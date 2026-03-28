# Mode C: Sprint Analytics

How to generate sprint reports and track velocity over time.

## Prerequisites

- Sprint (Iteration) field configured on the project (GitHub UI: Project Settings >
  Custom fields > New field > Iteration)
- At least one sprint with issues assigned to it

## Generating a sprint report

```bash
# Current sprint
./scripts/sprint-report.sh myorg 3

# Previous sprint
./scripts/sprint-report.sh myorg 3 --sprint previous

# A specific sprint by title
./scripts/sprint-report.sh myorg 3 --sprint "Sprint 12"

# JSON output (for piping or further processing)
./scripts/sprint-report.sh myorg 3 --json
```

### Example output

```
Sprint Report — Sprint 11 (2026-03-17 to 2026-03-23)
======================================================
Completion rate : 8 / 10 issues (80%)
Velocity        : 21 points
Blocked items   : 1

Completed issues:
  #42  Fix login redirect loop                [P1] [3 pts]
  #45  Add rate limiting to /api/auth         [P1] [5 pts]
  #47  Update onboarding copy                 [P2] [1 pt]
  #49  Refactor payment webhook handler       [P1] [8 pts]
  #51  Fix CSV export encoding                [P2] [2 pts]
  #53  Add dark mode toggle                   [P3] [1 pt]
  #55  Write E2E tests for checkout flow      [P2] [5 pts]
  #57  Upgrade Playwright to 1.42             [P3] [0 pts]

Incomplete issues:
  #44  Implement SSO (SAML)                   [P1] [8 pts]  <- blocked
  #50  Migrate user table to Postgres 16      [P2] [5 pts]

Blockers:
  #44  blocked — waiting on IdP credentials from customer
```

## Comparing sprints

```bash
# View two consecutive reports and compare manually
./scripts/sprint-report.sh myorg 3 --sprint previous
./scripts/sprint-report.sh myorg 3
```

Or use the MCP tool for both in one Claude Code session:

```
Show me the sprint report for Sprint 10 and Sprint 11 for project 3 owned by myorg,
then compare velocity and completion rate.
```

## Via MCP tool (project_sprint_report)

```json
{
  "owner": "myorg",
  "projectNumber": 3,
  "sprint": "current"
}
```

Other valid values for `sprint`:

- `"current"` — the active iteration (default)
- `"previous"` — the most recently completed iteration
- `"Sprint 12"` — exact sprint title match

### Response structure

The tool returns a structured `SprintReport` object:

```json
{
  "sprintTitle": "Sprint 11",
  "startDate": "2026-03-17",
  "endDate": "2026-03-23",
  "totalItems": 10,
  "completedItems": 8,
  "completionRate": 0.8,
  "velocity": 21,
  "blockedItems": 1,
  "completedIssues": [...],
  "incompleteIssues": [...]
}
```

## Tracking velocity over time

To build a velocity history, run the script after each sprint closes and save the output:

```bash
./scripts/sprint-report.sh myorg 3 --json > reports/sprint-11.json
```

Then compare across sprints with a simple shell one-liner:

```bash
for f in reports/sprint-*.json; do
  echo "$f: $(jq '.velocity' "$f") pts, $(jq '.completionRate * 100 | round' "$f")%"
done
```

Example output:

```
reports/sprint-09.json: 18 pts, 75%
reports/sprint-10.json: 24 pts, 90%
reports/sprint-11.json: 21 pts, 80%
```

## Sprint health signals

| Signal          | Healthy      | Watch  | Act   |
| --------------- | ------------ | ------ | ----- |
| Completion rate | >= 80%       | 60-79% | < 60% |
| Blocked items   | 0            | 1      | >= 2  |
| Velocity trend  | Stable or up | -10%   | -25%+ |

If completion rate drops below 60% two sprints in a row, review scope at sprint planning
and consider reducing capacity assumptions.
