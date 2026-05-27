import {
  RequestSchema,
  HttpMethodSchema,
  ExecutionConfigSchema,
  ExpectSchema,
  ExtractRuleSchema,
  ExtractSchema,
  WhenConditionSchema,
  ScenarioStepSchema,
  ScenarioSchema,
  getScenarioStepType,
  isScenarioHttpStep,
  isScenarioRunnerStep,
  inferScenarioTargetFamily,
  inferTargetFamilyFromUrl,
  getScenarioTargetCompatibility,
  countScenarioBlockingExpectations,
  countSimulationOverridableBlockingExpectations,
  normalizeScenarioTargetUrl,
  ScenarioTargetUrlError,
  ComplianceMappingSchema,
  ScenarioComplianceSchema,
  scenarioHasComplianceMapping,
  filterScenariosByCompliance,
} from '../types.js';

function minimalStep(overrides: Record<string, unknown> = {}) {
  return {
    id: 'step-1',
    name: 'Send request',
    stage: 'attack',
    request: { method: 'GET', url: 'https://example.com' },
    ...overrides,
  };
}

function minimalScenario(overrides: Record<string, unknown> = {}) {
  return {
    id: 'scenario-1',
    name: 'Basic scenario',
    steps: [minimalStep()],
    ...overrides,
  };
}

describe('ScenarioSchema', () => {
  it('accepts a valid minimal scenario', () => {
    expect(ScenarioSchema.safeParse(minimalScenario()).success).toBe(true);
  });

  it('accepts a full scenario with all fields', () => {
    const full = minimalScenario({
      description: 'Full test',
      category: 'injection',
      difficulty: 'Advanced',
      version: 2,
      tags: ['sql'],
      rule_ids: ['rule-1'],
      target: 'https://target.local',
      sourceIp: '10.0.0.1',
      kind: 'exploit',
      steps: [
        {
          id: 's1',
          name: 'Probe',
          stage: 'recon',
          request: {
            method: 'POST',
            url: '/api',
            headers: { 'Content-Type': 'application/json' },
            body: '{"q":"test"}',
            params: { page: '1' },
          },
          execution: { delayMs: 500, retries: 3, jitter: 100, iterations: 5 },
          expect: { status: 200, blocked: false, bodyContains: 'ok', headerPresent: 'X-Id' },
          extract: { token: { from: 'body', path: 'data.token' } },
          executionMode: 'parallel',
          parallelGroup: 1,
          dependsOn: [],
          when: { step: 'prev', succeeded: true },
        },
      ],
    });
    const result = ScenarioSchema.safeParse(full);
    expect(result.success).toBe(true);
  });

  it('rejects name shorter than 3 chars', () => {
    expect(ScenarioSchema.safeParse(minimalScenario({ name: 'AB' })).success).toBe(false);
  });

  it('rejects name longer than 255 chars', () => {
    expect(ScenarioSchema.safeParse(minimalScenario({ name: 'x'.repeat(256) })).success).toBe(false);
  });

  it('rejects invalid difficulty (Easy no longer valid)', () => {
    expect(ScenarioSchema.safeParse(minimalScenario({ difficulty: 'Easy' })).success).toBe(false);
  });

  it('preserves unknown fields via passthrough', () => {
    const result = ScenarioSchema.safeParse(minimalScenario({ customField: 42, phases: [] }));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveProperty('customField', 42);
      expect(result.data).toHaveProperty('phases');
    }
  });

  it('accepts FedRAMP compliance metadata without replacing category or rule_ids', () => {
    const result = ScenarioSchema.safeParse(
      minimalScenario({
        category: 'Compliance',
        rule_ids: ['164.312-e-1'],
        compliance: {
          mappings: [
            {
              framework: 'fedramp',
              revision: 'rev5',
              baseline: 'moderate',
              controlId: 'SC-13',
              family: 'SC',
              evidenceTypes: ['tls-handshake', 'request-response'],
              assertion: 'reject-non-fips-cipher',
              rationale: 'Weak cipher negotiation probes collect evidence for cryptographic protection controls.',
              implementationStatus: 'implemented',
            },
          ],
        },
      }),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.category).toBe('Compliance');
      expect(result.data.rule_ids).toEqual(['164.312-e-1']);
      expect(result.data.compliance?.mappings[0].controlId).toBe('SC-13');
    }
  });
});

