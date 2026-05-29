import { z } from 'zod';

// ── HTTP Request ────────────────────────────────────────────────────

export const HttpMethodSchema = z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']);

export type HttpMethod = z.infer<typeof HttpMethodSchema>;

export const RequestSchema = z.object({
  method: HttpMethodSchema,
  url: z.string(),
  headers: z.record(z.string()).optional(),
  body: z.union([z.string(), z.record(z.unknown()), z.array(z.unknown())]).optional(),
  params: z.record(z.string()).optional(),
});

export type Request = z.infer<typeof RequestSchema>;

// ── Execution Config ────────────────────────────────────────────────

export const ExecutionConfigSchema = z.object({
  delayMs: z.number().optional(),
  retries: z.number().int().min(0).optional(),
  jitter: z.number().min(0).optional(),
  iterations: z.number().int().min(1).optional(),
});

export type ExecutionConfig = z.infer<typeof ExecutionConfigSchema>;

// ── Assertions ──────────────────────────────────────────────────────

export const ExpectSchema = z.object({
  status: z.number().int().optional(),
  blocked: z.boolean().optional(),
  blockedOverridableInSimulation: z.boolean().optional(),
  bodyContains: z.string().optional(),
  bodyNotContains: z.string().optional(),
  headerPresent: z.string().optional(),
  headerEquals: z.record(z.string()).optional(),
});

export type Expect = z.infer<typeof ExpectSchema>;

// ── Variable Extraction ─────────────────────────────────────────────

export const ExtractRuleSchema = z.object({
  from: z.enum(['body', 'header', 'status']),
  path: z.string().optional(),
});

export type ExtractRule = z.infer<typeof ExtractRuleSchema>;

export const ExtractSchema = z.record(ExtractRuleSchema);

export type Extract = z.infer<typeof ExtractSchema>;

// ── Conditional Execution ───────────────────────────────────────────

export const WhenConditionSchema = z.object({
  step: z.string(),
  succeeded: z.boolean().optional(),
  status: z.number().int().optional(),
});

export type WhenCondition = z.infer<typeof WhenConditionSchema>;

export const StepExecutionModeSchema = z.enum(['sequential', 'parallel']);

export type StepExecutionMode = z.infer<typeof StepExecutionModeSchema>;

export const ScenarioStepTypeSchema = z.enum(['http', 'k6', 'nuclei']);

export type ScenarioStepType = z.infer<typeof ScenarioStepTypeSchema>;

export const ScenarioRunnerTypeSchema = z.enum(['k6', 'nuclei']);

export type ScenarioRunnerType = z.infer<typeof ScenarioRunnerTypeSchema>;

export const RunnerExecutionModeSchema = z.enum(['native', 'docker']);

export type RunnerExecutionMode = z.infer<typeof RunnerExecutionModeSchema>;

export const RunnerFindingSeveritySchema = z.enum([
  'info',
  'low',
  'medium',
  'high',
  'critical',
  'unknown',
]);

export type RunnerFindingSeverity = z.infer<typeof RunnerFindingSeveritySchema>;

/**
 * Execution-result summary produced by external runners (k6, nuclei).
 * Lives on `ExecutionStepResult.details.runner` and is consumed by the
 * report renderers, CLI, and web-client UI. Keep this type stable — the
 * apps/client published SDK mirrors it as the wire contract.
 */
export interface RunnerSummary {
  type: 'k6' | 'nuclei';
  summary?: string;
  /** True when the captured summary exceeded the runner's stdout cap. */
  summaryTruncated?: boolean;
  exitCode?: number;
  targetUrl?: string;
  artifacts?: string[];
  metrics?: {
    checksPassed?: number;
    checksFailed?: number;
    thresholdsPassed?: number;
    thresholdsFailed?: number;
    httpReqDurationP95Ms?: number;
    iterations?: number;
    requests?: number;
  };
  findings?: {
    total: number;
    bySeverity?: Partial<Record<RunnerFindingSeverity, number>>;
  };
}

export const ScenarioTargetFamilySchema = z.enum([
  'chimera',
  'crapi',
  'vampi',
  'vp-demo',
  'generic',
  'unknown',
]);

