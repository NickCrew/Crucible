import { describe, expect, it, vi, beforeEach } from 'vitest';
import { writeFile } from 'fs/promises';
import type { CrucibleClient } from '@atlascrew/crucible-client';
import { reportsCommand } from './reports.js';
import type { GlobalOptions } from '../parse.js';

vi.mock('fs/promises', () => ({
  writeFile: vi.fn().mockResolvedValue(undefined),
}));

const globals: GlobalOptions = {
  server: 'http://localhost:3000',
  timeout: 30,
  format: 'json',
};

describe('reportsCommand', () => {
  let writeOut: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    writeOut = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });

  it('downloads the OSCAL-shaped export with a stable default filename', async () => {
    const oscal = vi.fn().mockResolvedValue({
      arrayBuffer: async () => new TextEncoder().encode('{}').buffer,
    });
    const client = {
      reports: { oscal },
    } as unknown as CrucibleClient;

    const code = await reportsCommand(client, globals, ['exec-1', '--download', 'oscal']);

    expect(code).toBe(0);
    expect(oscal).toHaveBeenCalledWith('exec-1');
    expect(writeFile).toHaveBeenCalledWith('exec-1-report.oscal.json', expect.any(Buffer));
    expect(writeOut.mock.calls.flat().join('')).toContain('exec-1-report.oscal.json');
  });

  it('downloads the HIPAA evidence export with a stable default filename', async () => {
    const hipaa = vi.fn().mockResolvedValue({
      arrayBuffer: async () => new TextEncoder().encode('{}').buffer,
    });
    const client = {
      reports: { hipaa },
    } as unknown as CrucibleClient;

    const code = await reportsCommand(client, globals, ['exec-1', '--download', 'hipaa']);

    expect(code).toBe(0);
    expect(hipaa).toHaveBeenCalledWith('exec-1');
    expect(writeFile).toHaveBeenCalledWith('exec-1-report.hipaa-evidence.json', expect.any(Buffer));
    expect(writeOut.mock.calls.flat().join('')).toContain('exec-1-report.hipaa-evidence.json');
  });

  it('rejects unsupported report download formats', async () => {
    const writeErr = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    const client = {
      reports: {},
    } as unknown as CrucibleClient;

    const code = await reportsCommand(client, globals, ['exec-1', '--download', 'csv']);

    expect(code).toBe(1);
    expect(writeErr.mock.calls.flat().join('')).toContain('"hipaa"');
  });
});
