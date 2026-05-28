/**
 * AGENCY-OS DEPLOYMENT VALIDATOR
 * Runs as `prebuild` — any failure triggers HALT via process.exit(1).
 *
 * Checks:
 *  1. Every client's seo/local-citations.json has mandatory fields.
 *  2. truth-source/04-digital-assets.md contains at least one [SECURE_VAULT_REF] marker.
 *
 * On HALT: formats a JSON payload and POSTs to SLACK_HALT_WEBHOOK and/or
 * DISCORD_HALT_WEBHOOK if either environment variable is set.
 */

import fs from "node:fs";
import path from "node:path";
import { LocalCitationsSchema } from "./validator-logic.js";

// ── Constants ────────────────────────────────────────────────────────────────

const ROOT = path.resolve(import.meta.dirname, "..");
const CLIENTS_DIR = path.join(ROOT, "clients");
const DIGITAL_ASSETS_FILE = path.join(ROOT, "truth-source", "04-digital-assets.md");
const SECURE_VAULT_PATTERN = /\[SECURE_VAULT_REF[^\]]*\]/;

// ── Types ────────────────────────────────────────────────────────────────────

interface ValidationError {
  check: string;
  path: string;
  message: string;
}

interface SlackField {
  title: string;
  value: string;
  short: boolean;
}

interface DiscordField {
  name: string;
  value: string;
  inline: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function log(level: "INFO" | "ERROR" | "HALT", msg: string): void {
  const ts = new Date().toISOString();
  const prefix = `[${ts}] [${level}]`;
  if (level === "ERROR" || level === "HALT") {
    console.error(`${prefix} ${msg}`);
  } else {
    console.log(`${prefix} ${msg}`);
  }
}

function printErrorReport(errors: ValidationError[]): void {
  console.error("\n╔══════════════════════════════════════════════════════════════╗");
  console.error("║         AGENCY-OS DEPLOYMENT VALIDATOR — HALT TRIGGERED       ║");
  console.error("╚══════════════════════════════════════════════════════════════╝\n");
  console.error(`  ${errors.length} validation error(s) found:\n`);

  errors.forEach((err, i) => {
    console.error(`  [${i + 1}] CHECK   : ${err.check}`);
    console.error(`       PATH    : ${err.path}`);
    console.error(`       REASON  : ${err.message}`);
    console.error("");
  });

  console.error("  ACTION REQUIRED:");
  console.error("  ─ Fix all errors listed above before re-running the build.");
  console.error("  ─ See STATUS.md in the affected client folder for context.");
  console.error("  ─ Notify team via Slack/Discord with the error report above.\n");
}

// ── Notification helpers ──────────────────────────────────────────────────────

/** Extracts the client folder slug from a ValidationError file path. */
function extractClientSlug(errorPath: string): string {
  const match = /[/\\]clients[/\\]([^/\\]+)[/\\]/.exec(errorPath);
  return match?.[1] ?? "(system)";
}

/**
 * Builds a Slack incoming-webhook payload.
 * One attachment per error; each includes the client folder and STATUS.md reminder.
 */
function buildSlackPayload(errors: ValidationError[]): Record<string, unknown> {
  const fields: SlackField[] = [];

  for (let i = 0; i < errors.length; i++) {
    const err = errors[i]!;
    const client = extractClientSlug(err.path);

    fields.push({ title: "Client Folder", value: client, short: true });
    fields.push({ title: "Check Failed",  value: err.check,   short: true });
    fields.push({ title: "Error Detail",  value: err.message, short: false });

    if (client !== "(system)") {
      fields.push({
        title: "Next Step",
        value: `Open \`clients/${client}/STATUS.md\` — it contains the full health report and specific fix instructions for this client.`,
        short: false,
      });
    }

    // Visual divider between multiple errors
    if (i < errors.length - 1) {
      fields.push({ title: "──────────────────────", value: " ", short: false });
    }
  }

  return {
    text: `:rotating_light: *HALT — Agency-OS Deployment Validator* (${errors.length} error${errors.length === 1 ? "" : "s"} found)`,
    attachments: [
      {
        color: "#CC0000",
        fields,
        footer: "agency-os-core | Deployment Validator",
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };
}

/**
 * Builds a Discord incoming-webhook payload.
 * Uses the embed format with inline fields for compact display.
 */
function buildDiscordPayload(errors: ValidationError[]): Record<string, unknown> {
  const fields: DiscordField[] = [];

  for (let i = 0; i < errors.length; i++) {
    const err = errors[i]!;
    const client = extractClientSlug(err.path);

    fields.push({ name: "Client Folder", value: client,      inline: true });
    fields.push({ name: "Check Failed",  value: err.check,   inline: true });
    // Zero-width space forces a new row in Discord's 2-column inline layout
    fields.push({ name: "​",        value: "​",    inline: false });
    fields.push({ name: "Error Detail",  value: err.message, inline: false });

    if (client !== "(system)") {
      fields.push({
        name: "Next Step",
        value: `Open \`clients/${client}/STATUS.md\` — it contains the full health report and specific fix instructions for this client.`,
        inline: false,
      });
    }
  }

  return {
    content: `🛑 **HALT — Agency-OS Deployment Validator** — ${errors.length} error${errors.length === 1 ? "" : "s"} found`,
    embeds: [
      {
        title: "Deployment Blocked",
        color: 13369344, // 0xCC0000
        fields,
        footer: { text: "agency-os-core | Deployment Validator" },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

async function postWebhook(
  url: string,
  payload: Record<string, unknown>,
  platform: string,
): Promise<void> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      log("INFO", `HALT notification delivered to ${platform} webhook.`);
    } else {
      log(
        "ERROR",
        `${platform} webhook returned HTTP ${res.status.toString()} — notification may not have been delivered.`,
      );
    }
  } catch (err) {
    log(
      "ERROR",
      `Failed to POST HALT notification to ${platform}: ${(err as Error).message}`,
    );
  }
}

/**
 * Sends HALT notifications to every configured webhook.
 * Uses Promise.allSettled so a failed webhook never masks the original error.
 * Silently skips if no webhook env vars are set (local dev).
 */
async function sendHaltNotification(errors: ValidationError[]): Promise<void> {
  const slackUrl = process.env["SLACK_HALT_WEBHOOK"];
  const discordUrl = process.env["DISCORD_HALT_WEBHOOK"];

  if (!slackUrl && !discordUrl) {
    log(
      "INFO",
      "No HALT webhook configured (SLACK_HALT_WEBHOOK / DISCORD_HALT_WEBHOOK not set) — skipping notification.",
    );
    return;
  }

  const tasks: Promise<void>[] = [];

  if (slackUrl) {
    tasks.push(postWebhook(slackUrl, buildSlackPayload(errors), "Slack"));
  }
  if (discordUrl) {
    tasks.push(postWebhook(discordUrl, buildDiscordPayload(errors), "Discord"));
  }

  await Promise.allSettled(tasks);
}

// ── Check 1: local-citations.json ────────────────────────────────────────────

function validateLocalCitations(): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!fs.existsSync(CLIENTS_DIR)) {
    log("INFO", `clients/ directory not found — skipping citation check (${CLIENTS_DIR})`);
    return errors;
  }

  const allDirs    = fs.readdirSync(CLIENTS_DIR, { withFileTypes: true }).filter((d) => d.isDirectory());
  const templates  = allDirs.filter((d) =>  d.name.startsWith('[')).map((d) => d.name);
  const clientDirs = allDirs.filter((d) => !d.name.startsWith('[')).map((d) => d.name);

  if (templates.length > 0) {
    log("INFO", `Skipping template director${templates.length === 1 ? 'y' : 'ies'}: ${templates.join(', ')}`);
  }

  if (clientDirs.length === 0) {
    log("INFO", "No client directories found — skipping citation check.");
    return errors;
  }

  for (const client of clientDirs) {
    const citationsPath = path.join(CLIENTS_DIR, client, "seo", "local-citations.json");

    if (!fs.existsSync(citationsPath)) {
      errors.push({
        check: "LOCAL_CITATIONS_MISSING",
        path: citationsPath,
        message: `seo/local-citations.json not found for client '${client}'.`,
      });
      continue;
    }

    let raw: unknown;
    try {
      raw = JSON.parse(fs.readFileSync(citationsPath, "utf-8"));
    } catch (e) {
      errors.push({
        check: "LOCAL_CITATIONS_PARSE_ERROR",
        path: citationsPath,
        message: `JSON parse failed: ${(e as Error).message}`,
      });
      continue;
    }

    const result = LocalCitationsSchema.safeParse(raw);
    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push({
          check: "LOCAL_CITATIONS_INVALID_FIELD",
          path: `${citationsPath} → ${issue.path.join(".")}`,
          message: issue.message,
        });
      }
    } else {
      log("INFO", `[OK] ${client}/seo/local-citations.json — all mandatory fields present.`);
    }
  }

