---
id: TASK-73.7
title: '[Chimera] Annotate FedRAMP controls in OpenAPI endpoint metadata'
status: Done
assignee:
  - '@myself'
created_date: '2026-05-27 15:38'
updated_date: '2026-05-28 05:50'
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
modified_files:
  - ../Chimera/apps/vuln-api/docs/openapi.yaml
  - ../Chimera/apps/vuln-api/tests/unit/test_openapi_fedramp_annotations.py
  - ../Chimera/docs/fedramp-openapi-extensions.md
  - ../Chimera/docs/api-reference.md
parent_task_id: TASK-73
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add machine-readable FedRAMP control annotations to Chimera's OpenAPI surface so Crucible can connect scenario evidence to endpoint-level control intent.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 OpenAPI paths in the first FedRAMP slice include x-fedramp-controls, x-vulnerability-class, x-expected-defense, and x-evidence-types annotations.
- [x] #2 Annotated endpoints cover the auth, saas, admin/audit, healthcare, banking, ecommerce, payments, compliance, and integrations domains.
- [x] #3 Chimera OpenAPI drift checks pass or document intentional annotation-only differences.
- [x] #4 Crucible's compatibility-matrix follow-up can consume the annotations without hand parsing prose docs.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Start from the OpenAPI extension contract in TASK-73.2 and annotate only the first high-value endpoint slice.
2. Cover auth, saas tenant, admin/audit, healthcare, banking, ecommerce, payments, compliance, and integrations routes before expanding breadth.
3. Keep annotations machine-readable and consistent enough for Crucible import/validation.
4. Run Chimera's OpenAPI drift checker and update endpoint docs where annotations change generated/reference expectations.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Annotated the first Chimera FedRAMP OpenAPI operation slice with x-fedramp-controls, x-vulnerability-class, x-expected-defense, and x-evidence-types. The slice covers auth, users, SaaS tenants, admin/config, audit, healthcare, banking, ecommerce, payments, compliance, and integrations. Added a YAML-backed unit test so consumers can validate the extension shape without parsing prose docs.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented TASK-73.7 Chimera FedRAMP OpenAPI annotations. Verification: uv run pytest tests/unit/test_openapi_fedramp_annotations.py -q; uv run python scripts/check_openapi_drift.py; git diff --check. Independent specialist review .agents/reviews/review-20260528-014822.md was CLEAN; diff test audit .agents/reviews/test-audit-20260528-014933.md reported no prioritized gaps.
<!-- SECTION:FINAL_SUMMARY:END -->
