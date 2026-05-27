---
id: TASK-73.1
title: Define FedRAMP control metadata schema and validators
status: Done
assignee:
  - '@myself'
created_date: '2026-05-27 15:37'
updated_date: '2026-05-27 21:06'
labels:
  - feature
  - fedramp
  - compliance
  - catalog
milestone: m-3
dependencies: []
documentation:
  - backlog/docs/doc-2 - FedRAMP-Support-Plan-for-Crucible-and-Chimera.md
modified_files:
  - packages/catalog/src/models/types.ts
  - packages/catalog/src/index.ts
  - packages/catalog/src/validation/scenario-validator.ts
  - packages/catalog/src/models/__tests__/types.test.ts
  - packages/catalog/src/validation/__tests__/scenario-validator.test.ts
  - packages/catalog/scenarios/compliance-fedramp-cipher-negotiation.json
  - packages/catalog/scenarios/compliance-fedramp-cross-tenant.json
  - packages/crucible/scenarios/compliance-fedramp-cipher-negotiation.json
  - packages/crucible/scenarios/compliance-fedramp-cross-tenant.json
parent_task_id: TASK-73
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add first-class compliance metadata to Crucible scenario definitions so FedRAMP can act as a framework/control overlay without replacing technical scenario categories.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Scenario metadata supports framework name, baseline, control ID, control family, evidence type, assertion rationale, and implementation status.
- [x] #2 Catalog validation rejects malformed FedRAMP control IDs, unsupported baselines, and orphan evidence mappings.
- [x] #3 Existing compliance-fedramp scenarios are migrated or annotated without losing their current category, rule_ids, or execution behavior.
- [x] #4 Unit tests cover valid and invalid FedRAMP metadata and query/filter helpers.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Extend the catalog scenario model with a small compliance mapping shape before changing UI or reports.
2. Add Zod validation and type tests for FedRAMP framework, baseline, control family, control ID, evidence type, and rationale fields.
3. Migrate the existing compliance-fedramp scenarios to the new metadata shape while keeping category values technical or Compliance as appropriate.
4. Add compatibility helpers that let callers query scenarios by framework, baseline, control family, and control ID.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Added first-class FedRAMP compliance metadata schemas, runtime validators, query/filter helpers, and orphan evidence step validation. Annotated the two existing FedRAMP scenarios in catalog and crucible scenario copies without changing category, rule_ids, steps, or execution behavior.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented FedRAMP scenario compliance metadata for TASK-73.1. Verification: pnpm --filter @crucible/catalog test; pnpm --filter @crucible/catalog type-check; pnpm --filter @crucible/catalog build; git diff --check; built catalog smoke load found 132 scenarios and FedRAMP filters returned compliance-fedramp-cipher-negotiation plus compliance-fedramp-cross-tenant; diff test audit .agents/reviews/test-audit-20260527-170504.md reported no prioritized gaps.
<!-- SECTION:FINAL_SUMMARY:END -->
