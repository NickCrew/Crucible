'use client';

import type { ExecutionMetricsPoint } from '@/store/useCatalogStore';

interface ExecutionMetricsChartProps {
  history: ExecutionMetricsPoint[];
  throttleMs: number;
}

type SeriesDefinition = {
  key: keyof Omit<ExecutionMetricsPoint, 'timestamp'>;
  label: string;
  color: string;
};

const SERIES: SeriesDefinition[] = [
  { key: 'activeExecutions', label: 'Active Executions', color: 'var(--color-chart-1)' },
  { key: 'completedSteps', label: 'Resolved Steps', color: 'var(--color-chart-2)' },
  { key: 'failedSteps', label: 'Failed Steps', color: 'var(--color-chart-4)' },
];

const SVG_WIDTH = 720;
const SVG_HEIGHT = 240;
const PADDING_X = 18;
const PADDING_Y = 20;

export function ExecutionMetricsChart({ history, throttleMs }: ExecutionMetricsChartProps) {
  if (history.length === 0) {
    return (
      <div className="flex h-[300px] flex-col items-center justify-center rounded-lg border border-dashed border-border/70 bg-muted/20">
        <p className="type-data text-muted-foreground">
          TELEMETRY_FEED :: AWAITING_LIVE_EXECUTIONS
        </p>
        <p className="mt-2 type-body text-muted-foreground">
          Start a simulation to build a rolling metrics stream for the dashboard.
        </p>
      </div>
    );
  }

  const latest = history.at(-1)!;
  const maxValue = Math.max(
    1,
    ...history.flatMap((point) => SERIES.map((series) => point[series.key] as number)),
  );
  const sampleLabel = history.length === 1 ? 'sample' : 'samples';
  const chartSummary = SERIES.map((series) => `${series.label}: ${latest[series.key]}`).join(', ');

  return (
    <div className="space-y-4" data-testid="execution-metrics-chart">
      <div className="rounded-lg border border-border/70 bg-gradient-to-br from-card to-card/60 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="h-[240px] w-full"
          role="img"
          aria-label="Live execution telemetry chart"
        >
          <desc>{`Latest telemetry snapshot. ${chartSummary}.`}</desc>
          <defs>
            {SERIES.map((series) => (
              <linearGradient
                key={`${series.key}-gradient`}
                id={`${series.key}-gradient`}
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor={series.color} stopOpacity="0.24" />
                <stop offset="100%" stopColor={series.color} stopOpacity="0.02" />
              </linearGradient>
            ))}
          </defs>

          {[0, 1, 2, 3].map((index) => {
            const y = lerp(PADDING_Y, SVG_HEIGHT - PADDING_Y, index / 3);
            return (
              <line
                key={`grid-${index}`}
                x1={PADDING_X}
                y1={y}
                x2={SVG_WIDTH - PADDING_X}
                y2={y}
                stroke="currentColor"
                strokeOpacity="0.12"
                strokeDasharray="4 8"
              />
            );
          })}

          {SERIES.map((series) => {
            const linePath = buildLinePath(history, series.key, maxValue);
            const areaPath = buildAreaPath(linePath, history.length, maxValue);
            const lastPoint = projectPoint(
              history.length - 1,
              latest[series.key] as number,
              history.length,
              maxValue,
            );

            return (
              <g key={series.key}>
                <path d={areaPath} fill={`url(#${series.key}-gradient)`} />
                <path
                  d={linePath}
                  fill="none"
                  stroke={series.color}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx={lastPoint.x}
                  cy={lastPoint.y}
                  r="4"
                  fill={series.color}
                  stroke="var(--color-card)"
                  strokeWidth="2"
                />
              </g>
            );
          })}
        </svg>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {SERIES.map((series) => (
          <div key={series.key} className="rounded-lg border border-border/70 bg-card/70 px-4 py-3">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: series.color }}
                aria-hidden="true"
              />
              <p className="type-label text-muted-foreground">{series.label}</p>
            </div>
            <p className="mt-2 type-metric" style={{ color: series.color }}>
              {latest[series.key]}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 px-4 py-3">
        <p className="type-body text-muted-foreground">
          Rolling telemetry buffer from live execution updates.
        </p>
        <p className="type-data text-muted-foreground">
          {history.length} {sampleLabel} · ~{throttleMs}ms cadence
        </p>
      </div>
    </div>
  );
}

function buildLinePath(
  history: ExecutionMetricsPoint[],
  key: keyof Omit<ExecutionMetricsPoint, 'timestamp'>,
  maxValue: number,
): string {
  return history
    .map((point, index) => {
      const { x, y } = projectPoint(index, point[key] as number, history.length, maxValue);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');
}

function buildAreaPath(linePath: string, totalPoints: number, maxValue: number): string {
  const end = projectPoint(totalPoints - 1, 0, totalPoints, maxValue);
  const start = projectPoint(0, 0, totalPoints, maxValue);
  return `${linePath} L ${end.x} ${end.y} L ${start.x} ${start.y} Z`;
}

function projectPoint(index: number, value: number, totalPoints: number, maxValue: number) {
  const usableWidth = SVG_WIDTH - PADDING_X * 2;
  const usableHeight = SVG_HEIGHT - PADDING_Y * 2;
  const x =
    totalPoints === 1 ? SVG_WIDTH / 2 : PADDING_X + (usableWidth * index) / (totalPoints - 1);
  const y = PADDING_Y + usableHeight - (value / maxValue) * usableHeight;
  return { x, y };
}

function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * amount;
}
