# My PM Tools

[日本語](README.md) · v5.4.0 — AI-era PM Operator Stance onboard

A PM assistant skill for GitHub Projects V2. Covers environment setup, daily operations, Sprint analytics, and migration — all in one.

"Create an issue", "Change status", "Sprint report" — execute PM daily tasks instantly via CLI. From full project setup to Jira/Linear migration.

**31 MCP tools** / **9 shell scripts** / **536 tests** / **6 references docs** (12 principles + 30 anti-patterns + Cynefin + Premortem + Spec Quality Gate + CALM self-evaluation)

## Product Vision

> **JTBD**: PMs execute GitHub Projects V2 management and Notion/Google Workspace read-write operations via natural language

| Field           | Definition                                                                                                                        |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Target User** | PMs / Tech Leads in solo or small teams (1-10 people). Especially PMs orchestrating parallel AI coding agents.                   |
| **Core Value**  | Absorbs GraphQL API + Notion API + Google APIs complexity into CLI. Bidirectional document, spreadsheet, and calendar integration |
| **Scope**       | Mode A(Setup), Mode B(Daily Ops), Mode C(Analytics), Migration, Workspace Bridge(Read+Write), PM Operator Stance                  |
| **Non-Goals**   | GUI, multi-Org support, self-built Slack integration, full Jira/Linear replacement, Gmail sending                                 |

**Suite position**: `requirements_designer → speckit-bridge → **my_pm_tools** → pm-data-analysis`. The execution management layer after specs are finalized.

---

## 🛡️ PM Operator Stance — 12 Principles for AI-Era PMs (v5.4.0)

When orchestrating parallel AI coding agents (Claude Code / Cursor / Devin / Aider, etc.), the PM role shifts from "roadmap owner" to **last-line-of-defense coordinator** — closer to an incident commander than a traditional PM. The Multi-Agent System Taxonomy (MAST, UC Berkeley 2025) reports that of multi-agent failures, **41.77% occur in the specification layer, 36.94% in coordination, and 21.30% in verification**. Classical PM canon is necessary but insufficient against these three failure modes.

The 12 principles are synthesized from 200+ sources including Amazon, Google SRE, DORA, Cagan, Perri, Torres, Klein, Snowden, Taleb, Meadows, Anthropic, MAST, and CALM. Each principle carries **(a) citation, (b) reversal condition (when it does NOT apply), and (c) measurement method**. A principle without a reversal clause becomes dogma.

### 12 Principles (summary — see [SKILL.md](./SKILL.md) "PM Operator Stance" chapter and [references/](./references/) for full detail)

| # | Principle | Primary attack surface |
|---|---|---|
| P1 | Outcomes over outputs | Velocity blind-trust |
| P2 | Cynefin-aware routing | Over/under-engineering |
| P3 | Chain-of-Verification over self-report trust | MAST verification layer |
| P4 | Premortem before commit | Blind-spot risks |
| P5 | Blameless postmortem + Just Culture | Recurrence / second victim |
| P6 | Working Backwards artifact as SSOT | MAST spec layer / prompt bloat |
| P7 | Error Budget / SLO-first | Over-shipping / freeze discipline |
| P8 | Trunk-Based + small PRs + fast CI | Merge race / long branches |
| P9 | Leverage-point prioritization | Parameter-level patching |
| P10 | Antifragile posture, convex bets | Irreversible risk |
| P11 | Continuous Discovery (human cadence) | Discovery starvation under AI-accelerated delivery |
| P12 | LNO triage + CALM bias audit | PM's own 12 cognitive biases |

### Reference documents (references/)

- [`references/ai-pm-principles-research.md`](./references/ai-pm-principles-research.md) — full paper (Parts 1-9 + 40+ citations)
- [`references/anti-patterns.md`](./references/anti-patterns.md) — 30-row watchlist (spec / coordination / verification / cognitive / process)
- [`references/cynefin-guide.md`](./references/cynefin-guide.md) — 5-domain discrimination + orchestration mapping
- [`references/premortem-template.md`](./references/premortem-template.md) — 5-minute ritual + Devil's Advocate variant
- [`references/spec-quality-gate.md`](./references/spec-quality-gate.md) — 5-criterion Boolean rubric
- [`references/self-evaluation-protocol.md`](./references/self-evaluation-protocol.md) — CALM 12-bias checklist + Reflexion ritual

### Non-destructive upgrade note

The v5.3.0 7-principle stance is **preserved in spirit** and subsumed by the 12 principles. If your team has already internalized the 7-principle version, the 12 principles add citation / reversal / measurement to the same ideas — not a reset. See [SKILL.md](./SKILL.md) "Non-destructive upgrade note" for the old→new mapping.

---

## 3 Modes

| Mode                     | Purpose                                               | Key Operations                                        |
| ------------------------ | ----------------------------------------------------- | ----------------------------------------------------- |
| **Mode A: Setup**        | New project environment                               | 14 statuses, 5 views, 13 labels, templates, workflows |
| **Mode B: Operations** ★ | Issue/PR creation, status changes, backlog management | `project-ops.sh` + natural language                   |
| **Mode C: Analytics**    | Sprint reports, velocity tracking                     | `sprint-report.sh`                                    |

