import { describe, it, expect } from 'vitest';
import { extractVaultRefIds } from '../scripts/deploy-utils';

describe('extractVaultRefIds', () => {
  it('extracts a single vault ref ID', () => {
    const content = 'vercel_deploy_hook: "[SECURE_VAULT_REF: VERCEL_DEPLOY_HOOK]"';
    const ids = extractVaultRefIds(content);
    expect(ids.size).toBe(1);
    expect(ids.has('VERCEL_DEPLOY_HOOK')).toBe(true);
  });

  it('extracts multiple distinct vault ref IDs', () => {
    const content = `
      gbp_api_key: "[SECURE_VAULT_REF: GBP_API_KEY]"
      gtm_container_id: "[SECURE_VAULT_REF: GTM_CONTAINER_ID]"
      crm_webhook_secret: "[SECURE_VAULT_REF: CRM_WEBHOOK_SECRET]"
    `;
    const ids = extractVaultRefIds(content);
    expect(ids.size).toBe(3);
    expect(ids.has('GBP_API_KEY')).toBe(true);
    expect(ids.has('GTM_CONTAINER_ID')).toBe(true);
    expect(ids.has('CRM_WEBHOOK_SECRET')).toBe(true);
  });

  it('returns an empty set when no vault refs are present', () => {
    const ids = extractVaultRefIds('no vault references here');
    expect(ids.size).toBe(0);
  });

  it('deduplicates repeated vault refs', () => {
    const content = `
      "[SECURE_VAULT_REF: VERCEL_DEPLOY_HOOK]"
      "[SECURE_VAULT_REF: VERCEL_DEPLOY_HOOK]"
    `;
    const ids = extractVaultRefIds(content);
    expect(ids.size).toBe(1);
    expect(ids.has('VERCEL_DEPLOY_HOOK')).toBe(true);
  });

  it('handles extra whitespace after the colon', () => {
    const content = '"[SECURE_VAULT_REF:  SOME_KEY]"';
    const ids = extractVaultRefIds(content);
    expect(ids.has('SOME_KEY')).toBe(true);
  });

  it('rejects lowercase ref IDs (must be ALL_CAPS)', () => {
    const ids = extractVaultRefIds('"[SECURE_VAULT_REF: lowercase_key]"');
    expect(ids.size).toBe(0);
  });

  it('rejects mixed-case ref IDs', () => {
    const ids = extractVaultRefIds('"[SECURE_VAULT_REF: Mixed_Case_Key]"');
    expect(ids.size).toBe(0);
  });

  it('returns a fresh Set on each call (no shared lastIndex state)', () => {
    const content = '"[SECURE_VAULT_REF: KEY_A]"';
    const first = extractVaultRefIds(content);
    const second = extractVaultRefIds(content);
    expect(first.size).toBe(1);
    expect(second.size).toBe(1);
  });
});
