/**
 * AGENCY-OS INDEXER — Heartbeat Protocol
 *
 * Crawls clients/, runs health checks on every client's data files,
 * and produces two outputs:
 *
 *   1. clients/<slug>/STATUS.md  — live health snapshot per client.
 *      Contains "[HALT]" and a structured error table when critical
 *      data is missing or a credential leak is detected.
 *
 *   2. agency-dashboard.json     — machine-readable aggregate of all
 *      client statuses at the monorepo root.
 *
 * Exit codes:
 *   0 — all clients HEALTHY or WARNING
 *   1 — one or more clients in HALT state
 */

import fs   from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

// ── Constants ────────────────────────────────────────────────────────────────

const ROOT        = path.resolve(import.meta.dirname, '..');
const CLIENTS_DIR = path.join(ROOT, 'clients');
const DASHBOARD   = path.join(ROOT, 'agency-dashboard.json');

// ── Terminal colours (no external deps) ─────────────────────────────────────

const c = {
  reset:  '\x1b[0m',
  bold:   (s: string) => `\x1b[1m${s}\x1b[0m`,
  dim:    (s: string) => `\x1b[2m${s}\x1b[0m`,
  red:    (s: string) => `\x1b[31m${s}\x1b[0m`,
  green:  (s: string) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  cyan:   (s: string) => `\x1b[36m${s}\x1b[0m`,
};

// ── Types ────────────────────────────────────────────────────────────────────

type CheckStatus  = 'PASS' | 'WARN' | 'HALT';
type OverallStatus = 'HEALTHY' | 'WARNING' | 'HALT';

interface CheckResult {
  status: CheckStatus;
  detail: string;
  source: string;
}

interface ClientAudit {
  slug:        string;
  status:      OverallStatus;
  timestamp:   string;
  checks:      Record<string, CheckResult>;
  haltReasons: string[];
  warnReasons: string[];
}

interface DashboardClient {
  slug:         string;
  status:       OverallStatus;
  halt_count:   number;
  warn_count:   number;
  last_run:     string;
  halt_reasons: string[];
  warn_reasons: string[];
  checks:       Record<string, CheckResult>;
}

interface Dashboard {
  generated_at: string;
  version:      string;
  summary: {
    total_clients: number;
    healthy:       number;
    warning:       number;
    halt:          number;
  };
  clients: DashboardClient[];
}

// ── Zod schemas for client data files ────────────────────────────────────────

const LocalCitationsSchema = z
  .object({
    business_name: z.string(),
    address:       z.string(),
    zip:           z.string(),
    phone:         z.string(),
  })
  .passthrough(); // extra fields (website, hours, etc.) are allowed

