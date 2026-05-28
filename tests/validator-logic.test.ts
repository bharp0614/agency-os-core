import { describe, it, expect } from 'vitest';
import { noPlaceholder, LocalCitationsSchema } from '../scripts/validator-logic';

const VALID_CITATIONS = {
  business_name: 'Acme Plumbing LLC',
  address: '123 Main Street',
  zip: '90210',
  phone: '(310) 555-0100',
};

describe('noPlaceholder', () => {
  it('returns true for a real non-placeholder value', () => {
    expect(noPlaceholder('Acme Plumbing LLC')).toBe(true);
  });

  it('returns false for [PLACEHOLDER: description] format', () => {
    expect(noPlaceholder('[PLACEHOLDER: business name]')).toBe(false);
  });

  it('returns false for bare [PLACEHOLDER] token', () => {
    expect(noPlaceholder('[PLACEHOLDER]')).toBe(false);
  });

  it('returns false when [PLACEHOLDER appears anywhere in the string', () => {
    expect(noPlaceholder('prefix [PLACEHOLDER: something] suffix')).toBe(false);
  });
});

describe('LocalCitationsSchema', () => {
  it('passes on all valid mandatory fields', () => {
    const result = LocalCitationsSchema.safeParse(VALID_CITATIONS);
    expect(result.success).toBe(true);
  });

  it('passes with extra fields present (schema is not strict)', () => {
    const result = LocalCitationsSchema.safeParse({
      ...VALID_CITATIONS,
      website: 'acmeplumbing.com',
      radius_miles: 25,
    });
    expect(result.success).toBe(true);
  });

  it('fails when business_name is missing', () => {
    const { business_name: _, ...rest } = VALID_CITATIONS;
    const result = LocalCitationsSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('fails when address is an empty string', () => {
    const result = LocalCitationsSchema.safeParse({ ...VALID_CITATIONS, address: '' });
    expect(result.success).toBe(false);
  });

  it('fails when zip is missing', () => {
    const { zip: _, ...rest } = VALID_CITATIONS;
    const result = LocalCitationsSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('fails when business_name contains a placeholder token', () => {
    const result = LocalCitationsSchema.safeParse({
      ...VALID_CITATIONS,
      business_name: '[PLACEHOLDER: business name]',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toMatch(/Placeholder detected/);
  });

  it('fails when phone contains a placeholder token', () => {
    const result = LocalCitationsSchema.safeParse({
      ...VALID_CITATIONS,
      phone: '[PLACEHOLDER: phone number]',
    });
    expect(result.success).toBe(false);
  });

  it('fails when zip contains a placeholder token', () => {
    const result = LocalCitationsSchema.safeParse({
      ...VALID_CITATIONS,
      zip: '[PLACEHOLDER: zip code]',
    });
    expect(result.success).toBe(false);
  });

  it('fails when address contains a placeholder token', () => {
    const result = LocalCitationsSchema.safeParse({
      ...VALID_CITATIONS,
      address: '[PLACEHOLDER: street address]',
    });
    expect(result.success).toBe(false);
  });
});
