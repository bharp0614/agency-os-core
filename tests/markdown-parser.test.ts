import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { writeTruthSource, TruthSourceValidationError } from '../src/shared/utils/markdown-parser';
import type { BrandIdentity } from '../src/shared/types/truth-source-schemas';

const VALID_BRAND_IDENTITY: BrandIdentity = {
  brand_voice: {
    tone: 'Professional and trustworthy',
    personality: ['Expert', 'Reliable'],
    avoid: ['Slang'],
  },
  colors: {
    primary: '#1A2B3C',
    secondary: '#4D5E6F',
    neutral: '#808080',
    background: '#FFFFFF',
  },
  typography: {
    heading: { family: 'Inter', weight: 700 },
    body: { family: 'Inter', weight: 400 },
    accent: { family: 'Inter', weight: 600 },
  },
  logo: {
    primary: '[SECURE_VAULT_REF: LOGO_PRIMARY]',
    dark: '[SECURE_VAULT_REF: LOGO_DARK]',
    icon: '[SECURE_VAULT_REF: LOGO_ICON]',
  },
};

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'agency-os-test-'));
  await fs.mkdir(path.join(tmpDir, 'truth-source'));
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('writeTruthSource', () => {
  it('writes valid data atomically and file contains expected values', async () => {
    await writeTruthSource('brand-identity', VALID_BRAND_IDENTITY, 'Test body', tmpDir);
    const written = await fs.readFile(
      path.join(tmpDir, 'truth-source', '01-brand-identity.md'),
      'utf-8',
    );
    expect(written).toContain('Professional and trustworthy');
    expect(written).toContain('#1A2B3C');
    expect(written).toContain('[SECURE_VAULT_REF: LOGO_PRIMARY]');
  });

  it('throws TruthSourceValidationError on invalid data', async () => {
    await expect(
      writeTruthSource('brand-identity', {} as BrandIdentity, 'body', tmpDir),
    ).rejects.toBeInstanceOf(TruthSourceValidationError);
  });

  it('leaves the original file unchanged when validation fails', async () => {
    const targetFile = path.join(tmpDir, 'truth-source', '01-brand-identity.md');
    const original = '---\noriginal: true\n---\noriginal body';
    await fs.writeFile(targetFile, original, 'utf-8');

    await expect(
      writeTruthSource('brand-identity', {} as BrandIdentity, 'body', tmpDir),
    ).rejects.toBeInstanceOf(TruthSourceValidationError);

    const after = await fs.readFile(targetFile, 'utf-8');
    expect(after).toBe(original);
  });

  it('leaves no .tmp file after a validation failure', async () => {
    await expect(
      writeTruthSource('brand-identity', {} as BrandIdentity, 'body', tmpDir),
    ).rejects.toBeInstanceOf(TruthSourceValidationError);

    const tmpExists = await fs
      .access(path.join(tmpDir, 'truth-source', '01-brand-identity.md.tmp'))
      .then(() => true)
      .catch(() => false);
    expect(tmpExists).toBe(false);
  });

  it('TruthSourceValidationError carries the correct key and has zodError issues', async () => {
    let caught: unknown;
    try {
      await writeTruthSource('brand-identity', {} as BrandIdentity, 'body', tmpDir);
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(TruthSourceValidationError);
    const err = caught as TruthSourceValidationError;
    expect(err.key).toBe('brand-identity');
    expect(err.zodError.issues.length).toBeGreaterThan(0);
  });

  it('rejects data with a raw credential (no vault ref format) in logo fields', async () => {
    const invalidData: BrandIdentity = {
      ...VALID_BRAND_IDENTITY,
      logo: {
        primary: 'raw-secret-value',
        dark: '[SECURE_VAULT_REF: LOGO_DARK]',
        icon: '[SECURE_VAULT_REF: LOGO_ICON]',
      },
    };
    await expect(
      writeTruthSource('brand-identity', invalidData, 'body', tmpDir),
    ).rejects.toBeInstanceOf(TruthSourceValidationError);
  });
});
