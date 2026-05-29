---
id: TASK-74.1
title: Generalize compliance metadata schema for HIPAA
status: To Do
assignee: []
created_date: '2026-05-29 00:55'
labels:
  - feature
  - hipaa
  - compliance
  - schema
dependencies: []
references:
  - packages/catalog/src/models/types.ts
  - apps/client/src/types.ts
  - packages/catalog/src/models/regulations.ts
documentation:
  - backlog/docs/doc-3 - HIPAA-Support-Plan-for-Crucible.md
parent_task_id: TASK-74
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Extend the shared scenario compliance model so Crucible can represent HIPAA mappings alongside FedRAMP mappings without regressing existing FedRAMP scenarios, filters, reports, or client types.

HIPAA mappings should reuse shared evidence fields and add HIPAA-appropriate fields such as citation/safeguard rather than inheriting FedRAMP baseline semantics.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 ScenarioComplianceSchema accepts both FedRAMP and HIPAA mappings with framework-specific validation.
- [ ] #2 FedRAMP mappings, helper filters, scenario loading, and existing tests continue to pass without schema loosening.
- [ ] #3 HIPAA mappings can express 164.312 technical safeguard citations and evidence references without a FedRAMP baseline.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Extract shared compliance evidence fields from the FedRAMP mapping shape.
2. Add a HIPAA mapping schema with citation/control ID, safeguard area, assertion, rationale, implementation status, endpoint, and evidence references.
3. Update exported client/catalog types and helper predicates so framework-specific behavior stays explicit.
4. Add schema and validator tests covering valid HIPAA mappings, invalid citations, and FedRAMP regression cases.
<!-- SECTION:PLAN:END -->
