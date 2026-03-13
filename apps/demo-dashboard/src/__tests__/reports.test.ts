import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ReportService } from '../server/reports.js';
import { existsSync, readFileSync, rmSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { ScenarioExecution } from '../shared/types.js';

describe('ReportService', () => {
  const reportsDir = join(__dirname, 'tmp-reports');
  let service: ReportService;

  beforeEach(() => {
    mkdirSync(reportsDir, { recursive: true });
    service = new ReportService({ reportsDir, baseUrl: 'http://localhost:3001' });
  });

  afterEach(() => {
    rmSync(reportsDir, { recursive: true, force: true });
  });

  const mockExecution: ScenarioExecution = {
    id: 'test-exec-123',
    scenarioId: 'test-scenario',
    mode: 'assessment',
    status: 'completed',
    targetUrl: 'http://victim.local',
    steps: [
      {
        stepId: 'step-1',
        status: 'completed',
        duration: 150,
        attempts: 1,
        assertions: [{ field: 'status', expected: 200, actual: 200, passed: true }]
      }
    ],
    report: {
      summary: 'All steps passed successfully.',
      passed: true,
      score: 100,
      artifacts: []
    }
  };

  const mockScenario: any = {
    id: 'test-scenario',
    name: 'Test Scenario',
    description: 'A test scenario description',
    category: 'Injection',
    steps: [
      { id: 'step-1', name: 'Initial Probe' }
    ]
  };

  it('generates a valid JSON report', async () => {
    const { jsonPath } = await service.generateReports(mockExecution, mockScenario);
    
    expect(existsSync(jsonPath)).toBe(true);
    const content = JSON.parse(readFileSync(jsonPath, 'utf8'));
    expect(content.execution.id).toBe(mockExecution.id);
    expect(content.scenario.name).toBe(mockScenario.name);
  });

  it('generates a PDF report file', async () => {
    const { pdfPath } = await service.generateReports(mockExecution, mockScenario);
    
    expect(existsSync(pdfPath)).toBe(true);
    const stats = readFileSync(pdfPath);
    // PDF should start with %PDF
    expect(stats.subarray(0, 4).toString()).toBe('%PDF');
    expect(stats.length).toBeGreaterThan(1000);
  });
});
