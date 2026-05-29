---
id: TASK-74.3
title: Add HIPAA-aware scenario discovery filters
status: Done
assignee:
  - '@codex'
created_date: '2026-05-29 00:55'
updated_date: '2026-05-29 02:01'
labels:
  - feature
  - hipaa
  - compliance
  - api
  - cli
  - ui
dependencies:
  - TASK-74.2
references:
  - packages/catalog/src/models/types.ts
  - packages/catalog/src/service/catalog-service.ts
  - apps/demo-dashboard/src/server/backend.ts
  - apps/client/src/client.ts
  - apps/cli/src/commands/scenarios.ts
  - apps/web-client/src/app/scenarios/page.tsx
documentation:
  - backlog/docs/doc-3 - HIPAA-Support-Plan-for-Crucible.md
parent_task_id: TASK-74
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Extend scenario discovery so users can find HIPAA-mapped scenarios through the REST API, TypeScript client, CLI, and web catalog without breaking existing FedRAMP discovery behavior.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 REST scenario listing accepts framework=hipaa and HIPAA citation/control filters with validation errors for unsupported inputs.
- [x] #2 TypeScript client and CLI can request HIPAA-mapped scenarios and show HIPAA citations in table output.
- [x] #3 Web catalog can filter HIPAA scenarios without forcing FedRAMP baseline/family semantics.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Generalize catalog filter helpers around framework-specific selectors.
2. Add API/client/CLI parameters for HIPAA citation or control ID filters.
3. Update web catalog controls and badges to display HIPAA mappings cleanly alongside FedRAMP mappings.
4. Add tests for FedRAMP regression and HIPAA discovery paths.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented HIPAA scenario discovery across the REST query parser, CLI filters/output, catalog service tests, and web scenario catalog filters. Added framework-specific validation so HIPAA citation/safeguard filters cannot be mixed with FedRAMP baseline/family filters, while preserving FedRAMP discovery behavior.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
REST scenario listing now accepts framework=hipaa plus citation, safeguard, and HIPAA control-id aliases with validation. The CLI accepts HIPAA flags and renders citations in the controls column. The web catalog exposes HIPAA framework, citation, safeguard, badge, and search behavior without forcing FedRAMP baseline/family semantics.
<!-- SECTION:FINAL_SUMMARY:END -->
