# SESSION REPORT
**Date:** 2026-07-19
**Repo:** bharp0614/agency-os-core
**Branch:** claude/gifted-thompson-stztzh

---

## What Happened This Session

### No code was written. No files were changed. No PRs were created.

---

## 1. Coding Activity Report

- **Commits in last 3 hours:** None
- **Last commit on main:** 2026-06-24 at 03:14 UTC — PR #1 merged (StackEngine AI Planner)
- **Open PRs:** None
- **Current branch status:** Clean, no uncommitted changes

---

## 2. What Was Found in the Repo

### Current folder structure (agency-os-core):
```
agency-os-core/
├── clients/
│   ├── [CLIENT-TEMPLATE]/
│   ├── apex-plumbing/
│   └── jax-roofing/
├── src/
│   ├── src/               ← PROBLEM: nested src inside src
│   ├── features/
│   ├── shared/
│   ├── stores/
│   └── stackengine-planner.html  ← no proper home
├── scripts/
├── tests/
├── truth-source/
├── reviews/               ← orphaned file, should not be at root
├── AGENCY-OPERATIONAL-BLUEPRINT.txt
└── agency-dashboard.json
```

### Problems identified:
- `src/src/` — nested folders, wrong structure
- `reviews/` — one random architecture review file at root level
- `stackengine-planner.html` — dumped in `src/`, no real home
- No clear separation between company app and client work
- No `CLAUDE.md` file — so every session starts blind

---

## 3. What the Blueprint Says (Plain Language)

File: `AGENCY-OPERATIONAL-BLUEPRINT.txt`

- **One folder per client** inside `clients/` with subfolders for: website, gmb, seo, leads, reviews, analytics, integrations
- **Truth source** at `/truth-source/` holds brand identity, operations, SEO data, and digital asset references
- **Website templates** are pre-built — main pages, service pages, local SEO radius pages, financing, legal
- **React app** in `src/` manages agentic workflows
- **No real credentials** ever in files — only `[SECURE_VAULT_REF]` pointer tags
- **Fail fast** — halt and alert on missing required fields
- **Never build from scratch** — always use existing templates

---

## 4. Folder Problem on Windows Machine

Previous Claude Code sessions (local, not this cloud session) created folders directly at `C:\Users\ping2\` instead of inside a project folder:

- `C:\Users\ping2\00_SYSTEM-RULES`
- `C:\Users\ping2\01_COMPONENT_LIBRARY`
- `C:\Users\ping2\01_WEB-DESIGN-SYSTEM`
- `C:\Users\ping2\02_LOCAL-SEO-PLAYBOOK`
- `C:\Users\ping2\02_TEMPLATES`
- `C:\Users\ping2\03_CLIENT-DEPLOYMENT`
- `C:\Users\ping2\03_GBP-SYSTEM`
- `C:\Users\ping2\.claude\02_CONTENT-LIBRARY`

**These are safe to delete.** Nothing in them is the source of truth — the repo is.

**Root cause:** Local Claude Code sessions were launched from the home directory instead of from inside a project folder, so files landed at the root.

---

## 5. What Was NOT in This Session

- No access to "test" or "UIGEN" repos
- No discussion of Brandon, waterproofing, or Indiana Roofing
- No decisions made about clients
- No code built or changed

Those topics came from previous sessions. This AI has no memory between sessions — nothing carries over unless it is written into this repo.

---

## 6. What Needs to Happen Next

- [ ] Delete the 8 loose folders from `C:\Users\ping2\`
- [ ] Decide on the two sub-project folder names for this repo
- [ ] Create a `CLAUDE.md` file so every future session starts with the rules
- [ ] Fix `src/src/` nested folder problem
- [ ] Give `stackengine-planner.html` a proper home
- [ ] Move `reviews/` out of root

---

## 7. The Core Problem (Plain Language)

Every session starts fresh with zero memory of what was decided before. No `CLAUDE.md` exists to give structure. So every session wanders, creates things in the wrong place, and asks questions that were already answered. The fix is a single `CLAUDE.md` file written into this repo that every future session reads first.