export type ScenarioTargetFamily = z.infer<typeof ScenarioTargetFamilySchema>;

export const ScenarioTargetCompatibilitySchema = z.enum([
  'compatible',
  'incompatible',
  'unknown',
]);

export type ScenarioTargetCompatibility = z.infer<typeof ScenarioTargetCompatibilitySchema>;

// ── Compliance Metadata ─────────────────────────────────────────────

export const ComplianceFrameworkSchema = z.enum(['fedramp', 'hipaa']);

export type ComplianceFramework = z.infer<typeof ComplianceFrameworkSchema>;

export const FedRampComplianceFrameworkSchema = z.literal('fedramp');

export const HipaaComplianceFrameworkSchema = z.literal('hipaa');

export const FedRampRevisionSchema = z.enum(['rev5']);

export type FedRampRevision = z.infer<typeof FedRampRevisionSchema>;

export const FedRampBaselineSchema = z.enum(['low', 'moderate', 'high', 'li-saas']);

export type FedRampBaseline = z.infer<typeof FedRampBaselineSchema>;

export const FedRampControlFamilySchema = z.enum([
  'AC',
  'AT',
  'AU',
  'CA',
  'CM',
  'CP',
  'IA',
  'IR',
  'MA',
  'MP',
  'PE',
  'PL',
  'PM',
  'PS',
  'PT',
  'RA',
  'SA',
  'SC',
  'SI',
  'SR',
]);

export type FedRampControlFamily = z.infer<typeof FedRampControlFamilySchema>;

export const ComplianceEvidenceTypeSchema = z.enum([
  'request-response',
  'audit-log',
  'auth-token',
  'session-cookie',
  'tenant-fixture',
  'seeded-resource',
  'config-state',
  'runner-artifact',
  'tls-handshake',
  'openapi-operation',
]);

export type ComplianceEvidenceType = z.infer<typeof ComplianceEvidenceTypeSchema>;

export const FedRampEvidenceTypeSchema = ComplianceEvidenceTypeSchema;

export type FedRampEvidenceType = z.infer<typeof FedRampEvidenceTypeSchema>;

export const ComplianceImplementationStatusSchema = z.enum([
  'planned',
  'partial',
  'implemented',
  'manual',
  'deferred',
]);

export type ComplianceImplementationStatus = z.infer<typeof ComplianceImplementationStatusSchema>;

export const FedRampControlIdSchema = z
  .string()
  .regex(
    /^[A-Z]{2}-\d+(?:[a-z]|\(\d+\)|\([a-z]\))*$/,
    'FedRAMP control ID must look like AC-3, AU-9(4), AC-2a, or AC-2(1)(a)',
  );

export type FedRampControlId = z.infer<typeof FedRampControlIdSchema>;

export const HipaaSafeguardSchema = z.enum([
  'access-control',
  'audit-controls',
  'integrity',
  'person-or-entity-authentication',
  'transmission-security',
]);

export type HipaaSafeguard = z.infer<typeof HipaaSafeguardSchema>;

export const HipaaCitationSchema = z
  .string()
  .regex(
    /^164\.312\([a-e]\)(?:\([a-z0-9]+\))*$/,
    'HIPAA citation must look like 164.312(a)(1), 164.312(b), or 164.312(e)(2)(ii)',
  );

export type HipaaCitation = z.infer<typeof HipaaCitationSchema>;

export const ComplianceEvidenceMappingSchema = z
  .object({
    type: ComplianceEvidenceTypeSchema,
    stepId: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
  })
  .refine((mapping) => Boolean(mapping.stepId || mapping.description), {
    message: 'Evidence mapping must include either a stepId or a description',
  });

export type ComplianceEvidenceMapping = z.infer<typeof ComplianceEvidenceMappingSchema>;

export const FedRampEndpointReferenceSchema = z.object({
  method: HttpMethodSchema,
  path: z.string().min(1),
  fedrampAssertion: z.string().min(1).optional(),
});

export type FedRampEndpointReference = z.infer<typeof FedRampEndpointReferenceSchema>;

