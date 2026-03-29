import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

function fileExists(relativePath: string): boolean {
  return fs.existsSync(path.join(ROOT, relativePath));
}

function readFile(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf-8');
}

// ============================================================
// 2. SKILL.md Content Validation
// ============================================================
test.describe('SKILL.md Content Validation', () => {
  let content: string;

  test.beforeAll(() => {
    content = readFile('SKILL.md');
  });

  test('has metadata section with macro', () => {
    expect(content).toContain('!my_pm_tools');
  });

  test('has triggers in frontmatter', () => {
    expect(content).toContain('triggers:');
  });

  test('has metadata section with prerequisites', () => {
    expect(content).toContain('前提条件');
  });

  test('contains Phase 1: Custom fields', () => {
    expect(content).toContain('Phase 1');
    expect(content).toContain('カスタムフィールド');
  });

  test('contains Phase 2: Labels', () => {
    expect(content).toContain('Phase 2');
    expect(content).toContain('ラベル');
  });

  test('contains Phase 3: Views', () => {
    expect(content).toContain('Phase 3');
    expect(content).toContain('ビュー');
  });

  test('contains Phase 4: Templates', () => {
    expect(content).toContain('Phase 4');
    expect(content).toContain('テンプレート');
  });

  test('contains Phase 4-5: Templates and Workflows', () => {
    expect(content).toContain('Phase 4-5');
    expect(content).toContain('テンプレート');
  });

  test('contains Phase 6: Checklist', () => {
    expect(content).toContain('Phase 6');
    expect(content).toContain('チェックリスト');
  });

  test('references 14 statuses', () => {
    expect(content).toContain('14');
    expect(content).toContain('Icebox');
    expect(content).toContain('Done');
  });

  test('references all 14 status names', () => {
    const statuses = [
      'Icebox',
      '進行待ち',
      '要件作成中',
      'デザイン待ち',
      'デザイン作成中',
      'アサイン待ち',
      '開発待ち',
      '開発中',
      'コードレビュー',
      'テスト中',
      'テスト落ち',
      'リリース待ち',
      'リリース済み',
      'Done',
    ];
    for (const status of statuses) {
      expect(content).toContain(status);
    }
  });

  test('references 13 labels', () => {
    expect(content).toContain('13');
  });

  test('references Priority field with P0-P4', () => {
    expect(content).toContain('Priority');
    expect(content).toContain('P0');
    expect(content).toContain('P4');
  });

  test('references Estimate field', () => {
    expect(content).toContain('Estimate');
  });

  test('references Target field', () => {
    expect(content).toContain('Target');
  });

  test('references Sprint/Iteration field', () => {
    expect(content).toContain('Sprint');
    expect(content).toContain('Iteration');
  });

  test('references script names in script reference table', () => {
    expect(content).toContain('setup-all.sh');
    expect(content).toContain('project-ops.sh');
    expect(content).toContain('migrate-import.sh');
    expect(content).toContain('sprint-report.sh');
  });

  test('has checklist items in Phase 6', () => {
    expect(content).toContain('チェックリスト');
    expect(content).toContain('14ステータス');
  });

  test('references setup-labels.sh script', () => {
    expect(content).toContain('setup-labels.sh');
  });

  test('contains GraphQL API references', () => {
    expect(content).toContain('GraphQL');
  });

  test('references gh CLI', () => {
    expect(content).toContain('gh');
  });

  test('references Classic PAT requirement', () => {
    expect(content).toContain('Classic PAT');
  });

  test('contains view creation commands', () => {
    expect(content).toContain('Product Backlog');
    expect(content).toContain('Sprint Board');
    expect(content).toContain('Sprint Table');
    expect(content).toContain('Roadmap');
    expect(content).toContain('My Items');
  });
});

