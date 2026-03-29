# Examples

Practical guides for using the My PM Tools MCP server across all three modes.

## Index

| File                                       | Mode | Description                                                             |
| ------------------------------------------ | ---- | ----------------------------------------------------------------------- |
| [setup-project.md](setup-project.md)       | A    | Set up a new GitHub Project with labels, statuses, views, and templates |
| [daily-workflow.md](daily-workflow.md)     | B    | Daily PM operations: issues, status changes, labels, assignees          |
| [sprint-analytics.md](sprint-analytics.md) | C    | Sprint reports and velocity tracking                                    |
| [mcp-integration.md](mcp-integration.md)   | All  | Configure the MCP server in Claude Code and use tools directly          |

## Which mode do you need?

**Mode A — Setup**: You have a new GitHub Project (or an empty one) and want to configure
the full label taxonomy, status workflow, custom fields, and views in one shot.

**Mode B — Daily Operations**: Your project is already configured and you want to create
issues, move cards, manage labels, or handle assignees as part of your normal PM workflow.

**Mode C — Analytics**: You want to see how your current or previous sprint went —
completion rate, velocity, blockers.

**MCP Integration**: You want Claude Code (or another MCP-capable agent) to call the
11 project tools programmatically instead of (or in addition to) the shell scripts.

## Prerequisites

Before running any example, confirm these are in place:

```bash
# Node.js 20+
node --version

# gh CLI authenticated
gh auth status

# GITHUB_TOKEN set (Classic PAT with project, repo, read:org scopes)
echo $GITHUB_TOKEN
```

See [QUICKSTART.md](../QUICKSTART.md) for the full setup checklist.