describe('ComplianceMappingSchema', () => {
  const mapping = {
    framework: 'fedramp',
    revision: 'rev5',
    baseline: 'moderate',
    controlId: 'AC-3',
    family: 'AC',
    evidenceTypes: ['request-response'],
    assertion: 'tenant-access-is-enforced',
    rationale: 'Cross-tenant access attempts should be denied and auditable.',
    implementationStatus: 'implemented',
  };

  it('accepts valid FedRAMP metadata', () => {
    expect(ComplianceMappingSchema.safeParse(mapping).success).toBe(true);
  });

  it('rejects unsupported FedRAMP baselines', () => {
    expect(
      ComplianceMappingSchema.safeParse({ ...mapping, baseline: 'impact-level-5' }).success,
    ).toBe(false);
  });

  it('rejects malformed FedRAMP control IDs', () => {
    expect(ComplianceMappingSchema.safeParse({ ...mapping, controlId: 'AC3' }).success).toBe(false);
    expect(ComplianceMappingSchema.safeParse({ ...mapping, controlId: 'ac-3' }).success).toBe(false);
  });

  it('accepts FedRAMP control sub-items when the family still matches', () => {
    expect(ComplianceMappingSchema.safeParse({ ...mapping, controlId: 'AC-2a' }).success).toBe(true);
    expect(ComplianceMappingSchema.safeParse({ ...mapping, controlId: 'AC-2(1)(a)' }).success).toBe(true);
  });

  it('rejects mismatched control families', () => {
    expect(
      ComplianceMappingSchema.safeParse({ ...mapping, controlId: 'AC-3', family: 'AU' }).success,
    ).toBe(false);
  });

  it('requires at least one evidence type', () => {
    expect(ComplianceMappingSchema.safeParse({ ...mapping, evidenceTypes: [] }).success).toBe(false);
  });

  it('accepts endpoint and per-step evidence mappings', () => {
    const result = ScenarioComplianceSchema.safeParse({
      mappings: [
        {
          ...mapping,
          endpoint: {
            method: 'GET',
            path: '/api/v1/saas/tenants/{tenant_id}/projects',
            fedrampAssertion: 'tenant-project-access-is-enforced',
          },
          evidence: [
            {
              type: 'request-response',
              stepId: 'tenant-b-resource-access-attempt',
              description: 'Denied cross-tenant request response.',
            },
          ],
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid endpoint references', () => {
    expect(
      ScenarioComplianceSchema.safeParse({
        mappings: [
          {
            ...mapping,
            endpoint: {
              method: 'TRACE',
              path: '/api/v1/saas/tenants/{tenant_id}/projects',
            },
          },
        ],
      }).success,
    ).toBe(false);

    expect(
      ScenarioComplianceSchema.safeParse({
        mappings: [
          {
            ...mapping,
            endpoint: {
              method: 'GET',
              path: '',
            },
          },
        ],
      }).success,
    ).toBe(false);
  });

  it('rejects evidence mappings that have no step or description context', () => {
    expect(
      ScenarioComplianceSchema.safeParse({
        mappings: [
          {
            ...mapping,
            evidence: [{ type: 'request-response' }],
          },
        ],
      }).success,
    ).toBe(false);
  });

  it('rejects empty step IDs in evidence mappings', () => {
    expect(
      ScenarioComplianceSchema.safeParse({
        mappings: [
          {
            ...mapping,
            evidence: [{ type: 'request-response', stepId: '', description: 'Bad empty step reference.' }],
          },
        ],
      }).success,
    ).toBe(false);
  });

  it('rejects empty descriptions in evidence mappings', () => {
    expect(
      ScenarioComplianceSchema.safeParse({
        mappings: [
          {
            ...mapping,
            evidence: [{ type: 'request-response', description: '' }],
          },
        ],
      }).success,
    ).toBe(false);
  });
});

describe('Scenario compliance helpers', () => {
  const scenarios = [
    minimalScenario({
      id: 'fedramp-ac',
      compliance: {
        mappings: [
          {
            framework: 'fedramp',
            revision: 'rev5',
            baseline: 'moderate',
            controlId: 'AC-3',
            family: 'AC',
            evidenceTypes: ['request-response'],
            assertion: 'tenant-access-is-enforced',
            rationale: 'Cross-tenant access should be denied.',
            implementationStatus: 'implemented',
          },
        ],
      },
    }),
    minimalScenario({
      id: 'fedramp-sc',
      compliance: {
        mappings: [
          {
            framework: 'fedramp',
            revision: 'rev5',
            baseline: 'high',
            controlId: 'SC-13',
            family: 'SC',
            evidenceTypes: ['tls-handshake'],
            assertion: 'reject-non-fips-cipher',
            rationale: 'Weak TLS ciphers should be rejected.',
            implementationStatus: 'implemented',
          },
        ],
      },
    }),
    minimalScenario({ id: 'no-compliance' }),
  ];

  it('detects matching scenario compliance metadata', () => {
    expect(scenarioHasComplianceMapping(scenarios[0], {})).toBe(true);
    expect(scenarioHasComplianceMapping(scenarios[0], { framework: 'fedramp' })).toBe(true);
    expect(scenarioHasComplianceMapping(scenarios[0], { family: 'SC' })).toBe(false);
  });

  it('does not match framework-specific filters against future generic mappings', () => {
    const futureScenario = {
      compliance: {
        mappings: [{ framework: 'soc2' }],
      },
    } as any;

    expect(scenarioHasComplianceMapping(futureScenario, {})).toBe(true);
    expect(scenarioHasComplianceMapping(futureScenario, { framework: 'fedramp' })).toBe(false);
    expect(scenarioHasComplianceMapping(futureScenario, { baseline: 'high' })).toBe(false);
  });

  it('matches later compliance mappings in the same scenario', () => {
    const multiMappingScenario = minimalScenario({
      compliance: {
        mappings: [
          {
            framework: 'fedramp',
            revision: 'rev5',
            baseline: 'moderate',
            controlId: 'AC-3',
            family: 'AC',
            evidenceTypes: ['request-response'],
            assertion: 'tenant-access-is-enforced',
            rationale: 'Cross-tenant access should be denied.',
            implementationStatus: 'implemented',
          },
          {
            framework: 'fedramp',
            revision: 'rev5',
            baseline: 'high',
            controlId: 'SC-13',
            family: 'SC',
            evidenceTypes: ['tls-handshake'],
            assertion: 'reject-non-fips-cipher',
            rationale: 'Weak TLS ciphers should be rejected.',
            implementationStatus: 'implemented',
          },
        ],
      },
    });

    expect(scenarioHasComplianceMapping(multiMappingScenario, { controlId: 'SC-13' })).toBe(true);
  });

  it('filters by framework, baseline, family, and control ID', () => {
    expect(filterScenariosByCompliance(scenarios, { framework: 'fedramp' }).map((s) => s.id)).toEqual([
      'fedramp-ac',
      'fedramp-sc',
    ]);
    expect(filterScenariosByCompliance(scenarios, { baseline: 'moderate' }).map((s) => s.id)).toEqual([
      'fedramp-ac',
    ]);
    expect(filterScenariosByCompliance(scenarios, { family: 'SC' }).map((s) => s.id)).toEqual([
      'fedramp-sc',
    ]);
    expect(filterScenariosByCompliance(scenarios, { controlId: 'AC-3' }).map((s) => s.id)).toEqual([
      'fedramp-ac',
    ]);
  });

  it('returns an empty result when no compliance metadata matches', () => {
    expect(filterScenariosByCompliance(scenarios, { baseline: 'li-saas' })).toEqual([]);
    expect(filterScenariosByCompliance(scenarios, { controlId: 'RA-5' })).toEqual([]);
  });
});

describe('RequestSchema', () => {
  it('shares HTTP method validation for request and endpoint metadata', () => {
    expect(HttpMethodSchema.safeParse('GET').success).toBe(true);
    expect(HttpMethodSchema.safeParse('TRACE').success).toBe(false);
  });

  it('rejects invalid HTTP method', () => {
    expect(RequestSchema.safeParse({ method: 'TRACE', url: '/' }).success).toBe(false);
  });

  it('accepts all valid HTTP methods', () => {
    for (const method of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']) {
      expect(RequestSchema.safeParse({ method, url: '/' }).success).toBe(true);
    }
  });

  it('accepts a string body', () => {
    const r = RequestSchema.safeParse({ method: 'POST', url: '/', body: 'raw' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.body).toBe('raw');
  });

  it('accepts an object body', () => {
    const r = RequestSchema.safeParse({ method: 'POST', url: '/', body: { key: 'val' } });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.body).toEqual({ key: 'val' });
  });
});

describe('ExecutionConfigSchema', () => {
  it('rejects negative retries', () => {
    expect(ExecutionConfigSchema.safeParse({ retries: -1 }).success).toBe(false);
  });

  it('rejects iterations < 1', () => {
    expect(ExecutionConfigSchema.safeParse({ iterations: 0 }).success).toBe(false);
  });

  it('accepts empty object (all optional)', () => {
    expect(ExecutionConfigSchema.safeParse({}).success).toBe(true);
  });

  it('rejects negative jitter', () => {
    expect(ExecutionConfigSchema.safeParse({ jitter: -1 }).success).toBe(false);
  });
});

describe('ExtractRuleSchema', () => {
  it('rejects invalid from value', () => {
    expect(ExtractRuleSchema.safeParse({ from: 'cookie' }).success).toBe(false);
  });

  it('accepts body, header, and status', () => {
    for (const from of ['body', 'header', 'status']) {
      expect(ExtractRuleSchema.safeParse({ from }).success).toBe(true);
    }
  });
});

describe('ScenarioStepSchema', () => {
  it('accepts step without optional execution/expect/extract', () => {
    const r = ScenarioStepSchema.safeParse(minimalStep());
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.execution).toBeUndefined();
      expect(r.data.expect).toBeUndefined();
      expect(r.data.extract).toBeUndefined();
    }
  });

  it('rejects negative parallelGroup values', () => {
    expect(
      ScenarioStepSchema.safeParse(
        minimalStep({ executionMode: 'parallel', parallelGroup: -1 }),
      ).success,
    ).toBe(false);
  });

  it('rejects parallelGroup when executionMode is not parallel', () => {
    expect(
      ScenarioStepSchema.safeParse(minimalStep({ parallelGroup: 1 })).success,
    ).toBe(false);
    expect(
      ScenarioStepSchema.safeParse(
        minimalStep({ executionMode: 'sequential', parallelGroup: 1 }),
      ).success,
    ).toBe(false);
  });

  it('accepts legacy HTTP steps without an explicit type', () => {
    const r = ScenarioStepSchema.safeParse(minimalStep());
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.type).toBeUndefined();
    }
  });

  it('accepts k6 runner steps', () => {
    const r = ScenarioStepSchema.safeParse({
      id: 'k6-step',
      type: 'k6',
      name: 'Load test',
      stage: 'exercise',
      runner: {
        scriptRef: 'scripts/smoke.js',
        mode: 'docker',
        env: { TOKEN: '{{token}}' },
      },
    });
    expect(r.success).toBe(true);
  });

  it('accepts nuclei runner steps with a template reference', () => {
    const r = ScenarioStepSchema.safeParse({
      id: 'nuclei-step',
      type: 'nuclei',
      name: 'Scan target',
      stage: 'validate',
      runner: {
        templateRef: 'templates/http/cves/example.yaml',
        severity: ['high', 'critical'],
      },
    });
    expect(r.success).toBe(true);
  });

  it('rejects nuclei runner steps without template or workflow references', () => {
    const r = ScenarioStepSchema.safeParse({
      id: 'nuclei-step',
      type: 'nuclei',
      name: 'Broken scan',
      stage: 'validate',
      runner: {
        severity: ['medium'],
      },
    });
    expect(r.success).toBe(false);
  });

  it('treats legacy steps without an explicit type as http helpers', () => {
    const step = minimalStep() as any;

    expect(getScenarioStepType(step)).toBe('http');
    expect(isScenarioHttpStep(step)).toBe(true);
    expect(isScenarioRunnerStep(step)).toBe(false);
  });

  it('treats k6 and nuclei steps as runner helpers', () => {
    const k6Step = {
      id: 'k6-step',
      type: 'k6',
      name: 'Load test',
      stage: 'exercise',
      runner: { scriptRef: 'scripts/smoke.js' },
    } as any;
    const nucleiStep = {
      id: 'nuclei-step',
      type: 'nuclei',
      name: 'Scan target',
      stage: 'validate',
      runner: { templateRef: 'templates/http/example.yaml' },
    } as any;

    expect(getScenarioStepType(k6Step)).toBe('k6');
    expect(isScenarioRunnerStep(k6Step)).toBe(true);
    expect(isScenarioHttpStep(k6Step)).toBe(false);

    expect(getScenarioStepType(nucleiStep)).toBe('nuclei');
    expect(isScenarioRunnerStep(nucleiStep)).toBe(true);
    expect(isScenarioHttpStep(nucleiStep)).toBe(false);
  });

  it('does not classify unknown step types as http or runner steps', () => {
    const malformedStep = { ...minimalStep(), type: 'grpc' } as any;

    expect(getScenarioStepType(malformedStep)).toBe('http');
    expect(isScenarioHttpStep(malformedStep)).toBe(false);
    expect(isScenarioRunnerStep(malformedStep)).toBe(false);
  });
});

