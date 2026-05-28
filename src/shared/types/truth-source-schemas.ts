/**
 * Zod schemas for the 4 truth-source markdown files.
 *
 * Design rules:
 *  - String fields that will hold real values accept either a valid value OR a
 *    [PLACEHOLDER: …] string, so template files pass validation before a client
 *    is onboarded.  Once a real value is written, it must satisfy the base type.
 *  - Vault references MUST always be the canonical [SECURE_VAULT_REF: ID] form.
 *    Placeholder strings are rejected — every asset pointer must be vaulted.
 *  - Numeric fields use real numbers even in templates (sensible defaults).
 *  - Enum fields are strict — no placeholders allowed.
 */

import { z } from "zod";

// ── Shared primitives ────────────────────────────────────────────────────────

/** Matches [PLACEHOLDER: …] or [PLACEHOLDER] */
const PLACEHOLDER_RE = /^\[PLACEHOLDER[^\]]*\]$/;

/** Matches [SECURE_VAULT_REF: SOME_ID] exactly */
const VAULT_REF_RE = /^\[SECURE_VAULT_REF:[^\]]+\]$/;

/** Matches #RGB or #RRGGBB */
const HEX_COLOR_RE = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

const PlaceholderString = z.string().regex(PLACEHOLDER_RE, {
  message: 'Use [PLACEHOLDER: description] for unfilled template fields.',
});

/** Accept a valid schema value OR a [PLACEHOLDER: …] string. */
function orPlaceholder<T extends z.ZodTypeAny>(schema: T) {
  return z.union([schema, PlaceholderString]);
}

export const VaultRefSchema = z
  .string()
  .regex(VAULT_REF_RE, { message: 'Must be [SECURE_VAULT_REF: ID]. Never store raw credentials.' });

export const HexColorSchema = orPlaceholder(
  z.string().regex(HEX_COLOR_RE, { message: 'Must be a hex color: #RGB or #RRGGBB.' })
);

export const NonEmptyString = orPlaceholder(z.string().min(1, 'Field must not be empty.'));

export const EmailString = orPlaceholder(z.string().email('Must be a valid email address.'));

export const FontWeightSchema = z.union([
  z.literal(100), z.literal(200), z.literal(300),
  z.literal(400), z.literal(500), z.literal(600),
  z.literal(700), z.literal(800), z.literal(900),
]);

// ── 01-brand-identity.md ─────────────────────────────────────────────────────

export const BrandIdentitySchema = z.object({
  brand_voice: z.object({
    tone: NonEmptyString,
    personality: z.array(NonEmptyString).min(1, 'At least one personality trait is required.'),
    avoid: z.array(NonEmptyString),
  }),
  colors: z.object({
    primary: HexColorSchema,
    secondary: HexColorSchema,
    neutral: HexColorSchema,
    background: HexColorSchema,
  }),
  typography: z.object({
    heading: z.object({ family: NonEmptyString, weight: FontWeightSchema }),
    body:    z.object({ family: NonEmptyString, weight: FontWeightSchema }),
    accent:  z.object({ family: NonEmptyString, weight: FontWeightSchema }),
  }),
  logo: z.object({
    primary: VaultRefSchema,
    dark:    VaultRefSchema,
    icon:    VaultRefSchema,
  }),
});

export type BrandIdentity = z.infer<typeof BrandIdentitySchema>;

// ── 02-business-operations.md ────────────────────────────────────────────────

export const ServiceSchema = z.object({
  name:   NonEmptyString,
  type:   z.enum(['emergency', 'considered']),
  funnel: z.enum(['call', 'form']),
});

export const BusinessOperationsSchema = z.object({
  services: z.array(ServiceSchema).min(1, 'At least one service is required.'),
  pricing: z.object({
    emergency_fee:   z.number().nonnegative('Emergency fee must be ≥ 0.'),
    estimate:        z.enum(['free', 'paid']),
    payment_methods: z.array(z.string()),
  }),
  sops: z.object({
    lead_response_sla_hours: z.number().positive('SLA must be a positive number of hours.'),
    escalation_email:        EmailString,
  }),
  service_radius: z.object({
    primary_city:   NonEmptyString,
    state:          NonEmptyString,
    radius_miles:   z.number().nonnegative('Radius must be ≥ 0.'),
    excluded_zones: z.array(z.string()),
  }),
});

export type BusinessOperations = z.infer<typeof BusinessOperationsSchema>;

// ── 03-seo-and-aeo.md ────────────────────────────────────────────────────────

