import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ScenarioEngine } from '../server/engine.js';
import { CatalogService, ExecutionRepository, createDb } from '@crucible/catalog';

// ── Mocks ─────────────────────────────────────────────────────────────

const mockFetch = vi.fn();
global.fetch = mockFetch as any;

function mockResponse(status: number, body: string) {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: {
      get: (name: string) => (name.toLowerCase() === 'content-type' ? 'application/json' : null),
      forEach: (cb: (v: string, k: string) => void) => cb('application/json', 'content-type'),
    },
    json: () => Promise.resolve(JSON.parse(body)),
    text: () => Promise.resolve(body),
  };
}

const mockCatalog = { getScenario: vi.fn() } as unknown as CatalogService;

function makeScenario(id: string, stepCount: number) {
  return {
    id,
    name: `Scenario ${id}`,
    steps: Array.from({ length: stepCount }, (_, i) => ({
      id: `step-${i}`,
      name: `Step ${i}`,
      stage: 'main',
      request: { method: 'GET', url: `http://localhost/step-${i}` },
      expect: { status: 200 },
    })),
  };
}

describe('Storage Retention Validation', () => {
  let engine: ScenarioEngine;
  let repo: ExecutionRepository;
  let db: any;

  beforeEach(() => {
    vi.clearAllMocks();
    db = createDb(':memory:');
    repo = new ExecutionRepository(db);
    repo.ensureTables();

    // Reset env
    delete process.env.CRUCIBLE_STEP_BODY_RETENTION;
    delete process.env.CRUCIBLE_STEP_BODY_MAX_BYTES;
    process.env.CRUCIBLE_TARGET_URL = 'http://localhost';
  });

  afterEach(() => {
    if (engine) engine.destroy();
    if (db) db.close();
  });

  async function runScenario(scenarioId: string, stepCount: number) {
    const scenario = makeScenario(scenarioId, stepCount);
    (mockCatalog.getScenario as any).mockReturnValue(scenario);

    const executionId = await engine.startScenario(scenarioId);

    // Poll for completion
    return new Promise<void>((resolve, reject) => {
      const check = () => {
        const exec = repo.getExecution(executionId);
        if (exec?.status === 'completed' || exec?.status === 'failed') {
          resolve();
        } else if (exec?.status === 'cancelled') {
          reject(new Error('Execution cancelled'));
        } else {
          setTimeout(check, 10);
        }
      };
      check();
    });
  }

  it('proves that "all" retention stores everything', async () => {
    process.env.CRUCIBLE_STEP_BODY_RETENTION = 'all';
    engine = new ScenarioEngine(mockCatalog, repo);

    const largeBody = JSON.stringify({ data: 'x'.repeat(1000) });
    mockFetch.mockResolvedValue(mockResponse(200, largeBody));

    await runScenario('all-test', 3);

    const stats = repo.getStorageStats();
    // 3 steps * ~1010 bytes per body = ~3030 bytes
    expect(stats.totalResultBytes).toBeGreaterThan(3000);
  });

  it('proves that "failed-only" stores nothing for successful runs', async () => {
    process.env.CRUCIBLE_STEP_BODY_RETENTION = 'failed-only';
    engine = new ScenarioEngine(mockCatalog, repo);

    const largeBody = JSON.stringify({ data: 'x'.repeat(1000) });
    mockFetch.mockResolvedValue(mockResponse(200, largeBody));

    await runScenario('failed-only-success', 3);

    const stats = repo.getStorageStats();
    expect(stats.totalResultBytes).toBe(0);
  });

  it('proves that "failed-only" stores data for failed steps', async () => {
    process.env.CRUCIBLE_STEP_BODY_RETENTION = 'failed-only';
    engine = new ScenarioEngine(mockCatalog, repo);

    const largeBody = JSON.stringify({ data: 'x'.repeat(1000) });
    // First step succeeds, second fails
    mockFetch
      .mockResolvedValueOnce(mockResponse(200, largeBody))
      .mockResolvedValueOnce(mockResponse(500, largeBody));

    await runScenario('failed-only-mixed', 2);

    const stats = repo.getStorageStats();
    // Only 1 failed step stored
    expect(stats.totalResultBytes).toBeLessThan(2000);
    expect(stats.totalResultBytes).toBeGreaterThan(1000);
  });

  it('proves that "none" retention stores nothing even on failure', async () => {
    process.env.CRUCIBLE_STEP_BODY_RETENTION = 'none';
    engine = new ScenarioEngine(mockCatalog, repo);

    const largeBody = JSON.stringify({ data: 'x'.repeat(1000) });
    mockFetch.mockResolvedValue(mockResponse(500, largeBody));

    await runScenario('none-test', 3);

    const stats = repo.getStorageStats();
    expect(stats.totalResultBytes).toBe(0);
  });

  it('proves that byte truncation reduces storage footprint', async () => {
    process.env.CRUCIBLE_STEP_BODY_RETENTION = 'all';
    process.env.CRUCIBLE_STEP_BODY_MAX_BYTES = '100'; // Tight limit
    engine = new ScenarioEngine(mockCatalog, repo);

    const hugeBody = JSON.stringify({ data: 'x'.repeat(5000) });
    mockFetch.mockResolvedValue(mockResponse(200, hugeBody));

    await runScenario('truncation-test', 3);

    const stats = repo.getStorageStats();
    // 3 steps * ~100 bytes = ~300 bytes (plus some JSON overhead for the retention meta)
    // Certainly much less than 3 * 5000 = 15000
    expect(stats.totalResultBytes).toBeLessThan(1500);
    expect(stats.totalResultBytes).toBeGreaterThan(300);
  });
});
