import type { graphql } from '@octokit/graphql';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { GET_PROJECT_ID, GET_PROJECT_FIELDS } from '../graphql/queries.js';
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

function isSingleSelect(field: FieldNode): field is SingleSelectFieldNode {
  return 'options' in field && Array.isArray(field.options);
}

export async function listFields(
  gql: typeof graphql,
  args: { owner: string; projectNumber: number }
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

  const fields = fieldsData.node.fields.nodes.filter(Boolean).map((f) => ({
    id: f.id,
    name: f.name,
    type: isSingleSelect(f) ? 'SINGLE_SELECT' : 'dataType' in f ? f.dataType : 'ITERATION',
    options: isSingleSelect(f) ? f.options.map((o) => ({ id: o.id, name: o.name })) : [],
  }));

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ fields }, null, 2),
      },
    ],
  };
}
