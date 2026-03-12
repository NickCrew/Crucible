import { WebSocket, WebSocketServer } from 'ws';
import { isDeepStrictEqual } from 'node:util';
import { ScenarioEngine } from './engine.js';
import type {
  DashboardCommand,
  DashboardEvent,
  ExecutionStepDelta,
  ExecutionStepResult,
  ScenarioExecution,
  ScenarioExecutionDelta,
  WebSocketMessage,
} from '../shared/types.js';

export function setupWebSocket(wss: WebSocketServer, engine: ScenarioEngine): void {
  const executionSnapshots = new Map<string, ScenarioExecution>();

  engine.on('execution:started', (execution) => {
    const snapshot = cloneExecution(execution);
    executionSnapshots.set(execution.id, snapshot);
    broadcast(wss, createSnapshotEvent('EXECUTION_STARTED', snapshot));
  });

  engine.on('execution:updated', (execution) => {
    const snapshot = cloneExecution(execution);
    const previousSnapshot = executionSnapshots.get(execution.id);
    executionSnapshots.set(execution.id, snapshot);

    if (!previousSnapshot) {
      broadcast(wss, createSnapshotEvent('EXECUTION_UPDATED', snapshot));
      return;
    }

    const delta = buildExecutionDelta(previousSnapshot, snapshot);
    if (!hasExecutionChanges(delta)) {
      return;
    }

    broadcast(wss, {
      type: 'EXECUTION_DELTA',
      payload: delta,
      format: 'delta',
      timestamp: Date.now(),
    });
  });

  engine.on('execution:completed', (execution) => {
    const snapshot = cloneExecution(execution);
    executionSnapshots.delete(execution.id);
    broadcast(wss, createSnapshotEvent('EXECUTION_COMPLETED', snapshot));
  });

  engine.on('execution:failed', (execution) => {
    const snapshot = cloneExecution(execution);
    executionSnapshots.delete(execution.id);
    broadcast(wss, createSnapshotEvent('EXECUTION_FAILED', snapshot));
  });

  engine.on('execution:paused', (execution) => {
    const snapshot = cloneExecution(execution);
    executionSnapshots.set(execution.id, snapshot);
    broadcast(wss, createSnapshotEvent('EXECUTION_PAUSED', snapshot));
  });

  engine.on('execution:cancelled', (execution) => {
    const snapshot = cloneExecution(execution);
    executionSnapshots.delete(execution.id);
    broadcast(wss, createSnapshotEvent('EXECUTION_CANCELLED', snapshot));
  });

  engine.on('execution:resumed', (execution) => {
    const snapshot = cloneExecution(execution);
    executionSnapshots.set(execution.id, snapshot);
    broadcast(wss, createSnapshotEvent('EXECUTION_RESUMED', snapshot));
  });

  wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected');

    for (const execution of engine.listExecutions()) {
      const snapshot = cloneExecution(execution);
      executionSnapshots.set(snapshot.id, snapshot);
      ws.send(JSON.stringify(createSnapshotEvent('STATUS_UPDATE', snapshot)));
    }

    ws.on('message', async (message: string) => {
      try {
        const data: WebSocketMessage = JSON.parse(message);
        const command = data as DashboardCommand;

        switch (command.type) {
          case 'SCENARIO_START':
            if (command.payload.scenarioId) {
              try {
                const executionId = await engine.startScenario(
                  command.payload.scenarioId,
                  'simulation',
                  command.payload.filters,
                );
                ws.send(
                  JSON.stringify({
                    type: 'EXECUTION_STARTED',
                    payload: { executionId },
                    timestamp: Date.now(),
                  } as DashboardEvent),
                );
              } catch (err) {
                ws.send(
                  JSON.stringify({
                    type: 'EXECUTION_FAILED',
                    payload: { error: err instanceof Error ? err.message : String(err) },
                    timestamp: Date.now(),
                  } as DashboardEvent),
                );
              }
            }
            break;

          case 'SCENARIO_PAUSE':
            if (command.payload.executionId) {
              engine.pauseExecution(command.payload.executionId);
            }
            break;

          case 'SCENARIO_RESUME':
            if (command.payload.executionId) {
              engine.resumeExecution(command.payload.executionId);
            }
            break;

          case 'SCENARIO_STOP':
            if (command.payload.executionId) {
              engine.cancelExecution(command.payload.executionId);
            }
            break;

          case 'SCENARIO_RESTART':
            if (command.payload.executionId) {
              const newId = await engine.restartExecution(command.payload.executionId);
              if (newId) {
                ws.send(
                  JSON.stringify({
                    type: 'EXECUTION_STARTED',
                    payload: { executionId: newId },
                    timestamp: Date.now(),
                  } as DashboardEvent),
                );
              }
            }
            break;

          case 'PAUSE_ALL':
            engine.pauseAll();
            break;

          case 'RESUME_ALL':
            engine.resumeAll();
            break;

          case 'CANCEL_ALL':
            engine.cancelAll();
            break;

          case 'GET_STATUS':
            if (command.payload.executionId) {
              const execution = engine.getExecution(command.payload.executionId);
              if (execution) {
                const snapshot = cloneExecution(execution);
                executionSnapshots.set(snapshot.id, snapshot);
                ws.send(
                  JSON.stringify({
                    type: 'STATUS_UPDATE',
                    payload: snapshot,
                    format: 'snapshot',
                    timestamp: Date.now(),
                  } as DashboardEvent),
                );
              } else {
                ws.send(
                  JSON.stringify({
                    type: 'STATUS_UPDATE',
                    payload: { error: 'Execution not found' },
                    timestamp: Date.now(),
                  } as DashboardEvent),
                );
              }
            }
            break;

          default:
            console.warn('Unknown command type:', command.type);
        }
      } catch (err) {
        console.error('WebSocket error:', err);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected');
    });
  });
}

