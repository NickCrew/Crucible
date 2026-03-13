"use client";

import type { Scenario } from "@crucible/catalog";
import type { ScenarioExecution } from "@/store/useCatalogStore";

interface AssessmentTrendPanelProps {
  assessments: ScenarioExecution[];
  scenarios: Scenario[];
  isLoading?: boolean;
  error?: string | null;
}

interface ScenarioRateCard {
  scenarioId: string;
  scenarioName: string;
  total: number;
  passed: number;
  failed: number;
  passRate: number;
}

const SVG_WIDTH = 720;
const SVG_HEIGHT = 240;
const PADDING_X = 28;
const PADDING_Y = 22;
const MAX_POINTS = 12;

export function AssessmentTrendPanel({
  assessments,
  scenarios,
  isLoading = false,
  error = null,
}: AssessmentTrendPanelProps) {
  const completedAssessments = assessments
    .filter((execution) => execution.report)
    .slice()
    .sort((left, right) => getAssessmentTimestamp(left) - getAssessmentTimestamp(right));

  const trendAssessments = completedAssessments.slice(-MAX_POINTS);
  const scenarioRates = buildScenarioRates(completedAssessments, scenarios);
  const latestAssessment = completedAssessments.at(-1);
  const averageScore =
    completedAssessments.length > 0
      ? Math.round(
          completedAssessments.reduce(
            (total, execution) => total + (execution.report?.score ?? 0),
            0,
          ) / completedAssessments.length,
        )
      : null;
  const overallPassRate =
    completedAssessments.length > 0
      ? Math.round(
          (completedAssessments.filter((execution) => execution.report?.passed).length /
            completedAssessments.length) *
            100,
        )
      : null;

  if (isLoading && completedAssessments.length === 0) {
    return (
      <div className="flex h-[300px] flex-col items-center justify-center rounded-lg border border-dashed border-border/70 bg-muted/20">
        <p className="type-data text-muted-foreground">ASSESSMENT_HISTORY :: LOADING</p>
        <p className="mt-2 type-body text-muted-foreground">
          Pulling persisted assessment results from the reporting service.
        </p>
      </div>
    );
  }

  if (error && completedAssessments.length === 0) {
    return (
      <div className="flex h-[300px] flex-col items-center justify-center rounded-lg border border-dashed border-destructive/30 bg-destructive/5 px-6 text-center">
        <p className="type-data text-destructive">ASSESSMENT_HISTORY :: UNAVAILABLE</p>
        <p className="mt-2 type-body text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (completedAssessments.length === 0) {
    return (
      <div className="flex h-[300px] flex-col items-center justify-center rounded-lg border border-dashed border-border/70 bg-muted/20 px-6 text-center">
        <p className="type-data text-muted-foreground">ASSESSMENT_HISTORY :: EMPTY</p>
        <p className="mt-2 type-body text-muted-foreground">
          Run an assessment to unlock score trends and per-scenario pass rates.
        </p>
      </div>
    );
  }

  const highestScore = Math.max(...trendAssessments.map((execution) => execution.report?.score ?? 0), 1);

  return (
    <div className="space-y-4" data-testid="assessment-trend-panel">
      <div className="grid gap-3 md:grid-cols-3">
        <SummaryCard
          label="Latest Score"
          value={latestAssessment ? `${latestAssessment.report?.score ?? 0}%` : "N/A"}
          detail={
            latestAssessment
              ? `${resolveScenarioName(latestAssessment.scenarioId, scenarios)} · ${latestAssessment.report?.passed ? "Pass" : "Fail"}`
              : "No recent assessments"
          }
          tone={latestAssessment?.report?.passed ? "success" : "default"}
        />
        <SummaryCard
          label="Average Score"
          value={averageScore == null ? "N/A" : `${averageScore}%`}
          detail={`${completedAssessments.length} completed assessments`}
        />
        <SummaryCard
          label="Pass Rate"
          value={overallPassRate == null ? "N/A" : `${overallPassRate}%`}
          detail="Merged from persisted and live assessment results"
          tone="accent"
        />
      </div>

      <div className="rounded-lg border border-border/70 bg-gradient-to-br from-card to-card/60 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="type-label text-muted-foreground">Assessment score progression</p>
            <p className="type-body text-muted-foreground">
              Last {trendAssessments.length} completed assessments in chronological order.
            </p>
          </div>
          {error && (
            <p className="type-body text-warning">
              Live chart active. Historical refresh warning: {error}
            </p>
          )}
        </div>

        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="h-[240px] w-full"
          role="img"
          aria-label="Assessment score trend chart"
        >
          <desc>
            {trendAssessments
              .map(
                (execution) =>
                  `${resolveScenarioName(execution.scenarioId, scenarios)} ${execution.report?.score ?? 0}%`,
              )
              .join(", ")}
          </desc>

          {[0, 1, 2, 3, 4].map((index) => {
            const y = lerp(PADDING_Y, SVG_HEIGHT - PADDING_Y, index / 4);
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

          <path
            d={buildAreaPath(trendAssessments, highestScore)}
            fill="url(#assessment-score-area)"
          />
          <path
            d={buildLinePath(trendAssessments, highestScore)}
            fill="none"
            stroke="var(--color-chart-3)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <defs>
            <linearGradient id="assessment-score-area" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--color-chart-3)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--color-chart-3)" stopOpacity="0.04" />
            </linearGradient>
          </defs>

          {trendAssessments.map((execution, index) => {
            const point = projectPoint(
              index,
              execution.report?.score ?? 0,
              trendAssessments.length,
              highestScore,
            );

            return (
              <g key={execution.id}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="5"
                  fill={execution.report?.passed ? "var(--color-chart-2)" : "var(--color-chart-4)"}
                  stroke="var(--color-card)"
                  strokeWidth="2"
                />
              </g>
            );
          })}
        </svg>
      </div>

      <div className="rounded-lg border border-border/70 bg-card/70 p-4">
        <div className="mb-4">
          <p className="type-label text-muted-foreground">Per-scenario pass and fail rates</p>
          <p className="type-body text-muted-foreground">
            Persisted history is merged with the current session, so newly completed assessments
            update these rates immediately.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {scenarioRates.map((rate) => (
            <div key={rate.scenarioId} className="rounded-lg border border-border/60 bg-muted/20 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="type-body font-medium">{rate.scenarioName}</p>
                  <p className="type-timestamp text-muted-foreground">{rate.total} recorded assessments</p>
                </div>
                <p className="type-data text-foreground">{rate.passRate}%</p>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-success"
                  style={{ width: `${rate.passRate}%` }}
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] uppercase tracking-wider text-muted-foreground">
                <span>{rate.passed} pass</span>
                <span>{rate.failed} fail</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  detail,
  tone = "default",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "default" | "success" | "accent";
}) {
  const toneClass =
    tone === "success"
      ? "text-success"
      : tone === "accent"
        ? "text-primary"
        : "text-foreground";

  return (
    <div className="rounded-lg border border-border/70 bg-card/70 px-4 py-3">
      <p className="type-label text-muted-foreground">{label}</p>
      <p className={`mt-2 type-metric ${toneClass}`}>{value}</p>
      <p className="mt-1 type-body text-muted-foreground">{detail}</p>
    </div>
  );
}

function buildScenarioRates(
  assessments: ScenarioExecution[],
  scenarios: Scenario[],
): ScenarioRateCard[] {
  const scenarioNames = new Map(scenarios.map((scenario) => [scenario.id, scenario.name]));
  const grouped = new Map<string, ScenarioRateCard>();

  for (const execution of assessments) {
    const existing = grouped.get(execution.scenarioId) ?? {
      scenarioId: execution.scenarioId,
      scenarioName: scenarioNames.get(execution.scenarioId) ?? execution.scenarioId,
      total: 0,
      passed: 0,
      failed: 0,
      passRate: 0,
    };

    existing.total += 1;
    if (execution.report?.passed) {
      existing.passed += 1;
    } else {
      existing.failed += 1;
    }
    existing.passRate = Math.round((existing.passed / existing.total) * 100);
    grouped.set(execution.scenarioId, existing);
  }

  return Array.from(grouped.values()).sort((left, right) => right.total - left.total);
}

function resolveScenarioName(scenarioId: string, scenarios: Scenario[]): string {
  return scenarios.find((scenario) => scenario.id === scenarioId)?.name ?? scenarioId;
}

function getAssessmentTimestamp(execution: ScenarioExecution): number {
  return execution.completedAt ?? execution.startedAt ?? 0;
}

function buildLinePath(assessments: ScenarioExecution[], maxValue: number): string {
  return assessments
    .map((execution, index) => {
      const point = projectPoint(index, execution.report?.score ?? 0, assessments.length, maxValue);
      return `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`;
    })
    .join(" ");
}

function buildAreaPath(assessments: ScenarioExecution[], maxValue: number): string {
  const linePath = buildLinePath(assessments, maxValue);
  const end = projectPoint(assessments.length - 1, 0, assessments.length, maxValue);
  const start = projectPoint(0, 0, assessments.length, maxValue);
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
