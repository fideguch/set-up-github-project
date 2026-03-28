# Mode B: Daily Workflow

Common PM operations for a project that is already configured.
All examples use `myorg/my-app` as the repository and project number `3`.

## Adding issues and PRs to the project

```bash
# Add issue #42 to the project
./scripts/project-ops.sh myorg 3 add-issue myorg/my-app 42

# Add pull request #87 to the project
./scripts/project-ops.sh myorg 3 add-pr myorg/my-app 87
```

Via MCP tool (`project_add_item`):

```json
{
  "owner": "myorg",
  "projectNumber": 3,
  "repo": "myorg/my-app",
  "itemNumber": 42,
  "itemType": "issue"
}
```

## Moving an issue to a new status

```bash
# Move by item ID (get the ID from list-items first)
./scripts/project-ops.sh myorg 3 move PVTI_lADOBxxxxxxx "開発中"
```

English status aliases are supported so you do not have to type Japanese:

| Alias     | Maps to        |
| --------- | -------------- |
| `dev`     | 開発中         |
| `review`  | コードレビュー |
| `testing` | テスト中       |
| `done`    | Done           |
| `backlog` | 開発待ち       |

```bash
./scripts/project-ops.sh myorg 3 move PVTI_lADOBxxxxxxx dev
```

Via MCP tool (`project_move_status`):

```json
{
  "owner": "myorg",
  "projectNumber": 3,
  "itemId": "PVTI_lADOBxxxxxxx",
  "status": "dev"
}
```

## Setting priority

```bash
./scripts/project-ops.sh myorg 3 set-priority PVTI_lADOBxxxxxxx P1
```

Priority levels:

| Value | Meaning                         |
| ----- | ------------------------------- |
| P0    | Critical — fix today            |
| P1    | High — within 1-3 business days |
| P2    | Medium — within this sprint     |
| P3    | Low — when capacity allows      |
| P4    | Deferred — no timeline yet      |

Via MCP tool (`project_set_priority`):

```json
{
  "owner": "myorg",
  "projectNumber": 3,
  "itemId": "PVTI_lADOBxxxxxxx",
  "priority": "P1"
}
```

## Listing project items

```bash
# All items
./scripts/project-ops.sh myorg 3 list-items

# Filter by status
./scripts/project-ops.sh myorg 3 list-items --status "開発中"

# Filter by priority
./scripts/project-ops.sh myorg 3 list-items --priority P0
```

Expected output:

```
ITEM_ID                  STATUS      PRIORITY  TITLE
PVTI_lADOBxxxxxxx        開発中       P1        Fix login redirect loop
PVTI_lADOByyyyyyy        開発中       P0        Payment webhook timeout
```

Via MCP tool (`project_list_items`):

```json
{
  "owner": "myorg",
  "projectNumber": 3,
  "statusFilter": "開発中",
  "priorityFilter": "P0"
}
```

## Getting issue details

Use `project_get_issue` to fetch full issue metadata before editing:

```json
{
  "repo": "myorg/my-app",
  "issueNumber": 42
}
```

Response includes title, body, labels, assignees, and milestone.

## Editing an issue

Change title and/or body without opening the GitHub UI:

Via MCP tool (`project_edit_issue`):

```json
{
  "repo": "myorg/my-app",
  "issueNumber": 42,
  "title": "Fix login redirect loop (regression)",
  "body": "## Problem\nUsers are redirected to /login in a loop after OAuth callback.\n\n## Steps\n1. Log out\n2. Log in via Google OAuth\n3. Observe redirect loop\n\n## Expected\nUser lands on /dashboard"
}
```

## Managing labels

```bash
# Add labels
gh issue edit 42 --add-label "bug,frontend" --repo myorg/my-app

# Remove a label
gh issue edit 42 --remove-label "needs-review" --repo myorg/my-app
```

Via MCP tool (`project_manage_labels`):

```json
{
  "repo": "myorg/my-app",
  "issueNumber": 42,
  "addLabels": ["bug", "frontend"],
  "removeLabels": ["needs-review"]
}
```

## Managing assignees

Via MCP tool (`project_manage_assignees`):

```json
{
  "repo": "myorg/my-app",
  "issueNumber": 42,
  "addAssignees": ["alice"],
  "removeAssignees": ["bob"]
}
```

## Closing and reopening issues

Close as completed:

```json
{
  "repo": "myorg/my-app",
  "issueNumber": 42,
  "state": "closed",
  "reason": "completed"
}
```

Close as won't fix:

```json
{
  "repo": "myorg/my-app",
  "issueNumber": 42,
  "state": "closed",
  "reason": "not_planned"
}
```

Reopen:

```json
{
  "repo": "myorg/my-app",
  "issueNumber": 42,
  "state": "open"
}
```

## Typical morning triage flow

1. List all P0/P1 items in "開発中" to confirm active work:

   ```bash
   ./scripts/project-ops.sh myorg 3 list-items --status "開発中" --priority P1
   ```

2. Check for blockers (items with the `blocked` label):

   ```bash
   gh issue list --repo myorg/my-app --label blocked
   ```

3. Move any issues that unblocked overnight:

   ```bash
   ./scripts/project-ops.sh myorg 3 move PVTI_lADOBxxxxxxx dev
   ```

4. Assign any unassigned P1 items in "開発待ち":

   ```bash
   ./scripts/project-ops.sh myorg 3 list-items --status "開発待ち" --priority P1
   # Then use project_manage_assignees to assign
   ```
