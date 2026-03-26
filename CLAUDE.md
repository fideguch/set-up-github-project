# CLAUDE.md

## Purpose

Maintain and extend the `github_project_manager` skill.
PM assistant for GitHub Projects V2 with 3 modes:

- **Mode A**: Environment setup (14 statuses, 6 views, 13 labels, templates, workflows)
- **Mode B**: Daily operations (Issue/PR creation, status changes, backlog management)
- **Mode C**: Analytics (Sprint reports, velocity tracking)

## Language Rules

- Documentation, UI, communication: Japanese (default)
- Code (variables, comments, commits, PR): English
- Shell scripts: English comments preferred, Japanese output strings OK

## Project Structure

```
github-project-manager/
├── SKILL.md                     # Skill definition (3-mode architecture)
├── README.md / README.en.md     # User-facing documentation
├── CLAUDE.md                    # Project instructions (this file)
├── CONTRIBUTING.md              # Contribution guidelines
├── scripts/
│   ├── setup-all.sh             # Mode A: Full environment setup
│   ├── setup-labels.sh          # Mode A: 13 labels
│   ├── setup-fields.sh          # Mode A: Custom fields
│   ├── setup-status.sh          # Mode A: 14 status options
│   ├── setup-views.sh           # Mode A: 5 views
│   ├── setup-templates.sh       # Mode A: Template auto-deploy
│   ├── project-ops.sh           # Mode B: Issue/PR/status operations
│   ├── migrate-import.sh        # CSV import (Jira/Linear/Notion)
│   └── sprint-report.sh         # Mode C: Sprint analytics
├── templates/                   # Files to copy into TARGET repos
├── skills/                      # 5 reusable sub-skills
├── docs/                        # Detailed documentation
├── tests/                       # 231 Playwright regression tests
└── .github/                     # CI/CD for THIS repo
```

## Tech Stack

- Skill definition: Markdown (SKILL.md, 3-mode architecture)
- Automation: Shell scripts (bash, gh CLI, GraphQL) — 9 scripts, 1,498 lines
- Tests: Playwright + TypeScript (strict mode) — 231 tests
- Code quality: ESLint + Prettier + Husky + lint-staged
- CI: GitHub Actions (lint, typecheck, format:check, shellcheck, test)

## Five-File Sync Rule (CRITICAL)

When modifying labels, statuses, views, or fields, always update simultaneously:

1. **SKILL.md** — mode sections and command references
2. **README.md** — overview tables and script list
3. **scripts/\*.sh** — automation scripts
4. **docs/\*.md** — detailed documentation
5. **tests/skill-structure.spec.ts** — regression tests

Verify before commit:

```bash
npm run quality && npm test
```

## Key Distinction: templates/ vs .github/

- `templates/` — files to copy into **target repos** that users set up with this skill
- `.github/` — CI/CD and templates for **this repo's own development**

## Key Commands

```bash
npm test                          # Run 231 regression tests
npm run quality                   # lint + typecheck + format:check
npm run format                    # Auto-format all files
shellcheck scripts/*.sh           # Validate shell scripts
```

## GitHub

- Remote: `git@github.com:fideguch/set-up-github-project.git`
- Default branch: main
- Default account: fideguch
