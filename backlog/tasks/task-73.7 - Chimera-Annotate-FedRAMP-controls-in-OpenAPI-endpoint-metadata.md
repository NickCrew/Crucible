---
id: TASK-73.7
title: '[Chimera] Annotate FedRAMP controls in OpenAPI endpoint metadata'
status: To Do
assignee: []
created_date: '2026-05-27 15:38'
labels:
  - feature
  - fedramp
  - compliance
  - chimera
  - openapi
  - chimera-owned
milestone: m-3
dependencies:
  - TASK-73.2
references:
  - ../Chimera/apps/vuln-api/docs/openapi.yaml
  - ../Chimera/apps/vuln-api/scripts/check_openapi_drift.py
  - ../Chimera/docs/api-reference.md
documentation:
  - backlog/docs/doc-2 - FedRAMP-Support-Plan-for-Crucible-and-Chimera.md
parent_task_id: TASK-73
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add machine-readable FedRAMP control annotations to Chimera's OpenAPI surface so Crucible can connect scenario evidence to endpoint-level control intent.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 OpenAPI paths in the first FedRAMP slice include x-fedramp-controls, x-vulnerability-class, x-expected-defense, and x-evidence-types annotations.
- [ ] #2 Annotated endpoints cover the auth, saas, admin/audit, healthcare, banking, ecommerce, payments, compliance, and integrations domains.
- [ ] #3 Chimera OpenAPI drift checks pass or document intentional annotation-only differences.
- [ ] #4 Crucible's compatibility-matrix follow-up can consume the annotations without hand parsing prose docs.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Start from the OpenAPI extension contract in TASK-73.2 and annotate only the first high-value endpoint slice.
2. Cover auth, saas tenant, admin/audit, healthcare, banking, ecommerce, payments, compliance, and integrations routes before expanding breadth.
3. Keep annotations machine-readable and consistent enough for Crucible import/validation.
4. Run Chimera's OpenAPI drift checker and update endpoint docs where annotations change generated/reference expectations.
<!-- SECTION:PLAN:END -->
