import { test, expect } from '@playwright/test';
import {
  createMockGoogle,
  MOCK_SHEET_UPDATE,
  MOCK_SHEET_APPEND,
  MOCK_CALENDAR_EVENT_CREATED,
} from './fixtures/mock-google.js';
import { createMockNotion, MOCK_NOTION_PAGE } from './fixtures/mock-notion.js';
import { workspaceUpdateSheet } from '../../src/tools/workspace/update-sheet.js';
import { workspaceAppendSheet } from '../../src/tools/workspace/append-sheet.js';
import { workspaceCreateEvent } from '../../src/tools/workspace/create-event.js';
import { notionUpdatePage } from '../../src/tools/notion/update-page.js';
import { notionArchivePage } from '../../src/tools/notion/archive-page.js';

// ---------------------------------------------------------------------------
// PM write workflow scenarios — verify bidirectional Workspace Bridge operations
// ---------------------------------------------------------------------------

test.describe('PM updates sprint data in Sheets', () => {
  test('should update sheet cell values and return updated range metadata', async () => {
    // Given: a mock Google client returning update confirmation
    const google = createMockGoogle([MOCK_SHEET_UPDATE]);

    // When: updating sprint velocity data
    const result = await workspaceUpdateSheet(google, {
      spreadsheetId: 'sheet-456',
      range: 'Sheet1!A1:C2',
      values: '[["Sprint","Velocity","Done"],["Sprint 5","42","18"]]',
      valueInputOption: 'RAW',
    });

    // Then: response contains updated range and cell counts
    expect(result.isError).toBeUndefined();
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.spreadsheetId).toBe('sheet-456');
    expect(data.updatedRange).toBe('Sheet1!A1:C2');
    expect(data.updatedRows).toBe(2);
    expect(data.updatedColumns).toBe(3);
    expect(data.updatedCells).toBe(6);
    expect(data.message).toBe('Sheet values updated successfully');
  });

  test('should reject invalid (non-2D) values JSON', async () => {
    // Given: a mock Google client (will not be called)
    const google = createMockGoogle([]);

    // When: passing a flat array instead of 2D array
    const result = await workspaceUpdateSheet(google, {
      spreadsheetId: 'sheet-456',
      range: 'Sheet1!A1',
      values: '["flat","array"]',
      valueInputOption: 'RAW',
    });

    // Then: error is returned with a helpful message
    expect(result.isError).toBe(true);
    expect((result.content[0] as { text: string }).text).toContain('expected 2D array');
  });
});

// ---------------------------------------------------------------------------
// PM appends new tasks to backlog sheet
// ---------------------------------------------------------------------------

test.describe('PM appends new tasks to backlog sheet', () => {
  test('should append task rows and return append metadata', async () => {
    // Given: a mock Google client returning append confirmation
    const google = createMockGoogle([MOCK_SHEET_APPEND]);

    // When: appending new backlog items
    const result = await workspaceAppendSheet(google, {
      spreadsheetId: 'sheet-456',
      range: 'Sheet1!A1',
      values: '[["Implement OAuth","P0","Backlog"]]',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
    });

    // Then: response contains updated range and appended row info
    expect(result.isError).toBeUndefined();
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.spreadsheetId).toBe('sheet-456');
    expect(data.updatedRange).toBe('Sheet1!A4:C4');
    expect(data.updatedRows).toBe(1);
    expect(data.message).toBe('Rows appended successfully');
  });

  test('should reject malformed JSON values', async () => {
    // Given: a mock Google client (will not be called)
    const google = createMockGoogle([]);

    // When: passing malformed JSON
    const result = await workspaceAppendSheet(google, {
      spreadsheetId: 'sheet-456',
      range: 'Sheet1!A1',
      values: 'not-json',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
    });

    // Then: error is returned with the invalid JSON excerpt
    expect(result.isError).toBe(true);
    expect((result.content[0] as { text: string }).text).toContain('Invalid values JSON');
  });
});

