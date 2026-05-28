---
id: TASK-73.10
title: '[Chimera] Add FedRAMP annotation validation and drift checks'
status: Done
assignee:
  - '@myself'
created_date: '2026-05-27 15:38'
updated_date: '2026-05-28 06:26'
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
modified_files:
  - ../Chimera/apps/vuln-api/scripts/check_fedramp_openapi_annotations.py
  - ../Chimera/apps/vuln-api/justfile
  - ../Chimera/apps/vuln-api/README.md
  - ../Chimera/docs/fedramp-openapi-extensions.md
  - ../Chimera/apps/vuln-api/tests/unit/test_fedramp_openapi_validator.py
  - ../Chimera/apps/vuln-api/tests/unit/test_openapi_fedramp_annotations.py
parent_task_id: TASK-73
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Prevent Chimera FedRAMP endpoint annotations from drifting away from live routes, expected evidence fields, or Crucible scenario mappings.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A validation command checks required FedRAMP OpenAPI extensions for the annotated endpoint set.
- [x] #2 The validator detects malformed control IDs, missing expected-defense text, missing evidence types, and annotations on removed paths.
- [x] #3 Output is stable enough for CI and for Crucible compatibility-matrix automation to consume.
- [x] #4 Developer docs describe how to run the validation before updating Crucible scenarios.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Extend existing OpenAPI drift tooling or add a companion check for FedRAMP annotation completeness.
2. Validate control ID format, required extension fields, evidence type names, and stale references to removed paths.
3. Make the check useful from both Chimera and Crucible workflows by producing stable text or JSON output.
4. Document the command in the FedRAMP plan and Chimera developer docs.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Added a FedRAMP OpenAPI annotation validator with stable text and JSON output, a justfile command, docs for local/CI/Crucible usage, and focused tests for malformed controls, expected-defense fields, evidence types, stale paths, CLI exit codes, malformed YAML, live-route integration, and deterministic output.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented TASK-73.10 Chimera FedRAMP annotation validation. Verification: uv run pytest tests/unit/test_fedramp_openapi_validator.py tests/unit/test_openapi_fedramp_annotations.py -q; uv run black --check scripts/check_fedramp_openapi_annotations.py tests/unit/test_fedramp_openapi_validator.py tests/unit/test_openapi_fedramp_annotations.py; just docs-check-fedramp; uv run python scripts/check_fedramp_openapi_annotations.py --json; uv run python scripts/check_openapi_drift.py; git diff --check. Independent review reached P0/P1/P2 clean state; remaining P3 edge cases were fixed with local regression tests. Diff test audit coverage gaps were addressed with 44 focused tests.
<!-- SECTION:FINAL_SUMMARY:END -->
