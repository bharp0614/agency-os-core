---
vault_refs:
  credentials:
    gbp_api_key: "[SECURE_VAULT_REF: GBP_API_KEY]"
    gtm_container_id: "[SECURE_VAULT_REF: GTM_CONTAINER_ID]"
    crm_webhook_secret: "[SECURE_VAULT_REF: CRM_WEBHOOK_SECRET]"
    call_tracking_api_key: "[SECURE_VAULT_REF: CALL_TRACKING_API_KEY]"
    vercel_deploy_hook: "[SECURE_VAULT_REF: VERCEL_DEPLOY_HOOK]"
  media:
    logo_primary: "[SECURE_VAULT_REF: LOGO_PRIMARY]"
    logo_dark: "[SECURE_VAULT_REF: LOGO_DARK]"
    logo_icon: "[SECURE_VAULT_REF: LOGO_ICON]"
    hero_image: "[SECURE_VAULT_REF: HERO_IMAGE]"
  integrations:
    slack_halt_webhook: "[SECURE_VAULT_REF: SLACK_HALT_WEBHOOK]"
    discord_halt_webhook: "[SECURE_VAULT_REF: DISCORD_HALT_WEBHOOK]"
---

# 04 — Digital Assets

> Mandatory context for all AI agents. The YAML frontmatter above is schema-validated.
> **SECURITY**: This file stores vault reference POINTERS only — never raw credentials,
> API keys, tokens, or asset URLs. Any violation triggers the HALT protocol.

## How Vault References Work

Each `[SECURE_VAULT_REF: ID]` pointer is resolved at runtime by fetching the
secret from Vercel Environment Variables or AWS Secrets Manager. The resolved
value is used in-memory and never written to disk or logs.

## Adding a New Asset

1. Store the credential/URL in your vault provider (Vercel / AWS).
2. Add a `[SECURE_VAULT_REF: YOUR_NEW_ID]` entry to the correct section above.
3. Run `pnpm validate` to confirm the schema still passes.

## Credentials

API keys and webhook secrets for third-party platform integrations.

## Media

Vault-referenced CDN URLs for brand assets. The Template Factory resolves these
at build time to inject the correct asset into each rendered page.

## Integrations

Webhook endpoints for the HALT notification loop (Slack + Discord).

## Extended Credentials — Demo

Vault ref pointers for domain registrar and hosting provider credentials.
These are outside the core `DigitalAssetsSchema` fields and are documented
here as body-level pointers pending a schema extension.

| Purpose | Vault Ref |
|---------|-----------|
| Domain registrar credential | `[SECURE_VAULT_REF: DEMO_DOMAIN_01]` |
| Hosting provider credential | `[SECURE_VAULT_REF: DEMO_HOSTING_01]` |

Store the actual values in Vercel Environment Variables or AWS Secrets Manager
using the IDs `DEMO_DOMAIN_01` and `DEMO_HOSTING_01` respectively.
