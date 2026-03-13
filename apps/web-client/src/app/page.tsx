'use client';

import { useCatalogStore } from '@/store/useCatalogStore';
import { ExecutionMetricsChart } from '@/components/execution-metrics-chart';
import { AssessmentTrendPanel } from '@/components/assessment-trend-panel';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, ShieldCheck, Database, Zap, ArrowRight } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { ScenarioExecution } from '@/store/useCatalogStore';

const RemoteTerminal = dynamic(
  () => import('@/components/remote-terminal').then((mod) => mod.RemoteTerminal),
  { ssr: false },
);

export const DEFAULT_API_BASE = 'http://localhost:3001/api';
const API_BASE = process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_BASE;

export default function Dashboard() {
  const { scenarios, executions, activeExecution, fetchScenarios, metricsHistory, metricsThrottleMs } =
    useCatalogStore();
  const [historicalAssessments, setHistoricalAssessments] = useState<ScenarioExecution[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);

  useEffect(() => {
    fetchScenarios();
  }, [fetchScenarios]);

  useEffect(() => {
    const controller = new AbortController();

    const loadAssessmentHistory = async () => {
      setHistoryLoading(true);
      setHistoryError(null);

      try {
        const response = await fetch(`${API_BASE}/executions?mode=assessment&limit=50`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Assessment history request failed (${response.status})`);
        }

        const data = (await response.json()) as ScenarioExecution[];
        if (controller.signal.aborted) {
          return;
        }
        setHistoricalAssessments(data);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        setHistoryError(error instanceof Error ? error.message : 'Failed to load assessment history');
      } finally {
        if (!controller.signal.aborted) {
          setHistoryLoading(false);
        }
      }
    };

    void loadAssessmentHistory();

    return () => {
      controller.abort();
    };
  }, [API_BASE]);

  const categories = Array.from(new Set(scenarios.map((s) => s.category).filter(Boolean)));
  const runningCount = executions.filter((e) => e.status === 'running').length;
  const lastExecution = executions[0];
  const assessmentExecutions = mergeAssessmentExecutions(
    historicalAssessments,
    executions.filter((execution) => execution.mode === 'assessment'),
  );

  return (
    <div className="space-y-8">
      {/* Stats row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="type-label text-muted-foreground">Total Scenarios</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="type-metric">{scenarios.length}</div>
            <p className="type-body text-muted-foreground">Across {categories.length} categories</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="type-label text-muted-foreground">Active Simulations</CardTitle>
            <Zap
              className={
                runningCount > 0 ? 'h-4 w-4 text-primary' : 'h-4 w-4 text-muted-foreground'
              }
            />
          </CardHeader>
          <CardContent>
            <div className="type-metric">{runningCount}</div>
            <p className="type-body text-muted-foreground">Running in real-time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="type-label text-muted-foreground">System Health</CardTitle>
            <ShieldCheck className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="type-metric text-success">Optimal</div>
            <p className="type-body text-muted-foreground">Defense monitoring active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="type-label text-muted-foreground">Last Execution</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="type-metric">
              {lastExecution ? lastExecution.status.toUpperCase() : 'N/A'}
            </div>
            <p className="type-body text-muted-foreground">
              {lastExecution ? `Scenario ${lastExecution.scenarioId}` : 'No recent activity'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main content row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-12">
        <Card className="col-span-12 lg:col-span-8">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>
              Buffered execution telemetry with throttled chart updates
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-4 border-t border-border/50 pt-4">
            <ExecutionMetricsChart history={metricsHistory} throttleMs={metricsThrottleMs} />
          </CardContent>
        </Card>

        <Card className="col-span-12 lg:col-span-4">
          <CardHeader>
            <CardTitle>Recent Scenarios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {scenarios.slice(0, 5).map((scenario) => (
                <div key={scenario.id} className="flex items-center">
                  <div className="space-y-1">
                    <p className="type-body font-medium leading-none">{scenario.name}</p>
                    <p className="type-timestamp text-muted-foreground">{scenario.category}</p>
                  </div>
                  <div className="ml-auto">
                    <Badge variant="outline" className="type-tag">
                      {scenario.difficulty || 'Beginner'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 flex justify-center">
              <Link href="/scenarios" className="w-full">
                <Button variant="outline" className="w-full group">
                  View All Scenarios
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="col-span-12">
          <CardHeader>
            <CardTitle>Assessment Trends</CardTitle>
            <CardDescription>
              Persisted assessment history blended with live execution updates.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-4 border-t border-border/50 pt-4">
            <AssessmentTrendPanel
              assessments={assessmentExecutions}
              scenarios={scenarios}
              isLoading={historyLoading}
              error={historyError}
            />
          </CardContent>
        </Card>
      </div>

      {/* Active Terminal Row */}
      {(activeExecution && (activeExecution.status === 'running' || activeExecution.status === 'paused')) && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/80 mb-4 flex items-center gap-2">
            Active Sandbox
            <span className="h-px w-12 bg-border/50" />
          </h3>
          <div className="h-[400px]">
            <RemoteTerminal executionId={activeExecution.id} />
          </div>
        </div>
      )}
    </div>
  );
}

function mergeAssessmentExecutions(
  historicalAssessments: ScenarioExecution[],
  liveAssessments: ScenarioExecution[],
): ScenarioExecution[] {
  const merged = new Map<string, ScenarioExecution>();

  for (const execution of historicalAssessments) {
    merged.set(execution.id, execution);
  }

  for (const execution of liveAssessments) {
    merged.set(execution.id, execution);
  }

  return Array.from(merged.values()).sort(
    (left, right) =>
      (right.completedAt ?? right.startedAt ?? 0) - (left.completedAt ?? left.startedAt ?? 0),
  );
}
