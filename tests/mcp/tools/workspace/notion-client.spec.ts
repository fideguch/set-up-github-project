/**
 * Tests for NotionClient: rate limit retry, error handling.
 * Mocks global fetch to verify retry behavior on 429 responses.
 */
import { test, expect } from '@playwright/test';
import { createNotionClient } from '../../../../src/utils/notion-client.js';

/** Create a mock Response object. */
function mockResponse(status: number, body: unknown, headers?: Record<string, string>): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 429 ? 'Too Many Requests' : status === 200 ? 'OK' : 'Error',
    headers: new Headers(headers),
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as Response;
}

test.describe('NotionClient rate limit retry', () => {
  test('retries on 429 and succeeds', async () => {
    const calls: string[] = [];
    const originalFetch = globalThis.fetch;

    globalThis.fetch = async (input: RequestInfo | URL) => {
      calls.push(String(input));
      if (calls.length <= 2) {
        return mockResponse(429, {}, { 'Retry-After': '0' });
      }
      return mockResponse(200, { object: 'list', results: [], has_more: false, next_cursor: null });
    };

    try {
      const client = createNotionClient('test-token');
      const result = await client.search({ query: 'test' });

      expect(calls.length).toBe(3); // 2 retries + 1 success
      expect(result.results).toEqual([]);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('throws after exhausting retries on 429', async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = async () => {
      return mockResponse(429, {}, { 'Retry-After': '0' });
    };

    try {
      const client = createNotionClient('test-token');
      await expect(client.search({ query: 'test' })).rejects.toThrow('rate limit');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('throws descriptive error on non-429 failure', async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = async () => {
      return mockResponse(404, { code: 'object_not_found', message: 'Page not found' });
    };

    try {
      const client = createNotionClient('test-token');
      await expect(client.getPage('missing-id')).rejects.toThrow('object_not_found');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('validates response is an object', async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = async () => {
      return mockResponse(200, null);
    };

    try {
      const client = createNotionClient('test-token');
      await expect(client.search({ query: 'test' })).rejects.toThrow('non-object');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('sends correct authorization header', async () => {
    let capturedHeaders: Headers | undefined;
    const originalFetch = globalThis.fetch;

    globalThis.fetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
      capturedHeaders = new Headers(init?.headers);
      return mockResponse(200, { object: 'list', results: [], has_more: false, next_cursor: null });
    };

    try {
      const client = createNotionClient('secret-token-123');
      await client.search({ query: 'test' });

      expect(capturedHeaders?.get('Authorization')).toBe('Bearer secret-token-123');
      expect(capturedHeaders?.get('Notion-Version')).toBe('2022-06-28');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
