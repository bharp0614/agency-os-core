---
services:
  - name: '[PLACEHOLDER: service name]'
    type: emergency
    funnel: call
pricing:
  emergency_fee: 0
  estimate: free
  payment_methods:
    - '[PLACEHOLDER: e.g. credit card]'
sops:
  lead_response_sla_hours: 24
  escalation_email: '[PLACEHOLDER: escalation@example.com]'
service_radius:
  primary_city: Indianapolis
  state: IN
  radius_miles: 60
  excluded_zones: []
---

# 02 — Business Operations

> Mandatory context for all AI agents. The YAML frontmatter above is schema-validated.
> Edit only the frontmatter values — never alter the key names or enum values.

## Service Catalog

Each service entry has a `type` (`emergency` | `considered`) and a `funnel`
(`call` | `form`). The dual-funnel logic in `leads/conversion-data.json` reads
these values directly.

## Pricing

`emergency_fee` is in whole dollars. `estimate` is `free` or `paid`.

## SOPs

`lead_response_sla_hours` drives automated follow-up timers. `escalation_email`
receives HALT alerts and missed-lead notifications.

## Service Radius

`radius_miles: 0` means the radius has not been configured yet.
`excluded_zones` lists zip codes or city names excluded from the service area.
