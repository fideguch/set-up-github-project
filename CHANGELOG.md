# Changelog

All notable changes to this project will be documented in this file.

## [5.3.0] - 2026-04-21

### Added

- **PM Operator Stance (Last Line of Defense)** section — documents the PM session's self-discipline for parallel Claude Code session operations
  - 7 principles: MVP value × effort cost judgment, careful baseline, diligent oversight across all sessions, coverage self-check, intervention criteria, communication quality, self-criticism habit
  - Recommended judgment template (fact / evaluation / action / trade-off)
  - Anti-pattern list (session report blind trust, ambiguous "either works", prompt bloat, past judgment固執, scope creep, monitoring gaps)
  - Cross-references to bochi memo (`~/.claude/bochi-data/memos/2026-04-21-pm-last-line-of-defense-stance.md`)
- README.md top-level summary of PM Operator Stance with link to detailed SKILL.md section

### Context

Origin: 2026-04-21 real operational discovery during Kireinavi commercial project parallel session management. User feedback: "PM must be the strictest last-line-of-defense, tracking everything more diligently than any session." Codified as non-destructive additive documentation to prevent drift between sessions during high-stakes commercial launches.

## [5.2.0] - 2026-03-29

### Added

- **Workspace Bridge Write Tools**: 5 new MCP tools for bidirectional integration
  - `workspace_update_sheet`: Update Google Sheets cell values (PUT values/{range})
  - `workspace_append_sheet`: Append rows to Google Sheets (POST values:append)
  - `workspace_create_event`: Create Google Calendar events (RFC3339 + all-day support)
  - `notion_update_page`: Update Notion page properties (13 property types)
  - `notion_archive_page`: Archive/unarchive Notion pages (reversible)
- `is2DArray` type guard for Sheets value validation (zero `as` casts in new tools)
- 403 OAuth scope detection with actionable re-authorization message
- OAuth scope migration documentation in docs/workspace-bridge.md
- 26 new tests for write tools (5 test files)

### Changed

- `googleFetchCore` refactored to support POST/PUT/PATCH/DELETE via `GoogleFetchOptions`
- `googleFetch<T>` and `googleFetchText` now accept optional `opts` parameter
- GoogleClient interface: +3 write methods (updateSheetValues, appendSheetValues, createEvent)
- NotionClient interface: +1 write method (updatePage)
- OAuth scopes: spreadsheets.readonly → spreadsheets, calendar.readonly → calendar
- MCP tool count: 22 → 27
- Test count: 476 → 502

### Fixed

- brace-expansion dependency vulnerability (moderate → 0 vulnerabilities)

## [3.0.0] - 2026-03-28

### Added

- **Workspace Bridge**: 11 new MCP tools (5 Notion + 6 Google Workspace)
  - Notion: `notion_search`, `notion_get_page`, `notion_query_database`, `notion_create_page`, `notion_append_blocks`
  - Google: `workspace_search_drive`, `workspace_get_doc`, `workspace_get_sheet`, `workspace_get_slides`, `workspace_list_events`, `workspace_search_gmail`
- NotionClient + GoogleClient abstractions (injectable, testable)
- Notion block-to-Markdown converter (`notionBlocksToMarkdown`)
- API specs documentation (`skills/workspace-bridge/api-specs/`)
- Monthly API compatibility check CI workflow
- MIT LICENSE
- 82 new workspace bridge tests + 12 scenario tests
- Cross-service bridge tests (Notion/Google → GitHub compatibility)

### Changed

- Tool count: 11 → 22 (existing 11 tools unchanged)
- Test count: 375 → 459+
- README/SKILL.md updated with workspace triggers and tool table

## [2.2.0] - 2026-03-28

### Added

- Cursor-based pagination for `list-items` and `sprint-report` (MAX_PAGES=20 guard)
- `PageInfo` interface in type definitions
- Type guard functions: `hasField`, `isSelectValue`, `isNumberValue`, `isIterationValue`
- 10 scenario tests (`tests/scenarios/pm-workflows.spec.ts`) with Given-When-Then
- `QUICKSTART.md` — 3-step installation guide
- `examples/` directory with 4 example docs (setup, daily, analytics, MCP)

### Changed

- `GET_PROJECT_FULL` query now accepts `$cursor` parameter for pagination
- `sprint-report.ts` and `list-items.ts` paginate through all items automatically
- Test suite split: `skill-structure.spec.ts` (1,726 lines) → `tests/skill/{structure,content,validation}.spec.ts`
- Unsafe `as` casts reduced from 9 to 1 (justified: dynamic GraphQL response in `add-item.ts`)
- Test count: 339 → 375

### Fixed

- Projects with 200+ items no longer truncate results silently
- Added try/catch to sprint-report pagination loop for error resilience

## [2.1.0] - 2026-03-28

### Added

