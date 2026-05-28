import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';
import {
  CatalogService,
  filterScenariosByCompliance,
  type FedRampControlFamily,
} from '../../index.js';

const scenariosDir = fileURLToPath(new URL('../../../scenarios', import.meta.url));

describe('Chimera FedRAMP scenario pack', () => {
  it('loads one runnable Chimera scenario for every initial FedRAMP family', () => {
    const service = new CatalogService(scenariosDir);
    const fedrampScenarios = filterScenariosByCompliance(service.listScenarios(), {
      framework: 'fedramp',
      baseline: 'moderate',
    }).filter((scenario) => scenario.id.startsWith('chimera-fedramp-'));

    const byFamily = new Map<FedRampControlFamily, string[]>();
    for (const scenario of fedrampScenarios) {
      expect(scenario.tags).toEqual(expect.arrayContaining(['chimera', 'fedramp']));
      expect(scenario.category).toBeDefined();
      expect(scenario.category).not.toBe('Compliance');
      expect(scenario.steps.length).toBeGreaterThan(0);
      expect(scenario.steps.some((step) => step.expect !== undefined)).toBe(true);

      for (const mapping of scenario.compliance?.mappings ?? []) {
        if (mapping.framework !== 'fedramp') {
          continue;
        }
        byFamily.set(mapping.family, [...(byFamily.get(mapping.family) ?? []), scenario.id]);
      }
    }

    expect([...byFamily.keys()].sort()).toEqual(['AC', 'AU', 'CM', 'IA', 'RA', 'SC', 'SI']);
  });

  it('keeps compliance evidence references tied to real scenario steps', () => {
    const service = new CatalogService(scenariosDir);
    const fedrampScenarios = service
      .listScenarios()
      .filter((scenario) => scenario.id.startsWith('chimera-fedramp-'));

    expect(fedrampScenarios.length).toBeGreaterThanOrEqual(7);

    for (const scenario of fedrampScenarios) {
      const stepIds = new Set(scenario.steps.map((step) => step.id));

      for (const mapping of scenario.compliance?.mappings ?? []) {
        expect(mapping.endpoint).toBeDefined();
        expect(mapping.evidenceTypes.length).toBeGreaterThan(0);
        expect(mapping.evidence?.length ?? 0).toBeGreaterThan(0);

        for (const evidence of mapping.evidence ?? []) {
          if (evidence.stepId) {
            expect(stepIds.has(evidence.stepId)).toBe(true);
          }
        }
      }
    }
  });
});
