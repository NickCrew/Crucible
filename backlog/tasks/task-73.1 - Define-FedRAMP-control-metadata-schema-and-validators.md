---
id: TASK-73.1
title: Define FedRAMP control metadata schema and validators
status: To Do
assignee: []
created_date: '2026-05-27 15:37'
labels:
  - feature
  - fedramp
  - compliance
  - catalog
milestone: m-3
dependencies: []
documentation:
  - backlog/docs/doc-2 - FedRAMP-Support-Plan-for-Crucible-and-Chimera.md
modified_files:
  - packages/catalog/src/models/types.ts
  - packages/catalog/src/models/__tests__/types.test.ts
  - packages/catalog/src/validation/scenario-validator.ts
parent_task_id: TASK-73
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add first-class compliance metadata to Crucible scenario definitions so FedRAMP can act as a framework/control overlay without replacing technical scenario categories.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario metadata supports framework name, baseline, control ID, control family, evidence type, assertion rationale, and implementation status.
- [ ] #2 Catalog validation rejects malformed FedRAMP control IDs, unsupported baselines, and orphan evidence mappings.
- [ ] #3 Existing compliance-fedramp scenarios are migrated or annotated without losing their current category, rule_ids, or execution behavior.
- [ ] #4 Unit tests cover valid and invalid FedRAMP metadata and query/filter helpers.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Extend the catalog scenario model with a small compliance mapping shape before changing UI or reports.
2. Add Zod validation and type tests for FedRAMP framework, baseline, control family, control ID, evidence type, and rationale fields.
3. Migrate the existing compliance-fedramp scenarios to the new metadata shape while keeping category values technical or Compliance as appropriate.
4. Add compatibility helpers that let callers query scenarios by framework, baseline, control family, and control ID.
<!-- SECTION:PLAN:END -->
