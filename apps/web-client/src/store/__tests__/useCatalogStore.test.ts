import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCatalogStore } from '../useCatalogStore';

// ── TASK-15: useCatalogStore operations and error handling ────────────

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

function mockJsonResponse(status: number, data: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
  };
}

describe('useCatalogStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store to initial state
    useCatalogStore.setState({
      scenarios: [],
      executions: [],
      activeExecution: null,
      isLoading: false,
      error: null,
      wsConnected: false,
    });
  });

  describe('initial state', () => {
    it('has empty initial state', () => {
      const state = useCatalogStore.getState();
      expect(state.scenarios).toEqual([]);
      expect(state.executions).toEqual([]);
      expect(state.activeExecution).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.wsConnected).toBe(false);
    });
  });

  describe('fetchScenarios', () => {
    it('fetches and sets scenarios', async () => {
      const scenarios = [
        { id: 'a', name: 'Alpha', steps: [] },
        { id: 'b', name: 'Beta', steps: [] },
      ];
      mockFetch.mockResolvedValueOnce(mockJsonResponse(200, scenarios));

      await useCatalogStore.getState().fetchScenarios();

      const state = useCatalogStore.getState();
      expect(state.scenarios).toEqual(scenarios);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('sets loading state during fetch', async () => {
      let resolvePromise: (v: any) => void;
      mockFetch.mockReturnValueOnce(
        new Promise((resolve) => {
          resolvePromise = resolve;
        }),
      );

      const fetchPromise = useCatalogStore.getState().fetchScenarios();

      expect(useCatalogStore.getState().isLoading).toBe(true);

      resolvePromise!(mockJsonResponse(200, []));
      await fetchPromise;

      expect(useCatalogStore.getState().isLoading).toBe(false);
    });

    it('sets error on fetch failure', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse(500, {}));

      await useCatalogStore.getState().fetchScenarios();

      const state = useCatalogStore.getState();
      expect(state.error).toBe('Failed to fetch scenarios');
      expect(state.isLoading).toBe(false);
    });

    it('sets error on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await useCatalogStore.getState().fetchScenarios();

      expect(useCatalogStore.getState().error).toBe('Failed to fetch scenarios');
    });
  });

  describe('updateExecution', () => {
    it('adds a new execution', () => {
      const execution = {
        id: 'exec-1',
        scenarioId: 'a',
        mode: 'simulation' as const,
        status: 'running' as const,
        steps: [],
        attempts: 0,
      };

      useCatalogStore.getState().updateExecution(execution as any);

      expect(useCatalogStore.getState().executions).toHaveLength(1);
    });

    it('updates an existing execution in place', () => {
      const exec = {
        id: 'exec-1',
        scenarioId: 'a',
        mode: 'simulation' as const,
        status: 'running' as const,
        steps: [],
      };
      useCatalogStore.setState({ executions: [exec as any] });

      const updated = { ...exec, status: 'completed' as const };
      useCatalogStore.getState().updateExecution(updated as any);

      const state = useCatalogStore.getState();
      expect(state.executions).toHaveLength(1);
      expect(state.executions[0].status).toBe('completed');
    });

    it('updates activeExecution when it matches', () => {
      const exec = {
        id: 'exec-1',
        scenarioId: 'a',
        mode: 'simulation' as const,
        status: 'running' as const,
        steps: [],
      };
      useCatalogStore.setState({
        executions: [exec as any],
        activeExecution: exec as any,
      });

      const updated = { ...exec, status: 'completed' as const };
      useCatalogStore.getState().updateExecution(updated as any);

      expect(useCatalogStore.getState().activeExecution?.status).toBe('completed');
    });
  });

  describe('setActiveExecution', () => {
    it('sets active execution by ID', () => {
      const exec = { id: 'exec-1', scenarioId: 'a', status: 'running', steps: [] };
      useCatalogStore.setState({ executions: [exec as any] });

      useCatalogStore.getState().setActiveExecution('exec-1');

      expect(useCatalogStore.getState().activeExecution?.id).toBe('exec-1');
    });

    it('clears active execution with null', () => {
      useCatalogStore.setState({ activeExecution: { id: 'x' } as any });

      useCatalogStore.getState().setActiveExecution(null);

      expect(useCatalogStore.getState().activeExecution).toBeNull();
    });
  });

  describe('clearError', () => {
    it('clears the error state', () => {
      useCatalogStore.setState({ error: 'Something went wrong' });

      useCatalogStore.getState().clearError();

      expect(useCatalogStore.getState().error).toBeNull();
    });
  });

  describe('startSimulation', () => {
    it('returns execution ID on success', async () => {
      mockFetch.mockResolvedValueOnce(
        mockJsonResponse(200, { executionId: 'exec-123' }),
      );

      const id = await useCatalogStore.getState().startSimulation('scenario-1');

      expect(id).toBe('exec-123');
    });

    it('sets error and throws on failure', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse(500, {}));

      await expect(
        useCatalogStore.getState().startSimulation('scenario-1'),
      ).rejects.toThrow('Failed to start simulation');

      expect(useCatalogStore.getState().error).toBe('Failed to start simulation');
    });
  });

  describe('execution controls', () => {
    it('pauseExecution calls the correct endpoint', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse(200, {}));

      await useCatalogStore.getState().pauseExecution('exec-1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/executions/exec-1/pause'),
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('sets error when pause fails', async () => {
      mockFetch.mockResolvedValueOnce(
        mockJsonResponse(400, { error: 'Not running' }),
      );

      await useCatalogStore.getState().pauseExecution('exec-1');

      expect(useCatalogStore.getState().error).toBe('Not running');
    });
  });
});