const LeadsConversionSchema = z
  .object({
    funnel_type: z.string(),
    emergency: z
      .object({
        primary_action:        z.string(),
        phone:                 z.string(),
        cta_text:              z.string(),
        response_time_promise: z.string().optional(),
      })
      .passthrough(),
    considered: z
      .object({
        primary_action:      z.string(),
        form_endpoint:       z.string(),
        cta_text:            z.string(),
        follow_up_sla_hours: z.number().positive(),
      })
      .passthrough(),
    tracking: z
      .object({
        gtm_id:               z.string().optional(),
        call_tracking_number: z.string().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

// ── Placeholder & credential utilities ───────────────────────────────────────

/**
 * Matches any unfilled template token:
 *   [ALL_CAPS_UNDERSCORE]        — e.g. [BUSINESS_NAME], [GTM_ID]
 *   [PLACEHOLDER: description]   — Phase 2 truth-source format
 *   [SECURE_VAULT_REF: ID]       — vault pointer (not a raw credential)
 */
const PLACEHOLDER_RE = /^\[([A-Z][A-Z0-9_]*|PLACEHOLDER[^\]]*|SECURE_VAULT_REF:[^\]]+)\]$/;

function isPlaceholder(value: string): boolean {
  return PLACEHOLDER_RE.test(value.trim());
}

/** A mandatory field is missing if it is absent, empty, or still a placeholder. */
function isMandatoryMissing(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value !== 'string')             return true;
  if (value.trim() === '')                   return true;
  if (isPlaceholder(value))                  return true;
  return false;
}

/**
 * Patterns that identify a raw credential or secret.
 * Values matching these but NOT wrapped in a recognised placeholder format
 * are flagged as HALT-level security findings.
 */
const RAW_CREDENTIAL_RE: RegExp[] = [
  /^sk-[A-Za-z0-9]{20,}$/,                                         // OpenAI / Stripe secret key
  /^AIza[A-Za-z0-9\-_]{35}$/,                                      // Google API key
  /^AKIA[A-Z0-9]{16}$/,                                             // AWS access key
  /^xox[baprs]-[A-Za-z0-9\-]+$/,                                   // Slack token
  /^ghp_[A-Za-z0-9]{36}$/,                                         // GitHub PAT
  /^eyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/,      // JWT
  /^[0-9a-f]{32,}$/i,                                               // MD5 / SHA hex token (32+ chars)
];

/** Values that look like credentials but are actually safe. */
const SAFE_VALUE_RE =
  /^\[.+\]$|^https?:\/\/|^\d[\d\s()\-+.]{7,}$|^\d{5}(-\d{4})?$|^[A-Za-z]{1,3}$/;

function scanForRawCredentials(data: unknown, fieldPath = ''): string[] {
  const hits: string[] = [];

  if (typeof data === 'string') {
    const val = data.trim();
    if (!SAFE_VALUE_RE.test(val)) {
      const isLeak = RAW_CREDENTIAL_RE.some((re) => re.test(val));
      if (isLeak) {
        hits.push(
          `Potential raw credential at '${fieldPath}': "${val.slice(0, 8)}…"`,
        );
      }
    }
  } else if (Array.isArray(data)) {
    data.forEach((item, i) =>
      hits.push(...scanForRawCredentials(item, `${fieldPath}[${i}]`)),
    );
  } else if (typeof data === 'object' && data !== null) {
    for (const [key, val] of Object.entries(data as Record<string, unknown>)) {
      hits.push(
        ...scanForRawCredentials(val, fieldPath ? `${fieldPath}.${key}` : key),
      );
    }
  }

  return hits;
}

// ── JSON reader ──────────────────────────────────────────────────────────────

type ReadResult =
  | { ok: true; data: unknown }
  | { ok: false; error: string };

function readJson(filePath: string): ReadResult {
  if (!fs.existsSync(filePath)) {
    return { ok: false, error: 'File not found' };
  }
  try {
    return { ok: true, data: JSON.parse(fs.readFileSync(filePath, 'utf-8')) as unknown };
  } catch (e) {
    return { ok: false, error: `JSON parse error: ${(e as Error).message}` };
  }
}

// ── Client auditor ───────────────────────────────────────────────────────────

function auditClient(slug: string): ClientAudit {
  const clientDir = path.join(CLIENTS_DIR, slug);
  const citPath   = path.join(clientDir, 'seo',   'local-citations.json');
  const leadsPath = path.join(clientDir, 'leads', 'conversion-data.json');
  const timestamp = new Date().toISOString();

  const checks:      Record<string, CheckResult> = {};
  const haltReasons: string[]                    = [];
  const warnReasons: string[]                    = [];

  /** Record a single check result and bucket it into halt/warn lists. */
  function record(
    key:    string,
    status: CheckStatus,
    detail: string,
    source: string,
  ): void {
    checks[key] = { status, detail, source };
    if (status === 'HALT') haltReasons.push(`${key}: ${detail}`);
    if (status === 'WARN') warnReasons.push(`${key}: ${detail}`);
  }

  // ── Section A: seo/local-citations.json ─────────────────────────────────

  const citResult = readJson(citPath);

  if (!citResult.ok) {
    record('citations_file', 'HALT', citResult.error, 'seo/local-citations.json');
  } else {
    record('citations_file', 'PASS', 'File found and parsed', 'seo/local-citations.json');

    const parsed = LocalCitationsSchema.safeParse(citResult.data);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      record(
        'citations_schema',
        'HALT',
        `Schema invalid: ${firstIssue !== undefined ? firstIssue.message : 'unknown error'}`,
        'seo/local-citations.json',
      );
    } else {
      record('citations_schema', 'PASS', 'Schema valid', 'seo/local-citations.json');

      const { business_name, address, zip, phone } = parsed.data;

      // Mandatory NAP fields — HALT if missing or unfilled
      const mandatoryFields: [string, unknown][] = [
        ['business_name', business_name],
        ['address',       address],
        ['zip',           zip],
        ['phone',         phone],
      ];

      for (const [field, val] of mandatoryFields) {
        const missing = isMandatoryMissing(val);
        record(
          field,
          missing ? 'HALT' : 'PASS',
          missing
            ? 'Missing or unfilled placeholder — mandatory field'
            : `"${String(val)}"`,
          'seo/local-citations.json',
        );
      }

      // Credential scan
      const credHits = scanForRawCredentials(citResult.data, 'citations');
      const firstHit = credHits[0];
      record(
        'citations_credential_safety',
        credHits.length > 0 ? 'HALT' : 'PASS',
        credHits.length > 0
          ? `Raw credential detected — ${firstHit !== undefined ? firstHit : ''}`
          : 'No raw credentials detected',
        'seo/local-citations.json',
      );
    }
  }

  // ── Section B: leads/conversion-data.json ───────────────────────────────

  const leadsResult = readJson(leadsPath);

  if (!leadsResult.ok) {
    record('leads_file', 'WARN', leadsResult.error, 'leads/conversion-data.json');
  } else {
    record('leads_file', 'PASS', 'File found and parsed', 'leads/conversion-data.json');

    const parsed = LeadsConversionSchema.safeParse(leadsResult.data);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      record(
        'leads_schema',
        'WARN',
        `Schema invalid: ${firstIssue !== undefined ? firstIssue.message : 'unknown error'}`,
        'leads/conversion-data.json',
      );
    } else {
      record('leads_schema', 'PASS', 'Schema valid', 'leads/conversion-data.json');

      const { emergency, considered } = parsed.data;

      // Emergency funnel checks — WARN if unfilled (not HALT; build can proceed)
      record(
        'emergency_phone',
        isMandatoryMissing(emergency.phone) ? 'WARN' : 'PASS',
        isMandatoryMissing(emergency.phone)
          ? 'Emergency phone is an unfilled placeholder'
          : `"${String(emergency.phone)}"`,
        'leads/conversion-data.json',
      );

      record(
        'emergency_cta',
        isMandatoryMissing(emergency.cta_text) ? 'WARN' : 'PASS',
        isMandatoryMissing(emergency.cta_text)
          ? 'Emergency CTA text is unfilled'
          : `"${String(emergency.cta_text)}"`,
        'leads/conversion-data.json',
      );

      record(
        'form_endpoint',
        isMandatoryMissing(considered.form_endpoint) ? 'WARN' : 'PASS',
        isMandatoryMissing(considered.form_endpoint)
          ? 'Form endpoint is an unfilled placeholder — configure before going live'
          : `"${String(considered.form_endpoint)}"`,
        'leads/conversion-data.json',
      );

      // Credential scan
      const credHits = scanForRawCredentials(leadsResult.data, 'leads');
      const firstHit = credHits[0];
      record(
        'leads_credential_safety',
        credHits.length > 0 ? 'HALT' : 'PASS',
        credHits.length > 0
          ? `Raw credential detected — ${firstHit !== undefined ? firstHit : ''}`
          : 'No raw credentials detected',
        'leads/conversion-data.json',
      );
    }
  }

  // ── Derive overall status ────────────────────────────────────────────────

  const status: OverallStatus =
    haltReasons.length > 0 ? 'HALT'
    : warnReasons.length > 0 ? 'WARNING'
    : 'HEALTHY';

  return { slug, status, timestamp, checks, haltReasons, warnReasons };
}

