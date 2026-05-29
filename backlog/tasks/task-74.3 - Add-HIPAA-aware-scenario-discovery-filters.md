---
id: TASK-74.3
title: Add HIPAA-aware scenario discovery filters
status: To Do
assignee: []
created_date: '2026-05-29 00:55'
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
- [ ] #1 REST scenario listing accepts framework=hipaa and HIPAA citation/control filters with validation errors for unsupported inputs.
- [ ] #2 TypeScript client and CLI can request HIPAA-mapped scenarios and show HIPAA citations in table output.
- [ ] #3 Web catalog can filter HIPAA scenarios without forcing FedRAMP baseline/family semantics.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Generalize catalog filter helpers around framework-specific selectors.
2. Add API/client/CLI parameters for HIPAA citation or control ID filters.
3. Update web catalog controls and badges to display HIPAA mappings cleanly alongside FedRAMP mappings.
4. Add tests for FedRAMP regression and HIPAA discovery paths.
<!-- SECTION:PLAN:END -->