describe('WhenConditionSchema', () => {
  it('requires step field', () => {
    expect(WhenConditionSchema.safeParse({ succeeded: true }).success).toBe(false);
  });

  it('accepts step with optional succeeded and status', () => {
    expect(WhenConditionSchema.safeParse({ step: 's1', succeeded: false, status: 403 }).success).toBe(true);
  });
});

describe('Scenario target helpers', () => {
  it('classifies chimera and lab-family scenarios from ids and tags', () => {
    expect(inferScenarioTargetFamily(minimalScenario({ id: 'chimera-sqli', tags: ['chimera'] }))).toBe('chimera');
    expect(inferScenarioTargetFamily(minimalScenario({ id: 'api-demo-auth-attacks' }))).toBe('chimera');
    expect(inferScenarioTargetFamily(minimalScenario({ id: 'crapi-bola' }))).toBe('crapi');
    expect(inferScenarioTargetFamily(minimalScenario({ id: 'vampi-mass-assignment' }))).toBe('vampi');
    expect(inferScenarioTargetFamily(minimalScenario({ id: 'vp-demo-06-trap-endpoint' }))).toBe('vp-demo');
  });

  it('infers chimera targets from localhost:8880 and service hostnames', () => {
    expect(inferTargetFamilyFromUrl('http://localhost:8880')).toBe('chimera');
    expect(inferTargetFamilyFromUrl('http://chimera:8880')).toBe('chimera');
    expect(inferTargetFamilyFromUrl('https://crapi.local')).toBe('crapi');
    expect(inferTargetFamilyFromUrl('https://example.com')).toBeNull();
  });

  it('marks cross-lab scenarios as incompatible when the target family is known', () => {
    const chimeraScenario = minimalScenario({ id: 'chimera-banking-idor', tags: ['chimera'] });
    const crapiScenario = minimalScenario({ id: 'crapi-bola-vehicle-enumeration' });

    expect(getScenarioTargetCompatibility(chimeraScenario, 'http://localhost:8880')).toBe('compatible');
    expect(getScenarioTargetCompatibility(crapiScenario, 'http://localhost:8880')).toBe('incompatible');
    expect(getScenarioTargetCompatibility(minimalScenario(), 'http://localhost:8880')).toBe('unknown');
  });

  it('returns unknown compatibility when the target URL is missing', () => {
    expect(getScenarioTargetCompatibility(minimalScenario(), null)).toBe('unknown');
    expect(getScenarioTargetCompatibility(minimalScenario(), undefined)).toBe('unknown');
  });

  it('counts blocked expectations across HTTP steps only', () => {
    const scenario = minimalScenario({
      steps: [
        minimalStep({ expect: { blocked: true } }),
        minimalStep({ id: 'http-2', expect: { status: 200 } }),
        {
          id: 'scan',
          type: 'nuclei',
          name: 'Scan target',
          stage: 'validate',
          runner: { templateRef: 'templates/http/example.yaml' },
        },
      ],
    });

    expect(countScenarioBlockingExpectations(scenario)).toBe(1);
  });

  it('counts only author-approved simulation-overridable blocking expectations', () => {
    const scenario = minimalScenario({
      steps: [
        minimalStep({ expect: { blocked: true, blockedOverridableInSimulation: true } }),
        minimalStep({ id: 'http-2', expect: { status: 403, blockedOverridableInSimulation: true } }),
        minimalStep({ id: 'http-3', expect: { blocked: true } }),
        minimalStep({ id: 'http-4', expect: { blocked: false, blockedOverridableInSimulation: true } }),
      ],
    });

    expect(countSimulationOverridableBlockingExpectations(scenario)).toBe(2);
  });

  it('preserves trailing slashes for non-root paths while normalizing origin-only URLs', () => {
    expect(normalizeScenarioTargetUrl('http://example.com/?q=1')).toBe('http://example.com?q=1');
    expect(normalizeScenarioTargetUrl('http://example.com/api/')).toBe('http://example.com/api/');
    expect(normalizeScenarioTargetUrl('http://example.com/#/app')).toBe('http://example.com');
  });

  it('surfaces machine-readable target URL validation codes', () => {
    expect(() => normalizeScenarioTargetUrl('ftp://example.com')).toThrowError(
      expect.objectContaining<Partial<ScenarioTargetUrlError>>({
        code: 'protocol',
      }),
    );
  });
});
