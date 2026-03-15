import { EventEmitter } from 'events';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ScenarioExecution } from '../shared/types.js';
import type { CrucibleRuntime } from '../server/runtime.js';
import { runCli } from '../cli/assess-command.js';

class FakeEngine extends EventEmitter {
  readonly targetUrl: string;
  readonly startedScenarioIds: string[] = [];
  readonly triggerPayloads: Array<Record<string, unknown> | undefined> = [];
  readonly cancelledExecutionIds: string[] = [];
  private readonly outcomes: Record<string, { score: number; status?: ScenarioExecution['status']; hang?: boolean }>;
  private readonly executions = new Map<string, ScenarioExecution>();
  private counter = 0;

  constructor(
    targetUrl: string,
    outcomes: Record<string, { score: number; status?: ScenarioExecution['status']; hang?: boolean }>,
  ) {
    super();
    this.targetUrl = targetUrl;
    this.outcomes = outcomes;
  }

  destroy(): void {}

  async startScenario(
    scenarioId: string,
    mode: ScenarioExecution['mode'] = 'assessment',
    triggerData?: Record<string, unknown>,
  ): Promise<string> {
    this.startedScenarioIds.push(scenarioId);
    this.triggerPayloads.push(triggerData);
    const outcome = this.outcomes[scenarioId];
    if (!outcome) {
      throw new Error(`Unexpected scenario ${scenarioId}`);
    }

    const executionId = `exec-${++this.counter}`;
    const execution: ScenarioExecution = {
      id: executionId,
      scenarioId,
      mode,
      status: 'running',
      startedAt: Date.now(),
      steps: [
        { stepId: `${scenarioId}-step-1`, status: 'completed', attempts: 1 },
        { stepId: `${scenarioId}-step-2`, status: 'completed', attempts: 1 },
      ],
      targetUrl: this.targetUrl,
      report: {
        summary: `${scenarioId} finished`,
        passed: outcome.score >= 80,
        score: outcome.score,
        artifacts: [],
      },
    };

    this.executions.set(executionId, execution);

    if (outcome.hang) {
      return executionId;
    }

    queueMicrotask(() => {
      execution.status = outcome.status ?? 'completed';
      execution.completedAt = execution.startedAt! + 25;
      execution.duration = 25;
      if (execution.status === 'failed') {
        execution.error = `${scenarioId} failed`;
        this.emit('execution:failed', execution);
        return;
      }
      this.emit('execution:completed', execution);
    });

    return executionId;
  }

  cancelExecution(executionId: string): boolean {
    this.cancelledExecutionIds.push(executionId);
    return this.executions.has(executionId);
  }

  getExecution(executionId: string): ScenarioExecution | undefined {
    return this.executions.get(executionId);
  }
}

function createIo() {
  let stdout = '';
  let stderr = '';

  return {
    io: {
      stdout: { write: (chunk: string) => { stdout += chunk; return true; } },
      stderr: { write: (chunk: string) => { stderr += chunk; return true; } },
    },
    read: () => ({ stdout, stderr }),
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('runCli', () => {
  it('runs multiple scenarios in sequence and emits structured JSON output', async () => {
    const engine = new FakeEngine('http://victim.local', {
      alpha: { score: 91 },
      beta: { score: 74 },
      gamma: { score: 88 },
    });
    const dbClose = vi.fn();
    const createRuntime = vi.fn(
      () =>
        ({
          catalog: {
            getScenario: (id: string) => ({ id, name: `Scenario ${id}` }),
          },
          engine,
          db: { close: dbClose },
        } as unknown as CrucibleRuntime),
    );
    const { io, read } = createIo();

    const exitCode = await runCli(
      [
        'assess',
        '--scenario',
        'alpha',
        '--scenario=beta,gamma',
        '--target',
        'http://victim.local',
        '--fail-below',
        '80',
        '--format',
        'json',
      ],
      io,
      { createRuntime },
    );

    expect(exitCode).toBe(1);
    expect(createRuntime).toHaveBeenCalledWith(
      expect.objectContaining({
        targetUrl: 'http://victim.local',
        dbPath: ':memory:',
      }),
    );
    expect(engine.startedScenarioIds).toEqual(['alpha', 'beta', 'gamma']);
    expect(engine.triggerPayloads).toEqual([
      { invokedBy: 'cli' },
      { invokedBy: 'cli' },
      { invokedBy: 'cli' },
    ]);
    expect(dbClose).toHaveBeenCalledTimes(1);

    const output = JSON.parse(read().stdout);
    expect(output.command).toBe('assess');
    expect(output.targetUrl).toBe('http://victim.local');
    expect(output.results).toHaveLength(3);
    expect(output.results[0].scenarioId).toBe('alpha');
    expect(output.results[1].scenarioId).toBe('beta');
    expect(output.results[1].meetsThreshold).toBe(false);
    expect(output.results[2].scenarioId).toBe('gamma');
  });

  it('renders table output and treats missing scenarios as failures', async () => {
    const engine = new FakeEngine('http://localhost:9999', {
      alpha: { score: 95 },
    });
    const { io, read } = createIo();

    const exitCode = await runCli(
      [
        'assess',
        '--scenario',
        'alpha',
        '--scenario',
        'missing',
        '--format',
        'table',
      ],
      io,
      {
        createRuntime: () =>
          ({
            catalog: {
              getScenario: (id: string) => (id === 'alpha' ? { id, name: 'Scenario alpha' } : undefined),
            },
            engine,
            db: { close: vi.fn() },
          } as unknown as CrucibleRuntime),
      },
    );

    expect(exitCode).toBe(1);
    expect(read().stdout).toContain('Scenario');
    expect(read().stdout).toContain('alpha');
    expect(read().stdout).toContain('missing');
    expect(read().stdout).toContain('FAIL');
  });

  it('shows subcommand help on invalid arguments', async () => {
    const { io, read } = createIo();

    const exitCode = await runCli(['assess', '--fail-below', 'abc'], io);

    expect(exitCode).toBe(1);
    expect(read().stderr).toContain('--fail-below must be a number between 0 and 100');
    expect(read().stdout).toContain('Usage: crucible assess');
  });

  it('times out hanging assessments and emits a failed result', async () => {
    const engine = new FakeEngine('http://victim.local', {
      alpha: { score: 100, hang: true },
    });
    const { io, read } = createIo();

    const exitCode = await runCli(
      ['assess', '--scenario', 'alpha', '--timeout', '0.01', '--format', 'json'],
      io,
      {
        createRuntime: () =>
          ({
            catalog: {
              getScenario: (id: string) => ({ id, name: `Scenario ${id}` }),
            },
            engine,
            db: { close: vi.fn() },
          } as unknown as CrucibleRuntime),
      },
    );

    expect(exitCode).toBe(1);
    expect(engine.cancelledExecutionIds).toHaveLength(1);

    const output = JSON.parse(read().stdout);
    expect(output.results[0].status).toBe('failed');
    expect(output.results[0].meetsThreshold).toBe(false);
    expect(output.results[0].error).toContain('Timed out after 10ms');
  });
});