export const HipaaEndpointReferenceSchema = z.object({
  method: HttpMethodSchema,
  path: z.string().min(1),
});

export type HipaaEndpointReference = z.infer<typeof HipaaEndpointReferenceSchema>;

const FedRampComplianceMappingBaseSchema = z
  .object({
    framework: FedRampComplianceFrameworkSchema,
    revision: FedRampRevisionSchema,
    baseline: FedRampBaselineSchema,
    controlId: FedRampControlIdSchema,
    family: FedRampControlFamilySchema,
    evidenceTypes: z.array(FedRampEvidenceTypeSchema).min(1),
    assertion: z.string().min(1),
    rationale: z.string().min(1),
    implementationStatus: ComplianceImplementationStatusSchema,
    endpoint: FedRampEndpointReferenceSchema.optional(),
    evidence: z.array(ComplianceEvidenceMappingSchema).optional(),
  })
  .strict();

function validateFedRampControlFamily(
  mapping: z.infer<typeof FedRampComplianceMappingBaseSchema>,
  ctx: z.RefinementCtx,
) {
  const [controlFamily] = mapping.controlId.split('-');
  if (mapping.family !== controlFamily) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['family'],
      message: `FedRAMP control family "${mapping.family}" must match control ID "${mapping.controlId}"`,
    });
  }
}

export const FedRampComplianceMappingSchema = FedRampComplianceMappingBaseSchema.superRefine(
  validateFedRampControlFamily,
);

export type FedRampComplianceMapping = z.infer<typeof FedRampComplianceMappingSchema>;

const HipaaComplianceMappingBaseSchema = z
  .object({
    framework: HipaaComplianceFrameworkSchema,
    citation: HipaaCitationSchema,
    controlId: HipaaCitationSchema.optional(),
    safeguard: HipaaSafeguardSchema,
    evidenceTypes: z.array(ComplianceEvidenceTypeSchema).min(1),
    assertion: z.string().min(1),
    rationale: z.string().min(1),
    implementationStatus: ComplianceImplementationStatusSchema,
    endpoint: HipaaEndpointReferenceSchema.optional(),
    evidence: z.array(ComplianceEvidenceMappingSchema).optional(),
  })
  .strict();

function validateHipaaControlId(
  mapping: z.infer<typeof HipaaComplianceMappingBaseSchema>,
  ctx: z.RefinementCtx,
) {
  if (mapping.controlId && mapping.controlId !== mapping.citation) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['controlId'],
      message: `HIPAA control ID "${mapping.controlId}" must match citation "${mapping.citation}"`,
    });
  }
}

export const HipaaComplianceMappingSchema = HipaaComplianceMappingBaseSchema.superRefine(
  validateHipaaControlId,
);

export type HipaaComplianceMapping = z.infer<typeof HipaaComplianceMappingSchema>;

export const ComplianceMappingSchema = z
  .discriminatedUnion('framework', [FedRampComplianceMappingBaseSchema, HipaaComplianceMappingBaseSchema])
  .superRefine((mapping, ctx) => {
    if (mapping.framework === 'fedramp') {
      validateFedRampControlFamily(mapping, ctx);
    }
    if (mapping.framework === 'hipaa') {
      validateHipaaControlId(mapping, ctx);
    }
  });

export type ComplianceMapping = z.infer<typeof ComplianceMappingSchema>;

export const ScenarioComplianceSchema = z.object({
  mappings: z.array(ComplianceMappingSchema).min(1),
});

export type ScenarioCompliance = z.infer<typeof ScenarioComplianceSchema>;

// ── Scenario Step ───────────────────────────────────────────────────

const ScenarioStepBaseSchema = z.object({
  // identity
  id: z.string(),
  name: z.string(),
  stage: z.string(),

  // flow control
  executionMode: StepExecutionModeSchema.optional(),
  parallelGroup: z.number().int().min(0).optional(),
  dependsOn: z.array(z.string()).optional(),
  when: WhenConditionSchema.optional(),
});

