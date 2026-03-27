import type { graphql } from '@octokit/graphql';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { GET_PROJECT_ID, GET_PROJECT_FIELDS } from '../graphql/queries.js';
import { UPDATE_ITEM_FIELD } from '../graphql/mutations.js';
import type { FieldNode, SingleSelectFieldNode } from '../types/index.js';
import { resolveStatusAlias } from '../utils/status-alias.js';

interface GetProjectIdResponse {
  readonly user: {
    readonly projectV2: { readonly id: string } | null;
  };
}

interface GetFieldsResponse {
  readonly node: {
    readonly fields: { readonly nodes: readonly FieldNode[] };
  };
}

function findSingleSelectField(
  fields: readonly FieldNode[],
  fieldName: string
): SingleSelectFieldNode | undefined {
  return fields.find(
    (f): f is SingleSelectFieldNode => Boolean(f) && f.name === fieldName && 'options' in f
  );
}

export async function moveStatus(
  gql: typeof graphql,
  args: {
    owner: string;
    projectNumber: number;
    itemId: string;
    status: string;
  }
): Promise<CallToolResult> {
  let projectData: GetProjectIdResponse;
  try {
    projectData = await gql<GetProjectIdResponse>(GET_PROJECT_ID, {
      login: args.owner,
      number: args.projectNumber,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to fetch project: ${message}` }],
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

  let fieldsData: GetFieldsResponse;
  try {
    fieldsData = await gql<GetFieldsResponse>(GET_PROJECT_FIELDS, {
      projectId: project.id,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to fetch fields: ${message}` }],
    };
  }

  const statusField = findSingleSelectField(fieldsData.node.fields.nodes, 'Status');
  if (!statusField) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Status field not found in this project.' }],
    };
  }

  const availableNames = statusField.options.map((o) => o.name);
  const resolved = resolveStatusAlias(args.status, availableNames);
  if (!resolved) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Status '${args.status}' not found. Available: ${availableNames.join(', ')}`,
        },
      ],
    };
  }

  const option = statusField.options.find((o) => o.name === resolved);
  if (!option) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Internal error: resolved status '${resolved}' not found in options.`,
        },
      ],
    };
  }

  try {
    await gql(UPDATE_ITEM_FIELD, {
      projectId: project.id,
      itemId: args.itemId,
      fieldId: statusField.id,
      optionId: option.id,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to update status: ${message}` }],
    };
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            summary: `Status changed: ${args.itemId} → ${resolved}`,
            data: { itemId: args.itemId, status: resolved, success: true },
          },
          null,
          2
        ),
      },
    ],
  };
}
