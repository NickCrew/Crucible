---
id: TASK-74.5
title: Add HIPAA technical evidence JSON export
status: Done
assignee:
  - '@codex'
created_date: '2026-05-29 00:55'
updated_date: '2026-05-29 02:22'
labels:
  - feature
  - hipaa
  - compliance
  - export
dependencies:
  - TASK-74.4
references:
  - apps/demo-dashboard/src/server/reports.ts
  - apps/demo-dashboard/src/server/backend.ts
  - apps/client/src/client.ts
  - apps/cli/src/commands/reports.ts
documentation:
  - backlog/docs/doc-3 - HIPAA-Support-Plan-for-Crucible.md
parent_task_id: TASK-74
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add a machine-readable HIPAA technical evidence export after HIPAA report rollups stabilize. The export should package dynamic Crucible evidence for HIPAA-mapped scenarios while clearly avoiding claims of legal compliance, audit readiness, or complete HIPAA assessment coverage.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Reports include a HIPAA evidence export path for HIPAA-mapped assessments.
- [x] #2 REST API, TypeScript client, and CLI can download the HIPAA evidence JSON export.
- [x] #3 Export payload includes assessment metadata, HIPAA citations, assertion outcomes, evidence references, and explicit limitations.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Design a HIPAA-shaped evidence JSON payload derived from report rollups.
2. Add report file generation and download routes without reusing OSCAL naming.
3. Add client and CLI download support with stable default filenames.
4. Add tests for payload shape, limitations text, and download behavior.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Added a HIPAA technical evidence JSON artifact generated from assessment report rollups, exposed via report query format and /reports/:id/hipaa route, and wired TypeScript client plus CLI download support with stable hipaa-evidence.json filenames.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
HIPAA-mapped assessments now generate a machine-readable hipaa-evidence.json export with assessment metadata, citations, safeguards, assertion outcomes, evidence references, and explicit non-compliance/legal limitations. Client and CLI downloads are covered by focused tests.
<!-- SECTION:FINAL_SUMMARY:END -->
