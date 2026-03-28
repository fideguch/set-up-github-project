# Mode A: Project Setup

How to configure a new GitHub Project V2 with the full label taxonomy, 14 statuses,
6 views, custom fields, and issue templates in a single run.

## Prerequisites

- A GitHub repository and a Project V2 already created in the GitHub UI
- `gh` CLI authenticated with `project`, `repo`, and `read:org` scopes
- `GITHUB_TOKEN` environment variable set (Classic PAT, not fine-grained)

## One-command full setup

```bash
./scripts/setup-all.sh myorg/my-app 3
```

Replace `myorg/my-app` with your `OWNER/REPO` and `3` with your project number.

Expected output:

```
[setup-all] Starting full project setup for myorg/my-app (project #3)
[setup-fields] Creating Priority field...
[setup-fields] Creating Estimate field...
[setup-fields] Creating Target field...
[setup-status] Configuring 14 status options...
[setup-labels] Creating 13 labels...
[setup-views] Creating 6 views...
[setup-templates] Deploying issue templates...
[setup-all] Done. Project is ready.
```

## Lite mode (1-3 person teams)

For small teams that do not need the full 14-status workflow:

```bash
./scripts/setup-all.sh myorg/my-app 3 --lite
```

| Config | Statuses | Views | Labels |
| ------ | -------- | ----- | ------ |
| Lite   | 8        | 3     | 5      |
| Full   | 14       | 6     | 13     |

You can upgrade from Lite to Full at any time by re-running without `--lite`.

## Running phases individually

If the full setup fails partway through, or you only need to reconfigure one part,
run each phase script separately.

### Phase 1: Custom fields

```bash
./scripts/setup-fields.sh myorg 3
```

Creates three fields:

- `Priority` (single-select: P0 through P4)
- `Estimate` (number, story points)
- `Target` (text, milestone or date)

The Sprint (Iteration) field must be created in the GitHub UI:
Project Settings > Custom fields > New field > Iteration, 1-week cycle.

### Phase 2: Status options

```bash
./scripts/setup-status.sh myorg 3
```

Full 14-status workflow:

```
Icebox -> 進行待ち -> 要件作成中 -> デザイン待ち -> デザイン作成中
-> アサイン待ち -> 開発待ち -> 開発中 -> コードレビュー -> テスト中
-> テスト落ち -> リリース待ち -> リリース済み -> Done
```

### Phase 3: Labels

```bash
./scripts/setup-labels.sh myorg/my-app
```

Creates 13 labels covering type (`bug`, `feature`, `refactor`, `docs`, `chore`),
scope (`frontend`, `backend`, `infra`), and workflow (`blocked`, `needs-review`,
`needs-design`, `needs-spec`, `breaking-change`).

### Phase 4: Views

```bash
./scripts/setup-views.sh myorg 3
```

Creates 6 views: Board (default), Backlog, Sprint, Roadmap, Blockers, and Done.

### Phase 5: Issue templates

```bash
./scripts/setup-templates.sh myorg/my-app
```

Copies templates from the `templates/` directory into `.github/ISSUE_TEMPLATE/` in
the target repository. Includes Bug Report, Feature Request, and Task templates.

## Migrating from Jira, Linear, or Notion

Export your existing issues as CSV, then run:

```bash
# Jira CSV export
./scripts/migrate-import.sh myorg/my-app 3 jira-export.csv --format jira

# Linear CSV export
./scripts/migrate-import.sh myorg/my-app 3 linear-export.csv --format linear

# Notion CSV export
./scripts/migrate-import.sh myorg/my-app 3 notion-export.csv --format notion

# Preview without creating issues
./scripts/migrate-import.sh myorg/my-app 3 export.csv --dry-run
```

Expected dry-run output:

```
[dry-run] Would create 42 issues
[dry-run] Status mapping: In Progress -> 開発中 (38 items)
[dry-run] Status mapping: Done -> Done (4 items)
[dry-run] No issues created. Remove --dry-run to proceed.
```

## Verifying the setup

After setup, confirm the project is correctly configured:

```bash
# List all fields and their options
gh project field-list 3 --owner myorg

# List current labels
gh label list --repo myorg/my-app

# Confirm views
gh project view 3 --owner myorg
```

Or use the MCP tool from Claude Code:

```
List fields for project 3 owned by myorg
```

The `project_list_fields` tool returns all field names, types, and available options.
