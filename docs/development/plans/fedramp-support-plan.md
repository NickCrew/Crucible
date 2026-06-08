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

## Formal Delivery Sequence

### Phase 0: Alignment and contract

Goal: make the model explicit before adding broad endpoint or report behavior.

Tasks:

- `TASK-73.1`: Define FedRAMP control metadata schema and validators.
- `TASK-73.2`: Define Chimera FedRAMP endpoint annotation contract.

Exit criteria:

- Scenario metadata can represent FedRAMP mappings without replacing technical categories.
- Chimera has a documented OpenAPI extension contract that Crucible can consume.
- Official FedRAMP.gov guidance has been re-checked before encoding baseline/control assumptions.

### Phase 1: Chimera evidence substrate

Goal: give Crucible a stable, annotated target surface for the first assessment slice.

Tasks:

- `TASK-73.7`: Annotate FedRAMP controls in Chimera OpenAPI endpoint metadata.
- `TASK-73.8`: Add deterministic FedRAMP demo tenants, roles, and resources.
- `TASK-73.10`: Add FedRAMP annotation validation and drift checks.

Exit criteria:

- The first annotated endpoint slice covers auth, SaaS tenancy, admin/audit, healthcare, banking, ecommerce, payments, compliance, and integrations.
- Seeded fixture IDs are stable enough for scenario JSON.
- Annotation validation can catch missing extension fields, malformed control IDs, and stale OpenAPI paths.

### Phase 2: Endpoint behavior gap closure

Goal: close only the endpoint behavior gaps needed for the initial FedRAMP pack.

Tasks:

- `TASK-73.9`: Fill FedRAMP-relevant endpoint behavior gaps.

Exit criteria:

- Required AC, AU, IA, SC, SI, CM, and RA endpoint behaviors are implemented or explicitly deferred.
- New/changed Chimera behavior has docs, OpenAPI entries, and tests.
- Strict/secure-mode comparison behavior exists where it improves assessment evidence.

### Phase 3: Thin vertical slice

Goal: prove the end-to-end model with a small runnable pack before expanding reporting and export surfaces.

Tasks:

- `TASK-73.3`: Build initial Chimera FedRAMP scenario pack.
- `TASK-73.5`: Add framework and control filters to scenario discovery. This can proceed after `TASK-73.1` and run partly in parallel with scenario-pack work.

Exit criteria:

- At least one runnable Chimera scenario exists for each initial family: AC, AU, IA, SC, SI, CM, and RA.
- Operators can discover FedRAMP-mapped scenarios by framework, baseline, family, and control ID.
- Catalog validation and Chimera compatibility checks pass for the pack.

### Phase 4: Assessment reporting

Goal: make the evidence understandable to security and compliance readers.

Tasks:

- `TASK-73.4`: Add FedRAMP-aware assessment scoring and reports.

Exit criteria:

- JSON and human-readable reports summarize pass/fail/skipped/unknown by framework, baseline, control family, and control ID.
- Report rows link back to scenario steps, endpoints, assertions, and evidence references.
- Reports avoid claiming full authorization-package status.

### Phase 5: Evidence export and OSCAL-shaped output

Goal: produce machine-readable evidence after internal report semantics are stable.

Tasks:

- `TASK-73.6`: Add FedRAMP evidence export with OSCAL-shaped JSON.

Exit criteria:

- The export shape includes assessment metadata, target, scenario mappings, control rollups, assertion outcomes, artifacts, and evidence references.
- OSCAL-shaped output is clearly labeled as compatibility-oriented unless/until formal conformance is validated.
- Documentation states scope and limitations relative to official FedRAMP artifacts.

## Critical Path

The main blocking chain is:

`TASK-73.2 -> TASK-73.7 -> TASK-73.10 -> TASK-73.9 -> TASK-73.3 -> TASK-73.4 -> TASK-73.6`

`TASK-73.8` can run in parallel after `TASK-73.2`, but it must complete before `TASK-73.9` and `TASK-73.3` can be treated as stable. `TASK-73.1` is also required before `TASK-73.3`, `TASK-73.4`, and `TASK-73.5`; for `TASK-73.4`, that requirement is satisfied transitively through the scenario pack.

## First Usable Milestone

A useful first milestone is Phase 0 through Phase 3:

- Metadata schema and validators exist.
- Chimera has a documented annotation contract, a small annotated endpoint slice, deterministic fixtures, and validation tooling.
- Crucible has 3-7 runnable FedRAMP-mapped Chimera scenarios and basic framework/control discovery.

This should prove the product model without overcommitting to broad endpoint coverage, polished assessor-facing reports, or formal OSCAL conformance.

## Full Epic Effort

Expected level of effort for the full epic is XL:

- First usable milestone: about 2-3 engineering weeks.
- Useful first full version: about 4-7 engineering weeks.
- Broader endpoint coverage plus polished assessor-facing export/reporting: about 8-12+ engineering weeks.

## Open Decisions

- Which baseline names should be first-class: Low, Moderate, High, Li-SaaS, or a generic Rev5 baseline field?
- Should control mappings live directly in scenario JSON, a shared controls catalog, or both?
- Should Chimera OpenAPI annotations be imported into Crucible at build time, referenced at runtime, or kept as generated documentation?
- How strict should report language be about assessment evidence versus authorization-ready evidence?
- How much of FedRAMP 20x should be included in the first pass versus staying focused on Rev5 control mapping?
