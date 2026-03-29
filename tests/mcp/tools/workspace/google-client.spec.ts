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

test.describe('GoogleClient regression tests', () => {
  test('mimeType with single quote does not break the query', async () => {
    let capturedUrl = '';
    const originalFetch = globalThis.fetch;

    globalThis.fetch = async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes('oauth2.googleapis.com')) {
        return mockResponse(200, TOKEN_RESPONSE);
      }

      capturedUrl = url;
      return mockResponse(200, { files: [] });
    };

    try {
      const client = createGoogleClient(MOCK_CREDS);
      await client.searchDrive('test', { mimeType: "application/vnd.google-apps.document'" });

      // The single quote in mimeType should be escaped with backslash
      expect(capturedUrl).toContain('mimeType');
      expect(capturedUrl).not.toContain("mimeType = 'application/vnd.google-apps.document''");
      // Verify the escaped form is present (URL-encoded backslash-quote)
      const params = new URL(capturedUrl).searchParams;
      const q = params.get('q') ?? '';
      expect(q).toContain("mimeType = 'application/vnd.google-apps.document\\'");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('"sprint=5" is NOT detected as a Drive operator query', async () => {
    let capturedUrl = '';
    const originalFetch = globalThis.fetch;

    globalThis.fetch = async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes('oauth2.googleapis.com')) {
        return mockResponse(200, TOKEN_RESPONSE);
      }

      capturedUrl = url;
      return mockResponse(200, { files: [] });
    };

    try {
      const client = createGoogleClient(MOCK_CREDS);
      await client.searchDrive('sprint=5');

      // "sprint=5" has no spaces around "=", so isDriveOperatorQuery returns false
      // It should be wrapped as a name search, not passed through as an operator query
      const params = new URL(capturedUrl).searchParams;
      const q = params.get('q') ?? '';
      expect(q).toContain("name contains 'sprint=5'");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('refreshAccessToken fetch includes abort signal for timeout', async () => {
    let capturedInit: RequestInit | undefined;
    const originalFetch = globalThis.fetch;

    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.includes('oauth2.googleapis.com')) {
        capturedInit = init;
        // Simulate a timeout by throwing AbortError
        const error = new DOMException('The operation was aborted.', 'AbortError');
        throw error;
      }

      return mockResponse(200, { files: [] });
    };

    try {
      const client = createGoogleClient(MOCK_CREDS);
      await expect(client.searchDrive('test')).rejects.toThrow();

      // Verify the fetch call to oauth2 endpoint included a signal
      expect(capturedInit).toBeDefined();
      expect(capturedInit!.signal).toBeDefined();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