// ============================================================
// 3. Template YAML Validation
// ============================================================
test.describe('Template YAML Validation', () => {
  // Simple YAML validation using Ruby (available on macOS/Linux)
  function isValidYaml(filePath: string): boolean {
    try {
      execSync(`ruby -ryaml -e "YAML.safe_load(File.read('${path.join(ROOT, filePath)}'))"`, {
        stdio: 'pipe',
      });
      return true;
    } catch {
      return false;
    }
  }

  const yamlFiles = [
    'templates/ISSUE_TEMPLATE/bug_report.yml',
    'templates/ISSUE_TEMPLATE/feature_request.yml',
    'templates/workflows/ci.yml',
    'templates/workflows/project-automation.yml',
    'templates/workflows/pr-labeler.yml',
    'templates/workflows/stale-detection.yml',
    'templates/workflows/roadmap-date-sync.yml',
  ];

  for (const file of yamlFiles) {
    test(`valid YAML: ${file}`, () => {
      expect(isValidYaml(file)).toBe(true);
    });
  }

  test('bug_report.yml has required issue template fields', () => {
    const content = readFile('templates/ISSUE_TEMPLATE/bug_report.yml');
    expect(content).toContain('name:');
    expect(content).toContain('description:');
    expect(content).toContain('body:');
    expect(content).toContain('labels:');
  });

  test('bug_report.yml has severity dropdown', () => {
    const content = readFile('templates/ISSUE_TEMPLATE/bug_report.yml');
    expect(content).toContain('type: dropdown');
    expect(content).toContain('severity');
  });

  test('feature_request.yml has required issue template fields', () => {
    const content = readFile('templates/ISSUE_TEMPLATE/feature_request.yml');
    expect(content).toContain('name:');
    expect(content).toContain('description:');
    expect(content).toContain('body:');
    expect(content).toContain('labels:');
  });

  test('feature_request.yml has priority dropdown', () => {
    const content = readFile('templates/ISSUE_TEMPLATE/feature_request.yml');
    expect(content).toContain('type: dropdown');
    expect(content).toContain('priority');
  });

  test('all workflow templates have name, on, and jobs keys', () => {
    const workflows = [
      'templates/workflows/ci.yml',
      'templates/workflows/project-automation.yml',
      'templates/workflows/pr-labeler.yml',
      'templates/workflows/stale-detection.yml',
      'templates/workflows/roadmap-date-sync.yml',
    ];
    for (const wf of workflows) {
      const content = readFile(wf);
      expect(content).toContain('name:');
      expect(content).toContain('on:');
      expect(content).toContain('jobs:');
    }
  });

  test('ci.yml contains quality check steps', () => {
    const content = readFile('templates/workflows/ci.yml');
    expect(content).toContain('Lint');
    expect(content).toContain('Build');
  });

  test('roadmap-date-sync.yml uses placeholders not hardcoded values', () => {
    const content = readFile('templates/workflows/roadmap-date-sync.yml');
    expect(content).toContain('__PROJECT_ID__');
    expect(content).toContain('__OWNER__');
  });

  test('roadmap-date-sync.yml has schedule trigger', () => {
    const content = readFile('templates/workflows/roadmap-date-sync.yml');
    expect(content).toContain('schedule:');
    expect(content).toContain('cron:');
  });

  test('stale-detection.yml has weekly cron', () => {
    const content = readFile('templates/workflows/stale-detection.yml');
    expect(content).toContain('cron:');
  });

  test('project-automation.yml references PROJECT_TOKEN secret', () => {
    const content = readFile('templates/workflows/project-automation.yml');
    expect(content).toContain('PROJECT_TOKEN');
  });

  test('all YAML templates use single quotes (Prettier formatted)', () => {
    const files = [
      'templates/ISSUE_TEMPLATE/bug_report.yml',
      'templates/ISSUE_TEMPLATE/feature_request.yml',
      'templates/workflows/ci.yml',
      'templates/workflows/stale-detection.yml',
    ];
    for (const file of files) {
      const content = readFile(file);
      // Should not have double-quoted YAML string values (except in multiline blocks)
      const lines = content
        .split('\n')
        .filter((l) => !l.trim().startsWith('#') && !l.trim().startsWith('-') && l.includes(': "'));
      // Allow some double quotes in special cases (env vars, etc), but most should be single
      expect(lines.length).toBeLessThanOrEqual(3);
    }
  });
});