### Lite Mode (for small teams)

Use the `--lite` flag to set up a streamlined configuration for 1-3 person teams:

```bash
./scripts/setup-all.sh <OWNER/REPO> <PROJECT_NUMBER> --lite
```

| Config         | Statuses | Views | Labels | Recommended Team Size |
| -------------- | -------- | ----- | ------ | --------------------- |
| Lite           | 8        | 3     | 5      | 1-3 people            |
| Full (default) | 14       | 5     | 13     | 4+ people             |

You can migrate from Lite to Full at any time by re-running `setup-all.sh` without `--lite`.

On first launch, the skill auto-detects project state: unconfigured → Mode A, configured → Mode B. Project info is saved to `.github-project-config.json` for instant reconnection.

## Prerequisites

- `gh` CLI installed and authenticated
- GitHub Classic PAT (`ghp_` token) — Fine-grained PATs do not support Projects V2 GraphQL API
- PAT scopes: `project`, `repo`, `read:org`

## Installation

```bash
git clone git@github.com:fideguch/my_pm_tools.git
cd my_pm_tools
./install.sh    # Installs to ~/.claude/skills/my_pm_tools/
```

Invoke in Claude Code or Devin:

```
"Create an issue" "Set up project environment" "Sprint report"
```

## Quick Start

### New Project Setup (Mode A)

```bash
./scripts/setup-all.sh <OWNER/REPO> <PROJECT_NUMBER>
```

### Daily Operations (Mode B)

```bash
# Add issues/PRs to project
./scripts/project-ops.sh <OWNER> <NUMBER> add-issue <REPO> <ISSUE_NUM>
./scripts/project-ops.sh <OWNER> <NUMBER> add-pr <REPO> <PR_NUM>

# Change status (move cards)
./scripts/project-ops.sh <OWNER> <NUMBER> move <ITEM_ID> "開発中"

# Set priority
./scripts/project-ops.sh <OWNER> <NUMBER> set-priority <ITEM_ID> P1

# List items
./scripts/project-ops.sh <OWNER> <NUMBER> list-items
```

### Analytics (Mode C)

```bash
./scripts/sprint-report.sh <OWNER> <NUMBER>                        # Current sprint
./scripts/sprint-report.sh <OWNER> <NUMBER> --sprint previous      # Previous sprint
./scripts/sprint-report.sh <OWNER> <NUMBER> --sprint "Sprint 3"    # By title
./scripts/sprint-report.sh <OWNER> <NUMBER> --json                 # JSON output
```

> MCP Server also supports `sprint` parameter: `current` / `previous` / Sprint title. Projects with 200+ items use cursor pagination (max 20 pages).

### Migration from Other Tools

```bash
./scripts/migrate-import.sh <OWNER/REPO> <NUMBER> export.csv --format jira     # Jira
./scripts/migrate-import.sh <OWNER/REPO> <NUMBER> export.csv --format linear   # Linear
./scripts/migrate-import.sh <OWNER/REPO> <NUMBER> export.csv --format notion   # Notion
./scripts/migrate-import.sh <OWNER/REPO> <NUMBER> tasks.csv --dry-run          # Preview
```

## Scripts

| Script               | Mode | Purpose                                    |
| -------------------- | ---- | ------------------------------------------ |
| `setup-all.sh`       | A    | Full environment setup                     |
| `setup-labels.sh`    | A    | Bulk create 13 labels                      |
| `setup-fields.sh`    | A    | Custom fields (Priority, Estimate, Target) |
| `setup-status.sh`    | A    | Status 14 options                          |
| `setup-views.sh`     | A    | 5 project views                            |
| `setup-templates.sh` | A    | Auto-deploy templates & workflows          |
| `project-ops.sh`     | B    | Issue/PR add, status change, priority      |
| `migrate-import.sh`  | A    | Jira/Linear/Notion CSV import              |
| `sprint-report.sh`   | C    | Sprint report (velocity, completion)       |

## MCP Server

AI agents (Claude Code, GitHub Copilot, etc.) can operate projects via MCP protocol.

### Setup

```bash
npm install && npm run build
```

Add to Claude Desktop config:

```json
{
  "mcpServers": {
    "my_pm_tools": {
      "command": "node",
      "args": ["/path/to/my_pm_tools/dist/index.js"],
      "env": { "GITHUB_TOKEN": "ghp_..." }
    }
  }
}
```

### MCP Tools

