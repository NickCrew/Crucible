---
id: doc-2
title: FedRAMP Support Plan for Crucible and Chimera
type: specification
created_date: '2026-05-27 15:35'
updated_date: '2026-05-27 15:36'
tags:
  - fedramp
  - compliance
  - chimera
  - planning
---
# FedRAMP Support Plan for Crucible and Chimera

## Intent

Add broad FedRAMP support as a control-mapped assessment layer across Crucible and Chimera. FedRAMP should not become a replacement for technical scenario categories such as IDOR, SSRF, SQL Injection, Broken Authentication, or Business Logic. Instead, FedRAMP metadata should describe why a technical scenario matters for federal cloud authorization evidence, which controls are exercised, and what evidence was collected.

## Current Repo Baseline

- Crucible already has `Compliance` scenarios and two `compliance-fedramp-*` scenario files.
- Chimera-oriented coverage is currently expressed through scenario IDs and tags such as `chimera-*`, `api-demo-*`, and `chimera`.
- The existing compatibility matrix treats Chimera compatibility as target-family and endpoint-route evidence, not as compliance evidence.
- Reports include scenario category, rule IDs, step results, and status, but do not yet aggregate by compliance framework or control family.

## External Reference Baseline

Use official FedRAMP sources as the source of truth, not vendor summaries. As of 2026-05-27:

- FedRAMP Rev. 5 baselines align with NIST SP 800-53 Rev. 5 and SP 800-53B.
- Official FedRAMP guidance and templates are maintained on FedRAMP.gov.
- FedRAMP has active 2026 RFC activity around Rev5 baseline updates, continuous monitoring, machine-readable packages, and control-family guidance, so the implementation should assume control mappings can change.
- OSCAL-oriented outputs should be treated as a compatibility goal, with full conformance deferred until the scenario evidence model is stable.

References:

- https://www.fedramp.gov/archive/2023-05-30-rev-5-baselines-have-been-approved-and-released/
- https://help.fedramp.gov/hc/en-us/articles/27700580569499-Where-are-FedRAMP-guidance-documents-and-templates-maintained-How-is-the-FedRAMP-community-notified-of-new-documents-posted-for-public-comment
- https://www.fedramp.gov/rfcs/
- https://automate.fedramp.gov/

## Product Shape

### Crucible responsibilities

Crucible should be the assessment harness and evidence package generator:

- Add first-class compliance metadata to scenarios: framework, baseline, control ID, control family, evidence type, assertion rationale, and implementation status.
- Preserve the existing technical `category` field and use FedRAMP as a framework/control overlay.
- Validate control metadata in `@crucible/catalog` so invalid framework names, malformed control IDs, or orphan evidence mappings fail early.
- Let CLI and web users filter scenarios by framework, baseline, control family, and control ID.
- Score and summarize assessments by control, control family, framework, and scenario.
- Export control-mapped assessment evidence in JSON and human-readable report formats, with an OSCAL-shaped export path after the internal model settles.

### Chimera responsibilities

Chimera should act as the intentionally vulnerable federal-SaaS target surface:

- Annotate endpoints with compliance relevance, vulnerability class, expected secure behavior, seeded roles/tenants, and evidence expectations.
- Provide realistic federal SaaS failure modes: tenant isolation, RBAC/ABAC failures, audit suppression, weak crypto posture, session/token weakness, insecure configuration changes, incident logging gaps, data retention/export failures, and service-to-service trust abuse.
- Keep endpoint annotations machine-readable, ideally through OpenAPI extensions such as `x-fedramp-controls`, `x-vulnerability-class`, `x-expected-defense`, and `x-evidence-types`.
- Provide seeded users, tenants, roles, and test fixtures that let Crucible prove both exploitability and expected isolation boundaries.

### Shared contract

The durable integration point should be a contract between scenario metadata and Chimera endpoint metadata:

- Chimera endpoint annotations identify possible controls and expected secure behavior.
- Crucible scenario metadata chooses which control assertions it is testing.
- Reports link scenario result, endpoint, request/response evidence, assertion result, and FedRAMP control mapping.
- Compatibility tooling detects drift between scenario URLs, Chimera OpenAPI paths, and control mappings.

## Initial Control Families To Support

Prioritize controls that map naturally to endpoint-level dynamic tests:

- `AC`: access control, tenant isolation, role enforcement, least privilege.
- `AU`: audit event creation, audit tamper resistance, traceability.
- `IA`: authentication, token/session handling, identity assertions.
- `SC`: boundary protection, TLS/cipher posture, service-to-service trust, SSRF boundaries.
- `SI`: vulnerability detection, malformed input handling, monitoring signals.
- `CM`: unauthorized configuration changes and drift detection.
- `RA`: vulnerability/risk assessment evidence from scenario and runner results.

Avoid pretending Crucible can fully assess policy/process-heavy control families without external evidence. Those can be represented as references or manual evidence requirements later.

## Delivery Sequence

1. Define the metadata model and validation rules in Crucible.
2. Define the Chimera endpoint annotation contract and create a seed control map.
3. Build the first Chimera FedRAMP scenario pack across the priority control families.
4. Add control-aware reporting and scoring in CLI, API, and web reports.
5. Add framework/control filters and compatibility checks so operators can select and validate the FedRAMP pack.
6. Add JSON evidence export with an OSCAL-compatible structure; iterate toward formal OSCAL only after report semantics stabilize.

## Open Decisions

- Which baseline names should be first-class: Low, Moderate, High, Li-SaaS, or a generic Rev5 baseline field?
- Should control mappings live directly in scenario JSON, a shared controls catalog, or both?
- Should Chimera OpenAPI annotations be imported into Crucible at build time, referenced at runtime, or kept as generated documentation?
- How strict should report language be about assessment evidence versus authorization-ready evidence?
- How much of FedRAMP 20x should be included in the first pass versus staying focused on Rev5 control mapping?