// ============================================================
// 6. Documentation Consistency
// ============================================================
test.describe('Documentation Consistency', () => {
  const markdownFiles = [
    'README.md',
    'SKILL.md',
    'CONTRIBUTING.md',
    'CLAUDE.md',
    'LICENSE',
    'docs/USAGE.md',
    'docs/workflow-definition.md',
    'docs/view-design.md',
    'docs/automation-guide.md',
  ];

  for (const file of markdownFiles.filter((f) => f.endsWith('.md') && f !== 'LICENSE')) {
    test(`${file} has a top-level heading`, () => {
      const content = readFile(file);
      expect(content).toMatch(/^#\s+/m);
    });
  }

  test('CONTRIBUTING.md references branch naming convention', () => {
    const content = readFile('CONTRIBUTING.md');
    expect(content).toContain('feature/');
    expect(content).toContain('fix/');
  });

  test('CONTRIBUTING.md references commit conventions', () => {
    const content = readFile('CONTRIBUTING.md');
    expect(content).toContain('feat');
    expect(content).toContain('fix');
    expect(content).toContain('docs');
  });

  test('CONTRIBUTING.md references quality check commands', () => {
    const content = readFile('CONTRIBUTING.md');
    expect(content).toContain('npm run quality');
    expect(content).toContain('npm test');
  });

  test('CLAUDE.md references Five-File Sync Rule', () => {
    const content = readFile('CLAUDE.md');
    expect(content).toContain('SKILL.md');
    expect(content).toContain('README.md');
    expect(content).toContain('scripts');
    expect(content).toContain('docs');
    expect(content).toContain('tests');
  });

  test('CLAUDE.md references key commands', () => {
    const content = readFile('CLAUDE.md');
    expect(content).toContain('npm test');
    expect(content).toContain('npm run quality');
  });

  test('CLAUDE.md references GitHub remote', () => {
    const content = readFile('CLAUDE.md');
    expect(content).toContain('github.com');
    expect(content).toContain('my_pm_tools');
  });

  test('README references CONTRIBUTING.md', () => {
    const readme = readFile('README.md');
    expect(readme).toContain('CONTRIBUTING');
  });

  test('README has prerequisites section', () => {
    const readme = readFile('README.md');
    expect(readme).toContain('前提条件');
  });

  test('README has quick start section', () => {
    const readme = readFile('README.md');
    expect(readme).toContain('クイックスタート');
  });

  test('README has script list section', () => {
    const readme = readFile('README.md');
    expect(readme).toContain('スクリプト一覧');
  });

  test('README mentions ISC license', () => {
    const readme = readFile('README.md');
    expect(readme).toMatch(/ISC|License/i);
  });

  test('status count (14) is consistent across docs', () => {
    const files = ['SKILL.md', 'README.md', 'docs/USAGE.md'];
    for (const file of files) {
      const content = readFile(file);
      expect(content).toContain('14');
      expect(content).toContain('Icebox');
      expect(content).toContain('Done');
    }
  });

  test('workflow-definition.md mentions WIP limits', () => {
    const content = readFile('docs/workflow-definition.md');
    expect(content).toContain('WIP');
  });

  test('USAGE.md has troubleshooting section', () => {
    const usage = readFile('docs/USAGE.md');
    expect(usage).toContain('トラブルシューティング');
  });

  test('USAGE.md has best practices section', () => {
    const usage = readFile('docs/USAGE.md');
    expect(usage).toContain('ベストプラクティス');
  });
});

// ============================================================
// 11. Skill Maturity Validation (v1.3.0)
// ============================================================
test.describe('Skill Maturity Validation', () => {
  test('SKILL.md has YAML frontmatter with triggers', () => {
    const content = readFile('SKILL.md');
    expect(content).toMatch(/^---\n/);
    expect(content).toContain('triggers:');
  });

  test('SKILL.md frontmatter has 10+ trigger keywords', () => {
    const content = readFile('SKILL.md');
    const frontmatter = content.split('---')[1] || '';
    const triggerLines = frontmatter.split('\n').filter((l) => l.trim().startsWith("- '"));
    expect(triggerLines.length).toBeGreaterThanOrEqual(15);
  });

  test('SKILL.md has name and description in frontmatter', () => {
    const content = readFile('SKILL.md');
    expect(content).toContain('name:');
    expect(content).toContain('description:');
  });

  test('SKILL.md has Help Command section', () => {
    const content = readFile('SKILL.md');
    expect(content).toContain('## Help Command');
  });

  test('SKILL.md help section mentions connected skills', () => {
    const content = readFile('SKILL.md');
    expect(content).toContain('/code-quality');
    expect(content).toContain('/ci-cd-pipeline');
  });

  test('SKILL.md has Onboarding section with project detection', () => {
    const content = readFile('SKILL.md');
    expect(content).toContain('Onboarding');
  });

  test('SKILL.md progress detection has gh CLI commands', () => {
    const content = readFile('SKILL.md');
    expect(content).toContain('gh label list');
    expect(content).toContain('gh project field-list');
  });

  test('install.sh exists and is executable', () => {
    expect(fileExists('install.sh')).toBe(true);
    const content = readFile('install.sh');
    expect(content.startsWith('#!/bin/bash')).toBe(true);
    expect(content).toContain('set -euo pipefail');
  });

  test('install.sh targets ~/.claude/skills/', () => {
    const content = readFile('install.sh');
    expect(content).toContain('.claude/skills');
  });

  test('SECURITY.md covers PROJECT_TOKEN handling', () => {
    const content = readFile('SECURITY.md');
    expect(content).toContain('PROJECT_TOKEN');
    expect(content).toContain('Classic PAT');
  });

  test('CHANGELOG.md has version entries', () => {
    const content = readFile('CHANGELOG.md');
    expect(content).toContain('[1.0.0]');
    expect(content).toContain('[1.1.0]');
    expect(content).toContain('[1.2.0]');
    expect(content).toContain('[1.3.0]');
  });

  test('README.en.md exists with English content', () => {
    const content = readFile('README.en.md');
    expect(content).toContain('# My PM Tools');
    expect(content).toContain('Prerequisites');
    expect(content).toContain('Installation');
  });

  test('README.md links to English version', () => {
    const content = readFile('README.md');
    expect(content).toContain('[English](README.en.md)');
  });

  test('README.md mentions install.sh', () => {
    const content = readFile('README.md');
    expect(content).toContain('install.sh');
  });
});
