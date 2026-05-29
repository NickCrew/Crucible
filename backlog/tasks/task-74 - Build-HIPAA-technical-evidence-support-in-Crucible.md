---
id: TASK-74
title: Build HIPAA technical evidence support in Crucible
status: To Do
assignee: []
created_date: '2026-05-29 00:54'
labels:
  - feature
  - hipaa
  - compliance
dependencies: []
references:
  - docs/plans/scenarios-compliance.md
  - packages/catalog/src/models/regulations.ts
  - packages/catalog/src/models/types.ts
documentation:
  - backlog/docs/doc-3 - HIPAA-Support-Plan-for-Crucible.md
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Coordinate the HIPAA support program described in doc-3. This epic tracks schema generalization, HIPAA scenario annotations, discovery filters, report rollups, a HIPAA technical evidence export, GitHub Pages documentation, and any Chimera endpoint or fixture gaps needed for runnable HIPAA evidence.

HIPAA must be modeled as a technical evidence overlay. Crucible should not claim HIPAA compliance, legal advice, audit readiness, or complete covered-entity/business-associate attestation.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Backlog contains independently executable child tasks for schema, scenario annotation, discovery, reporting, export, docs, and Chimera gap validation.
- [ ] #2 Implementation sequence preserves technical scenario categories and treats HIPAA as a compliance evidence overlay.
- [ ] #3 doc-3 records the first usable milestone, non-goals, source anchors, and delivery phases.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Phase 0: generalize compliance metadata while preserving FedRAMP behavior (`TASK-74.1`).
Phase 1: annotate existing HIPAA scenarios with typed mappings (`TASK-74.2`).
Phase 2: expose HIPAA discovery through API/client/CLI/web filters (`TASK-74.3`).
Phase 3: add HIPAA-aware report rollups (`TASK-74.4`).
Phase 4: add HIPAA technical evidence JSON export (`TASK-74.5`).
Phase 5: publish GitHub Pages documentation (`TASK-74.6`).
Phase 6: validate or fill Chimera endpoint/fixture gaps (`TASK-74.7`).
<!-- SECTION:PLAN:END -->
