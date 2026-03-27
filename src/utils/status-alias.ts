/**
 * Status alias resolution for Japanese/English shorthand.
 * Resolution order: exact match → alias match → partial match (case-insensitive).
 */

const STATUS_ALIASES: ReadonlyMap<string, string> = new Map([
  // English shorthand → Japanese canonical
  ['dev', '開発中'],
  ['review', 'コードレビュー'],
  ['testing', 'テスト中'],
  ['done', 'Done'],
  ['backlog', 'Backlog'],
  ['icebox', 'Icebox'],
  ['test-failed', 'テスト落ち'],
  ['released', 'リリース済み'],
  ['waiting', '進行待ち'],
  ['design', 'デザイン作成中'],
  ['ready', '開発待ち'],
]);

/**
 * Resolve a status input to a canonical status name from the available options.
 * Returns the matched option name, or null if no match found.
 */
export function resolveStatusAlias(
  input: string,
  availableStatuses: readonly string[]
): string | null {
  // 1. Exact match
  const exact = availableStatuses.find((s) => s === input);
  if (exact) return exact;

  // 2. Alias match
  const aliasTarget = STATUS_ALIASES.get(input.toLowerCase());
  if (aliasTarget) {
    const aliasMatch = availableStatuses.find((s) => s === aliasTarget);
    if (aliasMatch) return aliasMatch;
  }

  // 3. Case-insensitive partial match
  const lowerInput = input.toLowerCase();
  const partial = availableStatuses.find((s) => s.toLowerCase().includes(lowerInput));
  if (partial) return partial;

  return null;
}
