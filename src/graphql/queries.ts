/**
 * GraphQL query strings for GitHub Projects V2.
 * Ported from scripts/project-ops.sh and scripts/sprint-report.sh.
 */

/** Get the project ID by owner login and project number. */
export const GET_PROJECT_ID = `
  query GetProjectId($login: String!, $number: Int!) {
    user(login: $login) {
      projectV2(number: $number) {
        id
      }
    }
  }
`;

/** Get all fields for a project (single select, iteration, basic). */
export const GET_PROJECT_FIELDS = `
  query GetProjectFields($projectId: ID!) {
    node(id: $projectId) {
      ... on ProjectV2 {
        fields(first: 50) {
          nodes {
            ... on ProjectV2SingleSelectField {
              id
              name
              options { id name }
            }
            ... on ProjectV2Field {
              id
              name
              dataType
            }
            ... on ProjectV2IterationField {
              id
              name
              configuration {
                iterations { id title startDate duration }
                completedIterations { id title startDate duration }
              }
            }
          }
        }
      }
    }
  }
`;

/** Get a single issue by number with full details. */
export const GET_ISSUE_BY_NUMBER = `
  query GetIssueByNumber($owner: String!, $repo: String!, $number: Int!) {
    repository(owner: $owner, name: $repo) {
      issue(number: $number) {
        id
        number
        title
        body
        state
        url
        labels(first: 20) { nodes { name } }
        assignees(first: 10) { nodes { login } }
        milestone { title }
        createdAt
        updatedAt
      }
    }
  }
`;

/** Get all items in a project with field values (with cursor pagination). */
export const GET_PROJECT_ITEMS = `
  query GetProjectItems($projectId: ID!, $cursor: String) {
    node(id: $projectId) {
      ... on ProjectV2 {
        items(first: 100, after: $cursor) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            id
            content {
              ... on Issue {
                number
                title
                state
                labels(first: 10) { nodes { name } }
              }
              ... on PullRequest {
                number
                title
                state
              }
            }
            fieldValues(first: 20) {
              nodes {
                ... on ProjectV2ItemFieldSingleSelectValue {
                  field { ... on ProjectV2SingleSelectField { name } }
                  name
                }
                ... on ProjectV2ItemFieldNumberValue {
                  field { ... on ProjectV2Field { name } }
                  number
                }
                ... on ProjectV2ItemFieldIterationValue {
                  field { ... on ProjectV2IterationField { name } }
                  title
                  startDate
                  duration
                  iterationId
                }
              }
            }
          }
        }
      }
    }
  }
`;

/** Get full project data (fields + items) for sprint reports. */
export const GET_PROJECT_FULL = `
  query GetProjectFull($login: String!, $number: Int!) {
    user(login: $login) {
      projectV2(number: $number) {
        id
        title
        fields(first: 50) {
          nodes {
            ... on ProjectV2SingleSelectField {
              id
              name
              options { id name }
            }
            ... on ProjectV2Field {
              id
              name
              dataType
            }
            ... on ProjectV2IterationField {
              id
              name
              configuration {
                iterations { id title startDate duration }
                completedIterations { id title startDate duration }
              }
            }
          }
        }
        items(first: 200) {
          nodes {
            id
            content {
              ... on Issue {
                number
                title
                state
                labels(first: 10) { nodes { name } }
              }
              ... on PullRequest {
                number
                title
                state
              }
            }
            fieldValues(first: 20) {
              nodes {
                ... on ProjectV2ItemFieldSingleSelectValue {
                  field { ... on ProjectV2SingleSelectField { name } }
                  name
                }
                ... on ProjectV2ItemFieldNumberValue {
                  field { ... on ProjectV2Field { name } }
                  number
                }
                ... on ProjectV2ItemFieldIterationValue {
                  field { ... on ProjectV2IterationField { name } }
                  title
                  startDate
                  duration
                  iterationId
                }
              }
            }
          }
        }
      }
    }
  }
`;