function broadcast(wss: WebSocketServer, message: DashboardEvent) {
  const data = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

function createSnapshotEvent(
  type: DashboardEvent['type'],
  payload: ScenarioExecution,
): DashboardEvent {
  return {
    type,
    payload,
    format: 'snapshot',
    timestamp: Date.now(),
  };
}

function hasExecutionChanges(delta: ScenarioExecutionDelta): boolean {
  return Object.keys(delta.changes).length > 0;
}

function buildExecutionDelta(
  previous: ScenarioExecution,
  current: ScenarioExecution,
): ScenarioExecutionDelta {
  const changes: ScenarioExecutionDelta['changes'] = {};

  for (const key of Object.keys(current) as Array<keyof ScenarioExecution>) {
    if (key === 'id' || key === 'steps') {
      continue;
    }

    if (!isDeepStrictEqual(previous[key], current[key])) {
      changes[key] = cloneValue(current[key]) as never;
    }
  }

  const previousSteps = new Map(previous.steps.map((step) => [step.stepId, step]));
  const changedSteps = current.steps
    .map((step) => buildStepDelta(previousSteps.get(step.stepId), step))
    .filter((stepDelta): stepDelta is ExecutionStepDelta => stepDelta !== null);

  if (changedSteps.length > 0) {
    changes.steps = changedSteps;
  }

  return {
    id: current.id,
    changes,
  };
}

function buildStepDelta(
  previous: ExecutionStepResult | undefined,
  current: ExecutionStepResult,
): ExecutionStepDelta | null {
  if (!previous) {
    return cloneExecution(current);
  }

  const stepDelta: ExecutionStepDelta = { stepId: current.stepId };

  for (const key of Object.keys(current) as Array<keyof ExecutionStepResult>) {
    if (key === 'stepId') {
      continue;
    }

    if (!isDeepStrictEqual(previous[key], current[key])) {
      stepDelta[key] = cloneValue(current[key]) as never;
    }
  }

  return Object.keys(stepDelta).length > 1 ? stepDelta : null;
}

function cloneExecution<T>(value: T): T {
  return structuredClone(value);
}

function cloneValue<T>(value: T): T {
  if (value == null || typeof value !== 'object') {
    return value;
  }
  return structuredClone(value);
}
