# Cloudflare Pages — Demo Site Deployment Guide

How to take any `demos/[name]/` folder live on Cloudflare Pages with a custom domain.
One Pages project per demo. One custom domain per project.

---

## Demo sites and their domains

| Demo folder | Domain | Status |
|---|---|---|
| `demos/locksmith/` | indyemergencylocks.com | Domain registered |
| `demos/electrician/` | indyelectricpro.com | Domain registered |
| `demos/lawn-care/` | indylawnpros.com | Domain registered — site not yet built |
| `demos/hvac/` | indyhvacpros.com | Domain registered — site not yet built |

---

## One-time setup: connect GitHub to Cloudflare

1. Log in to [dash.cloudflare.com](https://dash.cloudflare.com)
2. In the left sidebar → **Workers & Pages**
3. Click **Create application** → **Pages** tab → **Connect to Git**
4. Authorize Cloudflare to access GitHub and select the `bharp0614/agency-os-core` repo

---

## Per-demo deployment steps

Repeat this for each demo folder.

### Step 1 — Create the Pages project

1. Workers & Pages → **Create application** → **Pages** → **Connect to Git**
2. Select `bharp0614/agency-os-core`
3. **Project name:** use the demo slug, e.g. `indy-locksmith-247`
4. **Production branch:** `main`
5. **Framework preset:** None
6. **Build command:** *(leave blank)*
7. **Build output directory:** `demos/locksmith` ← set this to the demo folder
8. Click **Save and Deploy**

Cloudflare deploys the raw HTML directly — no build step needed.

### Step 2 — Add the custom domain

1. Open the Pages project → **Custom domains** tab
2. Click **Set up a custom domain**
3. Enter the domain (e.g. `indyemergencylocks.com`) → **Continue**
4. Cloudflare will show you a CNAME record to add
5. If the domain is already on Cloudflare DNS: it adds the record automatically
6. If the domain is at another registrar (Namecheap, Google, etc.): copy the CNAME and add it manually at that registrar

DNS propagates in a few minutes if the domain is on Cloudflare; up to 48 hours at external registrars.

### Step 3 — Verify

Visit `https://indyemergencylocks.com` — the site should load over HTTPS.
Cloudflare issues a free SSL certificate automatically.

---

## Settings summary per project

| Field | Value |
|---|---|
| Framework preset | None |
| Build command | *(blank)* |
| Build output directory | `demos/[name]` |
| Production branch | `main` |
| Root directory | *(blank — leave default)* |

---

## After deployment

- Every push to `main` that touches `demos/[name]/` auto-redeploys that project.
- Branch previews: any branch gets its own preview URL at `[branch].[project].pages.dev`.
- Analytics: Workers & Pages → project → **Analytics** tab (free, no JS snippet needed).

---

## Client handoff checklist

When a client is ready to take over their site:

- [ ] Client creates their own Cloudflare account
- [ ] Transfer the Pages project to their account (Settings → Transfer project)
- [ ] Point their domain to their new Cloudflare account
- [ ] Remove your GitHub repo connection from their project (they get a static deploy going forward, or connect their own fork)
- [ ] Hand over domain registrar login if you registered on their behalf

Do NOT leave the repo connection live under your GitHub account after handoff — a push from your end would overwrite their production site.

---

## TEST FIXTURE reminder

All contact forms currently use `action="mailto:bharp0614@gmail.com"` and display a red disclaimer banner. Before handing a site to a real client:

1. Replace the form `action` with their real form handler (Formspree, Basin, etc.)
2. Remove the `disclaimer-box` div from the contact page
3. Update placeholder phone numbers, email addresses, and license numbers
