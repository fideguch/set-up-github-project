import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { NotionClient } from '../../utils/notion-client.js';
import { textToParagraphBlocks } from '../../utils/notion-blocks.js';

/** Validate a value is a non-null object (not array). */
function isRecord(val: unknown): val is Record<string, unknown> {
  return val != null && typeof val === 'object' && !Array.isArray(val);
}

/**
 * Create a new Notion page under a database or another page.
 * P1: NotionClient DI, P2: never throws, P4: JSON envelope response.
 */
export async function notionCreatePage(
  notion: NotionClient,
  args: {
    parentId: string;
    parentType: 'database' | 'page';
    properties: string;
    content?: string;
  }
): Promise<CallToolResult> {
  try {
    const parent =
      args.parentType === 'database' ? { database_id: args.parentId } : { page_id: args.parentId };

    let properties: Record<string, unknown>;
    try {
      const parsed: unknown = JSON.parse(args.properties);
      if (!isRecord(parsed)) {
        return {
          isError: true,
          content: [{ type: 'text', text: 'properties must be a JSON object.' }],
        };
      }
      properties = parsed;
    } catch {
      return {
        isError: true,
        content: [
          { type: 'text', text: `Invalid properties JSON: ${args.properties.slice(0, 100)}` },
        ],
      };
    }

    const children = args.content ? textToParagraphBlocks(args.content) : undefined;

    const page = await notion.createPage({
      parent,
      properties,
      children,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              page: {
                id: page.id,
                url: page.url,
              },
              message: 'Page created successfully',
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
      content: [{ type: 'text', text: `Failed to create Notion page: ${message}` }],
    };
  }
}
