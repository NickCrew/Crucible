---
id: TASK-74.4
title: Add HIPAA-aware assessment report rollups
status: To Do
assignee: []
created_date: '2026-05-29 00:55'
labels:
  - feature
  - hipaa
  - compliance
  - reporting
dependencies:
  - TASK-74.2
references:
  - apps/demo-dashboard/src/server/reports.ts
  - apps/demo-dashboard/src/__tests__/reports.test.ts
documentation:
  - backlog/docs/doc-3 - HIPAA-Support-Plan-for-Crucible.md
parent_task_id: TASK-74
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Extend assessment report generation so HIPAA mappings produce framework rollups in JSON and HTML reports, using shared compliance status semantics while preserving existing FedRAMP report output.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Assessment JSON includes compliance.frameworks.hipaa counts and per-citation controls when HIPAA mappings are present.
- [ ] #2 HTML reports render HIPAA citation/status/evidence summaries without OSCAL or FedRAMP wording.
- [ ] #3 FedRAMP report tests continue to pass and shared rollup code is covered by tests.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Extract framework-generic control/evidence rollup helpers from the FedRAMP-specific report path.
2. Add HIPAA rollup construction with citation, safeguard, assertion, endpoint, evidence, and implementation status fields.
3. Render HIPAA summaries in HTML reports alongside existing framework cards.
4. Add report tests for passed, failed, skipped, and unknown HIPAA evidence states.
<!-- SECTION:PLAN:END -->
