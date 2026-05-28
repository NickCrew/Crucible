---
id: TASK-73.9
title: '[Chimera] Fill FedRAMP-relevant endpoint behavior gaps'
status: Done
assignee:
  - '@myself'
created_date: '2026-05-27 15:38'
updated_date: '2026-05-28 15:48'
labels:
  - feature
  - fedramp
  - compliance
  - chimera
  - endpoints
  - chimera-owned
milestone: m-3
dependencies:
  - TASK-73.7
  - TASK-73.8
  - TASK-73.10
references:
  - ../Chimera/apps/vuln-api/app/blueprints/admin/routes.py
  - ../Chimera/apps/vuln-api/app/blueprints/security_ops/routes.py
  - ../Chimera/apps/vuln-api/app/blueprints/government/routes.py
  - ../Chimera/apps/vuln-api/app/blueprints/saas/routes.py
documentation:
  - backlog/docs/doc-2 - FedRAMP-Support-Plan-for-Crucible-and-Chimera.md
parent_task_id: TASK-73
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add or refine Chimera endpoint behavior needed for the initial FedRAMP pack, especially audit suppression, unauthorized config changes, boundary/trust checks, monitoring signals, and vulnerability-risk evidence.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Endpoint gaps needed by the initial AC, AU, IA, SC, SI, CM, and RA scenarios are documented and either implemented or explicitly deferred.
- [x] #2 New or changed endpoints support deterministic vulnerable behavior and, where appropriate, strict/secure-mode comparison behavior.
- [x] #3 API docs, OpenAPI entries, and unit tests are updated for every new or changed endpoint.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Compare the desired FedRAMP scenario pack against current Chimera endpoint domains and identify missing behavior for AU, CM, SC, SI, and RA evidence.
2. Prefer extending existing blueprints over creating one-off endpoints when a domain already exists.
3. Add vulnerable and secure-mode comparison behavior where useful for assessment evidence.
4. Cover new behavior with unit tests and update API/reference docs.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Completed in Chimera commit fa64ae0 (feat(api): add deterministic FedRAMP endpoint evidence). Added deterministic FedRAMP endpoint evidence for audit suppression and defense metrics, documented AC/AU/IA/SC/SI/CM/RA endpoint gap decisions, updated OpenAPI/API docs, and expanded unit coverage for vulnerable/strict comparisons plus boundary and concurrency cases. Verification: uv run pytest tests/unit/test_admin_routes.py tests/unit/test_security_ops_routes.py tests/unit/test_openapi_fedramp_annotations.py tests/unit/test_fedramp_openapi_validator.py -q (149 passed, 1 pre-existing datetime.utcnow deprecation warning); uv run python -m py_compile app/models/data_stores.py app/models/__init__.py app/blueprints/admin/routes.py app/blueprints/security_ops/routes.py tests/unit/test_admin_routes.py tests/unit/test_security_ops_routes.py; git diff --check; just docs-check-fedramp; uv run python scripts/check_fedramp_openapi_annotations.py --json. Independent review: .agents/reviews/review-20260528-113640.md CLEAN via Gemini fallback after Claude contract failure. Independent test audit: .agents/reviews/test-audit-20260528-114524.md no prioritized gaps via Gemini fallback after Claude contract failure.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Chimera commit fa64ae0 fills the FedRAMP endpoint behavior gaps for the initial scenario pack. It implements deterministic audit-suppression evidence with strict denial comparison, adds deterministic FedRAMP defense metrics for SI/RA evidence, records endpoint gap decisions including the deferred SC integration slice, and updates OpenAPI/API docs plus focused unit tests. Verification passed with 149 focused tests, py_compile, git diff --check, FedRAMP docs validation, CLEAN independent source/docs review, and independent test audit with no prioritized gaps.
<!-- SECTION:FINAL_SUMMARY:END -->