| Tool                       | Method            | Description                                                     |
| -------------------------- | ----------------- | --------------------------------------------------------------- |
| `project_list_fields`      | GraphQL           | List fields and their options                                   |
| `project_list_items`       | GraphQL           | List items with status/priority filter (pagination support)     |
| `project_add_item`         | GraphQL           | Add an Issue or PR to the project                               |
| `project_move_status`      | GraphQL           | Change item status (alias support: "dev"→"開発中")              |
| `project_set_priority`     | GraphQL           | Set priority (P0-P4)                                            |
| `project_sprint_report`    | GraphQL           | Generate sprint report                                          |
| `project_get_issue`        | GraphQL           | Get issue details (title, body, labels, assignees, milestone)   |
| `project_create_issue`     | gh CLI            | Create a new issue (supports Japanese title and body)           |
| `project_edit_issue`       | gh CLI            | Edit issue title and/or body                                    |
| `project_manage_labels`    | gh CLI            | Add or remove labels on an issue                                |
| `project_manage_assignees` | gh CLI            | Add or remove assignees on an issue                             |
| `project_set_issue_state`  | gh CLI            | Close or reopen an issue                                        |
| `notion_search`            | Notion API        | Search Notion pages and databases                               |
| `notion_get_page`          | Notion API        | Get page content (Markdown conversion)                          |
| `notion_query_database`    | Notion API        | Query database with filters and sorting                         |
| `notion_create_page`       | Notion API        | Create a new page                                               |
| `notion_append_blocks`     | Notion API        | Append blocks to a page                                         |
| `notion_update_page`       | Notion API        | Update page properties                                          |
| `notion_archive_page`      | Notion API        | Archive (soft-delete) a page                                    |
| `workspace_search_drive`   | Drive API         | Search files in Google Drive                                    |
| `workspace_get_doc`        | Drive API         | Get Google Docs content (Markdown)                              |
| `workspace_get_sheet`      | Sheets API        | Get spreadsheet data                                            |
| `workspace_get_slides`     | Drive API         | Get slide content (text extraction)                             |
| `workspace_list_events`    | Calendar API      | List calendar events                                            |
| `workspace_search_gmail`   | Gmail API         | Search emails                                                   |
| `workspace_update_sheet`   | Sheets API        | Write values to spreadsheet cells                               |
| `workspace_append_sheet`   | Sheets API        | Append rows to a spreadsheet                                    |
| `workspace_create_event`   | Calendar API      | Create a calendar event                                         |
| `project_scan_zombies`     | gh CLI + grep/git | Detect zombie issues (implemented but still Open) with evidence |
| `project_scan_todos`       | gh CLI + grep     | Scan TODO/FIXME/HACK/XXX markers and propose issue creation     |
| `project_backlog_report`   | gh CLI + grep/git | Backlog health score (0-100) and comprehensive report           |

**Status aliases (11 mappings)**: Use English shorthand to operate Japanese statuses.

| Alias         | Target         |     | Alias      | Target         |
| ------------- | -------------- | --- | ---------- | -------------- |
| `dev`         | 開発中         |     | `testing`  | テスト中       |
| `review`      | コードレビュー |     | `done`     | Done           |
| `backlog`     | Backlog        |     | `icebox`   | Icebox         |
| `test-failed` | テスト落ち     |     | `released` | リリース済み   |
| `waiting`     | 進行待ち       |     | `design`   | デザイン作成中 |
| `ready`       | 開発待ち       |     |            |                |

Resolution order: exact match → alias match → partial match (case-insensitive).

## Documentation

- **[Operation Guide (USAGE.md)](docs/USAGE.md)** — Daily ops, views, Sprint, migration, FAQ
- **[Workflow Definition](docs/workflow-definition.md)** — 14-status specification
- **[View Design](docs/view-design.md)** — 5-view configuration
- **[Automation Guide](docs/automation-guide.md)** — Workflow and script setup
- **[Workspace Bridge](docs/workspace-bridge.md)** — Notion + Google Workspace integration guide

## Developer Setup

```bash
npm install
npm test            # 502 regression tests
npm run build       # Build MCP server
npm run quality     # lint + typecheck + format:check
```

Requirements: Node.js 20+, ShellCheck (optional). See [CONTRIBUTING.md](CONTRIBUTING.md).

## PM Tool Suite

This repository is part of a 5-tool suite that automates PM workflows in Claude Code.

| #   | Skill                 | Purpose                        | Repo                                                                                |
| --- | --------------------- | ------------------------------ | ----------------------------------------------------------------------------------- |
| 1   | **my_pm_tools**       | **GitHub Projects V2 管理**    | **this repo**                                                                       |
| 2   | requirements_designer | Requirements + Figma UI        | [fideguch/requirements_designer](https://github.com/fideguch/requirements_designer) |
| 3   | speckit-bridge        | Requirements → Spec (gate ≥70) | [fideguch/speckit-bridge](https://github.com/fideguch/speckit-bridge)               |
| 4   | pm-data-analysis      | GAFA-quality data analysis     | [fideguch/pm_data_analysis](https://github.com/fideguch/pm_data_analysis)           |
| 5   | pm-ad-operations      | Ad CSV analysis (Google/Meta)  | [fideguch/pm_ad_operations](https://github.com/fideguch/pm_ad_operations)           |

## License

ISC License. See [LICENSE](LICENSE) for details.
