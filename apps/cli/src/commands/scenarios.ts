import type { CrucibleClient, Scenario } from '@atlascrew/crucible-client';
import { renderOutput, renderTable } from '../format.js';
import type { GlobalOptions } from '../parse.js';

interface ScenarioListParams {
  framework?: 'fedramp';
  baseline?: 'low' | 'moderate' | 'high' | 'li-saas';
  family?: string;
  controlId?: string;
}

interface ScenarioCommandOptions {
  filters: ScenarioListParams;
  showControls: boolean;
}

export async function scenariosCommand(
  client: CrucibleClient,
  globals: GlobalOptions,
  args: string[] = [],
): Promise<number> {
  const options = parseScenarioCommandOptions(args);
  const listScenarios = client.scenarios.list as (params?: ScenarioListParams) => Promise<Scenario[]>;
  const scenarios = await listScenarios(hasScenarioFilters(options.filters) ? options.filters : undefined);

  if (globals.format === 'json') {
    process.stdout.write(renderOutput(scenarios, 'json'));
    return 0;
  }

  if (scenarios.length === 0) {
    process.stdout.write('No scenarios found.\n');
    return 0;
  }

  const rows = scenarios.map((s) => ({
    id: s.id,
    name: s.name,
    category: s.category ?? '-',
    difficulty: s.difficulty ?? '-',
    ...(options.showControls || hasScenarioFilters(options.filters)
      ? { controls: formatScenarioControls(s) }
      : {}),
    steps: s.steps.length,
  }));

  process.stdout.write(renderTable(rows));
  return 0;
}

function parseScenarioCommandOptions(args: string[]): ScenarioCommandOptions {
  const filters: ScenarioListParams = {};
  let showControls = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--show-controls') {
      showControls = true;
      continue;
    }

    if (arg === '--framework' || arg.startsWith('--framework=')) {
      filters.framework = readScenarioFlag(arg, args[i + 1], '--framework') as ScenarioListParams['framework'];
      if (arg === '--framework') i++;
      continue;
    }

    if (arg === '--baseline' || arg.startsWith('--baseline=')) {
      filters.baseline = readScenarioFlag(arg, args[i + 1], '--baseline') as ScenarioListParams['baseline'];
      if (arg === '--baseline') i++;
      continue;
    }

    if (arg === '--family' || arg.startsWith('--family=')) {
      filters.family = readScenarioFlag(arg, args[i + 1], '--family').toUpperCase();
      if (arg === '--family') i++;
      continue;
    }

    if (arg === '--control-id' || arg.startsWith('--control-id=')) {
      filters.controlId = readScenarioFlag(arg, args[i + 1], '--control-id').toUpperCase();
      if (arg === '--control-id') i++;
      continue;
    }

    throw new Error(`Unknown scenarios option: ${arg}`);
  }

  return { filters, showControls };
}

function readScenarioFlag(arg: string, nextArg: string | undefined, flagName: string): string {
  if (arg.startsWith(`${flagName}=`)) {
    const value = arg.slice(flagName.length + 1).trim();
    if (!value) throw new Error(`${flagName} requires a value`);
    return value;
  }
  if (!nextArg || nextArg.startsWith('--')) {
    throw new Error(`${flagName} requires a value`);
  }
  return nextArg.trim();
}

function hasScenarioFilters(filters: ScenarioListParams): boolean {
  return Object.values(filters).some((value) => value !== undefined);
}

function formatScenarioControls(scenario: Scenario): string {
  const controls = scenario.compliance?.mappings
    .filter((mapping) => mapping.framework === 'fedramp')
    .map((mapping) => `${mapping.controlId} (${mapping.baseline})`);

  return controls && controls.length > 0 ? controls.join(', ') : '-';
}
