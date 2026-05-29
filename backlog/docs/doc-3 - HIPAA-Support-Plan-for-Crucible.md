---
id: doc-3
title: HIPAA Support Plan for Crucible
type: specification
created_date: '2026-05-29 00:54'
updated_date: '2026-05-29 00:54'
tags:
  - hipaa
  - compliance
  - security-rule
---
# HIPAA Support Plan for Crucible

## Decision

Model HIPAA as a compliance evidence overlay, not as a replacement for technical scenario categories. Crucible should produce dynamic technical evidence mapped to HIPAA Security Rule citations, while explicitly avoiding claims that it produces a complete HIPAA compliance determination, legal assessment, risk analysis, audit package, or covered-entity/business-associate attestation.

This mirrors the FedRAMP direction in doc-2: scenarios keep their technical meaning, and compliance metadata adds framework-specific control context, evidence references, report rollups, and export formats.

## Source Anchors

- HHS Security Rule overview: https://www.hhs.gov/hipaa/for-professionals/security/index.html
- HHS HIPAA Security Rule NPRM overview: https://www.hhs.gov/hipaa/for-professionals/security/hipaa-security-rule-nprm/index.html
- HHS HIPAA Audit Protocol: https://www.hhs.gov/hipaa/for-professionals/compliance-enforcement/audit/protocol/index.html

As of this plan, HHS frames the Security Rule around administrative, physical, and technical safeguards for ePHI. The current implementation should start with technical safeguards under 45 CFR 164.312 because those map best to Crucible request/response, assertion, audit, identity, and transport evidence.

## Initial HIPAA Scope

| Area | Citation | Crucible evidence fit |
|------|----------|-----------------------|
| Access Control | 164.312(a)(1) | role boundaries, minimum necessary access, emergency access behavior, patient export filtering |
| Audit Controls | 164.312(b) | audit event generation, audit suppression attempts, skipped audit paths |
| Integrity | 164.312(c)(1) | PHI tamper or improper alteration detection |
| Person or Entity Authentication | 164.312(d) | stale key use, identity verification, weak service identity checks |
| Transmission Security | 164.312(e)(1), 164.312(e)(2) | ePHI transport protection, downgrade probes, transmission integrity evidence |

## Existing Repo Starting Point

- `packages/catalog/src/models/regulations.ts` already defines HIPAA controls for `164.312(a)(1)`, `164.312(b)`, `164.312(c)(1)`, and `164.312(e)(1)`.
- Existing HIPAA scenarios live in both `packages/catalog/scenarios/` and `packages/crucible/scenarios/`:
  - `compliance-hipaa-audit-suppression.json`
  - `compliance-hipaa-emergency-access.json`
  - `compliance-hipaa-minimum-necessary.json`
  - `compliance-hipaa-patient-export.json`
- Current typed compliance mappings only accept `framework: fedramp`, so HIPAA starts with schema generalization rather than copied FedRAMP-specific fields.
- `docs/development/reports/chimera-scenario-compatibility-matrix.md` already marks several HIPAA scenarios against Chimera-style endpoint compatibility; use it to decide whether this remains Crucible-only or needs Chimera endpoint/fixture follow-up.

## Delivery Phases

### Phase 0: Shared Compliance Foundation

Generalize `ScenarioComplianceSchema` so it can represent multiple frameworks while preserving FedRAMP behavior. HIPAA mappings should reuse shared fields such as `framework`, `controlId`, `assertion`, `rationale`, `implementationStatus`, `endpoint`, and `evidence`, but should not inherit FedRAMP-only fields such as `baseline`.

### Phase 1: Initial HIPAA Mapping Pack

Annotate the existing HIPAA scenarios with typed `compliance.mappings`. Keep `rule_ids` during the transition if still useful for legacy registry lookups, but make typed mappings the source for filtering, reports, and exports.

### Phase 2: Discovery and API Surface

Extend scenario discovery filters to handle `framework=hipaa` and HIPAA citations/control IDs. Preserve FedRAMP filters and avoid forcing HIPAA into baseline/family semantics.

### Phase 3: Report Rollups

Extend assessment reports from FedRAMP-only rollups to framework-generic compliance rollups. HIPAA report output should show safeguard/citation status, assertion slug, endpoint, and evidence references.

### Phase 4: HIPAA Evidence Export

Add a HIPAA technical evidence JSON export after report semantics stabilize. Name it as HIPAA-shaped technical evidence, not OSCAL, unless a later task explicitly designs an OSCAL mapping.

### Phase 5: GitHub Pages Documentation

Publish a user-facing HIPAA Functionality guide paralleling the FedRAMP guide: scope, limitations, metadata fields, discovery filters, CLI/API examples, report rollups, and evidence export.

### Phase 6: Chimera Endpoint and Fixture Gap Closure

If the first HIPAA pack needs deterministic healthcare data or endpoint behavior in Chimera, track that work from this Crucible backlog so cross-repo agents can pick it up without losing context.

## First Usable Milestone

The first usable milestone is: schema supports HIPAA, the four existing HIPAA scenarios have typed mappings, scenario discovery can filter `framework=hipaa`, and reports expose HIPAA rollups for those scenarios. Evidence export and public docs can follow after that slice is stable.

## Non-Goals

- Do not claim HIPAA compliance, legal advice, audit readiness, or covered-entity/business-associate compliance.
- Do not model administrative or physical safeguards until a separate task defines evidence that Crucible can actually collect.
- Do not make HIPAA reuse FedRAMP `baseline`, FedRAMP control-family enums, or OSCAL naming by default.
- Do not replace technical scenario categories with `Compliance` for all future HIPAA work; use compliance metadata as the overlay.

## Proposed Task Sequence

1. `TASK-74.1`: Generalize compliance metadata schema for HIPAA without regressing FedRAMP.
2. `TASK-74.2`: Annotate existing HIPAA scenarios with typed compliance mappings.
3. `TASK-74.3`: Add HIPAA-aware scenario discovery filters in API, client, CLI, and web UI.
4. `TASK-74.4`: Add HIPAA-aware report rollups.
5. `TASK-74.5`: Add HIPAA technical evidence JSON export.
6. `TASK-74.6`: Publish HIPAA Functionality on the GitHub Pages site.
7. `TASK-74.7`: Validate or fill Chimera HIPAA endpoint and fixture gaps.
