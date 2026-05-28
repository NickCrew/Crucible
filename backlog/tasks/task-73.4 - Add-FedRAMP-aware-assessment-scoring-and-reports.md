---
id: TASK-73.4
title: Add FedRAMP-aware assessment scoring and reports
status: Done
assignee:
  - '@myself'
created_date: '2026-05-27 15:37'
updated_date: '2026-05-28 16:37'
labels:
  - feature
  - fedramp
  - compliance
  - reporting
milestone: m-10
dependencies:
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
- [x] #1 Assessment JSON includes framework/control rollups with pass, fail, skipped, and unknown counts.
- [x] #2 HTML/PDF reports show a FedRAMP control summary linked back to scenario steps and endpoint evidence.
- [x] #3 CLI assessment output can display a concise control-family summary without overwhelming normal scenario output.
- [x] #4 Tests cover report payload generation for scenarios with and without FedRAMP metadata.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Extend report payloads to group scenario outcomes by framework, baseline, control family, and control ID.
2. Add pass/fail/unknown semantics for controls based on mapped scenario assertions and skipped evidence.
3. Render the control summary in CLI output, JSON reports, and HTML/PDF report surfaces.
4. Keep raw request/response details available as evidence links or step references rather than duplicating large bodies in every control row.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Extended assessment report payloads with FedRAMP framework, family, and control rollups; rendered the summary in HTML; added CLI assessment family summaries; covered mapped and unmapped report behavior.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
FedRAMP-aware assessment rollups now flow through JSON, HTML, and CLI assessment output.
<!-- SECTION:FINAL_SUMMARY:END -->
