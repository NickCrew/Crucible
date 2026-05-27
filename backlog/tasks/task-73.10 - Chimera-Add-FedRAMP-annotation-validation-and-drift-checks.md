---
id: TASK-73.10
title: '[Chimera] Add FedRAMP annotation validation and drift checks'
status: To Do
assignee: []
created_date: '2026-05-27 15:38'
labels:
  - feature
  - fedramp
  - compliance
  - chimera
  - tooling
  - chimera-owned
milestone: m-3
dependencies:
  - TASK-73.7
references:
  - ../Chimera/apps/vuln-api/scripts/check_openapi_drift.py
  - ../Chimera/apps/vuln-api/scripts/prune_openapi_drift.py
  - ../Chimera/apps/vuln-api/docs/openapi.yaml
documentation:
  - backlog/docs/doc-2 - FedRAMP-Support-Plan-for-Crucible-and-Chimera.md
parent_task_id: TASK-73
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Prevent Chimera FedRAMP endpoint annotations from drifting away from live routes, expected evidence fields, or Crucible scenario mappings.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A validation command checks required FedRAMP OpenAPI extensions for the annotated endpoint set.
- [ ] #2 The validator detects malformed control IDs, missing expected-defense text, missing evidence types, and annotations on removed paths.
- [ ] #3 Output is stable enough for CI and for Crucible compatibility-matrix automation to consume.
- [ ] #4 Developer docs describe how to run the validation before updating Crucible scenarios.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Extend existing OpenAPI drift tooling or add a companion check for FedRAMP annotation completeness.
2. Validate control ID format, required extension fields, evidence type names, and stale references to removed paths.
3. Make the check useful from both Chimera and Crucible workflows by producing stable text or JSON output.
4. Document the command in the FedRAMP plan and Chimera developer docs.
<!-- SECTION:PLAN:END -->
