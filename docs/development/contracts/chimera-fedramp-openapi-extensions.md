# Chimera FedRAMP OpenAPI Extension Contract

This contract defines how Crucible should consume Chimera's FedRAMP-oriented
OpenAPI annotations. The authoritative producer-side contract lives in Chimera at
`docs/fedramp-openapi-extensions.md`; this document records Crucible's consumer
expectations so scenario metadata, compatibility checks, and report generation can
share the same integration shape.

FedRAMP remains a framework overlay. Crucible scenario `category` values should
continue to describe the technical attack or behavior, while compliance metadata
describes the control assertion and evidence relevance.

## Required Chimera Extensions

Crucible should treat an OpenAPI operation as FedRAMP-addressable only when all
of these operation-level extensions are present:

| Extension | Consumer expectation |
| --- | --- |
| `x-fedramp-controls` | Array of `{ framework, revision, baselines, family, controlId, assertion, role, rationale }` objects. |
| `x-vulnerability-class` | Lower-kebab-case technical failure class, such as `idor`, `auth-bypass`, or `audit-suppression`. |
| `x-expected-defense` | Object describing strict-mode or external expected secure behavior. |
| `x-evidence-types` | Array of evidence artifact classes Crucible can collect or reference. |

`x-fedramp-controls[].framework` must be `fedramp`, `revision` must start as
`rev5`, `family` must match the `controlId` prefix, and `baselines` must use
`low`, `moderate`, `high`, or `li-saas`.

## Scenario Reference Shape

Scenarios should reference the OpenAPI operation and the assertion slug selected
from that operation:

```json
{
  "target": {
    "family": "chimera",
    "endpoint": {
      "method": "GET",
      "path": "/api/v1/saas/tenants/{tenant_id}/projects",
      "fedrampAssertion": "tenant-project-access-is-enforced"
    }
  },
  "compliance": {
    "framework": "fedramp",
    "revision": "rev5",
    "baseline": "moderate",
    "controlId": "AC-3",
    "family": "AC",
    "evidenceTypes": ["request-response", "audit-log", "tenant-fixture"]
  }
}
```

The scenario-level `compliance` block chooses the assessment assertion. Chimera's
OpenAPI extensions advertise what an endpoint can support; they do not replace the
scenario assertion, runner result, or report rollup.

## Seed Endpoint-Control Map

The first Chimera annotation slice should cover these endpoint families before
broader route coverage:

| Domain | Method | Chimera OpenAPI path | Primary controls |
| --- | --- | --- | --- |
| auth | `POST` | `/api/v1/auth/login` | `IA-2`, `IA-5`, `AC-7`, `AU-2` |
| auth | `POST` | `/api/v1/auth/verify-mfa` | `IA-2`, `IA-2(1)`, `IA-5`, `AU-2` |
| users | `GET` | `/api/v1/users/profile` | `AC-3`, `AC-6`, `IA-4`, `AU-2` |
| tenants | `GET` | `/api/v1/saas/tenants/{tenant_id}/projects` | `AC-3`, `AC-4`, `AC-6`, `AU-2` |
| healthcare | `GET` | `/api/v1/healthcare/records/{record_id}` | `AC-3`, `AU-2`, `SI-10`, `RA-5` |
| banking | `GET` | `/api/v1/banking/accounts/{account_id}` | `AC-3`, `AC-6`, `AU-2`, `RA-5` |
| ecommerce | `POST` | `/api/v1/ecommerce/checkout/submit` | `AC-3`, `CM-5`, `SI-10`, `AU-2` |
| payments | `POST` | `/api/v1/payments/capture` | `AC-3`, `SC-13`, `SI-10`, `AU-2` |
| admin/config | `GET` | `/api/v1/admin/security-config` | `CM-2`, `CM-3`, `CM-6`, `AC-6`, `AU-2` |
| audit | `POST` | `/api/v1/admin/audit/suspend` | `AU-2`, `AU-6`, `AU-9`, `AC-6`, `CM-5` |
| integrations | `POST` | `/api/v1/integrations/ws/simulate-frame` | `SC-7`, `SC-8`, `AC-4`, `SI-10` |

These mappings are endpoint-level dynamic-test relevance markers. Crucible should
not report them as full FedRAMP control satisfaction.

## Compatibility Checks

Scenario compatibility tooling should add control-map drift checks alongside route
matching:

- Normalize scenario request URLs and OpenAPI paths using the existing route
  comparison rules.
- For each scenario FedRAMP endpoint reference, require a matching OpenAPI
  operation with `x-fedramp-controls`.
- Require the referenced `fedrampAssertion` to appear in that operation's
  `x-fedramp-controls[].assertion` values.
- Require the scenario `controlId` to appear in that operation's
  `x-fedramp-controls[].controlId` values.
- Report missing annotations separately from missing routes so path drift and
  control-map drift stay actionable.
- Flag operations that use FedRAMP extensions but omit `x-vulnerability-class`,
  `x-expected-defense`, or `x-evidence-types`.

## Source Baseline

Official FedRAMP sources remain the source of truth for control semantics and
machine-readable package direction. As of 2026-05-27, the contract intentionally
stays at endpoint evidence relevance rather than claiming OSCAL or authorization
package conformance.

References:

- FedRAMP Rev. 5 baselines: https://www.fedramp.gov/archive/2023-05-30-rev-5-baselines-have-been-approved-and-released/
- FedRAMP Rev5 machine-readable packages RFC: https://www.fedramp.gov/rfcs/0024/
- FedRAMP machine-readable package outcome notice: https://www.fedramp.gov/notices/0009/