- `--lite` flag for small teams (1-3 people): 8 statuses, 3 views, 5 labels
- Lite mode comparison table in README.md / README.en.md
- Lite mode validation tests (18 test cases)
- `--lite` status mapping in migrate-import.sh

## [2.0.0] - 2026-03-27

### Changed

- **BREAKING**: Rebranded from `setup_github_project` to `github_project_manager`
- SKILL.md completely redesigned with 3-mode architecture (Setup / Operations / Analytics)
- Added Onboarding flow with `.github-project-config.json` for project context persistence
- Added Mode B: Daily Operations as the primary mode (Issue creation, PR support, status changes, backlog/blocker queries)
- Added Mode C: Analytics (Sprint reports, velocity tracking)
- Added natural language dialog patterns for PM daily tasks
- Triggers expanded from 10 to 15 (daily operation keywords like "Issue を作成して", "ステータスを変更")
- docs/USAGE.md restructured: daily operations first, setup second
- README rebranded to "GitHub Project Manager"
- install.sh updated to use new skill directory name

## [1.5.0] - 2026-03-27

### Added

- `scripts/migrate-import.sh` — CSV import from Jira, Linear, Notion, or generic format. Auto-creates Issues, adds to Project, sets Status/Priority/Estimate. Supports `--dry-run` and duplicate detection.
- `scripts/sprint-report.sh` — Sprint velocity, completion rate, status breakdown, priority distribution, and blocker detection. Supports `--sprint current|previous|<name>` and `--json` output.
- Migration guide in docs/USAGE.md (Jira/Linear/Notion export procedures + mapping tables)
- Sprint report section in docs/USAGE.md (velocity tracking best practices)
- Migration and report tool sections in docs/automation-guide.md

### Changed

- SKILL.md Help Command updated with migration and report command examples
- SKILL.md operations section expanded with migrate-import.sh and sprint-report.sh usage

## [1.4.0] - 2026-03-27

### Added

- `scripts/setup-templates.sh` — automated template and workflow deployment to target repos (clone → copy → substitute placeholders → commit → push)
- `scripts/setup-status.sh` — automated Status 14 options configuration via GraphQL API with manual fallback
- `scripts/project-ops.sh` — project operations CLI (add-issue, add-pr, move, set-priority, list-items, list-fields)
- Project item operations section in docs/USAGE.md
- GraphQL implementation details in docs/automation-guide.md
- Operations commands section in SKILL.md

### Changed

- `scripts/setup-all.sh` — fully automated (Phase 4-5 now auto-deploy templates and workflows)
- `templates/workflows/project-automation.yml` — replaced TODO comments with real GraphQL mutations for status transitions (PR→コードレビュー, Review→テスト中, Merge→Done)

## [1.3.0] - 2026-03-27

### Added

- YAML frontmatter in SKILL.md with 10 trigger keywords
- Help Command section with quick-start guide and connected skills
- Progress Detection logic for resuming partially completed setups
- `install.sh` for automated skill installation to `~/.claude/skills/`
- SECURITY.md with PAT handling guidelines
- CHANGELOG.md (this file)
- README.en.md (English version)

### Changed

- SKILL.md expanded from 289 to ~420 lines

## [1.2.0] - 2026-03-27

### Added

- 164 Playwright regression tests (`tests/skill-structure.spec.ts`)
- Code quality toolchain: ESLint + Prettier + Husky + lint-staged
- CI/CD: GitHub Actions (lint, format, typecheck, shellcheck, test)
- PR auto-labeler with 7 label categories
- CLAUDE.md with Five-File Sync Rule
- CONTRIBUTING.md (branch naming, commit conventions, SLAs, labels)
- LICENSE (ISC)
- `.github/` templates (bug report, feature request, PR template)

### Changed

- README.md expanded with developer setup and file tree

### Removed

- README_INIT.md (orphan placeholder)

## [1.1.0] - 2026-03-27

### Added

- `templates/workflows/roadmap-date-sync.yml` (Sprint date sync)
- `docs/USAGE.md` (474-line comprehensive operation manual)
- Roadmap Date Sync section in `docs/automation-guide.md`

### Changed

- Prettier single-quote formatting applied to all template files
- README.md updated with USAGE.md link and 6-view count
- SKILL.md Phase 5 updated with roadmap-date-sync.yml

## [1.0.0] - 2026-03-27

### Added

- SKILL.md: 6-phase Devin playbook for GitHub Projects V2 setup
- 4 shell scripts: setup-all.sh, setup-labels.sh, setup-fields.sh, setup-views.sh
- 5 workflow templates: ci, project-automation, pr-labeler, stale-detection
- Issue templates (bug report, feature request) and PR template
- 5 sub-skills: code-quality, ci-cd-pipeline, typescript, git-workflow, project-setup-automation
- 3 documentation files: workflow-definition, view-design, automation-guide
- README.md with overview, file structure, label table
