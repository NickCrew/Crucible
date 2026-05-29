import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CrucibleClient } from '@atlascrew/crucible-client';
import { scenariosCommand } from './scenarios.js';
import type { GlobalOptions } from '../parse.js';

const globals: GlobalOptions = {
  server: 'http://localhost:3000',
  timeout: 30,
  format: 'table',
};

function makeClient() {
  const list = vi.fn().mockResolvedValue([
    {
      id: 'compliance-fedramp-cross-tenant',
      name: 'FedRAMP Cross-Tenant Data Leakage Probe',
      category: 'Compliance',
      difficulty: 'Advanced',
      compliance: {
        mappings: [
          {
            framework: 'fedramp',
            revision: 'rev5',
            baseline: 'moderate',
            controlId: 'AC-3',
            family: 'AC',
            evidenceTypes: ['request-response'],
            assertion: 'tenant-project-access-is-enforced',
            rationale: 'Cross-tenant project access should be denied.',
            implementationStatus: 'implemented',
          },
        ],
      },
      steps: [{ id: 's1', name: 'Step 1', stage: 'main', request: { method: 'GET', url: '/' } }],
    },
  ]);

  return {
    client: { scenarios: { list } } as unknown as CrucibleClient,
    list,
  };
}

function makeHipaaClient() {
  const list = vi.fn().mockResolvedValue([
    {
      id: 'compliance-hipaa-audit-suppression',
      name: 'HIPAA Audit Suppression Probe',
      category: 'Compliance',
      difficulty: 'Advanced',
      compliance: {
        mappings: [
          {
            framework: 'hipaa',
            citation: '164.312(b)',
            controlId: '164.312(b)',
            safeguard: 'audit-controls',
            evidenceTypes: ['audit-log'],
            assertion: 'phi-export-remains-auditable',
            rationale: 'PHI export attempts should remain auditable.',
            implementationStatus: 'implemented',
          },
        ],
      },
      steps: [{ id: 's1', name: 'Step 1', stage: 'main', request: { method: 'GET', url: '/' } }],
    },
  ]);

  return {
    client: { scenarios: { list } } as unknown as CrucibleClient,
    list,
  };
}

describe('scenariosCommand', () => {
  let writeOut: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    writeOut = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });

  it('passes FedRAMP filters to the client and renders control mappings', async () => {
    const { client, list } = makeClient();

    const code = await scenariosCommand(client, globals, [
      '--framework',
      'fedramp',
      '--baseline=moderate',
      '--family',
      'ac',
      '--control-id',
      'ac-3',
    ]);

    expect(code).toBe(0);
    expect(list).toHaveBeenCalledWith({
      framework: 'fedramp',
      baseline: 'moderate',
      family: 'AC',
      controlId: 'AC-3',
    });
    expect(writeOut.mock.calls.flat().join('')).toContain('AC-3 (moderate)');
  });

  it('can show control mappings without filtering', async () => {
    const { client, list } = makeClient();

    await scenariosCommand(client, globals, ['--show-controls']);

    expect(list).toHaveBeenCalledWith(undefined);
    expect(writeOut.mock.calls.flat().join('')).toContain('controls');
    expect(writeOut.mock.calls.flat().join('')).toContain('AC-3 (moderate)');
  });

  it('passes HIPAA filters to the client and renders citation mappings', async () => {
    const { client, list } = makeHipaaClient();

    const code = await scenariosCommand(client, globals, [
      '--framework=HIPAA',
      '--citation',
      '164.312(b)',
      '--safeguard=Audit-Controls',
      '--control-id',
      '164.312(b)',
    ]);

    expect(code).toBe(0);
    expect(list).toHaveBeenCalledWith({
      framework: 'hipaa',
      citation: '164.312(b)',
      safeguard: 'audit-controls',
      controlId: '164.312(b)',
    });
    expect(writeOut.mock.calls.flat().join('')).toContain('164.312(b) (audit-controls)');
  });

  it('fails fast when HIPAA filter flags are missing values', async () => {
    const { client, list } = makeHipaaClient();

    await expect(scenariosCommand(client, globals, ['--citation'])).rejects.toThrow(
      '--citation requires a value',
    );
    await expect(scenariosCommand(client, globals, ['--safeguard'])).rejects.toThrow(
      '--safeguard requires a value',
    );
    expect(list).not.toHaveBeenCalled();
  });

  it('fails fast on unknown scenarios options', async () => {
    const { client, list } = makeClient();

    await expect(scenariosCommand(client, globals, ['--wat'])).rejects.toThrow(
      'Unknown scenarios option: --wat',
    );
    expect(list).not.toHaveBeenCalled();
  });
});
