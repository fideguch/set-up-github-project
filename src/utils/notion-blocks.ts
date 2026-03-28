/**
 * Notion block construction helpers.
 * Pure functions — no side effects, all inputs readonly.
 * Used by create-page and append-blocks tools.
 */
import type { NotionBlockInput } from '../types/notion.js';

/** Convert plain text lines into paragraph block inputs (split by double newline). */
export function textToParagraphBlocks(text: string): readonly NotionBlockInput[] {
  return text.split('\n\n').map((paragraph) => ({
    type: 'paragraph',
    paragraph: {
      rich_text: [{ type: 'text', text: { content: paragraph } }],
    },
  }));
}
