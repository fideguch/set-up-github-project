# MCP Integration

How to configure the GitHub Project Manager MCP server so Claude Code (or any
MCP-capable agent) can call the 11 project tools directly.

## Build the server

```bash
npm install
npm run build
```

This compiles TypeScript to `dist/index.js`.

## Configure Claude Code

Add the server to your Claude Code MCP configuration.

### Option A: Project-level (.mcp.json in the repo root)

Create or edit `/path/to/your-project/.mcp.json`:

```json
{
  "mcpServers": {
    "github-project-manager": {
      "command": "node",
      "args": ["/absolute/path/to/my_pm_tools/dist/index.js"],
      "env": {
        "GITHUB_TOKEN": "ghp_your_classic_pat_here"
      }
    }
  }
}
```

### Option B: Global (Claude Desktop config)

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS
or `%APPDATA%\Claude\claude_desktop_config.json` on Windows:

```json
{
  "mcpServers": {
    "github-project-manager": {
      "command": "node",
      "args": ["/absolute/path/to/my_pm_tools/dist/index.js"],
      "env": {
        "GITHUB_TOKEN": "ghp_your_classic_pat_here"
      }
    }
  }
}
```

Restart Claude Code / Claude Desktop after editing the config.

## Verify the server is connected

In Claude Code, run:

```
/mcp
```

You should see `github-project-manager` listed as an active server with 11 tools.

## Tool reference

All 11 tools share the same naming convention: `project_<action>`.

### Read tools (GraphQL)

| Tool                    | Required inputs          | Optional inputs                  |
| ----------------------- | ------------------------ | -------------------------------- |
| `project_list_fields`   | `owner`, `projectNumber` | —                                |
| `project_list_items`    | `owner`, `projectNumber` | `statusFilter`, `priorityFilter` |
| `project_get_issue`     | `repo`, `issueNumber`    | —                                |
| `project_sprint_report` | `owner`, `projectNumber` | `sprint` (default: `"current"`)  |

### Write tools — project board (GraphQL)

| Tool                   | Required inputs                                | Notes                            |
| ---------------------- | ---------------------------------------------- | -------------------------------- |
| `project_add_item`     | `owner`, `projectNumber`, `repo`, `itemNumber` | `itemType` defaults to `"issue"` |
| `project_move_status`  | `owner`, `projectNumber`, `itemId`, `status`   | English aliases supported        |
| `project_set_priority` | `owner`, `projectNumber`, `itemId`, `priority` | P0-P4                            |

### Write tools — issue metadata (gh CLI)

| Tool                       | Required inputs                | Notes                                   |
| -------------------------- | ------------------------------ | --------------------------------------- |
| `project_edit_issue`       | `repo`, `issueNumber`          | `title` and/or `body` (at least one)    |
| `project_manage_labels`    | `repo`, `issueNumber`          | `addLabels` and/or `removeLabels`       |
| `project_manage_assignees` | `repo`, `issueNumber`          | `addAssignees` and/or `removeAssignees` |
| `project_set_issue_state`  | `repo`, `issueNumber`, `state` | `reason` required when `state="closed"` |

## Usage examples in natural language

Once the server is connected, ask Claude Code in plain English:

```
List all items in project 3 owned by myorg that are in "開発中"
```

```
Add issue #55 from myorg/my-app to project 3 owned by myorg
```

```
Move item PVTI_lADOBxxxxxxx to "コードレビュー" in project 3 owned by myorg
```

```
Set priority P0 on item PVTI_lADOBxxxxxxx in project 3 owned by myorg
```

```
Get the details of issue #42 in myorg/my-app
```

```
Add labels "bug" and "frontend" to issue #42 in myorg/my-app,
and remove "needs-review"
```

```
Close issue #42 in myorg/my-app as completed
```

```
Generate the sprint report for the current sprint in project 3 owned by myorg
```

## Status aliases

When calling `project_move_status`, you can pass English shorthand instead of the
Japanese status names:

| Alias     | Full status    |
| --------- | -------------- |
| `dev`     | 開発中         |
| `review`  | コードレビュー |
| `testing` | テスト中       |
| `done`    | Done           |
| `backlog` | 開発待ち       |
| `blocked` | 進行待ち       |
| `release` | リリース待ち   |

## GITHUB_TOKEN requirements

The server requires a **Classic PAT** (`ghp_` prefix).
Fine-grained PATs do not support the Projects V2 GraphQL API.

Required scopes:

- `project` — read/write GitHub Projects V2
- `repo` — read/write issues, labels, assignees
- `read:org` — read organization project membership

Generate a Classic PAT at: https://github.com/settings/tokens

## Troubleshooting

| Problem                        | Likely cause                          | Fix                                                                  |
| ------------------------------ | ------------------------------------- | -------------------------------------------------------------------- |
| Server not listed in `/mcp`    | Config path wrong or build missing    | Confirm `dist/index.js` exists; check the path in config             |
| `GITHUB_TOKEN` errors          | Wrong token type or missing scopes    | Use Classic PAT with `project,repo,read:org`                         |
| `project_move_status` fails    | Item ID wrong or status not found     | Confirm `itemId` with `project_list_items`; check status alias table |
| GraphQL 401                    | Token expired                         | Regenerate the PAT on github.com/settings/tokens                     |
| `gh` CLI errors on write tools | `gh` not in PATH for the node process | Set `GH_TOKEN` env var or verify `gh auth status`                    |
