---
id: TASK-73.6
title: Add FedRAMP evidence export with OSCAL-shaped JSON
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
  - oscal
milestone: m-10
dependencies:
  - TASK-73.4
references:
  - 'https://automate.fedramp.gov/'
documentation:
  - backlog/docs/doc-2 - FedRAMP-Support-Plan-for-Crucible-and-Chimera.md
modified_files:
  - apps/demo-dashboard/src/server/reports.ts
  - apps/cli/src/commands/reports.ts
parent_task_id: TASK-73
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Produce a machine-readable FedRAMP evidence package from Crucible assessments, with an OSCAL-compatible direction once internal evidence semantics are stable.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 JSON export includes framework/control mappings, control rollups, scenario assertion outcomes, and evidence references.
- [x] #2 An OSCAL-shaped export mode is available behind a clearly named option or export type.
- [x] #3 Export documentation states scope and limitations relative to official FedRAMP authorization artifacts.
- [x] #4 Tests verify export shape stability for FedRAMP-mapped and unmapped scenarios.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Define a stable internal evidence export shape before promising formal OSCAL conformance.
2. Include assessment metadata, target URL, scenario mappings, control rollups, assertions, artifacts, and evidence references.
3. Add an OSCAL-shaped JSON export mode that can evolve toward FedRAMP OSCAL assessment results.
4. Document limitations clearly so users understand this is dynamic assessment evidence, not a full authorization package.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Added OSCAL-shaped JSON report generation, report download route, SDK/CLI download helpers, scope limitations in docs, and stability tests for mapped/unmapped report exports.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
FedRAMP evidence can now be exported as a clearly scoped OSCAL-shaped JSON artifact.
<!-- SECTION:FINAL_SUMMARY:END -->
