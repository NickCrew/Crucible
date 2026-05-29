# HIPAA Functionality

Crucible models HIPAA as a technical evidence overlay on ordinary security
scenarios. HIPAA mappings do not change how a scenario runs; they add citation,
safeguard, assertion, endpoint, and evidence metadata that can be used for
discovery, assessment rollups, and machine-readable exports.

This functionality is scoped to dynamic technical evidence for HIPAA Security
Rule technical safeguards. It is not legal advice, a HIPAA compliance
certification, an audit-ready attestation, or a complete covered-entity or
business-associate assessment.

---

## What Crucible Tracks

HIPAA metadata lives under `compliance.mappings`.

| Field | Purpose |
|-------|---------|
| `framework` | `hipaa` |
| `citation` | Technical safeguard citation such as `164.312(b)` |
| `controlId` | Optional alias, normally the same as `citation` |
| `safeguard` | `access-control`, `audit-controls`, `integrity`, `person-or-entity-authentication`, or `transmission-security` |
| `assertion` | Stable assertion slug used in reports and exports |
| `rationale` | Why the scenario evidence is relevant to the citation |
| `implementationStatus` | Mapping maturity: `planned`, `partial`, `implemented`, `manual`, or `deferred` |
| `evidenceTypes` | Evidence classes such as `request-response`, `audit-log`, `auth-token`, or `config-state` |
| `endpoint` | Optional endpoint method and path |
| `evidence` | Optional step-level evidence references |

---

## Discover HIPAA Scenarios

### Web catalog

Open **/scenarios**, set **Framework** to **HIPAA**, and filter by citation or
safeguard. Search also matches HIPAA citations and safeguard names. FedRAMP
baseline and family filters are disabled while HIPAA is selected.

### REST API

```bash
curl "http://localhost:3000/api/scenarios?framework=hipaa&citation=164.312(b)&safeguard=audit-controls"
```

`controlId` and `control_id` can also match HIPAA citations. FedRAMP
baseline/family filters cannot be mixed with HIPAA citation/safeguard filters.

### TypeScript client

```typescript
const hipaaScenarios = await client.scenarios.list({
  framework: 'hipaa',
  citation: '164.312(b)',
  safeguard: 'audit-controls',
});
```

### CLI

```bash
crucible-cli scenarios --framework hipaa --citation 164.312(b) --safeguard audit-controls --show-controls
```

The `controls` column renders HIPAA mappings as `164.312(b) (audit-controls)`.

---

## Report Rollups

Assessment JSON reports include HIPAA rollups when a scenario has HIPAA mappings:

```json
{
  "compliance": {
    "frameworks": {
      "hipaa": {
        "counts": { "passed": 1, "failed": 0, "skipped": 0, "unknown": 0 },
        "families": [{ "family": "audit-controls" }],
        "controls": [
          {
            "framework": "hipaa",
            "citation": "164.312(b)",
            "safeguard": "audit-controls",
            "status": "passed",
            "assertion": "phi-export-remains-auditable"
          }
        ]
      }
    }
  }
}
```

HTML reports render the HIPAA framework card with citation, status, assertion,
endpoint, and evidence summaries. OSCAL-shaped exports remain FedRAMP-only.

---

## HIPAA Evidence Export

Every assessment report also writes a HIPAA technical evidence JSON file:

```bash
curl -o hipaa-evidence.json \
  "http://localhost:3000/api/reports/abc123/hipaa"

curl -o hipaa-evidence.json \
  "http://localhost:3000/api/reports/abc123?format=hipaa-evidence.json"

crucible-cli reports abc123 --download hipaa -o hipaa-evidence.json
```

```typescript
const response = await client.reports.hipaa('abc123');
```

The export contains assessment metadata, scenario metadata, HIPAA citations,
assertion outcomes, endpoint references, evidence references, and limitations.
It intentionally excludes administrative, physical, policy, workforce,
contractual, and risk-management claims.
