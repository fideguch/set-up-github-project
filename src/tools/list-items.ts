import type { graphql } from '@octokit/graphql';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { GET_PROJECT_ID, GET_PROJECT_ITEMS } from '../graphql/queries.js';
import type { ItemNode, FieldValueNode, ProjectItem } from '../types/index.js';

interface GetProjectIdResponse {
  readonly user: {
    readonly projectV2: { readonly id: string } | null;
  };
}

interface GetItemsResponse {
  readonly node: {
    readonly items: { readonly nodes: readonly ItemNode[] };
  };
}

function getFieldValue(item: ItemNode, fieldName: string): string | number | null {
  for (const fv of item.fieldValues.nodes) {
    if (!fv || !('field' in fv)) continue;
    const fvTyped = fv as FieldValueNode & { field?: { name?: string } };
    if (fvTyped.field?.name === fieldName) {
      if ('name' in fvTyped) return (fvTyped as { name: string }).name;
      if ('number' in fvTyped) return (fvTyped as { number: number }).number;
      if ('title' in fvTyped) return (fvTyped as { title: string }).title;
    }
  }
  return null;
}

function isBlocked(item: ItemNode): boolean {
  const labels = item.content?.labels?.nodes ?? [];
  return labels.some((l) => l.name === 'blocked');
}

function toProjectItem(item: ItemNode): ProjectItem {
  const status = getFieldValue(item, 'Status');
  const priority = getFieldValue(item, 'Priority');
  const estimate = getFieldValue(item, 'Estimate');

  return {
    itemId: item.id,
    number: item.content?.number ?? null,
    title: item.content?.title ?? '(Draft)',
    state: item.content?.state ?? null,
    status: typeof status === 'string' ? status : null,
    priority: typeof priority === 'string' ? priority : null,
    estimate: typeof estimate === 'number' ? estimate : null,
    sprint:
      (() => {
        const val = getFieldValue(item, 'Sprint');
        return typeof val === 'string' ? val : null;
      })() ??
      (() => {
        const val = getFieldValue(item, 'Iteration');
        return typeof val === 'string' ? val : null;
      })(),
    isBlocked: isBlocked(item),
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
  const projectData = await gql<GetProjectIdResponse>(GET_PROJECT_ID, {
    login: args.owner,
    number: args.projectNumber,
  });

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

  const itemsData = await gql<GetItemsResponse>(GET_PROJECT_ITEMS, {
    projectId: project.id,
  });

  let items = itemsData.node.items.nodes.filter(Boolean).map(toProjectItem);

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
        text: JSON.stringify({ items, totalCount: items.length }, null, 2),
      },
    ],
  };
}