function validateParallelConfiguration(
  step: z.infer<typeof ScenarioStepBaseSchema>,
  ctx: z.RefinementCtx,
) {
  if (step.parallelGroup !== undefined && step.executionMode !== 'parallel') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['parallelGroup'],
      message: 'parallelGroup requires executionMode "parallel"',
    });
  }
}

export const ScenarioHttpStepSchema = ScenarioStepBaseSchema.extend({
  type: z.literal('http').optional(),

  // request
  request: RequestSchema,

  // execution config
  execution: ExecutionConfigSchema.optional(),

  // assertions
  expect: ExpectSchema.optional(),

  // variable extraction
  extract: ExtractSchema.optional(),
}).superRefine(validateParallelConfiguration);

// Runner steps intentionally do not define a dedicated target field.
// They inherit the effective execution target URL so TASK-63 remains the
// single launch-time target contract across HTTP and runner-backed steps.

export const K6StepRunnerSchema = z.object({
  scriptRef: z.string().min(1),
  args: z.array(z.string()).optional(),
  env: z.record(z.string()).optional(),
  mode: RunnerExecutionModeSchema.optional(),
  thresholds: z.record(z.string()).optional(),
});

export type K6StepRunner = z.infer<typeof K6StepRunnerSchema>;

export const ScenarioK6StepSchema = ScenarioStepBaseSchema.extend({
  type: z.literal('k6'),
  execution: ExecutionConfigSchema.optional(),
  runner: K6StepRunnerSchema,
}).superRefine(validateParallelConfiguration);

export const NucleiStepRunnerSchema = z.object({
  templateRef: z.string().min(1).optional(),
  workflowRef: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
  severity: z.array(RunnerFindingSeveritySchema).optional(),
  vars: z.record(z.string()).optional(),
  args: z.array(z.string()).optional(),
}).superRefine((runner, ctx) => {
  if (!runner.templateRef && !runner.workflowRef) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['templateRef'],
      message: 'nuclei runner requires templateRef or workflowRef',
    });
  }
});

export type NucleiStepRunner = z.infer<typeof NucleiStepRunnerSchema>;

export const ScenarioNucleiStepSchema = ScenarioStepBaseSchema.extend({
  type: z.literal('nuclei'),
  execution: ExecutionConfigSchema.optional(),
  runner: NucleiStepRunnerSchema,
}).superRefine(validateParallelConfiguration);

export const ScenarioStepSchema = z.union([
  ScenarioHttpStepSchema,
  ScenarioK6StepSchema,
  ScenarioNucleiStepSchema,
]);

export type ScenarioHttpStep = z.infer<typeof ScenarioHttpStepSchema>;
export type ScenarioK6Step = z.infer<typeof ScenarioK6StepSchema>;
export type ScenarioNucleiStep = z.infer<typeof ScenarioNucleiStepSchema>;
export type ScenarioRunnerStep = ScenarioK6Step | ScenarioNucleiStep;
export type ScenarioStep = z.infer<typeof ScenarioStepSchema>;

export function getScenarioStepType(step: ScenarioStep): ScenarioStepType {
  switch (step.type) {
    case 'k6':
      return 'k6';
    case 'nuclei':
      return 'nuclei';
    case 'http':
    case undefined:
    default:
      return 'http';
  }
}

export function isScenarioHttpStep(step: ScenarioStep): step is ScenarioHttpStep {
  return step.type === undefined || step.type === 'http';
}

export function isScenarioK6Step(step: ScenarioStep): step is ScenarioK6Step {
  return step.type === 'k6';
}

export function isScenarioNucleiStep(step: ScenarioStep): step is ScenarioNucleiStep {
  return step.type === 'nuclei';
}

export function isScenarioRunnerStep(step: ScenarioStep): step is ScenarioRunnerStep {
  return isScenarioK6Step(step) || isScenarioNucleiStep(step);
}

// ── Scenario ────────────────────────────────────────────────────────

