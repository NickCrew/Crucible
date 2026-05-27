---
id: TASK-73.4
title: Add FedRAMP-aware assessment scoring and reports
status: To Do
assignee: []
created_date: '2026-05-27 15:37'
labels:
  - feature
  - fedramp
  - compliance
  - reporting
milestone: m-10
dependencies:
  - TASK-73.1
  - TASK-73.3
documentation:
  - backlog/docs/doc-2 - FedRAMP-Support-Plan-for-Crucible-and-Chimera.md
modified_files:
  - apps/demo-dashboard/src/server/reports.ts
  - apps/cli/src/commands/assess.ts
  - apps/web-client/src/app/assessments/page.tsx
parent_task_id: TASK-73
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Make Crucible reports answer which FedRAMP controls were exercised, which passed or failed, and what endpoint evidence supports that result.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Assessment JSON includes framework/control rollups with pass, fail, skipped, and unknown counts.
- [ ] #2 HTML/PDF reports show a FedRAMP control summary linked back to scenario steps and endpoint evidence.
- [ ] #3 CLI assessment output can display a concise control-family summary without overwhelming normal scenario output.
- [ ] #4 Tests cover report payload generation for scenarios with and without FedRAMP metadata.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Extend report payloads to group scenario outcomes by framework, baseline, control family, and control ID.
2. Add pass/fail/unknown semantics for controls based on mapped scenario assertions and skipped evidence.
3. Render the control summary in CLI output, JSON reports, and HTML/PDF report surfaces.
4. Keep raw request/response details available as evidence links or step references rather than duplicating large bodies in every control row.
<!-- SECTION:PLAN:END -->
