---
brand_voice:
  tone: '[PLACEHOLDER: e.g. trustworthy, professional, locally rooted]'
  personality:
    - '[PLACEHOLDER: e.g. reliable]'
  avoid:
    - '[PLACEHOLDER: e.g. corporate jargon]'
colors:
  primary: '#1E3A8A'
  secondary: '#F59E0B'
  neutral: '[PLACEHOLDER: #HEX]'
  background: '[PLACEHOLDER: #HEX]'
typography:
  heading:
    family: Inter
    weight: 700
  body:
    family: Inter
    weight: 400
  accent:
    family: Inter
    weight: 500
logo:
  primary: '[SECURE_VAULT_REF: LOGO_PRIMARY]'
  dark: '[SECURE_VAULT_REF: LOGO_DARK]'
  icon: '[SECURE_VAULT_REF: LOGO_ICON]'
---

# 01 — Brand Identity

> Mandatory context for all AI agents. The YAML frontmatter above is schema-validated.
> Edit only the frontmatter values — never alter the key names.

## Brand Voice

Describes the personality and tone AI should use when writing copy for this client.

## Color Palette

Hex codes used across all templates. Must be exact 3- or 6-digit hex format.

## Typography

Font families and weights injected into CSS variables and template renders.

## Logo

All logo variants are vaulted. Use the `[SECURE_VAULT_REF: ID]` pointer pattern only.
Raw URLs or file paths must never appear here.