// ── STATUS.md generator ──────────────────────────────────────────────────────

function statusIcon(s: CheckStatus): string {
  return s === 'PASS' ? '✅' : s === 'WARN' ? '⚠️' : '🛑';
}

function generateStatusMd(audit: ClientAudit): string {
  const { slug, status, timestamp, checks, haltReasons, warnReasons } = audit;

  const statusBadge =
    status === 'HALT'
      ? '**[HALT]** — Critical issues detected. Deployment is blocked.'
      : status === 'WARNING'
        ? '**⚠️ WARNING** — Non-critical issues found. Review before going live.'
        : '**✅ HEALTHY** — All checks passed.';

  const tableRows = Object.entries(checks)
    .map(([key, r]) => {
      const icon  = statusIcon(r.status);
      const label = r.status === 'HALT' ? '[HALT]' : r.status;
      return `| \`${key}\` | \`${r.source}\` | ${icon} ${label} | ${r.detail} |`;
    })
    .join('\n');

  const haltSection =
    haltReasons.length > 0
      ? [
          '',
          `## 🛑 [HALT] — Critical Issues (${haltReasons.length})`,
          '',
          'These issues **must** be resolved before this client can be deployed:',
          '',
          haltReasons.map((r, i) => `${i + 1}. ${r}`).join('\n'),
          '',
        ].join('\n')
      : '';

  const warnSection =
    warnReasons.length > 0
      ? [
          '',
          `## ⚠️ Warnings (${warnReasons.length})`,
          '',
          warnReasons.map((r, i) => `${i + 1}. ${r}`).join('\n'),
          '',
        ].join('\n')
      : '';

  return `# STATUS — ${slug}

> **Generated:** ${timestamp}
> **Overall Status:** ${statusBadge}

---

## Health Checks

| Check | Source | Status | Detail |
|-------|--------|--------|--------|
${tableRows}
${haltSection}${warnSection}
---

*Auto-generated by \`scripts/indexer.ts\` — do not edit manually.*
`;
}

// ── Dashboard aggregator ─────────────────────────────────────────────────────

