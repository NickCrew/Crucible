import { describe, it, expect } from 'vitest';
import {
  parseFrontmatter,
  extractTitle,
  parseSteps,
  parseRunbook,
  slugify,
} from '../runbook-parser.js';

// ── TASK-13: Runbook parser functions ─────────────────────────────────

describe('runbook-parser', () => {
  describe('parseFrontmatter', () => {
    it('parses valid YAML frontmatter', () => {
      const content = `---
title: My Runbook
category: platform
difficulty: advanced
---
# Body content here`;

      const { frontmatter, body } = parseFrontmatter(content);

      expect(frontmatter.title).toBe('My Runbook');
      expect(frontmatter.category).toBe('platform');
      expect(frontmatter.difficulty).toBe('advanced');
      expect(body).toBe('# Body content here');
    });

    it('returns default frontmatter when none present', () => {
      const content = '# Just a heading\n\nSome body text';

      const { frontmatter, body } = parseFrontmatter(content);

      expect(frontmatter.title).toBe('Untitled Runbook');
      expect(body).toBe(content);
    });

    it('parses array values in frontmatter', () => {
      const content = `---
title: Tagged Runbook
tags:
  - security
  - auth
---
Body`;

      const { frontmatter } = parseFrontmatter(content);

      expect(frontmatter.tags).toEqual(['security', 'auth']);
    });

    it('parses numeric and boolean values', () => {
      const content = `---
title: Typed Values
nav_order: 42
---
Body`;

      const { frontmatter } = parseFrontmatter(content);

      expect(frontmatter.nav_order).toBe(42);
    });

    it('strips quotes from string values', () => {
      const content = `---
title: "Quoted Title"
---
Body`;

      const { frontmatter } = parseFrontmatter(content);

      expect(frontmatter.title).toBe('Quoted Title');
    });
  });

  describe('extractTitle', () => {
    it('extracts H1 heading from body', () => {
      expect(extractTitle('# My Title\n\nSome text')).toBe('My Title');
    });

    it('returns undefined when no H1 present', () => {
      expect(extractTitle('## Not H1\n\nText')).toBeUndefined();
    });

    it('extracts first H1 when multiple exist', () => {
      expect(extractTitle('# First\n\n# Second')).toBe('First');
    });
  });

  describe('slugify', () => {
    it('converts to lowercase kebab-case', () => {
      expect(slugify('Hello World')).toBe('hello-world');
    });

    it('strips special characters', () => {
      expect(slugify('Auth: CSRF & XSS!')).toBe('auth-csrf-xss');
    });

    it('collapses multiple dashes', () => {
      expect(slugify('a   b   c')).toBe('a-b-c');
    });
  });

  describe('parseSteps', () => {
    it('parses H2 headings as steps', () => {
      const body = `## Step One
Content for step one

## Step Two
Content for step two`;

      const steps = parseSteps(body);

      expect(steps).toHaveLength(2);
      expect(steps[0].title).toBe('Step One');
      expect(steps[1].title).toBe('Step Two');
    });

    it('parses checkbox items as substeps', () => {
      const body = `## Setup
- [x] Install dependencies
- [ ] Configure environment
- [x] Run migrations`;

      const steps = parseSteps(body);

      expect(steps).toHaveLength(1);
      expect(steps[0].substeps).toHaveLength(3);
      expect(steps[0].substeps![0].checked).toBe(true);
      expect(steps[0].substeps![0].text).toBe('Install dependencies');
      expect(steps[0].substeps![1].checked).toBe(false);
    });

    it('identifies phase headings and assigns to subsequent steps', () => {
      const body = `## Phase 1: Setup
## Install Tools
Install the tools

## Phase 2: Execution
## Run Tests
Run the tests`;

      const steps = parseSteps(body);

      expect(steps).toHaveLength(2);
      expect(steps[0].phase).toBe('Phase 1: Setup');
      expect(steps[1].phase).toBe('Phase 2: Execution');
    });

    it('returns empty array for body with no headings', () => {
      expect(parseSteps('Just plain text, no headings')).toEqual([]);
    });

    it('skips Table of Contents headings', () => {
      const body = `## Table of Contents
- Link 1

## Actual Step
Real content`;

      const steps = parseSteps(body);

      expect(steps).toHaveLength(1);
      expect(steps[0].title).toBe('Actual Step');
    });
  });

  describe('parseRunbook', () => {
    it('parses a complete runbook with frontmatter and steps', () => {
      const content = `---
title: Security Audit
category: platform
---
## Check Auth
Verify authentication

## Check Permissions
Verify authorization`;

      const result = parseRunbook(content, '/path/to/security-audit.md');

      expect(result.meta.title).toBe('Security Audit');
      expect(result.steps).toHaveLength(2);
      expect(result.rawContent).toBe(content);
    });

    it('falls back to H1 title when frontmatter title is missing', () => {
      const content = `---
category: general
---
# My Extracted Title

## Step 1
Content`;

      const result = parseRunbook(content, '/path/to/runbook.md');

      expect(result.meta.title).toBe('My Extracted Title');
    });

    it('generates ID from filename when not in frontmatter', () => {
      const content = `---
title: Test Runbook
---
## Step 1
Content`;

      const result = parseRunbook(content, '/some/path/my-runbook.md');

      expect(result.meta.id).toBe('my-runbook');
    });

    it('handles content with no frontmatter and no H1', () => {
      const content = `## Just a Step
Some content`;

      const result = parseRunbook(content, '/path/to/bare.md');

      expect(result.meta.title).toBe('Untitled Runbook');
      expect(result.steps).toHaveLength(1);
    });
  });
});
