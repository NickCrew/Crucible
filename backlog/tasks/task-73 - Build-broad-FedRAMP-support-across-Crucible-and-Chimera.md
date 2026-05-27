---
id: TASK-73
title: Build broad FedRAMP support across Crucible and Chimera
status: To Do
assignee: []
created_date: '2026-05-27 15:36'
updated_date: '2026-05-27 15:46'
labels:
  - feature
  - fedramp
  - compliance
  - chimera
dependencies: []
references:
  - docs/plans/scenarios-compliance.md
  - docs/development/reports/chimera-scenario-compatibility-matrix.md
documentation:
  - backlog/docs/doc-2 - FedRAMP-Support-Plan-for-Crucible-and-Chimera.md
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Coordinate the cross-cutting FedRAMP support program described in doc-2. This epic tracks the control metadata model, Chimera endpoint annotations, FedRAMP scenario pack, control-aware reporting, filtering, and evidence export work needed for Crucible to produce useful FedRAMP-oriented assessment evidence against Chimera.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Backlog contains independently executable child tasks for metadata, Chimera contract, scenario coverage, reporting, filtering, and evidence export.
- [ ] #2 The implementation sequence preserves technical scenario categories and treats FedRAMP as a framework/control overlay.
- [ ] #3 Formal delivery phases, critical path, first usable milestone, and effort range are documented in doc-2.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Phase 0: align on the Crucible metadata model and Chimera annotation contract (`TASK-73.1`, `TASK-73.2`).
Phase 1: build the Chimera evidence substrate with OpenAPI annotations, deterministic fixtures, and annotation drift checks (`TASK-73.7`, `TASK-73.8`, `TASK-73.10`).
Phase 2: close only the Chimera endpoint behavior gaps required by the first control-family slice (`TASK-73.9`).
Phase 3: prove the thin vertical slice with runnable FedRAMP-mapped scenarios and discovery filters (`TASK-73.3`, `TASK-73.5`).
Phase 4: add control-aware scoring and human-readable assessment reporting (`TASK-73.4`).
Phase 5: add machine-readable evidence export with OSCAL-shaped JSON after report semantics stabilize (`TASK-73.6`).
<!-- SECTION:PLAN:END -->
