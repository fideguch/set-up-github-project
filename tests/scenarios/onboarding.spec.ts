import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test.describe('Onboarding Scenario', () => {
  test('SKILL.md contains onboarding flow for new projects', () => {
    const skill = readFileSync('SKILL.md', 'utf-8');
    expect(skill).toContain('.github-project-config.json');
    expect(skill).toContain('初回起動フロー');
  });

  test('SKILL.md contains re-connection flow for existing projects', () => {
    const skill = readFileSync('SKILL.md', 'utf-8');
    expect(skill).toContain('再起動時');
    expect(skill).toContain('即座に操作可能状態に');
  });

  test('config schema includes required fields', () => {
    const skill = readFileSync('SKILL.md', 'utf-8');
    expect(skill).toContain('"owner"');
    expect(skill).toContain('"projectNumber"');
    expect(skill).toContain('"projectId"');
    expect(skill).toContain('"statusFieldId"');
  });

  test('SKILL.md has mode detection logic', () => {
    const skill = readFileSync('SKILL.md', 'utf-8');
    expect(skill).toContain('未構築');
    expect(skill).toContain('構築済み');
    expect(skill).toContain('部分構築');
  });
});
