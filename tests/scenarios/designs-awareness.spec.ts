import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test.describe('designs/ Awareness Scenario', () => {
  test('SKILL.md documents designs/ detection step', () => {
    const skill = readFileSync('SKILL.md', 'utf-8');
    expect(skill).toContain('designs/ 検出');
    expect(skill).toContain('requirements_designer 連携');
  });

  test('SKILL.md instructs to read designs/README.md', () => {
    const skill = readFileSync('SKILL.md', 'utf-8');
    expect(skill).toContain('designs/README.md');
    expect(skill).toContain('designs/user_stories.md');
    expect(skill).toContain('designs/functional_requirements.md');
  });

  test('SKILL.md documents designs/ context usage in issue creation', () => {
    const skill = readFileSync('SKILL.md', 'utf-8');
    expect(skill).toContain('コンテキストとして参照');
  });

  test('designs/ absence is handled gracefully', () => {
    const skill = readFileSync('SKILL.md', 'utf-8');
    expect(skill).toContain('不在の場合');
    expect(skill).toContain('designs/ は任意');
  });
});
