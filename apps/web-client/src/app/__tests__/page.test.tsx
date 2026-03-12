import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import DashboardPage from '../page';

const mockFetchScenarios = vi.fn();

let mockState: Record<string, unknown> = {};

vi.mock('@/store/useCatalogStore', () => ({
  useCatalogStore: () => ({
    scenarios: mockState.scenarios ?? [],
    executions: mockState.executions ?? [],
    metricsHistory: mockState.metricsHistory ?? [],
    metricsThrottleMs: mockState.metricsThrottleMs ?? 500,
    fetchScenarios: mockFetchScenarios,
  }),
}));

function makeMetricPoint(overrides: Record<string, unknown> = {}) {
  return {
    timestamp: Date.parse('2026-03-12T05:30:00Z'),
    activeExecutions: 1,
    completedExecutions: 0,
    failedExecutions: 0,
    runningSteps: 2,
    completedSteps: 3,
    failedSteps: 0,
    ...overrides,
  };
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState = {
      scenarios: [
        { id: 'scenario-1', name: 'Auth Sweep', category: 'auth', steps: [] },
        { id: 'scenario-2', name: 'API Abuse', category: 'api', steps: [] },
      ],
      executions: [
        {
          id: 'exec-1',
          scenarioId: 'scenario-1',
          mode: 'simulation',
          status: 'running',
          steps: [],
        },
      ],
      metricsHistory: [],
      metricsThrottleMs: 500,
    };
  });

  it('fetches scenarios on mount and shows the telemetry placeholder without history', () => {
    render(<DashboardPage />);

    expect(mockFetchScenarios).toHaveBeenCalledTimes(1);
    expect(screen.getByText('TELEMETRY_FEED :: AWAITING_LIVE_EXECUTIONS')).toBeInTheDocument();
  });

  it('renders a live telemetry chart when metrics history is available', () => {
    mockState.metricsHistory = [
      makeMetricPoint(),
      makeMetricPoint({
        timestamp: Date.parse('2026-03-12T05:30:00.500Z'),
        activeExecutions: 2,
        completedSteps: 5,
        failedSteps: 1,
      }),
    ];

    render(<DashboardPage />);

    expect(screen.getByTestId('execution-metrics-chart')).toBeInTheDocument();
    expect(screen.getByText('Active Executions')).toBeInTheDocument();
    expect(screen.getByText('Resolved Steps')).toBeInTheDocument();
    expect(screen.getByText('Failed Steps')).toBeInTheDocument();
    expect(screen.getByText('2 samples · ~500ms cadence')).toBeInTheDocument();
  });

  it('renders recent scenario details and the last execution summary from the store', () => {
    render(<DashboardPage />);

    expect(screen.getByText('Auth Sweep')).toBeInTheDocument();
    expect(screen.getByText('API Abuse')).toBeInTheDocument();
    expect(screen.getByText('RUNNING')).toBeInTheDocument();
    expect(screen.getByText('Scenario scenario-1')).toBeInTheDocument();
  });

  it('handles empty scenario and execution collections without crashing', () => {
    mockState.scenarios = [];
    mockState.executions = [];

    render(<DashboardPage />);

    expect(screen.getByText('No recent activity')).toBeInTheDocument();
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('renders a single telemetry point with the configured cadence footer', () => {
    mockState.metricsHistory = [makeMetricPoint({ activeExecutions: 4, completedSteps: 7 })];
    mockState.metricsThrottleMs = 1000;

    render(<DashboardPage />);

    expect(screen.getByTestId('execution-metrics-chart')).toBeInTheDocument();
    expect(screen.getByText('1 sample · ~1000ms cadence')).toBeInTheDocument();
    expect(
      within(screen.getByText('Active Executions').closest('div')!.parentElement!).getByText('4'),
    ).toBeInTheDocument();
    expect(
      within(screen.getByText('Resolved Steps').closest('div')!.parentElement!).getByText('7'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: /live execution telemetry chart/i }),
    ).toBeInTheDocument();
  });

  it('shows the first execution in the store as the current summary even with multiple statuses present', () => {
    mockState.executions = [
      {
        id: 'exec-9',
        scenarioId: 'scenario-api',
        mode: 'assessment',
        status: 'failed',
        steps: [],
      },
      {
        id: 'exec-8',
        scenarioId: 'scenario-1',
        mode: 'simulation',
        status: 'completed',
        steps: [],
      },
    ];

    render(<DashboardPage />);

    expect(screen.getByText('FAILED')).toBeInTheDocument();
    expect(screen.getByText('Scenario scenario-api')).toBeInTheDocument();
  });

  it('re-renders when new live metrics arrive after mount', () => {
    const { rerender } = render(<DashboardPage />);

    expect(screen.getByText('TELEMETRY_FEED :: AWAITING_LIVE_EXECUTIONS')).toBeInTheDocument();

    mockState.metricsHistory = [
      makeMetricPoint(),
      makeMetricPoint({
        timestamp: Date.parse('2026-03-12T05:30:00.500Z'),
        activeExecutions: 3,
        completedSteps: 9,
        failedSteps: 2,
      }),
    ];

    rerender(<DashboardPage />);

    expect(screen.getByTestId('execution-metrics-chart')).toBeInTheDocument();
    expect(screen.getByText('2 samples · ~500ms cadence')).toBeInTheDocument();
  });
});
