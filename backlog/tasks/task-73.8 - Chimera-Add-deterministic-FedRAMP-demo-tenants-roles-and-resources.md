---
id: TASK-73.8
title: '[Chimera] Add deterministic FedRAMP demo tenants, roles, and resources'
status: To Do
assignee: []
created_date: '2026-05-27 15:38'
labels:
  - feature
  - fedramp
  - compliance
  - chimera
  - fixtures
  - chimera-owned
milestone: m-3
dependencies:
  - TASK-73.2
references:
  - ../Chimera/apps/vuln-api/app/utils/demo_data.py
  - ../Chimera/apps/vuln-api/app/models/data_stores.py
  - ../Chimera/apps/vuln-api/tests/unit/test_demo_data.py
documentation:
  - backlog/docs/doc-2 - FedRAMP-Support-Plan-for-Crucible-and-Chimera.md
parent_task_id: TASK-73
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create stable Chimera seed data for FedRAMP control scenarios, especially tenant isolation, least privilege, audit accountability, and sensitive-data access tests.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Seed data includes deterministic tenants, users, roles, audit subjects, banking accounts, healthcare records, ecommerce orders, and payment resources for FedRAMP scenarios.
- [ ] #2 Fixture IDs and credentials are documented for Crucible scenario authors without introducing real secrets.
- [ ] #3 Tests verify fixture creation/reset and cross-tenant resource separation in both normal and vulnerable flows.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Inventory existing demo_data users, tenants, roles, banking accounts, healthcare records, and ecommerce/payment fixtures.
2. Add deterministic fixtures for Tenant A/Tenant B, admin/operator/auditor/user roles, and cross-domain resources used by the FedRAMP scenario pack.
3. Expose fixture identifiers in docs so Crucible scenarios do not depend on random IDs.
4. Add tests that prove fixture availability and reset behavior across local runs.
<!-- SECTION:PLAN:END -->