  return errors;
}

// ── Check 2: 04-digital-assets.md vault refs ─────────────────────────────────

function validateDigitalAssets(): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!fs.existsSync(DIGITAL_ASSETS_FILE)) {
    errors.push({
      check: "DIGITAL_ASSETS_MISSING",
      path: DIGITAL_ASSETS_FILE,
      message: "truth-source/04-digital-assets.md does not exist.",
    });
    return errors;
  }

  const content = fs.readFileSync(DIGITAL_ASSETS_FILE, "utf-8");

  if (!SECURE_VAULT_PATTERN.test(content)) {
    errors.push({
      check: "SECURE_VAULT_REF_MISSING",
      path: DIGITAL_ASSETS_FILE,
      message:
        "No [SECURE_VAULT_REF] pattern found. Credentials must be vaulted — never stored in plaintext.",
    });
  } else {
    log("INFO", "[OK] truth-source/04-digital-assets.md — [SECURE_VAULT_REF] marker present.");
  }

  return errors;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  log("INFO", "═══════════════════════════════════════════════════════");
  log("INFO", "AGENCY-OS DEPLOYMENT VALIDATOR — starting checks…");
  log("INFO", "═══════════════════════════════════════════════════════");

  const errors: ValidationError[] = [
    ...validateLocalCitations(),
    ...validateDigitalAssets(),
  ];

  if (errors.length > 0) {
    printErrorReport(errors);
    await sendHaltNotification(errors);
    log("HALT", "Build pipeline terminated. Fix errors and retry.");
    process.exit(1);
  }

  log("INFO", "═══════════════════════════════════════════════════════");
  log("INFO", "All checks passed — proceeding to build.");
  log("INFO", "═══════════════════════════════════════════════════════");
}

main().catch((err: unknown) => {
  console.error("[HALT] Unhandled error in deployment validator:", err);
  process.exit(1);
});
