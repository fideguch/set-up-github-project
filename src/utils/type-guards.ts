/**
 * Shared runtime type narrowing helpers.
 * Used across Notion tools and markdown utilities to avoid `as` casts (§1.5).
 */

/** Validate a value is a non-null object (not array). */
export function isRecord(val: unknown): val is Record<string, unknown> {
  return val != null && typeof val === 'object' && !Array.isArray(val);
}
