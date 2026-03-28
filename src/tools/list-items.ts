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
      readonly pageInfo: { readonly hasNextPage: boolean };
      readonly nodes: readonly ItemNode[];
    };
  };
}

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

  let itemsData: GetItemsResponse;
  try {
    itemsData = await gql<GetItemsResponse>(GET_PROJECT_ITEMS, {
      projectId: project.id,
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

  let items = itemsData.node.items.nodes.filter(Boolean).map(toProjectItem);

  if (args.statusFilter) {
    items = items.filter((i) => i.status === args.statusFilter);
  }
  if (args.priorityFilter) {
    items = items.filter((i) => i.priority?.startsWith(args.priorityFilter!));
  }

  const truncated = itemsData.node.items.pageInfo.hasNextPage;

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            items,
            totalCount: items.length,
            truncated,
            ...(truncated && {
              warning: 'Results limited to first 100 items. Project has more items not shown.',
            }),
          },
          null,
          2
        ),
      },
    ],
  };
}
