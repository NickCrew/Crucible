import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWebSocket } from '../useWebSocket';

// ── TASK-16: useWebSocket hook ────────────────────────────────────────

// Mock the store
const mockUpdateExecution = vi.fn();
const mockSetWsConnected = vi.fn();

vi.mock('@/store/useCatalogStore', () => ({
  useCatalogStore: () => ({
    updateExecution: mockUpdateExecution,
    setWsConnected: mockSetWsConnected,
  }),
}));

// WebSocket mock
class MockWebSocket {
  static instances: MockWebSocket[] = [];
  url: string;
  onopen: ((ev: any) => void) | null = null;
  onclose: ((ev: any) => void) | null = null;
  onmessage: ((ev: any) => void) | null = null;
  onerror: ((ev: any) => void) | null = null;
  readyState = 0; // CONNECTING

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  close() {
    this.readyState = 3; // CLOSED
    this.onclose?.({});
  }

  simulateOpen() {
    this.readyState = 1; // OPEN
    this.onopen?.({});
  }

  simulateMessage(data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }

  simulateError() {
    this.onerror?.({});
  }
}

// Set static properties that the hook checks
(MockWebSocket as any).OPEN = 1;

describe('useWebSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    MockWebSocket.instances = [];
    (global as any).WebSocket = MockWebSocket;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('connects on mount', () => {
    renderHook(() => useWebSocket());

    expect(MockWebSocket.instances).toHaveLength(1);
    expect(MockWebSocket.instances[0].url).toBe('ws://localhost:3001');
  });

  it('sets wsConnected on open', () => {
    renderHook(() => useWebSocket());

    const ws = MockWebSocket.instances[0];
    ws.simulateOpen();

    expect(mockSetWsConnected).toHaveBeenCalledWith(true);
  });

  it('dispatches execution updates from messages', () => {
    renderHook(() => useWebSocket());

    const ws = MockWebSocket.instances[0];
    ws.simulateOpen();

    ws.simulateMessage({
      type: 'EXECUTION_UPDATED',
      payload: { id: 'exec-1', status: 'running', steps: [] },
    });

    expect(mockUpdateExecution).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'exec-1', status: 'running' }),
    );
  });

  it('ignores messages without payload.id', () => {
    renderHook(() => useWebSocket());

    const ws = MockWebSocket.instances[0];
    ws.simulateOpen();

    ws.simulateMessage({ type: 'EXECUTION_UPDATED', payload: {} });

    expect(mockUpdateExecution).not.toHaveBeenCalled();
  });

  it('ignores malformed JSON messages', () => {
    renderHook(() => useWebSocket());

    const ws = MockWebSocket.instances[0];
    ws.simulateOpen();

    // Send raw string (not valid JSON)
    ws.onmessage?.({ data: 'not json' });

    expect(mockUpdateExecution).not.toHaveBeenCalled();
  });

  it('sets wsConnected false on close and schedules reconnect', () => {
    renderHook(() => useWebSocket());

    const ws = MockWebSocket.instances[0];
    ws.simulateOpen();

    // Simulate close
    ws.readyState = 3;
    ws.onclose?.({});

    expect(mockSetWsConnected).toHaveBeenCalledWith(false);

    // Advance past reconnect delay (3000ms)
    act(() => {
      vi.advanceTimersByTime(3500);
    });

    // Should have created a new WebSocket
    expect(MockWebSocket.instances.length).toBeGreaterThanOrEqual(2);
  });

  it('closes connection on unmount', () => {
    const { unmount } = renderHook(() => useWebSocket());

    const ws = MockWebSocket.instances[0];
    const closeSpy = vi.spyOn(ws, 'close');

    unmount();

    expect(closeSpy).toHaveBeenCalled();
  });
});
