# CLAUDE.md

Standing instructions for any AI session working in this repo. Read this first,
then [`README.md`](README.md) for orientation and [`docs/NOTEBOOK.md`](docs/NOTEBOOK.md)
for the full workflow map, missing pieces, and roadmap.

## What this repo is

`agency-os-core` is the **client-production/operations** node of a five-system
company architecture (Business OS · UIGEN · Agency OS Core · Brittany Harp ·
Indy CoCreator). It turns a client's business facts (the **truth source**) into
a validated, deployable website environment.

It is **not** the design system (that's **UIGEN**) and **not** where live client
sites are hosted (separate projects). This repo *consumes* approved UIGEN outputs.

## ⚠️ Critical guardrails — do not violate

1. **Never run `pnpm scaffold` without `--client <slug>`.** The truth source is
   currently **single-tenant/shared**, so an all-client run overwrites every
   client's NAP with one client's data. Always scope: `pnpm scaffold --client jax-roofing`.
2. **`scripts/deploy.ts` is SIMULATED.** It uses a mock secret, the Vercel
   `fetch()` is commented out, and it builds no pages. "Deploy succeeded" output
   means nothing shipped. Do not present it as a real deployment.
3. **There is no website generator yet.** `clients/*/website/0X_*/` folders are
   empty stubs; page content is `.md` templates full of `[PLACEHOLDER]`. Don't
   assume running the pipeline produces a site.
4. **Don't build a generator from scratch here.** The design already exists as
   UIGEN blueprints (see `docs/NOTEBOOK.md` Part 6). Consume/implement those.
5. **`pnpm build` builds the React admin app in `src/`, not client websites.**

## Commands — real vs simulated

| Command | Reality |
|---|---|
| `pnpm scaffold --client <slug>` | REAL — truth-source → client config/citations/leads |
| `pnpm validate` | REAL — mandatory-field + vault-ref checks; HALT on failure |
| `pnpm heartbeat` | REAL — scans clients, rewrites `STATUS.md` + `agency-dashboard.json` |
| `pnpm build` | REAL — builds `src/` admin app only |
| `pnpm test` | REAL — vitest |
| `pnpm client:deploy <slug>` | **SIMULATED** — see guardrail #2 |

## Architecture rules (from Business OS)

- UIGEN owns reusable UI; it is never client-facing.
- Agency OS Core consumes approved UIGEN outputs.
- Changes between systems flow as **reviewed import packages** (manifest + files),
  not direct edits to production.
- Credentials live in a vault; markdown stores only `[SECURE_VAULT_REF: ID]`
  pointers. Never hardcode secrets.

## Workflow & branch hygiene

- One branch per task, **named for the task**; every branch ends in **merge → delete**.
- Ship through **pull requests**; `main` is the source of truth.
- Fail-fast: validation/build scripts `process.exit(1)` on error — keep it that way.
- Prefer editing existing scripts over adding parallel ones.

## Truth-source model

`truth-source/` holds the client context injected into everything:
`01-brand-identity.md` (brand/colors/type), `02-business-operations.md`
(services/pricing/radius), `03-seo-and-aeo.md` (NAP/keywords), `04-digital-assets.md`
(vault pointers). **Known issue:** it is shared across all clients today and
currently mixes one client's NAP with another's keywords — splitting it per client
is Phase 0 of the roadmap.
