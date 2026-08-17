# Agency OS — Follow-Along Notebook

A plain-language map of how this system is *supposed* to work, what actually
works today, what's missing, and the plan to finish it. Read top to bottom the
first time; after that, jump to the section you need.

**Last updated:** 2026-08-17
**Companion doc:** [`../README.md`](../README.md) (the quick orientation)

---

## How to use this notebook

- **Part 1–2** = the big picture (mental model + how the pieces relate).
- **Part 3–4** = what happens today, step by step, with the exact commands.
- **Part 5** = the missing pieces (this is the "why it only pretends" section).
- **Part 6** = the blueprints you already own that fill those gaps.
- **Part 7** = the roadmap to make it real.
- **Part 8** = keeping branches/workflow clean (what we just fixed).

Anything marked **[REAL]** runs and does what it says. Anything marked
**[SIMULATED]** or **[MISSING]** does not yet — don't trust it in production.

---

## Part 1 — The mental model

The whole system runs on one sentence:

> **Build once. Lock the source. Duplicate safely. Customize through approved client layers.**

Meaning:
1. You build a **factory** of reusable parts once (components, themes, templates).
2. You **lock** that factory so nobody edits it by accident.
3. For each client you **duplicate** a clean copy.
4. You customize the copy only through **data** (their business facts) and
   **approved layers**, never by hacking the factory.

The client's business facts live in one place — the **truth source** — and flow
outward into everything: their website config, their SEO citations, their lead
funnel. Change a fact once, and automation propagates it.

---

## Part 2 — The systems map

You are not building one app. You're building a **company operating system** of
five isolated-but-aligned parts:

```text
Business OS  ── private source of truth + rules (the "head office")
   │
   ├── UIGEN ............ the design-system FACTORY (components, tokens, themes)
   ├── Agency OS Core ... THIS REPO — client production + operations
   ├── Brittany Harp .... public consulting / engineering brand
   └── Indy CoCreator ... public community / affordable-websites brand
```

**The rule that explains everything:**
- **UIGEN owns** the reusable UI. It is *never* client-facing.
- **Agency OS Core consumes** approved UIGEN outputs and runs client delivery.
- Live client websites live in **their own** separate projects.
- Changes move between systems as **reviewed import packages** (zipped, with a
  manifest), not by editing production files directly.

> 💡 **This is the key insight from the audit:** Agency OS Core has no website
> generator *by design* — it was always meant to import one from UIGEN. UIGEN's
> component system exists (as blueprints) but was never finished or wired in.
> That's the root cause of "it only pretends to deploy."

---

## Part 3 — How a client site is *supposed* to flow

The full factory defines a 20-stage production line. Condensed to the stages that
matter:

```text
1. Intake ............ collect the client brief → truth source
2. Template select ... pick an approved page template (e.g. local-business-card-site)
3. Theme tokens ...... apply a style pack (colors, fonts, spacing) — no hardcoding
4. Components ........ assemble approved sections (hero, features, testimonials, CTA, footer)
5. Content ........... inject the client's real copy (replace all placeholders)
6. Page build ........ render the pages to HTML
7. Responsive / A11y / SEO / Performance ... quality gates
8. QA + Review ....... checklist, then human approval
9. Deploy ............ publish to hosting (Vercel)
10. Post-launch ...... monitor, handle change requests
```

Today, **stages 1–2 and the data plumbing are real. Stages 3–9 (the parts that
turn data into an actual website and ship it) are not built.**

---

## Part 4 — What actually works today  [REAL]

Run these from the repo root after `pnpm install`.

### 4.1 Scaffold — sync truth source into a client  `pnpm scaffold`
- **Does:** reads `truth-source/` and writes each client's `website/config.js`,
  `seo/local-citations.json`, `leads/conversion-data.json`.
- **Real behavior:** NAP (name/address/phone) + brand colors + CTA funnel routing
  get injected. Placeholders are annotated, not silently shipped.
- ⚠️ **Gotcha:** with **no** `--client`, it applies the *one shared* truth source
  to *every* client, overwriting their identities. **Always** run
  `pnpm scaffold --client <slug>` until the truth source is split per client.

### 4.2 Validate — block bad deploys  `pnpm validate`
- **Does:** HALTs (exit 1) if any client's `local-citations.json` is missing
  mandatory fields, or if `truth-source/04-digital-assets.md` has no vault ref.
- **Real behavior:** can POST a HALT alert to Slack/Discord if webhook env vars
  are set.

### 4.3 Heartbeat — health report  `pnpm heartbeat`
- **Does:** scans every client, validates their JSON, scans for exposed
  credentials, then **rewrites** each `clients/*/STATUS.md` and the top-level
  `agency-dashboard.json`.
- **Real behavior:** a client with problems gets a `HALT` status and the command
  exits with an error.

### 4.4 Build the admin app  `pnpm build`  [REAL, but not client sites]
- Builds the **React truth-source-manager** in `src/` (a Vite app for editing
  business data). This is *your* internal tool, **not** a client website.

### 4.5 Tests  `pnpm test`  — vitest, real.

---

## Part 5 — The missing pieces (why it "pretends")

