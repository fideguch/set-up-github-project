import type { graphql } from '@octokit/graphql';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { GET_PROJECT_ID, GET_PROJECT_ITEMS } from '../graphql/queries.js';
import type { ItemNode } from '../types/index.js';
import { toProjectItem } from '../utils/field-helpers.js';

interface GetProjectIdResponse {
  readonly user: {
    readonly projectV2: { readonly id: string } | null;
  };
}

interface GetItemsResponse {
  readonly node: {
    readonly items: {
      readonly pageInfo: {
        readonly hasNextPage: boolean;
        readonly endCursor: string | null;
      };
      readonly nodes: readonly ItemNode[];
    };
  };
}

/** Maximum number of pagination requests to prevent runaway loops. */
const MAX_PAGES = 20;

export async function listItems(
  gql: typeof graphql,
  args: {
    owner: string;
    projectNumber: number;
    statusFilter?: string;
    priorityFilter?: string;
  }
): Promise<CallToolResult> {
  let projectData: GetProjectIdResponse;
  try {
    projectData = await gql<GetProjectIdResponse>(GET_PROJECT_ID, {
      login: args.owner,
      number: args.projectNumber,
    });
  } catch (error: unknown) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `GitHub API error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }

  const project = projectData.user.projectV2;
  if (!project) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Project #${args.projectNumber} not found for user '${args.owner}'.`,
        },
      ],
    };
  }

  // Paginate through all items
  const allNodes: ItemNode[] = [];
  let cursor: string | null = null;
  let hasMore = true;
  let pageCount = 0;

  while (hasMore && pageCount < MAX_PAGES) {
    let itemsData: GetItemsResponse;
    try {
      itemsData = await gql<GetItemsResponse>(GET_PROJECT_ITEMS, {
        projectId: project.id,
        cursor,
      });
    } catch (error: unknown) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `GitHub API error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }

    allNodes.push(...itemsData.node.items.nodes.filter(Boolean));
    hasMore = itemsData.node.items.pageInfo.hasNextPage;
    cursor = itemsData.node.items.pageInfo.endCursor;
    pageCount++;
  }

  let items = allNodes.map(toProjectItem);

  if (args.statusFilter) {
    items = items.filter((i) => i.status === args.statusFilter);
  }
  if (args.priorityFilter) {
    items = items.filter((i) => i.priority?.startsWith(args.priorityFilter!));
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            items,
            totalCount: items.length,
            pagesFetched: pageCount,
          },
          null,
          2
        ),
      },
    ],
  };
}
