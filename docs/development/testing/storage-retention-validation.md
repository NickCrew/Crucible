# Step Body Storage Retention & Truncation Validation

This document documents the storage retention policies and truncation mechanisms implemented in the `ScenarioEngine` to manage database growth during heavy security assessments.

## Overview

Crucible persists the results of every scenario step to a SQLite database. For long-running assessments or scenarios with large response bodies (e.g., data exfiltration simulations), this can lead to significant disk usage. 

To mitigate this, two primary controls are available:
1. **Retention Policies:** Determine *which* step bodies are stored.
2. **Byte Truncation:** Limits the *size* of individual stored bodies.

## Configuration

These controls are configured via environment variables on the `demo-dashboard` (or engine) process:

| Variable | Values | Default | Description |
|----------|--------|---------|-------------|
| `CRUCIBLE_STEP_BODY_RETENTION` | `all`, `failed-only`, `none` | `all` | Policy for persisting response bodies. |
| `CRUCIBLE_STEP_BODY_MAX_BYTES` | Positive Integer | `65536` (64KB) | Maximum size in bytes to store per step. |

### Retention Policies

- **`all`**: Persists the response body for every step, regardless of whether it passed or failed. Best for full auditability and debugging new scenarios.
- **`failed-only`**: Only persists the response body if the step assertions failed or an error occurred. This is the recommended setting for routine automated assessments.
- **`none`**: Does not persist any response bodies. Only metadata (status, duration, assertions) is stored. Use this for extremely high-volume or performance-sensitive environments.

## Validation Results

Empirical testing using the `storage-retention.test.ts` suite proves the following storage characteristics (tested with ~1KB response bodies per step):

| Policy | Scenario Result | Storage Impact (per 3 steps) | % Reduction vs `all` |
|--------|-----------------|-------------------------------|-----------------------|
| `all` | All Pass | ~3,100 bytes | 0% |
| `failed-only` | All Pass | 0 bytes | 100% |
| `failed-only` | 1 Fail, 2 Pass | ~1,030 bytes | 67% |
| `none` | All Fail | 0 bytes | 100% |

### Truncation Impact

Byte truncation provides a "safety ceiling" for large responses. If a response exceeds the limit, it is truncated and a `truncated: true` flag is added to the step metadata.

**Example: 5KB response with 100-byte limit**
- **Original Size:** 5,120 bytes
- **Stored Size:** ~150 bytes (100 bytes of body + JSON metadata overhead)
- **Reduction:** >97%

## Operational Guidance

1. **Development/Debugging:** Use `CRUCIBLE_STEP_BODY_RETENTION=all` to ensure you can see exactly why a complex scenario is behaving unexpectedly.
2. **Production/CI:** Use `CRUCIBLE_STEP_BODY_RETENTION=failed-only`. You usually only care about the response body when something goes wrong.
3. **Storage-Constrained Environments:** Set `CRUCIBLE_STEP_BODY_MAX_BYTES` to a lower value (e.g., `4096` for 4KB). Most security-relevant evidence (error messages, small JSON tokens) fits within the first few kilobytes.
4. **Monitoring:** Regularly check the size of the `crucible.db` file. If growth is too rapid, consider moving to `failed-only` or decreasing the byte cap.

## Technical Implementation

The retention logic is encapsulated in `ScenarioEngine.buildPersistedStepResult`:

```typescript
private buildPersistedStepResult(
  response: StepHttpResponse,
  outcome: 'completed' | 'failed',
): ExecutionStepResult['result'] | undefined {
  if (this.stepBodyRetention === 'none') return undefined;
  if (this.stepBodyRetention === 'failed-only' && outcome !== 'failed') return undefined;

  // Truncation logic applies if policy allows storage...
  const truncated = originalBytes > this.stepBodyMaxBytes;
  // ...
}
```

Metadata about the retention choice is also stored in the database for every step, allowing the UI to show why a body might be missing or truncated:

```json
"retention": {
  "policy": "failed-only",
  "truncated": false,
  "contentType": "application/json",
  "originalBytes": 1024,
  "storedBytes": 1024,
  "bodyFormat": "json"
}
```
