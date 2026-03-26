# Set Up GitHub Project

[日本語](README.md)

A Devin playbook and skill collection for building GitHub Projects V2 development environments in one go.

Sets up a 14-status workflow, 6 views, custom fields, 13 labels, Issue/PR templates, and GitHub Actions automation.

## Overview

This repository provides reusable skills, scripts, and templates for building a GitHub Projects V2 development environment based on best practices.

### What Gets Built

| Component         | Details                                                                          |
| ----------------- | -------------------------------------------------------------------------------- |
| **Statuses**      | 14 stages (Icebox > Planning > Design > Dev > Release > Done)                    |
| **Views**         | 6 types (Issues, Product Backlog, Sprint Board, Sprint Table, Roadmap, My Items) |
| **Custom Fields** | Priority (P0-P4), Sprint (1w Iteration), Estimate (Number), Target (Text)        |
| **Labels**        | 13 total (Type 6 + Area 4 + Ops 3)                                               |
| **Templates**     | Issue (feature/bug) + PR template                                                |
| **Automation**    | 5 Built-in Workflows + 5 GitHub Actions                                          |

## Prerequisites

- `gh` CLI installed and authenticated
- GitHub Classic PAT (`ghp_` token) required (Fine-grained PATs do not support Projects V2 GraphQL API)
- PAT scopes: `project`, `repo`, `read:org`

## Installation

```bash
git clone git@github.com:fideguch/set-up-github-project.git
cd set-up-github-project
./install.sh    # Installs skill to ~/.claude/skills/
```

## Usage

### As a Devin Playbook

Run the `!setup_github_project` macro in Devin to start the interactive setup.

### Direct Script Execution

```bash
# Bulk create 13 labels
./scripts/setup-labels.sh <OWNER/REPO>

# Full environment setup (interactive)
./scripts/setup-all.sh <OWNER/REPO> <PROJECT_NUMBER>
```

## Developer Setup

```bash
npm install
npm test            # Regression tests (170+)
npm run quality     # lint + typecheck + format:check
```

**Requirements:** Node.js 20+, ShellCheck (optional: `brew install shellcheck`)

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## Sub-Skills

| Skill                         | Description                                                     |
| ----------------------------- | --------------------------------------------------------------- |
| **code-quality**              | ESLint + Prettier + Husky + lint-staged integrated setup        |
| **ci-cd-pipeline**            | GitHub Actions CI/CD quality pipeline                           |
| **typescript-best-practices** | TypeScript recommended tsconfig and type-safe coding guidelines |
| **git-workflow**              | Conventional Commits, branch naming, PR/Issue templates         |
| **project-setup-automation**  | GitHub Projects V2 full environment automation                  |

## Documentation

- **[Operation Guide (USAGE.md)](docs/USAGE.md)** — Views, status workflow, Sprint ops, Roadmap, automation
- **[Workflow Definition](docs/workflow-definition.md)** — 14-status workflow specification
- **[View Design](docs/view-design.md)** — 5-view design specification
- **[Automation Guide](docs/automation-guide.md)** — Workflow setup and troubleshooting

## License

ISC License. See [LICENSE](LICENSE) for details.
