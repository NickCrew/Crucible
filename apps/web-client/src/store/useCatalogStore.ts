'use client';

import { create } from 'zustand';
import type { Scenario } from '@crucible/catalog';

// ── Types (mirrors demo-dashboard/shared/types.ts) ──────────────────

export type ExecutionStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'paused'
  | 'skipped';

export interface PausedState {
  pendingStepIds: string[];
  completedStepIds: string[];
  context: Record<string, unknown>;
  passedSteps: number;
  stepResults: Record<string, ExecutionStepResult>;
}

export interface AssertionResult {
  field: string;
  expected: unknown;
  actual: unknown;
  passed: boolean;
}

export interface ExecutionStepResult {
  stepId: string;
  status: ExecutionStatus;
  startedAt?: number;
  completedAt?: number;
  duration?: number;
  result?: Record<string, unknown>;
  error?: string;
  logs?: string[];
  attempts: number;
  assertions?: AssertionResult[];
}

export interface ExecutionStepDelta extends Partial<Omit<ExecutionStepResult, 'stepId'>> {
  stepId: string;
}

export interface ScenarioExecution {
  id: string;
  scenarioId: string;
  mode: 'simulation' | 'assessment';
  status: ExecutionStatus;
  startedAt?: number;
  completedAt?: number;
  duration?: number;
  steps: ExecutionStepResult[];
  error?: string;
  triggerData?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  context?: Record<string, unknown>;
  pausedState?: PausedState;
  parentExecutionId?: string;
  report?: {
    summary: string;
    passed: boolean;
    score: number;
    artifacts: string[];
  };
}

export interface ScenarioExecutionDelta {
  id: string;
  changes: Partial<Omit<ScenarioExecution, 'id' | 'steps'>> & {
    steps?: ExecutionStepDelta[];
  };
}

export interface ExecutionMetricsPoint {
  timestamp: number;
  activeExecutions: number;
  completedExecutions: number;
  failedExecutions: number;
  runningSteps: number;
  completedSteps: number;
  failedSteps: number;
}

type ExecutionMetricsSnapshot = Omit<ExecutionMetricsPoint, 'timestamp'>;

const DEFAULT_METRICS_HISTORY_LIMIT = 60;
const DEFAULT_METRICS_THROTTLE_MS = 500;

// ── Store ────────────────────────────────────────────────────────────

interface CatalogState {
  scenarios: Scenario[];
  executions: ScenarioExecution[];
  activeExecution: ScenarioExecution | null;
  metricsHistory: ExecutionMetricsPoint[];
  metricsHistoryLimit: number;
  metricsThrottleMs: number;
  isLoading: boolean;
  error: string | null;
  wsConnected: boolean;
  targetUrl: string | null;

  fetchScenarios: () => Promise<void>;
  fetchHealth: () => Promise<void>;
  updateScenario: (id: string, data: Scenario) => Promise<void>;
  startSimulation: (scenarioId: string) => Promise<string>;
  startAssessment: (scenarioId: string) => Promise<string>;
  updateExecution: (execution: ScenarioExecution) => void;
  applyExecutionDelta: (delta: ScenarioExecutionDelta) => void;
  setActiveExecution: (executionId: string | null) => void;
  setWsConnected: (connected: boolean) => void;
  clearError: () => void;
  resetMetricsHistory: () => void;

