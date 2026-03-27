/**
 * GraphQL mutation strings for GitHub Projects V2.
 * Ported from scripts/project-ops.sh.
 */

/** Add an Issue or PR to a project by content node ID. */
export const ADD_PROJECT_ITEM = `
  mutation AddProjectItem($projectId: ID!, $contentId: ID!) {
    addProjectV2ItemById(input: {
      projectId: $projectId,
      contentId: $contentId
    }) {
      item { id }
    }
  }
`;

/** Update a single-select field value on a project item. */
export const UPDATE_ITEM_FIELD = `
  mutation UpdateItemField(
    $projectId: ID!,
    $itemId: ID!,
    $fieldId: ID!,
    $optionId: String!
  ) {
    updateProjectV2ItemFieldValue(input: {
      projectId: $projectId,
      itemId: $itemId,
      fieldId: $fieldId,
      value: { singleSelectOptionId: $optionId }
    }) {
      projectV2Item { id }
    }
  }
`;
