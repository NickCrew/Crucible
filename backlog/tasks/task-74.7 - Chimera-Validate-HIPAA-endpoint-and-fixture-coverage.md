---
id: TASK-74.7
title: '[Chimera] Validate HIPAA endpoint and fixture coverage'
status: Done
assignee:
  - '@codex'
created_date: '2026-05-29 00:56'
updated_date: '2026-05-29 02:32'
labels:
  - feature
  - hipaa
  - compliance
  - chimera
dependencies:
  - TASK-74.2
references:
  - docs/development/reports/chimera-scenario-compatibility-matrix.md
  - packages/catalog/scenarios/compliance-hipaa-audit-suppression.json
  - packages/catalog/scenarios/compliance-hipaa-emergency-access.json
  - packages/catalog/scenarios/compliance-hipaa-minimum-necessary.json
  - packages/catalog/scenarios/compliance-hipaa-patient-export.json
documentation:
  - backlog/docs/doc-3 - HIPAA-Support-Plan-for-Crucible.md
parent_task_id: TASK-74
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Audit the existing HIPAA scenario routes against Chimera-compatible healthcare endpoints and decide whether deterministic healthcare fixtures or endpoint behavior updates are needed for a runnable HIPAA evidence slice. Track any Chimera-owned work from the Crucible backlog so handoffs stay centralized.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Compatibility matrix is refreshed or reviewed for the first HIPAA evidence slice.
- [x] #2 Required Chimera fixtures/endpoints for HIPAA scenarios are identified with exact route/data expectations.
- [x] #3 If Chimera changes are required, the task documents owner repo, files/routes, and validation commands before implementation begins.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Compare HIPAA scenario URLs, headers, and expected responses against Chimera OpenAPI/routes and existing compatibility notes.
2. Identify which scenarios can run as-is and which require deterministic healthcare data or endpoint behavior.
3. File or update follow-on Chimera implementation notes in this task before changing the sibling repo.
4. Keep Crucible scenario metadata aligned with whatever Chimera contract is chosen.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Validated HIPAA scenario routes against Chimera OpenAPI and Starlette route behavior. Current route coverage is 4/4 for HIPAA scenario route families, including the newly documented minimum-necessary scenario, but deterministic evidence requires Chimera-owned fixture/response follow-up for minimum-necessary role filtering, audit-suppression denial semantics, and stronger export redaction evidence. Validation probe: cd /Users/nick/Developer/Chimera/apps/vuln-api && uv run python with Starlette TestClient against create_app() for /api/v1/healthcare/records/export, /api/v1/healthcare/records/emergency-access, /api/v1/healthcare/records/P-88210, /api/v1/healthcare/records/REC-FEDRAMP-A-001, and /api/v1/admin/audit/suspend.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Refreshed the Chimera compatibility matrix with a HIPAA endpoint and fixture validation section. The matrix now identifies exact Chimera owner files, route/data expectations, and validation commands before any sibling-repo implementation begins. No Chimera files were changed in this slice.
<!-- SECTION:FINAL_SUMMARY:END -->
