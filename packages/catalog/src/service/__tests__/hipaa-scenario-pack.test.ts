import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';
import { CatalogService, filterScenariosByCompliance } from '../../index.js';

const scenariosDir = fileURLToPath(new URL('../../../scenarios', import.meta.url));

describe('HIPAA scenario pack', () => {
  it('loads the initial HIPAA technical evidence scenarios with typed mappings', () => {
    const service = new CatalogService(scenariosDir);
    const hipaaScenarios = filterScenariosByCompliance(service.listScenarios(), {
      framework: 'hipaa',
    }).filter((scenario) => scenario.id.startsWith('compliance-hipaa-'));

    expect(hipaaScenarios.map((scenario) => scenario.id).sort()).toEqual([
      'compliance-hipaa-audit-suppression',
      'compliance-hipaa-emergency-access',
      'compliance-hipaa-minimum-necessary',
      'compliance-hipaa-patient-export',
    ]);

    for (const scenario of hipaaScenarios) {
      expect(scenario.tags).toEqual(expect.arrayContaining(['hipaa', 'healthcare']));
      expect(scenario.compliance?.mappings.length).toBeGreaterThan(0);

      for (const mapping of scenario.compliance?.mappings ?? []) {
        expect(mapping.framework).toBe('hipaa');
        if (mapping.framework !== 'hipaa') {
          continue;
        }

        expect(mapping.citation).toMatch(/^164\.312\(/);
        expect(mapping.safeguard.length).toBeGreaterThan(0);
        expect(mapping.implementationStatus).toBe('implemented');
        expect(mapping.endpoint?.method).toMatch(/^(GET|POST)$/);
        expect(mapping.endpoint?.path.length).toBeGreaterThan(0);
        expect(mapping.evidenceTypes.length).toBeGreaterThan(0);
        expect(mapping.assertion.length).toBeGreaterThan(0);
        expect(mapping.rationale.length).toBeGreaterThan(0);
      }
    }
  });

  it('keeps HIPAA evidence references tied to real scenario steps', () => {
    const service = new CatalogService(scenariosDir);
    const hipaaScenarios = service
      .listScenarios()
      .filter((scenario) => scenario.id.startsWith('compliance-hipaa-'));

    expect(hipaaScenarios.length).toBeGreaterThanOrEqual(4);

    for (const scenario of hipaaScenarios) {
      const stepIds = new Set(scenario.steps.map((step) => step.id));

      for (const mapping of scenario.compliance?.mappings ?? []) {
        expect(mapping.evidenceTypes.length).toBeGreaterThan(0);
        expect(mapping.evidence?.length ?? 0).toBeGreaterThan(0);

        for (const evidence of mapping.evidence ?? []) {
          expect(mapping.evidenceTypes).toContain(evidence.type);
          expect(evidence.description?.length ?? 0).toBeGreaterThan(0);
          if (evidence.stepId) {
            expect(stepIds.has(evidence.stepId)).toBe(true);
          }
        }
      }
    }
  });
});
