---
id: TASK-73.5
title: Add framework and control filters to scenario discovery
status: To Do
assignee: []
created_date: '2026-05-27 15:37'
labels:
  - feature
  - fedramp
  - compliance
  - cli
  - web-client
milestone: m-10
dependencies:
  - TASK-73.1
documentation:
  - backlog/docs/doc-2 - FedRAMP-Support-Plan-for-Crucible-and-Chimera.md
modified_files:
  - packages/catalog/src/service/catalog-service.ts
  - apps/client/src/client.ts
  - apps/cli/src/commands/scenarios.ts
  - apps/web-client/src/app/scenarios/page.tsx
parent_task_id: TASK-73
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Let operators find and launch FedRAMP-relevant scenarios from the CLI, API/client library, and web catalog.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Scenario listing supports filtering by framework, baseline, control family, and control ID.
- [ ] #2 CLI scenarios output can list FedRAMP control mappings for matching scenarios.
- [ ] #3 Web catalog filters expose FedRAMP mappings without replacing the existing technical category filter.
- [ ] #4 Tests cover filtering behavior in catalog service, client/CLI, and web catalog state.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add API/catalog query parameters or client-side selectors for framework, baseline, control family, and control ID.
2. Expose matching filters in the CLI scenarios command and web scenario catalog.
3. Ensure filters compose with existing search/category/status behavior.
4. Add empty-state messaging that distinguishes no matching scenarios from missing FedRAMP metadata.
<!-- SECTION:PLAN:END -->