export const NapSchema = z.object({
  business_name:  NonEmptyString,
  street_address: NonEmptyString,
  city:           NonEmptyString,
  state:          NonEmptyString,
  zip:            NonEmptyString,
  phone:          NonEmptyString,
});

export const AeoPromptSchema = z.object({
  question: NonEmptyString,
  answer:   NonEmptyString,
});

export const SeoAndAeoSchema = z.object({
  nap: NapSchema,
  keywords: z.object({
    primary:         z.array(NonEmptyString).min(1, 'At least one primary keyword is required.'),
    local_modifiers: z.array(NonEmptyString),
  }),
  aeo_prompts: z
    .array(AeoPromptSchema)
    .min(1, 'At least one AEO prompt is required.'),
  schema_markup: z.object({
    primary:   z.string().min(1),
    secondary: z.string().min(1),
  }),
});

export type SeoAndAeo = z.infer<typeof SeoAndAeoSchema>;

// ── 04-digital-assets.md ─────────────────────────────────────────────────────

export const DigitalAssetsSchema = z.object({
  vault_refs: z.object({
    credentials: z.object({
      gbp_api_key:          VaultRefSchema,
      gtm_container_id:     VaultRefSchema,
      crm_webhook_secret:   VaultRefSchema,
      call_tracking_api_key: VaultRefSchema,
      vercel_deploy_hook:   VaultRefSchema,
    }),
    media: z.object({
      logo_primary: VaultRefSchema,
      logo_dark:    VaultRefSchema,
      logo_icon:    VaultRefSchema,
      hero_image:   VaultRefSchema,
    }),
    integrations: z.object({
      slack_halt_webhook:   VaultRefSchema,
      discord_halt_webhook: VaultRefSchema,
    }),
  }),
});

export type DigitalAssets = z.infer<typeof DigitalAssetsSchema>;

// ── UI Form schema (Business Data onboarding form) ───────────────────────────
//
// A UI-specific subset that covers the fields a user fills in during initial
// client onboarding.  On successful submission this data is merged into
// 02-business-operations.md and 03-seo-and-aeo.md.

export const BusinessDataFormSchema = z.object({
  /** Canonical business name — written to nap.business_name */
  business_name: z
    .string()
    .min(1, 'Business name is required.')
    .refine((val) => !val.includes('[PLACEHOLDER'), { message: 'Placeholder detected — enter a real business name.' }),

  /** Street address — written to nap.street_address */
  street_address: z
    .string()
    .min(1, 'Street address is required.')
    .refine((val) => !val.includes('[PLACEHOLDER'), { message: 'Placeholder detected — enter a real street address.' }),

  /** City — written to nap.city AND service_radius.primary_city */
  city: z
    .string()
    .min(1, 'City is required.')
    .refine((val) => !val.includes('[PLACEHOLDER'), { message: 'Placeholder detected — enter a real city name.' }),

  /** Two-letter state code — written to nap.state AND service_radius.state */
  state: z
    .string()
    .length(2, 'Use the 2-letter state code (e.g. CA).')
    .regex(/^[A-Za-z]{2}$/, 'State must be two letters.'),

  /** ZIP / postal code */
  zip: z
    .string()
    .regex(/^\d{5}(-\d{4})?$/, 'Enter a valid ZIP code (e.g. 90210 or 90210-1234).'),

  /** Business phone — written to nap.phone */
  phone: z
    .string()
    .min(10, 'Phone number is required.')
    .regex(/^[\d\s()\-+.]+$/, 'Enter digits only, with optional spaces, dashes, or parentheses.'),

  /** Service radius in miles — written to service_radius.radius_miles */
  radius_miles: z.coerce
    .number({ invalid_type_error: 'Radius must be a number.' })
    .nonnegative('Radius must be 0 or more.')
    .max(500, 'Radius looks too large — double-check this value.'),
});

export type BusinessDataFormValues = z.infer<typeof BusinessDataFormSchema>;

/** Field-level error map returned by the Zustand store validator */
export type BusinessDataFormErrors = Partial<Record<keyof BusinessDataFormValues, string>>;

// ── Discriminated union for the parser ───────────────────────────────────────

export const TRUTH_SOURCE_FILE_KEYS = [
  'brand-identity',
  'business-operations',
  'seo-and-aeo',
  'digital-assets',
] as const;

export type TruthSourceFileKey = (typeof TRUTH_SOURCE_FILE_KEYS)[number];

/** Maps each key to its Zod schema and inferred TypeScript type. */
export type TruthSourceDataMap = {
  'brand-identity':     BrandIdentity;
  'business-operations': BusinessOperations;
  'seo-and-aeo':        SeoAndAeo;
  'digital-assets':     DigitalAssets;
};
