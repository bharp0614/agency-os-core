# Agency OS Core — Task List

Active work items, pending decisions, and known gaps.
Update this file as tasks are started and completed.

---

## In Progress

*(nothing actively in progress — pick from Pending below)*

---

## Pending

### Demo sites — build

- [ ] `demos/lawn-care/` — 4-page CONSIDERED funnel site for `indylawnpros.com`
  - Pages: index, services, about, contact
  - Funnel type: CONSIDERED (seasonal, no emergency)
  - Domain registered: indylawnpros.com

- [ ] `demos/hvac/` — 4-page DUAL funnel site for `indyhvacpros.com`
  - Pages: index, services, about, contact
  - Funnel type: EMERGENCY (breakdown) + CONSIDERED (seasonal tune-up, new system)
  - Domain registered: indyhvacpros.com

### Go live — Cloudflare Pages

> **Note:** The correct way to deploy each demo on its own domain is **one Cloudflare Pages project per demo**, with the build output directory set to `demos/[name]`. This needs to be confirmed and tested before writing definitive instructions. See `docs/CLOUDFLARE-PAGES-DEPLOY.md` for the current draft — verify the subfolder deploy approach actually works the way documented.

- [ ] Deploy `demos/locksmith/` → `indyemergencylocks.com`
  1. Create Pages project, set output dir to `demos/locksmith`
  2. Connect custom domain `indyemergencylocks.com`
  3. Verify HTTPS live

- [ ] Deploy `demos/electrician/` → `indyelectricpro.com`
  1. Create Pages project, set output dir to `demos/electrician`
  2. Connect custom domain `indyelectricpro.com`
  3. Verify HTTPS live

- [ ] Deploy `demos/auto-repair/` → *(domain TBD)*

- [ ] Deploy `demos/lawn-care/` → `indylawnpros.com` *(build site first)*

- [ ] Deploy `demos/hvac/` → `indyhvacpros.com` *(build site first)*

### Domain / DNS

- [ ] Transfer `indycocreator.com` from Hostinger to Cloudflare
- [ ] Transfer `emergencytowingindianapolis.com` from Hostinger to Cloudflare

### Repo cleanup

- [ ] Fix `src/src/` nested folder problem
- [ ] Delete merged branch `claude/gifted-thompson-stztzh` (already merged, 0 commits ahead of main)

### Client handoff process

- [ ] Document client onboarding checklist (own Gmail, domain, Cloudflare account)
- [ ] Document how to transfer a Pages project to a client's Cloudflare account
- [ ] Replace TEST FIXTURE form actions before any real client hand-off

---

## Completed

- [x] Locksmith demo site — all 4 pages (`demos/locksmith/`)
- [x] Electrician demo site — all 4 pages (`demos/electrician/`)
- [x] Register domains: indylawnpros.com, indyelectricpro.com, indyemergencylocks.com, indyhvacpros.com
- [x] Full-page screenshots of locksmith, electrician, auto-repair demo sites
- [x] Cloudflare Pages deploy guide draft (`docs/CLOUDFLARE-PAGES-DEPLOY.md`)
