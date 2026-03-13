import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import DashboardPage, { DEFAULT_API_BASE } from '../page';

const mockFetchScenarios = vi.fn();
const mockFetch = vi.fn();

let mockState: Record<string, unknown> = {};

vi.mock('@/store/useCatalogStore', () => ({
  useCatalogStore: () => ({
    scenarios: mockState.scenarios ?? [],
    executions: mockState.executions ?? [],
    activeExecution: mockState.activeExecution ?? null,
    metricsHistory: mockState.metricsHistory ?? [],
    metricsThrottleMs: mockState.metricsThrottleMs ?? 500,
    fetchScenarios: mockFetchScenarios,
  }),
}));

vi.mock('@/components/remote-terminal', () => ({
  RemoteTerminal: ({ executionId }: { executionId: string }) => (
    <div data-testid="remote-terminal">{executionId}</div>
  ),
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

function makeAssessmentExecution(overrides: Record<string, unknown> = {}) {
  return {
    id: 'assessment-1',
    scenarioId: 'scenario-1',
    mode: 'assessment',
    status: 'completed',
    startedAt: Date.parse('2026-03-12T05:20:00Z'),
    completedAt: Date.parse('2026-03-12T05:30:00Z'),
    steps: [],
    report: {
      summary: 'Assessment complete',
      passed: true,
      score: 92,
      artifacts: [],
    },
    ...overrides,
  };
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockImplementation(() => new Promise(() => {}));
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
      activeExecution: null,
      metricsHistory: [],
      metricsThrottleMs: 500,
    };
  });

  it('fetches scenarios on mount and shows the telemetry placeholder without history', () => {
    render(<DashboardPage />);

    expect(mockFetchScenarios).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      `${DEFAULT_API_BASE}/executions?mode=assessment&limit=50`,
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
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

  it('renders assessment trend data from persisted history and scenario pass rates', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        makeAssessmentExecution(),
        makeAssessmentExecution({
          id: 'assessment-2',
          scenarioId: 'scenario-2',
          completedAt: Date.parse('2026-03-12T06:00:00Z'),
          report: {
            summary: 'Assessment failed',
            passed: false,
            score: 41,
            artifacts: [],
          },
        }),
      ],
    });

    render(<DashboardPage />);

    const panel = await screen.findByTestId('assessment-trend-panel');
    expect(panel).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /assessment score trend chart/i })).toBeInTheDocument();
    expect(within(panel).getByText('41%')).toBeInTheDocument();
    expect(within(panel).getByText('Auth Sweep')).toBeInTheDocument();
    expect(within(panel).getByText('API Abuse')).toBeInTheDocument();
    expect(within(panel).getByText('100%')).toBeInTheDocument();
    expect(within(panel).getByText('0%')).toBeInTheDocument();
  });

  it('updates the assessment trend panel when a new live assessment completes', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [makeAssessmentExecution()],
    });

    const { rerender } = render(<DashboardPage />);
    let panel = await screen.findByTestId('assessment-trend-panel');
    expect(panel).toBeInTheDocument();
    expect(within(panel).getAllByText('92%').length).toBeGreaterThan(0);

    mockState.executions = [
      {
        id: 'assessment-live',
        scenarioId: 'scenario-2',
        mode: 'assessment',
        status: 'completed',
        startedAt: Date.parse('2026-03-12T07:00:00Z'),
        completedAt: Date.parse('2026-03-12T07:05:00Z'),
        steps: [],
        report: {
          summary: 'Live assessment',
          passed: false,
          score: 28,
          artifacts: [],
        },
      },
      ...((mockState.executions as Array<Record<string, unknown>>) ?? []),
    ];

    rerender(<DashboardPage />);

    panel = await screen.findByTestId('assessment-trend-panel');
    expect(within(panel).getByText('28%')).toBeInTheDocument();
    expect(within(panel).getByText('50%')).toBeInTheDocument();
    expect(within(panel).getByText('1 pass')).toBeInTheDocument();
    expect(within(panel).getByText('1 fail')).toBeInTheDocument();
  });

  it('shows an assessment history error state when the API request fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
    });

    render(<DashboardPage />);

    expect(await screen.findByText(/Assessment history request failed \(503\)/)).toBeInTheDocument();
    expect(screen.getByText('ASSESSMENT_HISTORY :: UNAVAILABLE')).toBeInTheDocument();
  });

  it('renders the active terminal only for running or paused executions', async () => {
    mockState.activeExecution = {
      id: 'exec-running',
      scenarioId: 'scenario-1',
      mode: 'simulation',
      status: 'running',
      steps: [],
    };

    const { rerender } = render(<DashboardPage />);

    expect(await screen.findByTestId('remote-terminal')).toHaveTextContent('exec-running');

    mockState.activeExecution = {
      id: 'exec-complete',
      scenarioId: 'scenario-1',
      mode: 'simulation',
      status: 'completed',
      steps: [],
    };

    rerender(<DashboardPage />);

    expect(screen.queryByTestId('remote-terminal')).not.toBeInTheDocument();
  });

  it('aborts the assessment history request on unmount', () => {
    let capturedSignal: AbortSignal | undefined;
    mockFetch.mockImplementationOnce((_input: RequestInfo | URL, init?: RequestInit) => {
      capturedSignal = init?.signal as AbortSignal | undefined;
      return new Promise(() => {});
    });

    const { unmount } = render(<DashboardPage />);

    expect(capturedSignal?.aborted).toBe(false);

    unmount();

    expect(capturedSignal?.aborted).toBe(true);
  });
});
