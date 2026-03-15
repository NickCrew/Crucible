import { tmpdir } from 'os';
import { join } from 'path';
import type { Scenario } from '@crucible/catalog';
import type { ScenarioExecution, ExecutionStatus } from '../shared/types.js';
import {
  createCrucibleRuntime,
  type CrucibleRuntime,
  type CreateCrucibleRuntimeOptions,
} from '../server/runtime.js';

const TERMINAL_STATUSES = new Set<ExecutionStatus>(['completed', 'failed', 'cancelled']);
const DEFAULT_FAIL_BELOW = 80;
const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000;

type OutputFormat = 'json' | 'table';

export interface CliIO {
  stdout: Pick<NodeJS.WriteStream, 'write'>;
  stderr: Pick<NodeJS.WriteStream, 'write'>;
}

export interface AssessCommandOptions {
  scenarioIds: string[];
  targetUrl?: string;
  dbPath?: string;
  reportsDir?: string;
  failBelow: number;
  timeoutMs: number;
  format: OutputFormat;
}

export interface AssessScenarioResult {
  scenarioId: string;
  scenarioName?: string;
  executionId?: string;
  status: ExecutionStatus | 'not-found';
  summary: string;
  score: number | null;
  reportPassed: boolean | null;
  meetsThreshold: boolean;
  failBelow: number;
  durationMs?: number;
  targetUrl?: string;
  artifacts: string[];
  stepCount: number;
  failedStepCount: number;
  error?: string;
}

export interface AssessCommandResult {
  command: 'assess';
  targetUrl?: string;
  failBelow: number;
  format: OutputFormat;
  scenarioCount: number;
  passed: boolean;
  exitCode: 0 | 1;
  results: AssessScenarioResult[];
}

export interface CliDependencies {
  createRuntime?: (options: CreateCrucibleRuntimeOptions) => CrucibleRuntime;
}

export async function runCli(
  argv: string[] = process.argv.slice(2),
  io: CliIO = { stdout: process.stdout, stderr: process.stderr },
  deps: CliDependencies = {},
): Promise<number> {
  const [command, ...rest] = argv;

  if (!command || isHelpFlag(command)) {
    io.stdout.write(renderGeneralHelp());
    return command ? 0 : 1;
  }

  if (command !== 'assess') {
    io.stderr.write(`Unknown command: ${command}\n`);
    io.stdout.write(renderGeneralHelp());
    return 1;
  }

  if (rest.some(isHelpFlag)) {
    io.stdout.write(renderAssessHelp());
    return 0;
  }

  let options: AssessCommandOptions;
  try {
    options = parseAssessArgs(rest);
  } catch (error) {
    io.stderr.write(`${formatError(error)}\n`);
    io.stdout.write(renderAssessHelp());
    return 1;
  }

  const result = await runAssessCommand(options, deps);
  writeAssessOutput(result, io.stdout);
  return result.exitCode;
}

export function parseAssessArgs(argv: string[]): AssessCommandOptions {
  const scenarioIds: string[] = [];
  let targetUrl: string | undefined;
  let failBelow = DEFAULT_FAIL_BELOW;
  let timeoutMs = DEFAULT_TIMEOUT_MS;
  let format: OutputFormat = 'json';

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];

    if (arg === '--scenario' || arg.startsWith('--scenario=')) {
      const value = readFlagValue(arg, argv[index + 1], '--scenario');
      if (arg === '--scenario') {
        index++;
      }
      scenarioIds.push(...splitScenarioIds(value));
      continue;
    }

    if (arg === '--target' || arg.startsWith('--target=')) {
      const value = readFlagValue(arg, argv[index + 1], '--target');
      if (arg === '--target') {
        index++;
      }
      targetUrl = value;
      continue;
    }

    if (arg === '--fail-below' || arg.startsWith('--fail-below=')) {
      const value = readFlagValue(arg, argv[index + 1], '--fail-below');
      if (arg === '--fail-below') {
        index++;
      }
      const parsed = Number(value);
      if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
        throw new Error('--fail-below must be a number between 0 and 100');
      }
      failBelow = parsed;
      continue;
    }

    if (arg === '--format' || arg.startsWith('--format=')) {
      const value = readFlagValue(arg, argv[index + 1], '--format');
      if (arg === '--format') {
        index++;
      }
      if (value !== 'json' && value !== 'table') {
        throw new Error('--format must be either "json" or "table"');
      }
      format = value;
      continue;
    }

    if (arg === '--timeout' || arg.startsWith('--timeout=')) {
      const value = readFlagValue(arg, argv[index + 1], '--timeout');
      if (arg === '--timeout') {
        index++;
      }
      const parsed = Number(value);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new Error('--timeout must be a positive number of seconds');
      }
      timeoutMs = Math.round(parsed * 1000);
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (scenarioIds.length === 0) {
    throw new Error('At least one --scenario value is required');
  }

  return { scenarioIds, targetUrl, failBelow, timeoutMs, format };
}

