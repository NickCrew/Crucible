import { vi, describe, it, expect, beforeEach } from 'vitest';
import { readFileSync, readdirSync, writeFileSync } from 'fs';

// Mock fs before importing CatalogService
vi.mock('fs', () => ({
  readFileSync: vi.fn(),
  readdirSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

// Mock url module for ESM compat
vi.mock('url', () => ({
  fileURLToPath: vi.fn(() => '/fake/catalog/src/service'),
}));

const mockReaddir = vi.mocked(readdirSync);
const mockReadFile = vi.mocked(readFileSync);
const mockWriteFile = vi.mocked(writeFileSync);

// Valid scenario JSON for test fixtures
function validScenarioJson(id: string, name = 'Test Scenario') {
  return JSON.stringify({
    id,
    name,
    steps: [
      {
        id: 'step-1',
        name: 'Step 1',
        stage: 'main',
        request: { method: 'GET', url: 'http://localhost/test' },
      },
    ],
  });
}

// Dynamically import after mocks are set up
async function createService(dir?: string) {
  const { CatalogService } = await import('../catalog-service.js');
  return new CatalogService(dir ?? '/test/scenarios');
}

describe('CatalogService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── TASK-7: Validation and error handling ─────────────────────────

  describe('constructor loading', () => {
    it('loads valid JSON files into memory', async () => {
      mockReaddir.mockReturnValue(['alpha.json', 'beta.json'] as any);
      mockReadFile
        .mockReturnValueOnce(validScenarioJson('alpha', 'Alpha Scenario') as any)
        .mockReturnValueOnce(validScenarioJson('beta', 'Beta Scenario') as any);

      const svc = await createService();

      expect(svc.size).toBe(2);
      expect(svc.getScenario('alpha')).toBeDefined();
      expect(svc.getScenario('beta')).toBeDefined();
    });

    it('skips invalid JSON files without crashing', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      mockReaddir.mockReturnValue(['good.json', 'bad.json'] as any);
      mockReadFile
        .mockReturnValueOnce(validScenarioJson('good', 'Good One') as any)
        .mockReturnValueOnce('{ not valid json ]]' as any);

      const svc = await createService();

      expect(svc.size).toBe(1);
      expect(svc.getScenario('good')).toBeDefined();
      expect(warnSpy).toHaveBeenCalled();

      warnSpy.mockRestore();
    });

    it('skips scenarios that fail Zod schema validation', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      mockReaddir.mockReturnValue(['valid.json', 'invalid.json'] as any);
      mockReadFile
        .mockReturnValueOnce(validScenarioJson('valid', 'Valid') as any)
        // Missing required fields: no name, no steps
        .mockReturnValueOnce(JSON.stringify({ id: 'invalid' }) as any);

      const svc = await createService();

      expect(svc.size).toBe(1);
      expect(svc.getScenario('valid')).toBeDefined();
      expect(svc.getScenario('invalid')).toBeUndefined();

      warnSpy.mockRestore();
    });

    it('handles missing scenarios directory gracefully', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      mockReaddir.mockImplementation(() => {
        throw new Error('ENOENT: no such file or directory');
      });

      const svc = await createService('/nonexistent/dir');

      expect(svc.size).toBe(0);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('scenarios directory not found'),
      );

      warnSpy.mockRestore();
    });

    it('ignores non-JSON files', async () => {
      mockReaddir.mockReturnValue([
        'readme.md',
        'notes.txt',
        'scenario.json',
        '.gitkeep',
      ] as any);
      mockReadFile.mockReturnValue(validScenarioJson('scenario', 'The Scenario') as any);

      const svc = await createService();

      // Only scenario.json should be loaded
      expect(svc.size).toBe(1);
      expect(mockReadFile).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateScenario', () => {
    it('rejects invalid data before writing to disk', async () => {
      mockReaddir.mockReturnValue([] as any);

      const svc = await createService();

      // Data with name too short (min 3 chars)
      expect(() =>
        svc.updateScenario('test', {
          id: 'test',
          name: 'ab',
          steps: [],
        } as any),
      ).toThrow();

      expect(mockWriteFile).not.toHaveBeenCalled();
    });

    it('writes valid data to disk and updates cache', async () => {
      mockReaddir.mockReturnValue([] as any);

      const svc = await createService();
      const data = {
        id: 'new-scenario',
        name: 'New Scenario',
        steps: [
          {
            id: 'step-1',
            name: 'Step 1',
            stage: 'main',
            request: { method: 'GET' as const, url: 'http://localhost/test' },
          },
        ],
      };

      const result = svc.updateScenario('new-scenario', data as any);

      expect(mockWriteFile).toHaveBeenCalledTimes(1);
      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('new-scenario.json'),
        expect.any(String),
        'utf-8',
      );
      expect(result.id).toBe('new-scenario');
      expect(svc.getScenario('new-scenario')).toBeDefined();
    });
  });

  // ── TASK-14: Query methods ────────────────────────────────────────

  describe('query methods', () => {
    async function loadedService() {
      mockReaddir.mockReturnValue(['a.json', 'b.json', 'c.json'] as any);
      mockReadFile
        .mockReturnValueOnce(
          JSON.stringify({
            id: 'a',
            name: 'Auth Bypass',
            category: 'auth',
            steps: [
              { id: 's1', name: 'S1', stage: 'main', request: { method: 'GET', url: 'http://x/a' } },
            ],
          }) as any,
        )
        .mockReturnValueOnce(
          JSON.stringify({
            id: 'b',
            name: 'SQL Injection',
            category: 'injection',
            steps: [
              { id: 's1', name: 'S1', stage: 'main', request: { method: 'GET', url: 'http://x/b' } },
            ],
          }) as any,
        )
        .mockReturnValueOnce(
          JSON.stringify({
            id: 'c',
            name: 'CSRF Attack',
            category: 'auth',
            steps: [
              { id: 's1', name: 'S1', stage: 'main', request: { method: 'GET', url: 'http://x/c' } },
            ],
          }) as any,
        );
      return createService();
    }

    it('getScenario returns correct scenario by ID', async () => {
      const svc = await loadedService();
      const scenario = svc.getScenario('b');
      expect(scenario).toBeDefined();
      expect(scenario!.name).toBe('SQL Injection');
    });

    it('getScenario returns undefined for non-existent ID', async () => {
      const svc = await loadedService();
      expect(svc.getScenario('nonexistent')).toBeUndefined();
    });

    it('listScenarios returns all loaded scenarios', async () => {
      const svc = await loadedService();
      const all = svc.listScenarios();
      expect(all).toHaveLength(3);
    });

    it('getScenariosByCategory filters correctly', async () => {
      const svc = await loadedService();
      const authScenarios = svc.getScenariosByCategory('auth');
      expect(authScenarios).toHaveLength(2);
      expect(authScenarios.map((s) => s.id).sort()).toEqual(['a', 'c']);
    });

    it('getCategories returns sorted unique categories', async () => {
      const svc = await loadedService();
      const categories = svc.getCategories();
      expect(categories).toEqual(['auth', 'injection']);
    });
  });
});
