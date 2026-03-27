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

export async function moveStatus(
  gql: typeof graphql,
  args: {
    owner: string;
    projectNumber: number;
    itemId: string;
    status: string;
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

  const fieldsData = await gql<GetFieldsResponse>(GET_PROJECT_FIELDS, {
    projectId: project.id,
  });

  const statusField = findSingleSelectField(fieldsData.node.fields.nodes, 'Status');
  if (!statusField) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Status field not found in this project.' }],
    };
  }

  const option = statusField.options.find((o) => o.name === args.status);
  if (!option) {
    const available = statusField.options.map((o) => o.name).join(', ');
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Status '${args.status}' not found. Available: ${available}`,
        },
      ],
    };
  }

  await gql(UPDATE_ITEM_FIELD, {
    projectId: project.id,
    itemId: args.itemId,
    fieldId: statusField.id,
    optionId: option.id,
  });

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            success: true,
            message: `Status changed: ${args.itemId} → ${args.status}`,
          },
          null,
          2
        ),
      },
    ],
  };
}
