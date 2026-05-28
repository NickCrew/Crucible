# FedRAMP Functionality

Crucible can model FedRAMP as a compliance overlay on top of ordinary technical
security scenarios. A scenario can keep a technical category such as IDOR,
authentication, service boundary, configuration, or audit behavior while also
declaring the FedRAMP controls, assertions, endpoints, and evidence types it
exercises.

This functionality is intended for dynamic assessment evidence: request/response
checks, assertion outcomes, endpoint references, control rollups, and report
exports from Crucible runs. It is not a complete FedRAMP authorization package,
SSP, POA&M workflow, inventory, 3PAO attestation, or formal OSCAL conformance
claim.

---

## What Crucible Tracks

FedRAMP metadata lives on scenarios under `compliance.mappings`. Each mapping
describes one control assertion that a run can exercise.

| Field | Purpose |
|-------|---------|
| `framework` | Currently `fedramp` |
| `revision` | FedRAMP control revision, currently `rev5` |
| `baseline` | `low`, `moderate`, `high`, or `li-saas` |
| `family` | Control family such as `AC`, `AU`, `IA`, `SC`, `SI`, `CM`, or `RA` |
| `controlId` | Specific control ID, such as `AC-3` |
| `assertion` | Stable assertion slug used in reports and findings |
| `rationale` | Why the scenario evidence is relevant to that control |
| `implementationStatus` | Mapping maturity: `planned`, `partial`, `implemented`, `manual`, or `deferred` |
| `evidenceTypes` | Evidence classes such as `request-response`, `audit-log`, `tenant-fixture`, or `runner-artifact` |
| `endpoint` | Optional endpoint reference with method, path, and assertion slug |
| `evidence` | Optional step-level evidence references |

The initial Chimera pack includes runnable FedRAMP-oriented scenarios for these
families:

| Family | Example evidence focus |
|--------|------------------------|
| `AC` | Cross-tenant access control and authorization boundaries |
| `AU` | Audit event generation and suppression attempts |
| `IA` | Authenticator and identity boundary checks |
| `SC` | Service communication and trust boundaries |
| `SI` | Defense metrics, monitoring, and integrity signals |
| `CM` | Security configuration change behavior |
| `RA` | Risk finding and exposure evidence |

---

## Discover FedRAMP Scenarios

### Web catalog

Open **/scenarios** and use the catalog filters:

| Filter | What it matches |
|--------|-----------------|
| **Framework** | Select **FedRAMP** to show mapped scenarios |
| **Baseline** | Narrow to `low`, `moderate`, `high`, or `li-saas` |
| **Family** | Narrow by control family, such as `AC` or `SC` |
| **Control ID** | Narrow by a specific control, such as `AC-3` |
| **Category** | Still filters by the technical scenario category |

The search box also matches FedRAMP control IDs, families, and baselines. Scenario
cards show FedRAMP control badges when mappings are present.

### REST API

`GET /api/scenarios` accepts FedRAMP discovery filters:

```bash
curl "http://localhost:3000/api/scenarios?framework=fedramp&baseline=moderate&family=AC&controlId=AC-3"
```

`control_id` is also accepted as an alias for `controlId` at the API boundary.

### TypeScript client

```typescript
import { CrucibleClient } from '@atlascrew/crucible-client';

const client = new CrucibleClient({ baseUrl: 'http://localhost:3000' });

const fedrampScenarios = await client.scenarios.list({
  framework: 'fedramp',
  baseline: 'moderate',
  family: 'AC',
  controlId: 'AC-3',
});
```

### CLI

```bash
crucible-cli scenarios --framework fedramp --baseline moderate --family AC --control-id AC-3 --show-controls
```

When a FedRAMP filter is active, the table includes a `controls` column. Use
`--show-controls` to include that column without filtering.

---

## Run FedRAMP-Mapped Assessments

FedRAMP mappings do not change how scenarios execute. They add compliance context
to the scenario result and report output.

```bash
crucible-cli assess chimera-fedramp-ac-tenant-project-isolation --fail-below 90
```

For mapped scenarios, table output includes a concise FedRAMP summary after the
assessment verdict:

```text
FedRAMP controls:
  chimera-fedramp-ac-tenant-project-isolation: AC (AC-3)
```

JSON output includes the same scenario-level control information so CI pipelines
can route or label results by control family.

---

## Report Rollups

Assessment JSON reports include FedRAMP rollups when the scenario has compliance
mappings:

```json
{
  "compliance": {
    "frameworks": {
      "fedramp": {
        "counts": {
          "passed": 1,
          "failed": 0,
          "skipped": 0,
          "unknown": 0
        },
        "families": [
          {
            "family": "AC",
            "counts": {
              "passed": 1,
              "failed": 0,
              "skipped": 0,
              "unknown": 0
            }
          }
        ],
        "controls": [
          {
            "controlId": "AC-3",
            "status": "passed",
            "assertion": "tenant-project-access-is-enforced"
          }
        ]
      }
    }
  }
}
```

Control status is derived from mapped evidence:

| Status | Meaning |
|--------|---------|
| `passed` | All mapped evidence ran and assertions passed |
| `failed` | Any mapped evidence failed or any mapped assertion failed |
| `skipped` | Evidence was skipped or cancelled without a failure |
| `unknown` | Evidence was not run yet, is pending/running/paused, or no evidence exists |

HTML reports render the FedRAMP family/control summary alongside the assessment
summary, including each mapped control's status, assertion slug, and endpoint
evidence when present.

---

## OSCAL-Shaped Evidence Export

Crucible writes an OSCAL-shaped JSON export for each assessment report. Download
it through the REST API, TypeScript client, or CLI:

```bash
# REST
curl -o fedramp-evidence.oscal.json \
  "http://localhost:3000/api/reports/abc123/oscal"

# Query form
curl -o fedramp-evidence.oscal.json \
  "http://localhost:3000/api/reports/abc123?format=oscal.json"

# CLI
crucible-cli reports abc123 --download oscal -o fedramp-evidence.oscal.json
```

```typescript
const response = await client.reports.oscal('abc123');
const evidencePackage = await response.json();
```

The export includes:

- Assessment metadata and target URL
- FedRAMP control selections
- Scenario assertion outcomes
- Observation IDs and finding IDs
- Evidence references back to Crucible steps
- Scope limitations for FedRAMP/OSCAL use

The export is intentionally named OSCAL-shaped. It is structured for evidence
interchange and future mapping, but Crucible does not claim it is a complete
FedRAMP OSCAL assessment result package.

---

## Related Documentation

- [Running Scenarios](running-scenarios.md)
- [Remote CLI](cli.md)
- [API Client Library](api-client.md)
- [REST API Reference](../reference/rest-api.md)
- [Chimera FedRAMP Contract](../development/contracts/chimera-fedramp-openapi-extensions.md)
