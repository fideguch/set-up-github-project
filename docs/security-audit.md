# Security Audit Record

## Latest Audit: 2026-03-29

| Check                 | Result                 | Details                                                  |
| --------------------- | ---------------------- | -------------------------------------------------------- |
| npm audit             | 0 vulnerabilities      | brace-expansion moderate fixed via npm audit fix         |
| Hardcoded secrets     | 0 found                | grep -rn for sk-, ghp*, ntn*, GOCSPX- in src/            |
| Input validation      | All boundaries covered | JSON.parse + isRecord/is2DArray guards on all user input |
| URL construction      | Safe                   | encodeURIComponent used for all user-provided IDs        |
| Error message safety  | No leaks               | Truncation (.slice(0,100)), no tokens in error output    |
| OAuth scope detection | Active                 | 403 errors return actionable re-authorization message    |
| Dependencies          | 246 packages           | 93 looking for funding, 0 vulnerabilities                |

## Audit History

| Date       | Vulnerabilities              | Action                  |
| ---------- | ---------------------------- | ----------------------- |
| 2026-03-29 | 1 moderate (brace-expansion) | Fixed via npm audit fix |

## Policy

- Run `npm audit` before each release
- Address CRITICAL/HIGH immediately
- Record all findings in this file
