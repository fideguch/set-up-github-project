import { test, expect } from '@playwright/test';
import { notionQueryDatabase } from '../../../../src/tools/notion/query-database.js';
import {
  createMockNotion,
  MOCK_NOTION_QUERY,
  MOCK_NOTION_PAGE,
} from '../../../scenarios/fixtures/mock-notion.js';
import type { NotionQueryResponse } from '../../../../src/types/notion.js';

/** Build a query response with the given results. */
function queryResponse(
  results: readonly unknown[],
  opts?: { has_more?: boolean; next_cursor?: string | null }
): NotionQueryResponse {
  return {
    object: 'list',
    results: results as NotionQueryResponse['results'],
    has_more: opts?.has_more ?? false,
    next_cursor: opts?.next_cursor ?? null,
  };
}

test.describe('notion_query_database tool', () => {
  test('returns database results', async () => {
    const notion = createMockNotion([MOCK_NOTION_QUERY]);

    const result = await notionQueryDatabase(notion, { databaseId: 'db-uuid' });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.results).toHaveLength(1);
    expect(data.results[0].id).toBe('page-uuid-1234');
  });

  test('applies filter parameter', async () => {
    const notion = createMockNotion([MOCK_NOTION_QUERY]);

    const filter = JSON.stringify({
      property: 'Status',
      select: { equals: 'Done' },
    });
    const result = await notionQueryDatabase(notion, {
      databaseId: 'db-uuid',
      filter,
    });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.results).toHaveLength(1);
  });

  test('returns error for non-existent database', async () => {
    const notion = createMockNotion([new Error('Notion API error 404: not found')]);

    const result = await notionQueryDatabase(notion, { databaseId: 'nonexistent' });

    expect(result.isError).toBe(true);
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain('404');
  });

  test('returns error on invalid JSON filter', async () => {
    const notion = createMockNotion([MOCK_NOTION_QUERY]);

    const result = await notionQueryDatabase(notion, {
      databaseId: 'db-uuid',
      filter: '{invalid json',
    });

    expect(result.isError).toBe(true);
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain('Invalid filter JSON');
  });

  test('handles empty results', async () => {
    const notion = createMockNotion([queryResponse([])]);

    const result = await notionQueryDatabase(notion, { databaseId: 'db-uuid' });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.results).toHaveLength(0);
    expect(data.totalResults).toBe(0);
  });

  test('returns error on API failure', async () => {
    const notion = createMockNotion([new Error('Notion API error 500: internal server error')]);

    const result = await notionQueryDatabase(notion, { databaseId: 'db-uuid' });

    expect(result.isError).toBe(true);
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain('500');
  });

  test('paginates through multiple pages', async () => {
    const page2 = { ...MOCK_NOTION_PAGE, id: 'page-uuid-5678', url: 'https://notion.so/page-5678' };
    const notion = createMockNotion([
      queryResponse([MOCK_NOTION_PAGE], { has_more: true, next_cursor: 'cursor_1' }),
      queryResponse([page2], { has_more: false }),
    ]);

    const result = await notionQueryDatabase(notion, { databaseId: 'db-uuid' });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.results).toHaveLength(2);
    expect(data.results[0].id).toBe('page-uuid-1234');
    expect(data.results[1].id).toBe('page-uuid-5678');
    expect(data.pagesFetched).toBe(2);
    expect(data.hasMore).toBe(false);
  });

  test('respects MAX_PAGES limit', async () => {
    // Create 11 pages of responses (MAX_PAGES = 10)
    const responses = Array.from({ length: 11 }, (_, i) =>
      queryResponse([{ ...MOCK_NOTION_PAGE, id: `page-${i}` }], {
        has_more: true,
        next_cursor: `cursor_${i}`,
      })
    );
    const notion = createMockNotion(responses);

    const result = await notionQueryDatabase(notion, { databaseId: 'db-uuid' });

    expect(result.isError).toBeUndefined();
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.pagesFetched).toBe(10);
    expect(data.hasMore).toBe(true); // Stopped before exhausting
  });

  test('returns sorts validation error for non-array', async () => {
    const notion = createMockNotion([MOCK_NOTION_QUERY]);

    const result = await notionQueryDatabase(notion, {
      databaseId: 'db-uuid',
      sorts: '{"property": "Name"}', // object, not array
    });

    expect(result.isError).toBe(true);
    const text = (result.content[0] as { text: string }).text;
    expect(text).toContain('expected an array');
  });
});