This is the heart of it. Four gaps stand between "data plumbing" and "a real
agency that ships websites":

| # | Gap | Where it shows | Impact |
|---|---|---|---|
| **1** | **No website generator** | `clients/*/website/0X_*/` folders are empty `.gitkeep` stubs; page content lives as `.md` files full of `[PLACEHOLDER]` | Nothing turns client data into actual HTML pages |
| **2** | **Deployment is simulated** | `scripts/deploy.ts`: mock secret, `fetch()` to Vercel commented out, no build step | `pnpm client:deploy` prints "success" but ships nothing |
| **3** | **Truth source is single-tenant** | one shared `truth-source/` for all clients; currently mixes Jax Roofing's address with Apex's keywords | Blind `pnpm scaffold` corrupts client identities |
| **4** | **Placeholder content** | funnel `.md` files are templates, not written copy | Even if generated, pages would show `[PLACEHOLDER: …]` |

**Plain-English version:** the system is a very good *filing clerk* (it organizes,
validates, and reports on client data) but it is **not yet a builder** (it can't
make or publish the websites). The demos in `demos/` prove the output is
achievable — but those were built **by hand**, not generated.

---

## Part 6 — The blueprints you already own

Good news: the design for the missing builder already exists. It was stored as
four zip archives on the `agency-os-analysis` branch (the audit rescued and
documented them). Each maps directly onto a gap above:

| Blueprint (zip) | What it is | Fills gap |
|---|---|---|
| **uigen-build-001** | The design-system factory: theme tokens, style packs (e.g. "Modern Glass"), component schemas, and factory definitions (`local-business-card-site`, `landing-page`). Components are *stubbed* (schemas exist, code doesn't). | **#1 generator** |
| **agency_os_pipelines_v2** | The 20-stage production-line process (intake → deploy), plus a Python client-folder scaffolder. | **process / #2** |
| **agency_os_research_engine_v1** | Python scripts that turn competitor screenshots into a structured design database (page intent, color system, hero type, CTA strategy). Runs in mock mode until a vision API is connected. | design research |
| **business-os-starter** | The governance layer: master architecture, import-package policy, and a registry linking all five systems. | **coordination** |

**Translation:** UIGEN already specifies *what the generator should build*
(hero, features, testimonials, contact-cta, footer, all theme-driven). The job is
to implement those stubs and wire the output into Agency OS Core's client folders,
then make `deploy.ts` actually publish it.

---

## Part 7 — The roadmap (how to make it real)

A phased path, smallest-useful-thing first:

**Phase 0 — Preserve & unblock** *(low effort, do first)*
- [ ] Merge the rescued blueprints into `main` as real files (out of zips).
- [ ] Split `truth-source/` per client (kills gap #3), OR hard-guard
      `scaffold-engine.ts` so it refuses an all-client run.

**Phase 1 — First real page** *(the vertical slice)*
- [ ] Implement UIGEN's first-slice components: `button → card → hero`.
- [ ] Build a `site-builder.ts` that renders **one** template
      (`local-business-card-site`) from a client's `config.js` + funnel `.md`
      into real HTML in `clients/<slug>/website/_site/`.
- [ ] Prove it on `jax-roofing`. Compare to the hand-built `demos/`.

**Phase 2 — Real deployment**
- [ ] Replace the simulated `deploy.ts` Step 2 with a call to `site-builder.ts`.
- [ ] Make Step 3 actually `POST` to the Vercel hook when the secret is present
      (keep simulation only as an explicit no-secret fallback).

**Phase 3 — Fill & scale**
- [ ] Write real content to replace placeholders (or generate it).
- [ ] Add remaining components + a second style pack.
- [ ] Wire the research engine to a vision API for competitor-informed design.

> Each phase ends in something you can *see*: a rendered page, a live URL.

---

## Part 8 — Keeping it clean (branches & workflow)

The audit found the repo cluttered with stale branches — a real source of "I
can't follow what's going on." Current clean state:

- **`main`** — the trunk. All merged work lives here.
- **`agency-os-analysis`** — holds the blueprints (Part 6). Merge into `main`,
  then delete.

**Deleted during cleanup** (all were already merged into `main`):
`practical-archimedes`, `confident-planck`, `gallant-shannon`, `gifted-thompson`.

**Workflow rules to stay clean:**
1. One branch per task, named for the task (`site-generator`, not a random slug).
2. Every branch ends in **merge → delete**. No long-lived side branches.
3. Changes flow through **reviewed pull requests**, matching the import-package
   principle from Business OS.
4. `main` is the source of truth. Your local clone and any cloud sandbox only
   sync through GitHub (`git push` / `git pull`).

---

## Appendix — Three copies of this project

Whenever something is "invisible," it's usually because it's in a different copy:

| Copy | Location | Notes |
|---|---|---|
| **GitHub** | github.com/bharp0614/agency-os-core | the shared master; both people + automation see it |
| **Cloud sandbox** | temporary Anthropic container | where the assistant works; ephemeral |
| **Local clone** | `C:\Users\ping2\Documents\agency-os-core` | your machine; what you see in PowerShell |

They only exchange changes through GitHub. A file written in one copy is
invisible to the others until it's pushed and pulled.
