import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ScenarioEditorTab } from '../scenario-editor-tab';

// ── TASK-8: Prototype pollution filtering ─────────────────────────────

// Mock the catalog store
const mockUpdateScenario = vi.fn();
vi.mock('@/store/useCatalogStore', () => ({
  useCatalogStore: (selector: any) => {
    const state = { updateScenario: mockUpdateScenario };
    return selector(state);
  },
}));

// Mock sub-components to keep tests focused
vi.mock('../metadata-form', () => ({
  MetadataForm: ({ draft }: any) => (
    <div data-testid="metadata-form">{draft.name}</div>
  ),
}));

vi.mock('../steps-list', () => ({
  StepsList: ({ steps }: any) => (
    <div data-testid="steps-list">{steps.length} steps</div>
  ),
  emptyRequestDraft: () => ({
    method: 'GET',
    url: '',
    headerPairs: [],
    paramPairs: [],
    bodyMode: 'none',
    bodyJson: '',
    bodyRaw: '',
  }),
  emptyExecutionDraft: () => ({ enabled: false, delayMs: '', retries: '', jitter: '', iterations: '' }),
  emptyExpectDraft: () => ({
    enabled: false,
    status: '',
    blocked: '',
    bodyContains: '',
    bodyNotContains: '',
    headerPresent: '',
    headerEqualsPairs: [],
  }),
  emptyExtractDraft: () => ({ enabled: false, rows: [] }),
}));

function minimalScenario(extra: Record<string, unknown> = {}) {
  return {
    id: 'test-scenario',
    name: 'Test Scenario',
    steps: [
      {
        id: 'step-1',
        name: 'Step 1',
        stage: 'main',
        request: { method: 'GET', url: 'http://localhost/test' },
      },
    ],
    ...extra,
  } as any;
}

describe('ScenarioEditorTab — prototype pollution filtering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateScenario.mockResolvedValue(undefined);
  });

  it('strips __proto__ key from scenario on save', async () => {
    // Create scenario with dangerous key using Object.assign to avoid JS prototype issues
    const scenario = minimalScenario();
    Object.defineProperty(scenario, '__proto__', {
      value: 'malicious',
      enumerable: true,
      configurable: true,
      writable: true,
    });

    const onSave = vi.fn();
    render(<ScenarioEditorTab scenario={scenario} onSaveSuccess={onSave} />);

    // Click save
    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateScenario).toHaveBeenCalledTimes(1);
    });

    const savedData = mockUpdateScenario.mock.calls[0][1];
    expect(savedData).not.toHaveProperty('__proto__');
  });

  it('strips constructor key from scenario on save', async () => {
    const scenario = minimalScenario({ constructor: 'malicious' });

    const onSave = vi.fn();
    render(<ScenarioEditorTab scenario={scenario} onSaveSuccess={onSave} />);

    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateScenario).toHaveBeenCalledTimes(1);
    });

    const savedData = mockUpdateScenario.mock.calls[0][1];
    expect(savedData).not.toHaveProperty('constructor');
  });

  it('strips prototype key from scenario on save', async () => {
    const scenario = minimalScenario({ prototype: 'malicious' });

    const onSave = vi.fn();
    render(<ScenarioEditorTab scenario={scenario} onSaveSuccess={onSave} />);

    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateScenario).toHaveBeenCalledTimes(1);
    });

    const savedData = mockUpdateScenario.mock.calls[0][1];
    expect(savedData).not.toHaveProperty('prototype');
  });

  it('preserves safe unknown keys through round-trip', async () => {
    const scenario = minimalScenario({ customField: 'safe-value' });

    const onSave = vi.fn();
    render(<ScenarioEditorTab scenario={scenario} onSaveSuccess={onSave} />);

    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateScenario).toHaveBeenCalledTimes(1);
    });

    const savedData = mockUpdateScenario.mock.calls[0][1];
    expect(savedData).toHaveProperty('customField', 'safe-value');
  });
});