export const ScenarioSchema = z
  .object({
    id: z.string(),
    name: z.string().min(3).max(255),
    description: z.string().optional(),
    category: z.string().optional(),
    difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert']).optional(),
    steps: z.array(ScenarioStepSchema),
    version: z.number().optional(),
    tags: z.array(z.string()).optional(),
    rule_ids: z.array(z.string()).optional(),
    compliance: ScenarioComplianceSchema.optional(),

    // Fields that exist in JSON files — previously stripped by Zod
    target: z.string().optional(),
    sourceIp: z.string().optional(),
    kind: z.string().optional(),
  })
  .passthrough();

export type Scenario = z.infer<typeof ScenarioSchema>;

export interface FedRampScenarioComplianceFilter {
  framework?: 'fedramp';
  baseline?: FedRampBaseline;
  family?: FedRampControlFamily;
  controlId?: FedRampControlId;
}

export interface HipaaScenarioComplianceFilter {
  framework?: 'hipaa';
  controlId?: HipaaCitation;
  citation?: HipaaCitation;
  safeguard?: HipaaSafeguard;
}

export interface ScenarioComplianceFilter {
  framework?: ComplianceFramework;
  baseline?: FedRampBaseline;
  family?: FedRampControlFamily;
  controlId?: FedRampControlId | HipaaCitation;
  citation?: HipaaCitation;
  safeguard?: HipaaSafeguard;
}

export function scenarioHasComplianceMapping(
  scenario: Pick<Scenario, 'compliance'>,
  filter: ScenarioComplianceFilter,
): boolean {
  const mappings = scenario.compliance?.mappings ?? [];

  return mappings.some((mapping) => {
    if (filter.framework && mapping.framework !== filter.framework) {
      return false;
    }

    if (mapping.framework === 'fedramp') {
      if ('citation' in filter && filter.citation) {
        return false;
      }
      if ('safeguard' in filter && filter.safeguard) {
        return false;
      }
      if (filter.baseline && mapping.baseline !== filter.baseline) {
        return false;
      }
      if (filter.family && mapping.family !== filter.family) {
        return false;
      }
      if (filter.controlId && mapping.controlId !== filter.controlId) {
        return false;
      }
      return true;
    }

    if (mapping.framework === 'hipaa') {
      if (filter.baseline || filter.family) {
        return false;
      }
      const controlId = mapping.controlId ?? mapping.citation;
      if (filter.controlId && controlId !== filter.controlId) {
        return false;
      }
      if ('citation' in filter && filter.citation && mapping.citation !== filter.citation) {
        return false;
      }
      if ('safeguard' in filter && filter.safeguard && mapping.safeguard !== filter.safeguard) {
        return false;
      }
      return true;
    }

    if (filter.baseline || filter.family || filter.controlId || ('citation' in filter && filter.citation) || ('safeguard' in filter && filter.safeguard)) {
      return false;
    }

    return true;
  });
}

export function filterScenariosByCompliance<T extends Pick<Scenario, 'compliance'>>(
  scenarios: readonly T[],
  filter: ScenarioComplianceFilter,
): T[] {
  return scenarios.filter((scenario) => scenarioHasComplianceMapping(scenario, filter));
}

function normalizeScenarioHints(values: readonly string[] | undefined): string[] {
  return (values ?? []).map((value) => value.trim().toLowerCase()).filter(Boolean);
}

function hasScenarioFamilyHint(
  scenarioId: string,
  tags: readonly string[],
  target: string,
  needle: string,
): boolean {
  return scenarioId.startsWith(`${needle}-`)
    || tags.some((tag) => tag === needle || tag.startsWith(`${needle}-`))
    || target.includes(needle);
}

export function inferScenarioTargetFamily(
  scenario: Pick<Scenario, 'id' | 'tags' | 'target'>,
): ScenarioTargetFamily {
  const scenarioId = scenario.id.trim().toLowerCase();
  const tags = normalizeScenarioHints(scenario.tags);
  const target = typeof scenario.target === 'string' ? scenario.target.trim().toLowerCase() : '';

  if (scenarioId.startsWith('chimera-') || scenarioId.startsWith('api-demo-') || hasScenarioFamilyHint(scenarioId, tags, target, 'chimera')) {
    return 'chimera';
  }

  if (scenarioId.startsWith('crapi-') || hasScenarioFamilyHint(scenarioId, tags, target, 'crapi')) {
    return 'crapi';
  }

  if (scenarioId.startsWith('vampi-') || hasScenarioFamilyHint(scenarioId, tags, target, 'vampi')) {
    return 'vampi';
  }

  if (scenarioId.startsWith('vp-demo-') || hasScenarioFamilyHint(scenarioId, tags, target, 'vp-demo')) {
    return 'vp-demo';
  }

  if (scenarioId.startsWith('api-')) {
    return 'generic';
  }

  return 'unknown';
}

