---
id: TASK-73.8
title: '[Chimera] Add deterministic FedRAMP demo tenants, roles, and resources'
status: Done
assignee:
  - '@myself'
created_date: '2026-05-27 15:38'
updated_date: '2026-05-28 14:45'
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
- [x] #1 Seed data includes deterministic tenants, users, roles, audit subjects, banking accounts, healthcare records, ecommerce orders, and payment resources for FedRAMP scenarios.
- [x] #2 Fixture IDs and credentials are documented for Crucible scenario authors without introducing real secrets.
- [x] #3 Tests verify fixture creation/reset and cross-tenant resource separation in both normal and vulnerable flows.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Inventory existing demo_data users, tenants, roles, banking accounts, healthcare records, and ecommerce/payment fixtures.
2. Add deterministic fixtures for Tenant A/Tenant B, admin/operator/auditor/user roles, and cross-domain resources used by the FedRAMP scenario pack.
3. Expose fixture identifiers in docs so Crucible scenarios do not depend on random IDs.
4. Add tests that prove fixture availability and reset behavior across local runs.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented in Chimera commit b64bd5e (feat(api): add deterministic FedRAMP fixtures). Added deterministic FedRAMP tenants/users/roles/resources, fixture helper contract, compliance log seeding, docs, and focused tests. Verification: uv run pytest tests/unit/test_demo_data.py tests/unit/test_hotpatch.py -q (51 passed); uv run python -m py_compile app/utils/demo_data.py tests/conftest.py tests/unit/test_demo_data.py; git diff --check. Agent-loop review: specialist-review clean after remediation; diff-test-audit clean after remediation.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Completed TASK-73.8. Chimera now seeds deterministic FedRAMP tenants, role-bearing demo users, audit/compliance subjects, banking accounts, healthcare records, ecommerce orders, customer payment methods, and payment authorization fixtures from init_demo_data(). Added get_fedramp_demo_fixtures() for Crucible scenario authors and documented all stable IDs/demo-only credentials in docs/fedramp-openapi-extensions.md. Tests cover fixture creation, reset, idempotency, patched-store behavior, tenant separation, vulnerable SaaS cross-tenant access, and secure/vulnerable banking BOLA comparison. Chimera commit: b64bd5e.
<!-- SECTION:FINAL_SUMMARY:END -->