// ---------------------------------------------------------------------------
// PM creates sprint planning event
// ---------------------------------------------------------------------------

test.describe('PM creates sprint planning event', () => {
  test('should create a timed calendar event and return event id and link', async () => {
    // Given: a mock Google client returning the created event
    const google = createMockGoogle([MOCK_CALENDAR_EVENT_CREATED]);

    // When: creating a sprint planning event with RFC3339 timestamps
    const result = await workspaceCreateEvent(google, {
      calendarId: 'primary',
      summary: 'Sprint Planning',
      startDateTime: '2026-04-01T10:00:00+09:00',
      endDateTime: '2026-04-01T11:00:00+09:00',
      description: 'Sprint 6 planning',
      location: 'Room A',
    });

    // Then: response contains event id, link, and confirmation message
    expect(result.isError).toBeUndefined();
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.event.id).toBe('evt-new-1');
    expect(data.event.htmlLink).toContain('calendar.google.com');
    expect(data.event.summary).toBe('Sprint Planning');
    expect(data.event.status).toBe('confirmed');
    expect(data.message).toBe('Event created successfully');
  });

  test('should reject timed events without timezone offset', async () => {
    // Given: a mock Google client (will not be called)
    const google = createMockGoogle([]);

    // When: creating an event with datetime missing timezone offset
    const result = await workspaceCreateEvent(google, {
      calendarId: 'primary',
      summary: 'Meeting',
      startDateTime: '2026-04-01T10:00:00',
      endDateTime: '2026-04-01T11:00:00',
    });

    // Then: error is returned with RFC3339 format guidance
    expect(result.isError).toBe(true);
    expect((result.content[0] as { text: string }).text).toContain('RFC3339');
  });
});

// ---------------------------------------------------------------------------
// PM updates Notion page status
// ---------------------------------------------------------------------------

test.describe('PM updates Notion page status', () => {
  test('should update page properties and return updated page metadata', async () => {
    // Given: a mock Notion client returning the updated page
    const notion = createMockNotion([MOCK_NOTION_PAGE]);

    // When: updating the status property of a Notion page
    const result = await notionUpdatePage(notion, {
      pageId: 'page-uuid-1234',
      properties: '{"Status":{"select":{"name":"In Review"}}}',
    });

    // Then: response contains page id, url, and success message
    expect(result.isError).toBeUndefined();
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.page.id).toBe('page-uuid-1234');
    expect(data.page.url).toContain('notion.so');
    expect(data.message).toBe('Page updated successfully');
  });

  test('should reject non-object properties JSON', async () => {
    // Given: a mock Notion client (will not be called)
    const notion = createMockNotion([]);

    // When: passing a JSON array instead of an object
    const result = await notionUpdatePage(notion, {
      pageId: 'page-uuid-1234',
      properties: '["not","an","object"]',
    });

    // Then: error is returned listing updatable property types
    expect(result.isError).toBe(true);
    expect((result.content[0] as { text: string }).text).toContain(
      'properties must be a JSON object'
    );
  });
});

// ---------------------------------------------------------------------------
// PM archives completed Notion page
// ---------------------------------------------------------------------------

test.describe('PM archives completed Notion page', () => {
  test('should archive a Notion page and return archived status', async () => {
    // Given: a mock Notion client returning the archived page
    const archivedPage = { ...MOCK_NOTION_PAGE, archived: true };
    const notion = createMockNotion([archivedPage]);

    // When: archiving a completed sprint retrospective page
    const result = await notionArchivePage(notion, {
      pageId: 'page-uuid-1234',
      archive: true,
    });

    // Then: response confirms the page was archived
    expect(result.isError).toBeUndefined();
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.page.id).toBe('page-uuid-1234');
    expect(data.page.archived).toBe(true);
    expect(data.message).toBe('Page archived successfully');
  });

  test('should unarchive a page when archive=false', async () => {
    // Given: a mock Notion client returning an unarchived page
    const unarchivedPage = { ...MOCK_NOTION_PAGE, archived: false };
    const notion = createMockNotion([unarchivedPage]);

    // When: restoring an accidentally archived page
    const result = await notionArchivePage(notion, {
      pageId: 'page-uuid-1234',
      archive: false,
    });

    // Then: response confirms the page was unarchived
    expect(result.isError).toBeUndefined();
    const data = JSON.parse((result.content[0] as { text: string }).text);
    expect(data.page.archived).toBe(false);
    expect(data.message).toBe('Page unarchived successfully');
  });
});

