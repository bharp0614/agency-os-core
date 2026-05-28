/** Matches every [SECURE_VAULT_REF: SOME_ID] pointer in a file. */
const VAULT_REF_RE = /\[SECURE_VAULT_REF:\s*([A-Z][A-Z0-9_]*)\]/g;

/**
 * Scans `fileContent` and returns the set of all vault ref IDs found.
 * Re-creates the regex on each call so `lastIndex` is always 0.
 */
export function extractVaultRefIds(fileContent: string): Set<string> {
  const ids = new Set<string>();
  const re = new RegExp(VAULT_REF_RE.source, 'g');
  let match: RegExpExecArray | null;
  while ((match = re.exec(fileContent)) !== null) {
    const id = match[1];
    if (id !== undefined) ids.add(id);
  }
  return ids;
}