function buildDashboard(audits: ClientAudit[]): Dashboard {
  const now     = new Date().toISOString();
  const healthy = audits.filter((a) => a.status === 'HEALTHY').length;
  const warning = audits.filter((a) => a.status === 'WARNING').length;
  const halt    = audits.filter((a) => a.status === 'HALT').length;

  return {
    generated_at: now,
    version:      '1.0.0',
    summary: {
      total_clients: audits.length,
      healthy,
      warning,
      halt,
    },
    clients: audits.map((a) => ({
      slug:         a.slug,
      status:       a.status,
      halt_count:   a.haltReasons.length,
      warn_count:   a.warnReasons.length,
      last_run:     a.timestamp,
      halt_reasons: a.haltReasons,
      warn_reasons: a.warnReasons,
      checks:       a.checks,
    })),
  };
}

// ── Main ─────────────────────────────────────────────────────────────────────

function main(): void {
  console.log(c.bold('\n╔══════════════════════════════════════════════════════╗'));
  console.log(c.bold('║      AGENCY-OS INDEXER — Heartbeat Protocol          ║'));
  console.log(c.bold('╚══════════════════════════════════════════════════════╝'));
  console.log(c.dim(`  ${new Date().toISOString()}\n`));

  if (!fs.existsSync(CLIENTS_DIR)) {
    console.error(c.red('[ERROR] clients/ directory not found at: ' + CLIENTS_DIR));
    process.exit(1);
  }

  const allEntries  = fs.readdirSync(CLIENTS_DIR, { withFileTypes: true }).filter((d) => d.isDirectory());
  const templates   = allEntries.filter((d) =>  d.name.startsWith('[')).map((d) => d.name);
  const clientSlugs = allEntries.filter((d) => !d.name.startsWith('[')).map((d) => d.name);

  if (templates.length > 0) {
    console.log(c.dim(`  Skipping template director${templates.length === 1 ? 'y' : 'ies'}: ${templates.join(', ')}\n`));
  }

  if (clientSlugs.length === 0) {
    console.log(c.yellow('  No client directories found. Nothing to audit.'));
    return;
  }

  console.log(
    c.cyan(`  Discovered ${clientSlugs.length} client(s):`),
    clientSlugs.join(', ') + '\n',
  );

  const audits: ClientAudit[] = [];

  for (const slug of clientSlugs) {
    console.log(c.bold(`  ▶  ${slug}`));

    const audit = auditClient(slug);
    audits.push(audit);

    // Write STATUS.md
    const statusPath = path.join(CLIENTS_DIR, slug, 'STATUS.md');
    fs.writeFileSync(statusPath, generateStatusMd(audit), 'utf-8');

    // Terminal result line
    const badge =
      audit.status === 'HALT'    ? c.red('[HALT]')
      : audit.status === 'WARNING' ? c.yellow('[WARNING]')
      : c.green('[HEALTHY]');

    console.log(`     Status : ${badge}`);

    if (audit.haltReasons.length > 0) {
      console.log(c.red('     🛑 HALT reasons:'));
      audit.haltReasons.forEach((r) => console.log(c.red(`        • ${r}`)));
    }

    if (audit.warnReasons.length > 0) {
      console.log(c.yellow('     ⚠  Warnings:'));
      audit.warnReasons.forEach((r) => console.log(c.yellow(`        • ${r}`)));
    }

    const passCount = Object.values(audit.checks).filter((ch) => ch.status === 'PASS').length;
    const total     = Object.keys(audit.checks).length;
    console.log(c.dim(`     ${passCount}/${total} checks passed → STATUS.md written\n`));
  }

  // Write agency-dashboard.json
  const dashboard = buildDashboard(audits);
  fs.writeFileSync(DASHBOARD, JSON.stringify(dashboard, null, 2), 'utf-8');

  // Final summary block
  console.log(c.bold('══════════════════════════════════════════════════════'));
  console.log(c.bold('  SUMMARY'));
  console.log(c.bold('══════════════════════════════════════════════════════'));
  console.log(`  Total clients : ${c.bold(String(audits.length))}`);
  console.log(`  ${c.green('Healthy')}        : ${dashboard.summary.healthy}`);
  console.log(`  ${c.yellow('Warning')}        : ${dashboard.summary.warning}`);
  console.log(`  ${c.red('HALT')}           : ${dashboard.summary.halt}`);
  console.log(c.dim(`\n  agency-dashboard.json → ${DASHBOARD}`));

  if (dashboard.summary.halt > 0) {
    console.log(
      c.red(c.bold('\n  ⛔  One or more clients are in [HALT] state.')),
    );
    console.log(c.red('     Review the STATUS.md files listed above before deploying.\n'));
    process.exit(1);
  }

  console.log(c.green(c.bold('\n  ✓  All clients healthy.\n')));
}

main();
