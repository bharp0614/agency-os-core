# Agency OS Core

> Multi-tenant client-production platform for local-business websites.
> Part of a five-system company operating architecture (see [The Ecosystem](#the-ecosystem)).

**Core principle:** *Build once. Lock the source. Duplicate safely. Customize through approved client layers.*

This repo holds the **backend automation** that turns a client's business facts
(the *truth source*) into a validated, deployable website environment. It is the
production/operations layer — **not** the design system, and **not** where live
client sites are hosted.

> **New here? Read [`docs/NOTEBOOK.md`](docs/NOTEBOOK.md).** It's a follow-along
> guide to every workflow, what's actually automated vs. simulated, the missing
> pieces, and the roadmap to finish it.

---

## What this repo is (and isn't)

| ✅ This repo **does** | ❌ This repo does **not** |
|---|---|
| Store per-client truth-source data | Own the reusable UI/component design system (that's **UIGEN**) |
| Sync truth-source → each client's config | Host live client websites (those are separate projects) |
| Validate client data & block bad deploys (HALT) | Contain a client-facing portal/builder |
| Report health to `STATUS.md` + a dashboard | **Actually generate website HTML yet** — see the gap below |
| Build the internal React admin app (`src/`) | **Actually deploy to Vercel yet** — the runner is simulated |

**The honest status:** the *data sync, validation, and reporting* automation is
real and working. The *website generation* and *deployment* steps are currently
**simulated** — `scripts/deploy.ts` prints success without building pages or
POSTing to Vercel. Closing that gap is the project's headline goal.

---

## The Ecosystem

`agency-os-core` is one of five systems designed to stay isolated but aligned:

```text
Parent Company (Business OS = private source of truth + rules)
├── UIGEN ............. internal-only design-system factory (components, tokens, templates)
├── Agency OS Core .... THIS REPO — client production + operations
├── Brittany Harp ..... public consulting / engineering brand
└── Indy CoCreator .... public community / affordable-websites brand
```

**Boundary rule that matters here:** UIGEN *owns* the reusable components and
themes; Agency OS Core *consumes* approved UIGEN outputs. That's why this repo
has no generator yet — it was always meant to import one.

---

## Repo structure

```text
agency-os-core/
├── truth-source/              # The single context source injected into clients
│   ├── 01-brand-identity.md   #   brand voice, hex colors, typography
│   ├── 02-business-operations.md  # services, pricing, SOPs, service radius
│   ├── 03-seo-and-aeo.md      #   NAP (name/address/phone), keywords, AEO
│   └── 04-digital-assets.md   #   [SECURE_VAULT_REF: …] credential pointers
│
├── clients/                   # Multi-tenant: one folder per client
│   ├── [CLIENT-TEMPLATE]/     #   master blueprint (skipped by automation)
│   ├── apex-plumbing/
│   └── jax-roofing/
│       ├── website/config.js  #   generated NAP + brand + CTA config
│       ├── website/0X_*/      #   page-category folders (mostly empty stubs)
│       ├── seo/local-citations.json
│       ├── leads/conversion-data.json
│       └── STATUS.md          #   auto-rewritten health snapshot
│
├── scripts/                   # The automation (TypeScript, run via tsx)
│   ├── scaffold-engine.ts     #   truth-source → client config   [REAL]
│   ├── deployment-validator.ts#   mandatory-field / vault checks [REAL]
│   ├── indexer.ts             #   heartbeat: scan + STATUS + dash [REAL]
│   └── deploy.ts              #   client deploy runner           [SIMULATED]
│
├── src/                       # Internal React admin app (Vite)   [REAL]
│   └── features/truth-source-manager/
│
├── demos/                     # Hand-built static demo sites (NOT generated)
├── .github/workflows/deploy.yml
├── agency-dashboard.json      # auto-generated fleet health roll-up
└── docs/NOTEBOOK.md           # ← the follow-along guide
```

---

## Commands — and what each *really* does

| Command | Script | Reality |
|---|---|---|
| `pnpm scaffold` | `scaffold-engine.ts` | **REAL.** Injects truth-source NAP/brand into every client's `config.js`, `local-citations.json`, `conversion-data.json`. |
| `pnpm validate` | `deployment-validator.ts` | **REAL.** Fails (HALT) if a client is missing mandatory citation fields or the vault ref is absent. Can alert Slack/Discord. |
| `pnpm heartbeat` | `indexer.ts` | **REAL.** Scans all clients, validates JSON, scans for exposed credentials, rewrites each `STATUS.md` and `agency-dashboard.json`. |
| `pnpm build` | `turbo run build` | **REAL** — but builds the React admin app in `src/`, **not** client websites. |
| `pnpm test` | `vitest run` | **REAL.** |
| `pnpm client:deploy <slug>` | `deploy.ts` | **⚠️ SIMULATED.** Uses a mock secret, the Vercel `fetch()` is commented out, no pages are built. Prints "success" regardless. |

> ⚠️ **Known data risk:** `pnpm scaffold` with no `--client` flag applies the
> *single shared* truth source to **every** client, overwriting each one's NAP.
> Today the truth source holds Jax Roofing's address but Apex's keywords — so a
> blind run mixes client identities. Always scope with `--client <slug>` until
> the truth source is per-client. See the notebook for the fix.

---

## Quick start

```bash
pnpm install
pnpm scaffold --client jax-roofing   # sync one client (safe)
pnpm validate                        # check everything is deploy-ready
pnpm heartbeat                        # refresh STATUS.md + dashboard
```

For the full workflow map, the missing pieces, and the plan to make deployment
real, see **[`docs/NOTEBOOK.md`](docs/NOTEBOOK.md)**.
