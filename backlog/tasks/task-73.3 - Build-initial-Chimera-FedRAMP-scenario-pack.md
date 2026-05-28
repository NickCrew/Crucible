---
id: TASK-73.3
title: Build initial Chimera FedRAMP scenario pack
status: Done
assignee:
  - '@myself'
created_date: '2026-05-27 15:37'
updated_date: '2026-05-28 16:37'
labels:
  - feature
  - fedramp
  - compliance
  - chimera
  - scenarios
milestone: m-3
dependencies:
  - TASK-73.1
  - TASK-73.7
  - TASK-73.8
  - TASK-73.9
documentation:
  - backlog/docs/doc-2 - FedRAMP-Support-Plan-for-Crucible-and-Chimera.md
modified_files:
  - packages/catalog/scenarios
parent_task_id: TASK-73
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create a first FedRAMP-oriented Chimera scenario pack that exercises endpoint-level controls while preserving technical categories such as IDOR, SSRF, Broken Authentication, and Business Logic.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The pack includes at least one runnable Chimera scenario for each initial family: AC, AU, IA, SC, SI, CM, and RA.
- [x] #2 Each scenario includes FedRAMP metadata, technical category, Chimera tag, explicit evidence expectations, and pass/fail assertions.
- [x] #3 Scenarios use seeded Chimera users, tenants, roles, and resources where isolation or authorization evidence is required.
- [x] #4 Catalog validation and Chimera compatibility checks pass for the new pack.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Select a thin vertical slice across the priority control families instead of trying to cover the whole Rev5 baseline.
2. Build Chimera-native scenarios that prove exploit attempt, expected secure behavior, and collected evidence for each selected control mapping.
3. Use the new FedRAMP metadata from TASK-73.1 and the endpoint contract from TASK-73.2.
4. Validate the scenario pack with catalog tests and at least one targeted Chimera compatibility pass.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented seven Chimera FedRAMP scenarios covering AC, AU, IA, SC, SI, CM, and RA with FedRAMP mappings, endpoint/evidence references, Chimera tags, technical categories, and pass/fail assertions.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added the initial runnable Chimera FedRAMP scenario pack and catalog validation coverage.
<!-- SECTION:FINAL_SUMMARY:END -->