export function inferTargetFamilyFromUrl(
  targetUrl?: string | null,
): ScenarioTargetFamily | null {
  if (!targetUrl) {
    return null;
  }

  try {
    const parsed = new URL(targetUrl);
    const hostname = parsed.hostname.toLowerCase();
    const port = parsed.port;

    if (
      hostname === 'chimera'
      // Chimera's default local developer port. We still prefer the explicit
      // service hostname when available, but localhost:8880 is the common path.
      || (['localhost', '127.0.0.1'].includes(hostname) && port === '8880')
    ) {
      return 'chimera';
    }

    if (hostname.includes('crapi')) {
      return 'crapi';
    }

    if (hostname.includes('vampi')) {
      return 'vampi';
    }

    return null;
  } catch {
    return null;
  }
}

export type ScenarioTargetUrlErrorCode =
  | 'invalid'
  | 'protocol'
  | 'hostname'
  | 'credentials';

export class ScenarioTargetUrlError extends Error {
  constructor(
    public readonly code: ScenarioTargetUrlErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'ScenarioTargetUrlError';
  }
}

export function normalizeScenarioTargetUrl(value: string | null | undefined): string | undefined {
  if (value == null) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmed);
  } catch {
    throw new ScenarioTargetUrlError('invalid', 'Scenario target URL must be a valid absolute URL');
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    throw new ScenarioTargetUrlError('protocol', 'Scenario target URL must use http or https');
  }

  if (!parsedUrl.hostname) {
    throw new ScenarioTargetUrlError('hostname', 'Scenario target URL must include a hostname');
  }

  if (parsedUrl.username || parsedUrl.password) {
    throw new ScenarioTargetUrlError('credentials', 'Scenario target URL must not include credentials');
  }

  // Fragments are client-side only and never reach the target server.
  // Strip them so previously saved `#/...` application routes remain launchable.
  parsedUrl.hash = '';

  if (parsedUrl.pathname === '/') {
    return `${parsedUrl.origin}${parsedUrl.search}`;
  }

  return parsedUrl.toString();
}

export function getScenarioTargetCompatibility(
  scenario: Pick<Scenario, 'id' | 'tags' | 'target'>,
  targetUrl?: string | null,
): ScenarioTargetCompatibility {
  const targetFamily = inferTargetFamilyFromUrl(targetUrl);
  if (!targetFamily) {
    return 'unknown';
  }

  const scenarioFamily = inferScenarioTargetFamily(scenario);
  if (scenarioFamily === 'unknown' || scenarioFamily === 'generic') {
    return 'unknown';
  }

  return scenarioFamily === targetFamily ? 'compatible' : 'incompatible';
}

export function countScenarioBlockingExpectations(
  scenario: Pick<Scenario, 'steps'>,
): number {
  return scenario.steps.reduce((count, step) => {
    if (!isScenarioHttpStep(step)) {
      return count;
    }

    return count + (step.expect?.blocked === true ? 1 : 0);
  }, 0);
}

export function countSimulationOverridableBlockingExpectations(
  scenario: Pick<Scenario, 'steps'>,
): number {
  return scenario.steps.reduce((count, step) => {
    if (!isScenarioHttpStep(step)) {
      return count;
    }

    const expect = step.expect;
    if (expect?.blockedOverridableInSimulation !== true) {
      return count;
    }

    const hasBlockingCheck =
      expect.blocked === true
      || expect.status === 403
      || expect.status === 429;

    return count + (hasBlockingCheck ? 1 : 0);
  }, 0);
}