export async function runAssessCommand(
  options: AssessCommandOptions,
  deps: CliDependencies = {},
): Promise<AssessCommandResult> {
  const createRuntime = deps.createRuntime ?? createCrucibleRuntime;
  const runtime = createRuntime({
    targetUrl: options.targetUrl,
    dbPath: options.dbPath ?? process.env.CRUCIBLE_DB_PATH ?? ':memory:',
    reportsDir: options.reportsDir ?? process.env.CRUCIBLE_REPORTS_DIR ?? join(tmpdir(), 'crucible-cli-reports'),
  });

  try {
    const results: AssessScenarioResult[] = [];

    for (const scenarioId of options.scenarioIds) {
      const scenario = runtime.catalog.getScenario(scenarioId);
      if (!scenario) {
        results.push({
          scenarioId,
          status: 'not-found',
          summary: `Scenario ${scenarioId} not found.`,
          score: null,
          reportPassed: null,
          meetsThreshold: false,
          failBelow: options.failBelow,
          artifacts: [],
          stepCount: 0,
          failedStepCount: 0,
          error: `Scenario ${scenarioId} not found`,
        });
        continue;
      }

      const executionId = await runtime.engine.startScenario(
        scenarioId,
        'assessment',
        { invokedBy: 'cli' },
      );
      const execution = await waitForExecution(runtime, executionId, scenarioId, options.timeoutMs);
      results.push(buildScenarioResult(execution, scenario, options.failBelow));
    }

    const passed = results.every((result) => result.meetsThreshold);
    const output: AssessCommandResult = {
      command: 'assess',
      targetUrl: runtime.engine.targetUrl,
      failBelow: options.failBelow,
      format: options.format,
      scenarioCount: results.length,
      passed,
      exitCode: passed ? 0 : 1,
      results,
    };

    return output;
  } finally {
    runtime.engine.destroy();
    runtime.db.close();
  }
}

function buildScenarioResult(
  execution: ScenarioExecution,
  scenario: Scenario,
  failBelow: number,
): AssessScenarioResult {
  const score = execution.report?.score ?? null;
  const failedStepCount = execution.steps.filter((step) => step.status === 'failed').length;
  const meetsThreshold = execution.status === 'completed' && score !== null && score >= failBelow;

  return {
    scenarioId: execution.scenarioId,
    scenarioName: scenario.name,
    executionId: execution.id,
    status: execution.status,
    summary: execution.report?.summary ?? execution.error ?? 'Assessment completed without a report summary.',
    score,
    reportPassed: execution.report?.passed ?? null,
    meetsThreshold,
    failBelow,
    durationMs: execution.duration,
    targetUrl: execution.targetUrl,
    artifacts: execution.report?.artifacts ?? [],
    stepCount: execution.steps.length,
    failedStepCount,
    error: execution.error,
  };
}

async function waitForExecution(
  runtime: CrucibleRuntime,
  executionId: string,
  scenarioId: string,
  timeoutMs: number,
): Promise<ScenarioExecution> {
  const existing = runtime.engine.getExecution(executionId);
  if (existing && TERMINAL_STATUSES.has(existing.status)) {
    return existing;
  }

  return new Promise<ScenarioExecution>((resolve) => {
    let settled = false;
    const timeoutHandle = setTimeout(() => {
      settled = true;
      const latest = runtime.engine.getExecution(executionId);
      runtime.engine.cancelExecution(executionId);
      cleanup();
      resolve(buildTimedOutExecution(executionId, scenarioId, runtime.engine.targetUrl, latest, timeoutMs));
    }, timeoutMs);

    const resolveIfMatching = (execution: ScenarioExecution) => {
      if (settled || execution.id !== executionId) {
        return;
      }
      settled = true;
      cleanup();
      resolve(execution);
    };

    const cleanup = () => {
      clearTimeout(timeoutHandle);
      runtime.engine.off('execution:completed', resolveIfMatching);
      runtime.engine.off('execution:failed', resolveIfMatching);
      runtime.engine.off('execution:cancelled', resolveIfMatching);
    };

    runtime.engine.on('execution:completed', resolveIfMatching);
    runtime.engine.on('execution:failed', resolveIfMatching);
    runtime.engine.on('execution:cancelled', resolveIfMatching);

    const latest = runtime.engine.getExecution(executionId);
    if (latest && TERMINAL_STATUSES.has(latest.status)) {
      settled = true;
      cleanup();
      resolve(latest);
    }
  });
}

