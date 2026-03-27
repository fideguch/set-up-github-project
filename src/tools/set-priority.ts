import type { graphql } from '@octokit/graphql';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { GET_PROJECT_ID, GET_PROJECT_FIELDS } from '../graphql/queries.js';
import { UPDATE_ITEM_FIELD } from '../graphql/mutations.js';
import type { FieldNode, SingleSelectFieldNode } from '../types/index.js';

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

export async function setPriority(
  gql: typeof graphql,
  args: {
    owner: string;
    projectNumber: number;
    itemId: string;
    priority: string;
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

  const priorityField = findSingleSelectField(fieldsData.node.fields.nodes, 'Priority');
  if (!priorityField) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Priority field not found in this project.',
        },
      ],
    };
  }

  // Match by prefix (e.g. "P0" matches "P0 - Critical")
  const option = priorityField.options.find((o) => o.name.startsWith(args.priority));
  if (!option) {
    const available = priorityField.options.map((o) => o.name).join(', ');
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Priority '${args.priority}' not found. Available: ${available}`,
        },
      ],
    };
  }

  try {
    await gql(UPDATE_ITEM_FIELD, {
      projectId: project.id,
      itemId: args.itemId,
      fieldId: priorityField.id,
      optionId: option.id,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      isError: true,
      content: [{ type: 'text', text: `Failed to update priority: ${message}` }],
    };
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            success: true,
            message: `Priority set: ${args.itemId} → ${args.priority}`,
          },
          null,
          2
        ),
      },
    ],
  };
}
