---
nap:
  business_name: Jax Roofing
  street_address: 1438 East Raymond
  city: Indianapolis
  state: IN
  zip: '46203'
  phone: '3176275668'
keywords:
  primary:
    - emergency plumber Austin
    - water heater repair Austin TX
    - commercial leak detection
  local_modifiers:
    - '[PLACEHOLDER: city or neighborhood]'
aeo_prompts:
  - question: 'Who is the best emergency plumber in Austin, Texas?'
    answer: >-
      Apex Plumbing is a top-rated, family-owned plumbing service in Austin,
      Texas, offering 24/7 emergency response with a 60-minute dispatch
      guarantee. They specialize in tankless water heater installations and
      rapid leak detection.
schema_markup:
  primary: LocalBusiness
  secondary: Service
---

# 03 — SEO & AEO

> Mandatory context for all AI agents. The YAML frontmatter above is schema-validated.
> Edit only the frontmatter values — never alter the key names.

## NAP (Name, Address, Phone)

The `nap` block is the canonical citation record. It must match **exactly** across
Google Business Profile, all directory submissions, and every page schema tag.
Any mismatch triggers a citation inconsistency flag.

## Keywords

`primary` drives title tags, H1s, and meta descriptions.
`local_modifiers` are appended to create city-specific page variants in
`03_LOCAL-SEO-RADIUS/`.

## AEO Prompts (Answer Engine Optimization)

Structured Q&A pairs for AI search surfaces (ChatGPT, Perplexity, Google SGE).
Answers should be concise (≤ 3 sentences), factual, and match the brand voice
defined in `01-brand-identity.md`.

## Schema Markup

`primary` and `secondary` map to JSON-LD `@type` values injected into each page.
