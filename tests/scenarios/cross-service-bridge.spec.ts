import { test, expect } from '@playwright/test';
import { createMockNotion, MOCK_NOTION_QUERY } from './fixtures/mock-notion.js';
import { createMockGoogle, MOCK_SHEET_VALUES } from './fixtures/mock-google.js';
import { notionQueryDatabase } from '../../src/tools/notion/query-database.js';
import { workspaceGetSheet } from '../../src/tools/workspace/get-sheet.js';

// ---------------------------------------------------------------------------
// Cross-service bridge: verify output format compatibility between
// workspace tools and GitHub project tools (addItem expects id + title).
// ---------------------------------------------------------------------------

test.describe('Cross-service bridge compatibility', () => {
  test('Notion query_database results have id and extractable title for addItem', async () => {
    // Given: a mock Notion client returning a database query result
    const notion = createMockNotion([MOCK_NOTION_QUERY]);

    // When: querying a database
    const result = await notionQueryDatabase(notion, { databaseId: 'db-uuid' });

    // Then: each result row has `id` and `properties` with a title-type property
    expect(result.isError).toBeUndefined();
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.results).toHaveLength(1);

    const row = data.results[0];
    // id is present and non-empty (needed for cross-referencing)
    expect(typeof row.id).toBe('string');
    expect(row.id.length).toBeGreaterThan(0);

    // properties contain a title-type property whose value can be extracted
    const titleProp = Object.values(row.properties).find(
      (p: unknown) =>
        p != null &&
        typeof p === 'object' &&
        !Array.isArray(p) &&
        (p as Record<string, unknown>)['type'] === 'title'
    ) as Record<string, unknown> | undefined;
    expect(titleProp).toBeDefined();

    // Title array contains plain_text that can be used as issue title
    const titleArr = titleProp!['title'] as readonly { plain_text: string }[];
    const titleText = titleArr.map((t) => t.plain_text).join('');
    expect(titleText.length).toBeGreaterThan(0);
  });

  test('Sheet get_sheet results have rows mappable to issue data', async () => {
    // Given: a mock Google client returning sheet values with Name/Priority/Status columns
    const google = createMockGoogle([MOCK_SHEET_VALUES]);

    // When: reading a sheet range
    const result = await workspaceGetSheet(google, {
      spreadsheetId: 'sheet-456',
      range: 'Sheet1!A1:C3',
    });

    // Then: response has headers and rows that can be mapped to issue fields
    expect(result.isError).toBeUndefined();
    const data = JSON.parse((result.content[0] as { text: string }).text);

    // Headers include Name, Priority, Status — mappable to issue title/priority/status
    expect(data.headers).toContain('Name');
    expect(data.headers).toContain('Priority');
    expect(data.headers).toContain('Status');

    // Each row can be mapped: row[nameIdx] → issue title, row[priorityIdx] → priority
    const nameIdx = data.headers.indexOf('Name');
    const priorityIdx = data.headers.indexOf('Priority');

    expect(data.rows.length).toBeGreaterThan(0);
    for (const row of data.rows) {
      expect(typeof row[nameIdx]).toBe('string');
      expect(row[nameIdx].length).toBeGreaterThan(0);
      expect(typeof row[priorityIdx]).toBe('string');
    }
  });
});
