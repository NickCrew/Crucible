---
id: TASK-74.1
title: Generalize compliance metadata schema for HIPAA
status: Done
assignee:
  - '@codex'
created_date: '2026-05-29 00:55'
updated_date: '2026-05-29 01:27'
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
- [x] #1 ScenarioComplianceSchema accepts both FedRAMP and HIPAA mappings with framework-specific validation.
- [x] #2 FedRAMP mappings, helper filters, scenario loading, and existing tests continue to pass without schema loosening.
- [x] #3 HIPAA mappings can express 164.312 technical safeguard citations and evidence references without a FedRAMP baseline.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Extract shared compliance evidence fields from the FedRAMP mapping shape.
2. Add a HIPAA mapping schema with citation/control ID, safeguard area, assertion, rationale, implementation status, endpoint, and evidence references.
3. Update exported client/catalog types and helper predicates so framework-specific behavior stays explicit.
4. Add schema and validator tests covering valid HIPAA mappings, invalid citations, and FedRAMP regression cases.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented shared compliance framework support for HIPAA alongside FedRAMP. Added HIPAA citation/safeguard schemas, HIPAA mapping exports, client list params for citation/safeguard, and focused model/client tests. Independent review used Gemini fallback after Claude contract output failed; remediated the P1 citation-regex issue plus audit-requested negative/fallback coverage.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added HIPAA compliance metadata support without changing existing FedRAMP behavior.

Changes:
- Extended catalog compliance schema/types to accept `framework: hipaa` mappings with 164.312 citation validation, safeguards, endpoint references, evidence references, and optional `controlId` fallback.
- Exported HIPAA schemas/types through catalog and client entrypoints.
- Added client query serialization for `citation` and `safeguard`.
- Added tests for HIPAA mapping validation, citation boundaries, endpoint/evidence refs, cross-framework filter rejection, and client query params.

Verification:
- `pnpm --filter @crucible/catalog test -- src/models/__tests__/types.test.ts`
- `pnpm --filter @crucible/catalog type-check`
- `pnpm --filter @atlascrew/crucible-client test -- src/client.test.ts`
- `pnpm --filter @atlascrew/crucible-client type-check`
- `git diff --check`

Review:
- Independent review/audit via agent-loops provider scripts; Claude output failed contract, Gemini fallback produced usable artifacts. P1/P2 findings were remediated before closeout.
<!-- SECTION:FINAL_SUMMARY:END -->
