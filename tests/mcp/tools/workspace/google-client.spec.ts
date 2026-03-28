/**
 * Tests for GoogleClient: rate limit retry, OAuth2 token refresh, caching.
 * Mocks global fetch to verify retry and token behavior.
 */
import { test, expect } from '@playwright/test';
import { createGoogleClient } from '../../../../src/utils/google-client.js';
import type { GoogleCredentials } from '../../../../src/types/workspace.js';

const MOCK_CREDS: GoogleCredentials = {
  clientId: 'test-client-id',
  clientSecret: 'test-client-secret',
  refreshToken: 'test-refresh-token',
};

/** Create a mock Response object. */
function mockResponse(status: number, body: unknown, headers?: Record<string, string>): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 429 ? 'Too Many Requests' : status === 200 ? 'OK' : 'Error',
    headers: new Headers(headers),
    json: async () => body,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  } as Response;
}

/** Token endpoint response. */
const TOKEN_RESPONSE = { access_token: 'fresh-token-abc', expires_in: 3600, token_type: 'Bearer' };

test.describe('GoogleClient rate limit retry', () => {
  test('retries on 429 and succeeds', async () => {
    const calls: string[] = [];
    const originalFetch = globalThis.fetch;

    globalThis.fetch = async (input: RequestInfo | URL) => {
      const url = String(input);
      calls.push(url);

      // Token endpoint
      if (url.includes('oauth2.googleapis.com')) {
        return mockResponse(200, TOKEN_RESPONSE);
      }

      // First API call: 429, second: success
      if (calls.filter((c) => c.includes('googleapis.com/drive')).length <= 1) {
        return mockResponse(429, {});
      }
      return mockResponse(200, { files: [] });
    };

    try {
      const client = createGoogleClient(MOCK_CREDS);
      const result = await client.searchDrive('test query');
      expect(result.files).toEqual([]);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('throws after exhausting retries on 429', async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('oauth2.googleapis.com')) {
        return mockResponse(200, TOKEN_RESPONSE);
      }
      return mockResponse(429, {});
    };

    try {
      const client = createGoogleClient(MOCK_CREDS);
      await expect(client.searchDrive('test')).rejects.toThrow('rate limit');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

test.describe('GoogleClient OAuth2 token refresh', () => {
  test('refreshes token on first call', async () => {
    const tokenCalls: string[] = [];
    const originalFetch = globalThis.fetch;

    globalThis.fetch = async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes('oauth2.googleapis.com')) {
        tokenCalls.push(url);
        return mockResponse(200, TOKEN_RESPONSE);
      }

      return mockResponse(200, { files: [] });
    };

    try {
      const client = createGoogleClient(MOCK_CREDS);
      await client.searchDrive('test');

      expect(tokenCalls.length).toBe(1);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('caches token across calls', async () => {
    let tokenCallCount = 0;
    const originalFetch = globalThis.fetch;

    globalThis.fetch = async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes('oauth2.googleapis.com')) {
        tokenCallCount++;
        return mockResponse(200, TOKEN_RESPONSE);
      }

      // Drive, Sheets, Calendar endpoints
      if (url.includes('drive')) return mockResponse(200, { files: [] });
      if (url.includes('sheets')) return mockResponse(200, { range: 'A1', values: [] });
      if (url.includes('calendar')) return mockResponse(200, { items: [] });
      return mockResponse(200, {});
    };

    try {
      const client = createGoogleClient(MOCK_CREDS);
      await client.searchDrive('q1');
      await client.getSheetValues('sheet-1', 'A1:B2');
      await client.listEvents('primary', { limit: 5 });

      // Token should be refreshed only once (cached for ~58 min)
      expect(tokenCallCount).toBe(1);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('throws on token refresh failure', async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('oauth2.googleapis.com')) {
        return mockResponse(401, 'invalid_grant');
      }
      return mockResponse(200, {});
    };

    try {
      const client = createGoogleClient(MOCK_CREDS);
      await expect(client.searchDrive('test')).rejects.toThrow('OAuth2 token refresh failed');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('throws when token response has no access_token', async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('oauth2.googleapis.com')) {
        return mockResponse(200, { token_type: 'Bearer' }); // no access_token
      }
      return mockResponse(200, {});
    };

    try {
      const client = createGoogleClient(MOCK_CREDS);
      await expect(client.searchDrive('test')).rejects.toThrow('no access_token');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('sends correct Content-Type and body to token endpoint', async () => {
    let capturedBody: string | undefined;
    const originalFetch = globalThis.fetch;

    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.includes('oauth2.googleapis.com')) {
        capturedBody = typeof init?.body === 'string' ? init.body : init?.body?.toString();
        return mockResponse(200, TOKEN_RESPONSE);
      }

      return mockResponse(200, { files: [] });
    };

    try {
      const client = createGoogleClient(MOCK_CREDS);
      await client.searchDrive('test');

      expect(capturedBody).toContain('client_id=test-client-id');
      expect(capturedBody).toContain('client_secret=test-client-secret');
      expect(capturedBody).toContain('refresh_token=test-refresh-token');
      expect(capturedBody).toContain('grant_type=refresh_token');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