  pauseExecution: (id: string) => Promise<void>;
  resumeExecution: (id: string) => Promise<void>;
  cancelExecution: (id: string) => Promise<void>;
  restartExecution: (id: string) => Promise<string>;
  pauseAll: () => Promise<number>;
  resumeAll: () => Promise<number>;
  cancelAll: () => Promise<number>;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const METRICS_HISTORY_LIMIT = parsePositiveInteger(
  process.env.NEXT_PUBLIC_METRICS_HISTORY_LIMIT,
  DEFAULT_METRICS_HISTORY_LIMIT,
);
const METRICS_THROTTLE_MS = parsePositiveInteger(
  process.env.NEXT_PUBLIC_METRICS_THROTTLE_MS,
  DEFAULT_METRICS_THROTTLE_MS,
);

type CatalogStateSnapshot = Pick<
  CatalogState,
  | 'scenarios'
  | 'executions'
  | 'activeExecution'
  | 'metricsHistory'
  | 'metricsHistoryLimit'
  | 'metricsThrottleMs'
  | 'isLoading'
  | 'error'
  | 'wsConnected'
  | 'targetUrl'
>;

export const catalogInitialState: CatalogStateSnapshot = {
  scenarios: [],
  executions: [],
  activeExecution: null,
  metricsHistory: [],
  metricsHistoryLimit: METRICS_HISTORY_LIMIT,
  metricsThrottleMs: METRICS_THROTTLE_MS,
  isLoading: false,
  error: null,
  wsConnected: false,
  targetUrl: null,
};

export const useCatalogStore = create<CatalogState>((set, get) => {
  let metricsFlushTimer: ReturnType<typeof setTimeout> | null = null;

  const clearMetricsFlushTimer = (): void => {
    if (metricsFlushTimer) {
      clearTimeout(metricsFlushTimer);
      metricsFlushTimer = null;
    }
  };

  const captureMetricsSample = (timestamp: number): void => {
    clearMetricsFlushTimer();

    set((state) => {
      const point: ExecutionMetricsPoint = {
        timestamp,
        ...deriveMetricsSnapshot(state.executions),
      };

      return {
        metricsHistory: appendMetricsPoint(state.metricsHistory, point, state.metricsHistoryLimit),
      };
    });
  };

  const scheduleMetricsSample = (): void => {
    const now = Date.now();
    let nextDelayMs: number | null = null;

    set((state) => {
      const lastPoint = state.metricsHistory.at(-1);

      if (!lastPoint || now - lastPoint.timestamp >= state.metricsThrottleMs) {
        return {
          metricsHistory: appendMetricsPoint(
            state.metricsHistory,
            { timestamp: now, ...deriveMetricsSnapshot(state.executions) },
            state.metricsHistoryLimit,
          ),
        };
      }

      if (!metricsFlushTimer) {
        nextDelayMs = state.metricsThrottleMs - (now - lastPoint.timestamp);
      }

      return {};
    });

    if (nextDelayMs != null && !metricsFlushTimer) {
      // Keep a trailing sample so the chart settles on the latest execution state.
      metricsFlushTimer = setTimeout(() => {
        metricsFlushTimer = null;
        captureMetricsSample(Date.now());
      }, nextDelayMs);
    }
  };

  return {
    ...catalogInitialState,
    fetchHealth: async () => {
      try {
        const base = API_BASE.replace(/\/api$/, '');
        const response = await fetch(`${base}/health`);
        if (!response.ok) return;
        const data = await response.json();
        if (data.targetUrl) set({ targetUrl: data.targetUrl });
      } catch {
        // health check is best-effort
      }
    },

    fetchScenarios: async () => {
      set({ isLoading: true, error: null });
      try {
        const response = await fetch(`${API_BASE}/scenarios`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        set({ scenarios: data, isLoading: false });
      } catch {
        set({ error: 'Failed to fetch scenarios', isLoading: false });
      }
    },

    updateScenario: async (id: string, data: Scenario) => {
      const response = await fetch(`${API_BASE}/scenarios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
        throw new Error(err.error || `HTTP ${response.status}`);
      }
      const updated: Scenario = await response.json();
      set((state) => ({
        scenarios: state.scenarios.map((s) => (s.id === id ? updated : s)),
      }));
    },

    startSimulation: async (scenarioId: string) => {
      try {
        const response = await fetch(`${API_BASE}/simulations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scenarioId }),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const { executionId } = await response.json();
        return executionId;
      } catch {
        set({ error: 'Failed to start simulation' });
        throw new Error('Failed to start simulation');
      }
    },

    startAssessment: async (scenarioId: string) => {
      try {
        const response = await fetch(`${API_BASE}/assessments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scenarioId }),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const { executionId } = await response.json();
        return executionId;
      } catch {
        set({ error: 'Failed to start assessment' });
        throw new Error('Failed to start assessment');
      }
    },

    updateExecution: (execution: ScenarioExecution) => {
      set((state) => {
        const newExecutions = state.executions.some((e) => e.id === execution.id)
          ? state.executions.map((e) => (e.id === execution.id ? execution : e))
          : [execution, ...state.executions];

        const activeExecution =
          state.activeExecution?.id === execution.id ? execution : state.activeExecution;

        return { executions: newExecutions, activeExecution };
      });

      scheduleMetricsSample();
    },

    applyExecutionDelta: (delta: ScenarioExecutionDelta) => {
      let appliedDelta = false;

      set((state) => {
        const targetExecution = state.executions.find((execution) => execution.id === delta.id);
        if (!targetExecution) {
          return {};
        }

        appliedDelta = true;

        const mergedExecution = mergeExecutionDelta(targetExecution, delta);
        const executions = state.executions.map((execution) =>
          execution.id === delta.id ? mergedExecution : execution,
        );
        const activeExecution =
          state.activeExecution?.id === delta.id ? mergedExecution : state.activeExecution;

        return {
          executions,
          activeExecution,
        };
      });

      if (appliedDelta) {
        scheduleMetricsSample();
      }
    },

    setActiveExecution: (executionId: string | null) => {
      if (!executionId) {
        set({ activeExecution: null });
        return;
      }
      const execution = get().executions.find((e) => e.id === executionId) ?? null;
      set({ activeExecution: execution });
    },

    setWsConnected: (connected: boolean) => set({ wsConnected: connected }),
    clearError: () => set({ error: null }),
    resetMetricsHistory: () => {
      clearMetricsFlushTimer();
      set({ metricsHistory: [] });
    },

    pauseExecution: async (id: string) => {
      const res = await fetch(`${API_BASE}/executions/${id}/pause`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        set({ error: err.error });
      }
    },

    resumeExecution: async (id: string) => {
      const res = await fetch(`${API_BASE}/executions/${id}/resume`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        set({ error: err.error });
      }
    },

    cancelExecution: async (id: string) => {
      const res = await fetch(`${API_BASE}/executions/${id}/cancel`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        set({ error: err.error });
      }
    },

    restartExecution: async (id: string) => {
      const res = await fetch(`${API_BASE}/executions/${id}/restart`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        set({ error: err.error });
        throw new Error(err.error);
      }
      const { executionId } = await res.json();
      return executionId;
    },

    pauseAll: async () => {
      const res = await fetch(`${API_BASE}/executions/pause-all`, { method: 'POST' });
      if (!res.ok) {
        set({ error: 'Failed to pause all executions' });
        return 0;
      }
      const { count } = await res.json();
      return count;
    },

    resumeAll: async () => {
      const res = await fetch(`${API_BASE}/executions/resume-all`, { method: 'POST' });
      if (!res.ok) {
        set({ error: 'Failed to resume all executions' });
        return 0;
      }
      const { count } = await res.json();
      return count;
    },

    cancelAll: async () => {
      const res = await fetch(`${API_BASE}/executions/cancel-all`, { method: 'POST' });
      if (!res.ok) {
        set({ error: 'Failed to cancel all executions' });
        return 0;
      }
      const { count } = await res.json();
      return count;
    },
  };
});

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function appendMetricsPoint(
  history: ExecutionMetricsPoint[],
  point: ExecutionMetricsPoint,
  limit: number,
): ExecutionMetricsPoint[] {
  return history.length >= limit ? [...history.slice(1), point] : [...history, point];
}

function isActiveExecution(status: ExecutionStatus): boolean {
  return status === 'pending' || status === 'running' || status === 'paused';
}

function deriveMetricsSnapshot(executions: ScenarioExecution[]): ExecutionMetricsSnapshot {
  let activeExecutions = 0;
  let completedExecutions = 0;
  let failedExecutions = 0;
  let runningSteps = 0;
  let completedSteps = 0;
  let failedSteps = 0;

  for (const execution of executions) {
    if (isActiveExecution(execution.status)) activeExecutions += 1;
    if (execution.status === 'completed') completedExecutions += 1;
    // Cancelled runs are grouped into the fault lane so operator charts show non-success exits together.
    if (execution.status === 'failed' || execution.status === 'cancelled') failedExecutions += 1;

    for (const step of execution.steps) {
      if (step.status === 'running') runningSteps += 1;
      if (step.status === 'completed') completedSteps += 1;
      if (step.status === 'failed' || step.status === 'cancelled') failedSteps += 1;
    }
  }

  return {
    activeExecutions,
    completedExecutions,
    failedExecutions,
    runningSteps,
    completedSteps,
    failedSteps,
  };
}

function mergeExecutionDelta(
  execution: ScenarioExecution,
  delta: ScenarioExecutionDelta,
): ScenarioExecution {
  const { steps: stepChanges, ...topLevelChanges } = delta.changes;

  return {
    ...execution,
    ...topLevelChanges,
    steps: stepChanges ? mergeExecutionSteps(execution.steps, stepChanges) : execution.steps,
  };
}

function mergeExecutionSteps(
  existingSteps: ExecutionStepResult[],
  stepChanges: ExecutionStepDelta[],
): ExecutionStepResult[] {
  const stepsById = new Map(existingSteps.map((step) => [step.stepId, step]));

  for (const stepChange of stepChanges) {
    const existingStep = stepsById.get(stepChange.stepId);
    stepsById.set(
      stepChange.stepId,
      existingStep ? { ...existingStep, ...stepChange } : (stepChange as ExecutionStepResult),
    );
  }

  const mergedSteps = existingSteps.map((step) => stepsById.get(step.stepId) ?? step);
  for (const stepChange of stepChanges) {
    if (!existingSteps.some((step) => step.stepId === stepChange.stepId)) {
      mergedSteps.push(stepChange as ExecutionStepResult);
    }
  }

  return mergedSteps;
}
