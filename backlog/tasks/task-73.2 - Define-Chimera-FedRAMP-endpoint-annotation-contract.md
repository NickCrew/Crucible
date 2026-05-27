---
id: TASK-73.2
title: Define Chimera FedRAMP endpoint annotation contract
status: Done
assignee:
  - '@myself'
created_date: '2026-05-27 15:37'
updated_date: '2026-05-27 16:01'
labels:
  - documentation
  - fedramp
  - compliance
  - chimera
  - openapi
milestone: m-3
dependencies: []
references:
  - docs/development/reports/chimera-scenario-compatibility-matrix.md
documentation:
  - backlog/docs/doc-2 - FedRAMP-Support-Plan-for-Crucible-and-Chimera.md
parent_task_id: TASK-73
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create the shared contract that lets Chimera describe endpoint compliance relevance and lets Crucible connect scenario evidence to FedRAMP controls.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A documented OpenAPI extension contract exists for x-fedramp-controls, x-vulnerability-class, x-expected-defense, and x-evidence-types.
- [x] #2 A seed endpoint-control map covers the highest-value Chimera domains: auth, users, tenants, healthcare, banking, ecommerce, payments, admin/config, audit, and integrations.
- [x] #3 The compatibility-matrix guidance explains how to detect missing or stale FedRAMP mappings in addition to route mismatches.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Define the OpenAPI extension contract Chimera should expose for compliance mapping and expected secure behavior.
2. Seed a control map for the current Chimera endpoint families most relevant to AC, AU, IA, SC, SI, CM, and RA.
3. Document how Crucible scenario metadata should reference Chimera endpoint annotations.
4. Update the compatibility-matrix workflow expectations so route drift and control-map drift are both detectable.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented the shared Chimera FedRAMP OpenAPI annotation contract in Chimera docs, added Crucible consumer guidance, seeded the high-value endpoint-control map, and extended the compatibility matrix with FedRAMP control-map drift checks.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Defined the Chimera FedRAMP OpenAPI annotation contract and Crucible consumer contract. Added a seed endpoint-control map covering auth, users, tenants, healthcare, banking, ecommerce, payments, admin/config, audit, and integrations. Updated the Chimera compatibility matrix guidance to detect missing annotations, stale control/assertion/evidence mappings, and route-plus-control drift separately.
<!-- SECTION:FINAL_SUMMARY:END -->
