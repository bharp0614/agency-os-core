/**
 * Truth-source markdown parser.
 *
 * Reads/writes the four truth-source files via gray-matter (YAML frontmatter +
 * markdown body).  All reads validate against Zod schemas before returning
 * data; all writes re-validate before touching disk.
 *
 * NOTE: File I/O functions (`readTruthSource`, `writeTruthSource`) are Node.js
 * only and must be called from scripts or server-side contexts — not from the
 * browser bundle.  `validateTruthSourceData` is portable and safe anywhere.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { z } from 'zod';

import {
  BrandIdentitySchema,
  BusinessOperationsSchema,
  SeoAndAeoSchema,
  DigitalAssetsSchema,
  type TruthSourceFileKey,
  type TruthSourceDataMap,
} from '../types/truth-source-schemas';

// ── Schema + path registry ───────────────────────────────────────────────────

const REGISTRY = {
  'brand-identity': {
    schema:       BrandIdentitySchema,
    relativePath: 'truth-source/01-brand-identity.md',
  },
  'business-operations': {
    schema:       BusinessOperationsSchema,
    relativePath: 'truth-source/02-business-operations.md',
  },
  'seo-and-aeo': {
    schema:       SeoAndAeoSchema,
    relativePath: 'truth-source/03-seo-and-aeo.md',
  },
  'digital-assets': {
    schema:       DigitalAssetsSchema,
    relativePath: 'truth-source/04-digital-assets.md',
  },
} as const satisfies Record<TruthSourceFileKey, { schema: z.ZodTypeAny; relativePath: string }>;

// ── Error class ──────────────────────────────────────────────────────────────

export class TruthSourceValidationError extends Error {
  constructor(
    public readonly key: TruthSourceFileKey,
    public readonly filePath: string,
    public readonly zodError: z.ZodError,
  ) {
    const issues = zodError.issues
      .map((i) => `  • ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    super(
      `[TRUTH-SOURCE] Schema validation failed for '${key}'\n` +
        `  File: ${filePath}\n` +
        `${issues}`,
    );
    this.name = 'TruthSourceValidationError';
  }
}

// ── Internal helpers ─────────────────────────────────────────────────────────

function resolveFilePath(key: TruthSourceFileKey, rootDir: string): string {
  return path.join(rootDir, REGISTRY[key].relativePath);
}

function parseAndValidate<K extends TruthSourceFileKey>(
  key: K,
  filePath: string,
  raw: string,
): { data: TruthSourceDataMap[K]; content: string } {
  const { data: frontmatter, content } = matter(raw);
  const schema = REGISTRY[key].schema as unknown as z.ZodType<TruthSourceDataMap[K]>;

  const result = schema.safeParse(frontmatter);
  if (!result.success) {
    throw new TruthSourceValidationError(key, filePath, result.error);
  }

  return { data: result.data, content };
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Read a truth-source file, validate its frontmatter, and return the typed
 * data + markdown body.  Throws `TruthSourceValidationError` on schema
 * violations.
 *
 * @param key     - One of the four truth-source file identifiers.
 * @param rootDir - Absolute path to the monorepo root.
 */
export async function readTruthSource<K extends TruthSourceFileKey>(
  key: K,
  rootDir: string,
): Promise<{ data: TruthSourceDataMap[K]; content: string; filePath: string }> {
  const filePath = resolveFilePath(key, rootDir);
  const raw = await fs.readFile(filePath, 'utf-8');
  const { data, content } = parseAndValidate(key, filePath, raw);
  return { data, content, filePath };
}

/**
 * Validate updated `data` against the schema, then write frontmatter + body
 * back to disk atomically (write to a `.tmp` file, then rename).
 * Throws `TruthSourceValidationError` if the data is invalid — disk is never
 * touched on a schema violation.
 *
 * @param key     - One of the four truth-source file identifiers.
 * @param data    - Validated frontmatter object (must conform to schema).
 * @param content - Raw markdown body (below the frontmatter delimiter).
 * @param rootDir - Absolute path to the monorepo root.
 */
export async function writeTruthSource<K extends TruthSourceFileKey>(
  key: K,
  data: TruthSourceDataMap[K],
  content: string,
  rootDir: string,
): Promise<void> {
  const filePath = resolveFilePath(key, rootDir);
  const tmpPath = `${filePath}.tmp`;

  // Validate before ANY disk write — fail-fast
  const schema = REGISTRY[key].schema as unknown as z.ZodType<TruthSourceDataMap[K]>;
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new TruthSourceValidationError(key, filePath, result.error);
  }

  const output = matter.stringify(content, result.data as Record<string, unknown>);

  // Atomic write: tmp → rename
  await fs.writeFile(tmpPath, output, 'utf-8');
  await fs.rename(tmpPath, filePath);
}

/**
 * Validate an arbitrary data object against a truth-source schema without any
 * file I/O.  Safe to call in the browser.
 *
 * Returns the parsed (and potentially transformed) data, or throws
 * `TruthSourceValidationError`.
 *
 * @param key  - One of the four truth-source file identifiers.
 * @param data - Raw data to validate (e.g., from a form submission).
 */
export function validateTruthSourceData<K extends TruthSourceFileKey>(
  key: K,
  data: unknown,
): TruthSourceDataMap[K] {
  const schema = REGISTRY[key].schema as unknown as z.ZodType<TruthSourceDataMap[K]>;
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new TruthSourceValidationError(key, '<in-memory>', result.error);
  }
  return result.data;
}
