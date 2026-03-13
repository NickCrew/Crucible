import { mkdirSync, writeFileSync, createWriteStream } from 'fs';
import { join } from 'path';
import PDFDocument from 'pdfkit';
import type { ScenarioExecution, ExecutionStepResult } from '../shared/types.js';
import type { Scenario } from '@crucible/catalog';

export interface ReportServiceConfig {
  reportsDir: string;
  baseUrl: string;
}

export class ReportService {
  private reportsDir: string;
  private baseUrl: string;
  private locks: Map<string, Promise<void>> = new Map();

  static readonly PDF_SUFFIX = 'pdf';
  static readonly JSON_SUFFIX = 'json';

  constructor(config: ReportServiceConfig) {
    this.reportsDir = config.reportsDir;
    this.baseUrl = config.baseUrl;
    this.ensureDirectory();
  }

  private ensureDirectory() {
    mkdirSync(this.reportsDir, { recursive: true });
  }

  async generateReports(execution: ScenarioExecution, scenario: Scenario): Promise<{ jsonPath: string; pdfPath: string }> {
    // Basic mutex to prevent parallel writes for same ID
    while (this.locks.has(execution.id)) {
      await this.locks.get(execution.id);
    }

    const reportPromise = (async () => {
      const jsonPath = await this.generateJsonReport(execution, scenario);
      const pdfPath = await this.generatePdfReport(execution, scenario);
      return { jsonPath, pdfPath };
    })();

    this.locks.set(execution.id, reportPromise.then(() => {}).catch(() => {}));
    
    try {
      return await reportPromise;
    } finally {
      this.locks.delete(execution.id);
    }
  }

  private async generateJsonReport(execution: ScenarioExecution, scenario: Scenario): Promise<string> {
    const fileName = `${execution.id}.json`;
    const filePath = join(this.reportsDir, fileName);
    
    const reportData = {
      execution,
      scenario: {
        id: scenario.id,
        name: scenario.name,
        description: scenario.description,
        category: scenario.category,
      },
      generatedAt: new Date().toISOString(),
    };

    writeFileSync(filePath, JSON.stringify(reportData, null, 2));
    return filePath;
  }

  private async generatePdfReport(execution: ScenarioExecution, scenario: Scenario): Promise<string> {
    const fileName = `${execution.id}.pdf`;
    const filePath = join(this.reportsDir, fileName);
    
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const stream = createWriteStream(filePath);

      doc.pipe(stream);

      // Header
      doc.fontSize(24).text('Security Assessment Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown(2);

      // Executive Summary Section
      doc.fontSize(16).text('Executive Summary', { underline: true });
      doc.moveDown();
      
      const status = execution.report?.passed ? 'PASSED' : 'FAILED';
      const score = execution.report?.score ?? 0;
      
      doc.fontSize(12).text(`Scenario: ${scenario.name}`);
      doc.text(`Execution ID: ${execution.id}`);
      doc.text(`Target URL: ${execution.targetUrl || 'N/A'}`);
      doc.text(`Status: ${status}`, { color: execution.report?.passed ? '#008000' : '#FF0000' });
      doc.text(`Score: ${score}%`);
      doc.moveDown();
      
      doc.fontSize(11).text(execution.report?.summary || 'No summary available.');
      doc.moveDown(2);

      // Details Section
      doc.fontSize(16).text('Detailed Findings', { underline: true });
      doc.moveDown();

      execution.steps.forEach((step, index) => {
        const definition = scenario.steps.find(s => s.id === step.stepId);
        
        // Don't start a new page for every step, but check for space
        if (doc.y > 650) doc.addPage();

        doc.fontSize(12).fillColor('#333333').text(`${index + 1}. ${definition?.name || step.stepId}`, { oblique: true });
        doc.fontSize(10).fillColor('#666666').text(`Status: ${step.status.toUpperCase()} | Duration: ${step.duration || 0}ms`);
        
        if (step.error) {
          doc.fillColor('#FF0000').text(`Error: ${step.error}`);
        }

        if (step.assertions && step.assertions.length > 0) {
          doc.moveDown(0.5);
          doc.fillColor('#000000').text('Assertions:');
          step.assertions.forEach(a => {
            const mark = a.passed ? '[PASS]' : '[FAIL]';
            doc.fontSize(9).text(`  ${mark} ${a.field}: expected ${JSON.stringify(a.expected)}, got ${JSON.stringify(a.actual)}`, {
              color: a.passed ? '#008000' : '#FF0000'
            });
          });
        }

        doc.moveDown();
      });

      // Footer
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).fillColor('#999999').text(
          `Page ${i + 1} of ${pages.count} | Crucible Security Lab Suite`,
          50,
          doc.page.height - 50,
          { align: 'center' }
        );
      }

      doc.end();
      stream.on('finish', () => resolve(filePath));
      stream.on('error', reject);
    });
  }
}
