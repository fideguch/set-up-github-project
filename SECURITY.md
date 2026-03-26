# Security Policy

## Reporting Vulnerabilities

If you discover a security vulnerability in this project, please report it responsibly:

1. **Do NOT open a public issue**
2. Use [GitHub Security Advisories](https://github.com/fideguch/set-up-github-project/security/advisories/new) to report privately
3. Include: description, reproduction steps, and potential impact

We will respond within 3 business days.

## Security Considerations

### PROJECT_TOKEN (Classic PAT)

This skill requires a GitHub Classic PAT with `project`, `repo`, and `read:org` scopes.

- **Never commit** PAT tokens to source code or `.github-project-config.json`
- Store as **GitHub Actions secrets** (`Settings > Secrets > Actions`)
- Use the minimum required scopes
- Rotate tokens regularly (recommended: every 90 days)
- Fine-grained PATs are NOT supported (GitHub Projects V2 GraphQL API limitation)

### .github-project-config.json

This file stores project metadata (project ID, field IDs) but **never** stores tokens or credentials. It is safe to commit to the repository. However, if your project IDs should remain private, add it to `.gitignore`.

### Shell Scripts

All scripts in `scripts/` use `set -euo pipefail` for safe execution:

- `set -e`: Exit on error
- `set -u`: Error on undefined variables
- `set -o pipefail`: Propagate pipe failures

### Template Security

Workflow templates in `templates/workflows/` reference `${{ secrets.PROJECT_TOKEN }}`.
When deploying to target repositories, ensure the secret is configured before enabling workflows.
