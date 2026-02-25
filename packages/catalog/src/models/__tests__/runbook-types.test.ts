import { describe, it, expect } from 'vitest';
import {
  RunbookFrontmatterSchema,
  RunbookStepSchema,
  RunbookSubstepSchema,
  RunbookSchema,
  RunbookCategoryEnum,
  RunbookDifficultyEnum,
  RunbookSummarySchema,
} from '../runbook-types.js';

// ── TASK-20: Runbook type schemas ─────────────────────────────────────

describe('RunbookFrontmatterSchema', () => {
  it('parses valid frontmatter with all fields', () => {
    const result = RunbookFrontmatterSchema.parse({
      id: 'runbook-1',
      title: 'My Runbook',
      description: 'A test runbook',
      category: 'platform',
      difficulty: 'advanced',
      estimatedTime: '30m',
      version: '1.0',
      tags: ['security', 'auth'],
    });

    expect(result.title).toBe('My Runbook');
    expect(result.category).toBe('platform');
    expect(result.difficulty).toBe('advanced');
  });

  it('applies defaults for category and difficulty', () => {
    const result = RunbookFrontmatterSchema.parse({
      title: 'Minimal Runbook',
    });

    expect(result.category).toBe('general');
    expect(result.difficulty).toBe('intermediate');
  });

  it('rejects missing required title', () => {
    expect(() =>
      RunbookFrontmatterSchema.parse({ id: 'no-title' }),
    ).toThrow();
  });

  it('rejects invalid category value', () => {
    expect(() =>
      RunbookFrontmatterSchema.parse({
        title: 'Bad Category',
        category: 'nonexistent',
      }),
    ).toThrow();
  });

  it('rejects invalid difficulty value', () => {
    expect(() =>
      RunbookFrontmatterSchema.parse({
        title: 'Bad Difficulty',
        difficulty: 'legendary',
      }),
    ).toThrow();
  });
});

describe('RunbookStepSchema', () => {
  it('parses a valid step', () => {
    const result = RunbookStepSchema.parse({
      id: 'step-1',
      title: 'Setup',
      content: 'Install dependencies',
      order: 0,
    });

    expect(result.id).toBe('step-1');
    expect(result.phase).toBeUndefined();
  });

  it('parses step with optional phase and substeps', () => {
    const result = RunbookStepSchema.parse({
      id: 'step-1',
      title: 'Setup',
      content: 'Do things',
      phase: 'Phase 1: Init',
      order: 0,
      substeps: [
        { id: 'sub-1', text: 'Install', order: 0, checked: false },
      ],
    });

    expect(result.phase).toBe('Phase 1: Init');
    expect(result.substeps).toHaveLength(1);
  });
});

describe('RunbookSubstepSchema', () => {
  it('defaults checked to false', () => {
    const result = RunbookSubstepSchema.parse({
      id: 'sub-1',
      text: 'Do a thing',
      order: 0,
    });

    expect(result.checked).toBe(false);
  });
});

describe('RunbookCategoryEnum', () => {
  it('accepts all valid categories', () => {
    for (const cat of ['gauntlet', 'orchestrator', 'catalog-api', 'platform', 'general']) {
      expect(RunbookCategoryEnum.parse(cat)).toBe(cat);
    }
  });
});

describe('RunbookDifficultyEnum', () => {
  it('accepts all valid difficulties', () => {
    for (const diff of ['beginner', 'intermediate', 'advanced']) {
      expect(RunbookDifficultyEnum.parse(diff)).toBe(diff);
    }
  });
});

describe('RunbookSummarySchema', () => {
  it('parses a valid summary', () => {
    const result = RunbookSummarySchema.parse({
      id: 'rb-1',
      slug: 'my-runbook',
      title: 'My Runbook',
      category: 'general',
      difficulty: 'beginner',
      stepCount: 5,
    });

    expect(result.stepCount).toBe(5);
  });
});