// ---------------------------------------------------------------------------
// Full write workflow: update sheet + create event + update Notion page
// ---------------------------------------------------------------------------

test.describe('Full write workflow', () => {
  test('should execute update sheet → create event → update Notion page in sequence', async () => {
    // Given: mocks for all three operations in sequence
    const google = createMockGoogle([MOCK_SHEET_UPDATE, MOCK_CALENDAR_EVENT_CREATED]);
    const notion = createMockNotion([MOCK_NOTION_PAGE]);

    // When: PM updates sprint data, creates kickoff event, then updates Notion sprint doc
    const sheetResult = await workspaceUpdateSheet(google, {
      spreadsheetId: 'sheet-456',
      range: 'Sprint!A1:B2',
      values: '[["Sprint 6","Active"],["Start","2026-04-01"]]',
      valueInputOption: 'USER_ENTERED',
    });

    const eventResult = await workspaceCreateEvent(google, {
      calendarId: 'primary',
      summary: 'Sprint 6 Kickoff',
      startDateTime: '2026-04-01T09:00:00+09:00',
      endDateTime: '2026-04-01T09:30:00+09:00',
    });

    const notionResult = await notionUpdatePage(notion, {
      pageId: 'page-uuid-1234',
      properties: '{"Status":{"select":{"name":"Active"}}}',
    });

    // Then: all three operations succeed
    expect(sheetResult.isError).toBeUndefined();
    expect(eventResult.isError).toBeUndefined();
    expect(notionResult.isError).toBeUndefined();

    const sheetData = JSON.parse((sheetResult.content[0] as { text: string }).text);
    const eventData = JSON.parse((eventResult.content[0] as { text: string }).text);
    const notionData = JSON.parse((notionResult.content[0] as { text: string }).text);

    expect(sheetData.message).toBe('Sheet values updated successfully');
    expect(eventData.message).toBe('Event created successfully');
    expect(notionData.message).toBe('Page updated successfully');
  });
});

// ---------------------------------------------------------------------------
// Mixed success/failure: first tool succeeds, second fails → error isolation
// ---------------------------------------------------------------------------

test.describe('Write workflow error isolation', () => {
  test('should isolate errors — first tool success does not affect second tool failure', async () => {
    // Given: Google client where first call succeeds and second throws
    const google = createMockGoogle([MOCK_SHEET_UPDATE, new Error('API rate limit exceeded')]);

    // When: update sheet succeeds, then create event hits a rate limit
    const sheetResult = await workspaceUpdateSheet(google, {
      spreadsheetId: 'sheet-456',
      range: 'Sheet1!A1',
      values: '[["Sprint 6"]]',
      valueInputOption: 'RAW',
    });

    const eventResult = await workspaceCreateEvent(google, {
      calendarId: 'primary',
      summary: 'Retro',
      startDateTime: '2026-04-02T14:00:00+09:00',
      endDateTime: '2026-04-02T15:00:00+09:00',
    });

    // Then: first operation succeeds, second returns error without throwing
    expect(sheetResult.isError).toBeUndefined();
    const sheetData = JSON.parse((sheetResult.content[0] as { text: string }).text);
    expect(sheetData.message).toBe('Sheet values updated successfully');

    expect(eventResult.isError).toBe(true);
    expect((eventResult.content[0] as { text: string }).text).toContain('Create event failed');
    expect((eventResult.content[0] as { text: string }).text).toContain('rate limit');
  });
});
