---
id: TASK-74.2
title: Annotate existing HIPAA scenarios with typed mappings
status: Done
assignee:
  - '@codex'
created_date: '2026-05-29 00:55'
updated_date: '2026-05-29 01:33'
labels:
  - feature
  - hipaa
  - compliance
  - scenarios
dependencies:
  - TASK-74.1
references:
  - packages/catalog/scenarios/compliance-hipaa-audit-suppression.json
  - packages/catalog/scenarios/compliance-hipaa-emergency-access.json
  - packages/catalog/scenarios/compliance-hipaa-minimum-necessary.json
  - packages/catalog/scenarios/compliance-hipaa-patient-export.json
  - packages/crucible/scenarios/compliance-hipaa-audit-suppression.json
  - packages/crucible/scenarios/compliance-hipaa-emergency-access.json
  - packages/crucible/scenarios/compliance-hipaa-minimum-necessary.json
  - packages/crucible/scenarios/compliance-hipaa-patient-export.json
documentation:
  - backlog/docs/doc-3 - HIPAA-Support-Plan-for-Crucible.md
parent_task_id: TASK-74
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add typed HIPAA compliance mappings to the existing HIPAA scenario pack in both catalog copies. Preserve the technical behavior of the scenarios while making typed compliance metadata the source for future filtering, report rollups, and exports.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 All four existing HIPAA scenarios in packages/catalog/scenarios include valid typed HIPAA compliance mappings.
- [x] #2 Matching packages/crucible/scenarios copies are kept aligned with catalog annotations.
- [x] #3 Scenario validator coverage proves evidence references point to real steps.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Map each existing HIPAA scenario to the relevant 164.312 citation and assertion slug.
2. Add compliance.mappings to catalog and Crucible scenario copies.
3. Keep rule_ids during the transition unless the schema task removes that need explicitly.
4. Add or update catalog service/validator tests for HIPAA scenario loading and evidence references.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented typed HIPAA compliance mappings for the four existing HIPAA scenarios in both catalog copies. Added catalog service coverage that loads the HIPAA pack, filters by framework, validates mapping fields, and verifies evidence references point to real scenario steps with matching evidence types.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
HIPAA scenario annotations are now present and aligned across packages/catalog and packages/crucible; verification passed with catalog scenario tests, scenario validator tests, type-check, and diff whitespace checks.
<!-- SECTION:FINAL_SUMMARY:END -->
