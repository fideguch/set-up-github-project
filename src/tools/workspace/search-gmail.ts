import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { GoogleClient } from '../../utils/google-client.js';
import type { GmailMessageResponse } from '../../types/workspace.js';

/** Extract a specific header value from a Gmail message payload. */
function extractHeader(message: GmailMessageResponse, headerName: string): string {
  const header = message.payload.headers.find(
    (h) => h.name.toLowerCase() === headerName.toLowerCase()
  );
  return header?.value ?? '';
}

/**
 * Search Gmail messages and return metadata (subject, from, date, snippet).
 * Fetches message list, then retrieves metadata for each message.
 * P1: GoogleClient DI, P2: never throws, P4: JSON envelope response.
 */
export async function workspaceSearchGmail(
  google: GoogleClient,
  args: {
    query: string;
    limit: number;
  }
): Promise<CallToolResult> {
  try {
    const listResponse = await google.listGmailMessages(args.query, {
      limit: args.limit,
    });

    const messages = [];
    for (const msg of (listResponse.messages ?? []).slice(0, args.limit)) {
      try {
        const detail = await google.getGmailMessage(msg.id);
        messages.push({
          id: detail.id,
          subject: extractHeader(detail, 'Subject'),
          from: extractHeader(detail, 'From'),
          date: extractHeader(detail, 'Date'),
          snippet: detail.snippet,
        });
      } catch {
        /* skip failed individual message fetch */
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              messages,
              totalEstimate: listResponse.resultSizeEstimate ?? messages.length,
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      isError: true,
      content: [{ type: 'text', text: `Gmail search failed: ${message}` }],
    };
  }
}
