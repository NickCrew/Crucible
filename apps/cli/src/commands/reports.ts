import type { CrucibleClient } from '@atlascrew/crucible-client';
import { writeFile } from 'fs/promises';
import { renderOutput } from '../format.js';
import { readFlag } from '../parse.js';
import type { GlobalOptions } from '../parse.js';

export async function reportsCommand(
  client: CrucibleClient,
  globals: GlobalOptions,
  args: string[],
): Promise<number> {
  let id: string | undefined;
  let download: 'json' | 'html' | 'pdf' | 'oscal' | 'hipaa' | undefined;
  let outPath: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--download' || arg.startsWith('--download=')) {
      const val = readFlag(arg, args[i + 1], '--download');
      if (arg === '--download') i++;
      if (val !== 'json' && val !== 'html' && val !== 'pdf' && val !== 'oscal' && val !== 'hipaa') {
        process.stderr.write('--download must be "json", "html", "pdf", "oscal", or "hipaa"\n');
        return 1;
      }
      download = val;
    } else if (arg === '-o' || arg === '--output' || arg.startsWith('--output=')) {
      outPath = readFlag(arg === '-o' ? '--output' : arg, args[i + 1], '--output');
      if (arg === '-o' || arg === '--output') i++;
    } else if (arg === 'get') {
      // explicit sub-command — no-op
    } else if (!arg.startsWith('-')) {
      id = arg;
    } else {
      process.stderr.write(`Unknown option: ${arg}\n`);
      return 1;
    }
  }

  if (!id) {
    process.stderr.write('Usage: crucible-cli reports <id> [--download json|html|pdf|oscal|hipaa] [-o file]\n');
    return 1;
  }

  if (download) {
    const res = await downloadReport(client, download, id);
    const buffer = Buffer.from(await res.arrayBuffer());
    const filename = outPath ?? `${id}-report.${reportDownloadExtension(download)}`;
    await writeFile(filename, buffer);
    process.stdout.write(`Saved to ${filename}\n`);
    return 0;
  }

  const report = await client.reports.get(id);
  process.stdout.write(renderOutput(report, globals.format));
  return 0;
}

function reportDownloadExtension(format: 'json' | 'html' | 'pdf' | 'oscal' | 'hipaa'): string {
  if (format === 'oscal') {
    return 'oscal.json';
  }
  if (format === 'hipaa') {
    return 'hipaa-evidence.json';
  }
  return format;
}

function downloadReport(
  client: CrucibleClient,
  format: 'json' | 'html' | 'pdf' | 'oscal' | 'hipaa',
  id: string,
): Promise<Response> {
  switch (format) {
    case 'json':
      return client.reports.json(id);
    case 'html':
      return client.reports.html(id);
    case 'pdf':
      return client.reports.pdf(id);
    case 'oscal':
      return client.reports.oscal(id);
    case 'hipaa':
      return client.reports.hipaa(id);
  }
}
