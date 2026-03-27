import { test, expect } from '@playwright/test';
import { z } from 'zod';
import {
  addItemSchema,
  moveStatusSchema,
  setPrioritySchema,
  listItemsSchema,
  listFieldsSchema,
  sprintReportSchema,
} from '../../src/schemas/index.js';

// Helper to parse a raw shape into a Zod object and validate
function parseShape(shape: Record<string, z.ZodType>, data: unknown) {
  return z.object(shape).safeParse(data);
}

test.describe('Zod Schema Validation', () => {
  test.describe('addItemSchema', () => {
    test('accepts valid input', () => {
      const result = parseShape(addItemSchema, {
        owner: 'fideguch',
        projectNumber: 1,
        repo: 'fideguch/my_pm_tools',
        itemNumber: 42,
        itemType: 'issue',
      });
      expect(result.success).toBe(true);
    });

    test('defaults itemType to issue', () => {
      const result = parseShape(addItemSchema, {
        owner: 'fideguch',
        projectNumber: 1,
        repo: 'fideguch/my_pm_tools',
        itemNumber: 42,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as { itemType: string }).itemType).toBe('issue');
      }
    });

    test('rejects invalid repo format', () => {
      const result = parseShape(addItemSchema, {
        owner: 'fideguch',
        projectNumber: 1,
        repo: 'invalid-repo',
        itemNumber: 42,
        itemType: 'issue',
      });
      expect(result.success).toBe(false);
    });

    test('rejects non-positive projectNumber', () => {
      const result = parseShape(addItemSchema, {
        owner: 'fideguch',
        projectNumber: 0,
        repo: 'fideguch/my_pm_tools',
        itemNumber: 42,
      });
      expect(result.success).toBe(false);
    });

    test('rejects invalid itemType', () => {
      const result = parseShape(addItemSchema, {
        owner: 'fideguch',
        projectNumber: 1,
        repo: 'fideguch/my_pm_tools',
        itemNumber: 42,
        itemType: 'draft',
      });
      expect(result.success).toBe(false);
    });

    test('accepts pr as itemType', () => {
      const result = parseShape(addItemSchema, {
        owner: 'fideguch',
        projectNumber: 1,
        repo: 'fideguch/my_pm_tools',
        itemNumber: 10,
        itemType: 'pr',
      });
      expect(result.success).toBe(true);
    });
  });

  test.describe('moveStatusSchema', () => {
    test('accepts valid input', () => {
      const result = parseShape(moveStatusSchema, {
        owner: 'fideguch',
        projectNumber: 1,
        itemId: 'PVTI_abc123',
        status: '開発中',
      });
      expect(result.success).toBe(true);
    });

    test('rejects missing status', () => {
      const result = parseShape(moveStatusSchema, {
        owner: 'fideguch',
        projectNumber: 1,
        itemId: 'PVTI_abc123',
      });
      expect(result.success).toBe(false);
    });
  });

  test.describe('setPrioritySchema', () => {
    test('accepts valid priority P0-P4', () => {
      for (const p of ['P0', 'P1', 'P2', 'P3', 'P4']) {
        const result = parseShape(setPrioritySchema, {
          owner: 'fideguch',
          projectNumber: 1,
          itemId: 'PVTI_abc123',
          priority: p,
        });
        expect(result.success).toBe(true);
      }
    });

    test('rejects invalid priority', () => {
      const result = parseShape(setPrioritySchema, {
        owner: 'fideguch',
        projectNumber: 1,
        itemId: 'PVTI_abc123',
        priority: 'P5',
      });
      expect(result.success).toBe(false);
    });
  });

  test.describe('listItemsSchema', () => {
    test('accepts minimal input', () => {
      const result = parseShape(listItemsSchema, {
        owner: 'fideguch',
        projectNumber: 1,
      });
      expect(result.success).toBe(true);
    });

    test('accepts with optional filters', () => {
      const result = parseShape(listItemsSchema, {
        owner: 'fideguch',
        projectNumber: 1,
        statusFilter: 'Done',
        priorityFilter: 'P0',
      });
      expect(result.success).toBe(true);
    });
  });

  test.describe('listFieldsSchema', () => {
    test('accepts valid input', () => {
      const result = parseShape(listFieldsSchema, {
        owner: 'fideguch',
        projectNumber: 3,
      });
      expect(result.success).toBe(true);
    });

    test('rejects missing owner', () => {
      const result = parseShape(listFieldsSchema, {
        projectNumber: 3,
      });
      expect(result.success).toBe(false);
    });
  });

  test.describe('sprintReportSchema', () => {
    test('accepts valid input with default', () => {
      const result = parseShape(sprintReportSchema, {
        owner: 'fideguch',
        projectNumber: 1,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as { sprint: string }).sprint).toBe('current');
      }
    });

    test('accepts previous sprint', () => {
      const result = parseShape(sprintReportSchema, {
        owner: 'fideguch',
        projectNumber: 1,
        sprint: 'previous',
      });
      expect(result.success).toBe(true);
    });

    test('accepts custom sprint title', () => {
      const result = parseShape(sprintReportSchema, {
        owner: 'fideguch',
        projectNumber: 1,
        sprint: 'Sprint 2026-W13',
      });
      expect(result.success).toBe(true);
    });
  });
});
