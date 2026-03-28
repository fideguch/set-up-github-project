/**
 * Shared field-value extraction helpers for project items.
 * Used by list-items and sprint-report to avoid duplicated logic.
 */
import type { ItemNode, FieldValueNode, ProjectItem } from '../types/index.js';

/**
 * Extract a field value from a project item by field name.
 * Returns the display value (name, number, or title) or null if not found.
 * Uses `in` narrowing where possible; a single `as` cast is needed
 * because the FieldValueNode union includes Record<string, never>
 * which lacks a `field` property.
 */
export function getFieldValue(item: ItemNode, fieldName: string): string | number | null {
  for (const fv of item.fieldValues.nodes) {
    if (!fv || !('field' in fv)) continue;

    // Safe cast: we verified 'field' exists above. The union's empty-record
    // variant is excluded by the `in` check.
    const typed = fv as FieldValueNode & { field: { name: string } };
    if (typed.field.name !== fieldName) continue;

    if ('name' in fv) return (fv as { name: string }).name;
    if ('number' in fv) return (fv as { number: number }).number;
    if ('title' in fv) return (fv as { title: string }).title;
  }
  return null;
}

/** Check whether an item has the 'blocked' label. */
export function isBlocked(item: ItemNode): boolean {
  const labels = item.content?.labels?.nodes ?? [];
  return labels.some((l) => l.name === 'blocked');
}

/** Convert a raw GraphQL ItemNode into a normalized ProjectItem. */
export function toProjectItem(item: ItemNode): ProjectItem {
  const status = getFieldValue(item, 'Status');
  const priority = getFieldValue(item, 'Priority');
  const estimate = getFieldValue(item, 'Estimate');

  return {
    itemId: item.id,
    number: item.content?.number ?? null,
    title: item.content?.title ?? '(Draft)',
    state: item.content?.state ?? null,
    status: typeof status === 'string' ? status : null,
    priority: typeof priority === 'string' ? priority : null,
    estimate: typeof estimate === 'number' ? estimate : null,
    sprint:
      (() => {
        const val = getFieldValue(item, 'Sprint');
        return typeof val === 'string' ? val : null;
      })() ??
      (() => {
        const val = getFieldValue(item, 'Iteration');
        return typeof val === 'string' ? val : null;
      })(),
    isBlocked: isBlocked(item),
  };
}