function buildTimedOutExecution(
  executionId: string,
  scenarioId: string,
  targetUrl: string,
  latest: ScenarioExecution | undefined,
  timeoutMs: number,
): ScenarioExecution {
  const startedAt = latest?.startedAt ?? Date.now();
  const completedAt = Date.now();
  const error = `Timed out after ${timeoutMs}ms waiting for scenario ${scenarioId} to finish.`;

  return {
    id: executionId,
    scenarioId,
    mode: 'assessment',
    status: 'failed',
    startedAt,
    completedAt,
    duration: completedAt - startedAt,
    steps: latest?.steps ?? [],
    triggerData: latest?.triggerData,
    context: latest?.context,
    targetUrl,
    error,
    report: {
      summary: error,
      passed: false,
      score: 0,
      artifacts: latest?.report?.artifacts ?? [],
    },
  };
}

function writeAssessOutput(
  result: AssessCommandResult,
  stdout: Pick<NodeJS.WriteStream, 'write'>,
): void {
  if (result.format === 'json') {
    stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }

  stdout.write(renderTable(result));
}

function renderTable(result: AssessCommandResult): string {
  const headers = ['Scenario', 'Status', 'Score', 'Threshold', 'Verdict', 'Duration'];
  const rows = result.results.map((scenarioResult) => [
    scenarioResult.scenarioId,
    scenarioResult.status,
    scenarioResult.score === null ? 'n/a' : `${scenarioResult.score}%`,
    `${scenarioResult.failBelow}%`,
    scenarioResult.meetsThreshold ? 'PASS' : 'FAIL',
    formatDuration(scenarioResult.durationMs),
  ]);

  const widths = headers.map((header, index) =>
    Math.max(header.length, ...rows.map((row) => row[index].length)),
  );

  const renderRow = (cells: string[]) =>
    `${cells.map((cell, index) => cell.padEnd(widths[index])).join('  ')}\n`;

  let output = '';
  output += renderRow(headers);
  output += renderRow(widths.map((width) => '-'.repeat(width)));

  for (const row of rows) {
    output += renderRow(row);
  }

  output += '\n';
  output += `Overall: ${result.passed ? 'PASS' : 'FAIL'} (${result.results.filter((item) => item.meetsThreshold).length}/${result.results.length} met threshold)\n`;

  return output;
}

function formatDuration(durationMs?: number): string {
  if (durationMs == null) {
    return 'n/a';
  }
  if (durationMs < 1000) {
    return `${durationMs}ms`;
  }
  return `${(durationMs / 1000).toFixed(1)}s`;
}

function splitScenarioIds(value: string): string[] {
  const ids = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (ids.length === 0) {
    throw new Error('--scenario requires a non-empty value');
  }

  return ids;
}

function readFlagValue(arg: string, nextArg: string | undefined, flagName: string): string {
  if (arg.startsWith(`${flagName}=`)) {
    const value = arg.slice(flagName.length + 1).trim();
    if (!value) {
      throw new Error(`${flagName} requires a value`);
    }
    return value;
  }

  if (!nextArg || nextArg.startsWith('--')) {
    throw new Error(`${flagName} requires a value`);
  }

  return nextArg;
}

function isHelpFlag(value: string): boolean {
  return value === '--help' || value === '-h';
}

function renderGeneralHelp(): string {
  return [
    'Usage: crucible <command> [options]',
    '',
    'Commands:',
    '  assess   Run one or more scenarios in headless assessment mode',
    '',
    'Run `crucible assess --help` for assessment options.',
    '',
  ].join('\n');
}

function renderAssessHelp(): string {
  return [
    'Usage: crucible assess --scenario <id> [options]',
    '',
    'Options:',
    '  --scenario <id>       Scenario ID to assess. Repeat or pass a comma-separated list.',
    '  --target <url>        Override the target URL for this run.',
    '  --fail-below <score>  Exit non-zero when a score falls below this value. Default: 80.',
    '  --timeout <seconds>   Maximum time to wait for each scenario. Default: 300.',
    '  --format <format>     Output format: json or table. Default: json.',
    '  --help                Show this help message.',
    '',
  ].join('\n');
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
