"use client"

import { memo, useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  countScenarioBlockingExpectations,
  countSimulationOverridableBlockingExpectations,
  getScenarioTargetCompatibility,
  inferScenarioTargetFamily,
  inferTargetFamilyFromUrl,
  normalizeScenarioTargetUrl,
  ScenarioTargetUrlError,
} from "@crucible/catalog/client"
import type {
  FedRampBaseline,
  FedRampControlFamily,
  FedRampControlId,
  HipaaCitation,
  HipaaSafeguard,
  Scenario,
  ScenarioTargetCompatibility,
  ScenarioTargetFamily,
} from "@crucible/catalog/client"
import { useCatalogStore } from "@/store/useCatalogStore"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { ScenarioDetailDialog } from "@/components/scenario-detail-dialog"
import { Play, ClipboardList, Search, Loader2 } from "lucide-react"

const ALL_FILTER_VALUE = "all"
const FEDRAMP_BASELINES = ["low", "moderate", "high", "li-saas"] as const
const FEDRAMP_CONTROL_FAMILIES = [
  "AC",
  "AT",
  "AU",
  "CA",
  "CM",
  "CP",
  "IA",
  "IR",
  "MA",
  "MP",
  "PE",
  "PL",
  "PM",
  "PS",
  "PT",
  "RA",
  "SA",
  "SC",
  "SI",
  "SR",
] as const
const HIPAA_SAFEGUARDS = [
  "access-control",
  "audit-controls",
  "integrity",
  "person-or-entity-authentication",
  "transmission-security",
] as const

type ComplianceFramework = "fedramp" | "hipaa"

interface ScenarioComplianceFilter {
  framework?: ComplianceFramework
  baseline?: FedRampBaseline
  family?: FedRampControlFamily
  controlId?: FedRampControlId
  citation?: HipaaCitation
  safeguard?: HipaaSafeguard
}

interface LaunchDialogState {
  scenario: Scenario
  mode: "simulation" | "assessment"
  targetUrl: string
  expectWafBlocking: boolean
}

interface LaunchTargetState {
  normalized: string | null
  error: string | null
}

interface ScenarioCatalogEntry {
  scenario: Scenario
  targetFamily: ScenarioTargetFamily
  compatibility: ScenarioTargetCompatibility
  blockingChecks: number
}

interface ComplianceFilterState {
  framework: typeof ALL_FILTER_VALUE | ComplianceFramework
  baseline: typeof ALL_FILTER_VALUE | FedRampBaseline
  family: typeof ALL_FILTER_VALUE | FedRampControlFamily
  controlId: string
  safeguard: typeof ALL_FILTER_VALUE | HipaaSafeguard
}

export default function ScenariosPage() {
  const router = useRouter()
  const {
    scenarios,
    isLoading,
    targetUrl,
    targetStatus,
    fetchScenarios,
    startSimulation,
    startAssessment,
    setTargetUrl,
  } = useCatalogStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null)
  const [selectedCategory, setSelectedCategory] = useState(ALL_FILTER_VALUE)
  const [complianceFilters, setComplianceFilters] = useState<ComplianceFilterState>({
    framework: ALL_FILTER_VALUE,
    baseline: ALL_FILTER_VALUE,
    family: ALL_FILTER_VALUE,
    controlId: "",
    safeguard: ALL_FILTER_VALUE,
  })
  const [launchDialog, setLaunchDialog] = useState<LaunchDialogState | null>(null)
  const [launchError, setLaunchError] = useState<string | null>(null)
  const [launchTargetDraft, setLaunchTargetDraft] = useState<string | null>(null)
  const [launching, setLaunching] = useState<{ scenarioId: string; mode: "simulation" | "assessment" } | null>(null)
  const catalogTargetFamily = useMemo(() => inferTargetFamilyFromUrl(targetUrl), [targetUrl])
  const categories = useMemo(
    () => Array.from(new Set(scenarios.map((scenario) => scenario.category).filter(Boolean) as string[])).sort(),
    [scenarios],
  )
  const fedRampControlIds = useMemo(
    () => Array.from(new Set(scenarios.flatMap((scenario) => (
      scenario.compliance?.mappings
        .filter((mapping) => mapping.framework === "fedramp")
        .map((mapping) => mapping.controlId) ?? []
    )))).sort(),
    [scenarios],
  )
  const hipaaCitations = useMemo(
    () => Array.from(new Set(scenarios.flatMap((scenario) => (
      scenario.compliance?.mappings
        .filter((mapping) => mapping.framework === "hipaa")
        .map((mapping) => mapping.citation) ?? []
    )))).sort(),
    [scenarios],
  )
  const complianceControlOptions = useMemo(
    () => Array.from(new Set([...fedRampControlIds, ...hipaaCitations])).sort(),
    [fedRampControlIds, hipaaCitations],
  )
  const activeComplianceFilter = useMemo(() => {
    const isHipaaFilter = complianceFilters.framework === "hipaa"
    const controlId = normalizeComplianceControlInput(complianceFilters.controlId)
    const filter = {
      ...(complianceFilters.framework !== ALL_FILTER_VALUE ? { framework: complianceFilters.framework } : {}),
      ...(!isHipaaFilter && complianceFilters.baseline !== ALL_FILTER_VALUE ? { baseline: complianceFilters.baseline } : {}),
      ...(!isHipaaFilter && complianceFilters.family !== ALL_FILTER_VALUE ? { family: complianceFilters.family } : {}),
      ...(controlId ? (
        isHipaaFilter
          ? { citation: controlId as HipaaCitation }
          : { controlId: controlId as FedRampControlId }
      ) : {}),
      ...(isHipaaFilter && complianceFilters.safeguard !== ALL_FILTER_VALUE ? { safeguard: complianceFilters.safeguard } : {}),
    }

    return Object.keys(filter).length > 0 ? filter : null
  }, [complianceFilters])
  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
    selectedCategory !== ALL_FILTER_VALUE ||
    activeComplianceFilter,
  )
  const isHipaaFrameworkSelected = complianceFilters.framework === "hipaa"
  const isFedRampFrameworkSelected = complianceFilters.framework === "fedramp"

  useEffect(() => {
    fetchScenarios()
  }, [fetchScenarios])

  const filtered = useMemo<ScenarioCatalogEntry[]>(() => {
    const q = searchQuery.trim().toLowerCase()
    const matches = scenarios
      .filter((s) => {
        if (selectedCategory !== ALL_FILTER_VALUE && s.category !== selectedCategory) {
          return false
        }

        if (activeComplianceFilter && !scenarioMatchesCompliance(s, activeComplianceFilter)) {
          return false
        }

        if (!q) {
          return true
        }

        return (
          s.name.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q) ||
          s.category?.toLowerCase().includes(q) ||
          s.tags?.some((t) => t.toLowerCase().includes(q)) ||
          s.compliance?.mappings.some((mapping) => getComplianceSearchTerms(mapping).some((term) => term.includes(q)))
        )
      })
      .map((scenario) => ({
        scenario,
        targetFamily: inferScenarioTargetFamily(scenario),
        compatibility: getScenarioTargetCompatibility(scenario, targetUrl),
        blockingChecks: countScenarioBlockingExpectations(scenario),
      }))

    if (!catalogTargetFamily) {
      return matches
    }

    return [...matches].sort((left, right) => compareScenarioPriority(left, right, catalogTargetFamily))
  }, [activeComplianceFilter, catalogTargetFamily, scenarios, searchQuery, selectedCategory, targetUrl])

  const launchTargetState = useMemo<LaunchTargetState>(
    () => validateLaunchTargetInput(launchDialog?.targetUrl ?? ""),
    [launchDialog?.targetUrl],
  )
  const effectiveLaunchTarget = useMemo(() => {
    if (!launchDialog) {
      return targetUrl ?? null
    }

    if (!launchDialog.targetUrl.trim() || launchTargetState.error) {
      return targetUrl ?? null
    }

    return launchTargetState.normalized
  }, [launchDialog, launchTargetState.error, launchTargetState.normalized, targetUrl])
  const launchTargetFamily = useMemo(
    () => inferTargetFamilyFromUrl(effectiveLaunchTarget),
    [effectiveLaunchTarget],
  )
  const launchScenarioFamily = launchDialog
    ? inferScenarioTargetFamily(launchDialog.scenario)
    : null
  const launchCompatibility = launchDialog && effectiveLaunchTarget
    ? getScenarioTargetCompatibility(launchDialog.scenario, effectiveLaunchTarget)
    : "unknown"
  const launchBlockingChecks = launchDialog
    ? countScenarioBlockingExpectations(launchDialog.scenario)
    : 0
  const launchOverridableBlockingChecks = launchDialog
    ? countSimulationOverridableBlockingExpectations(launchDialog.scenario)
    : 0

  const openLaunchDialog = useCallback((scenario: Scenario, mode: "simulation" | "assessment") => {
    if (launching) {
      return
    }
    setLaunchError(null)

    setLaunchDialog({
      scenario,
      mode,
      targetUrl: launchTargetDraft ?? targetUrl ?? "",
      expectWafBlocking: true,
    })
  }, [launchTargetDraft, launching, targetUrl])

  const closeLaunchDialog = () => {
    if (launching) {
      return
    }

    setLaunchDialog(null)
    setLaunchError(null)
  }

  const handleLaunch = async () => {
    if (!launchDialog) {
      return
    }

    const submission = validateLaunchTargetInput(launchDialog.targetUrl)
    if (submission.error) {
      setLaunchError(submission.error)
      return
    }

    setLaunchError(null)
    const scenarioId = launchDialog.scenario.id
    const launchMode = launchDialog.mode
    setLaunching({ scenarioId, mode: launchMode })

    try {
      if (launchMode === "simulation") {
        await startSimulation(scenarioId, {
          targetUrl: submission.normalized,
          expectWafBlocking: launchDialog.expectWafBlocking,
        })
        if (submission.normalized) {
          setTargetUrl(submission.normalized)
        }
        setLaunchTargetDraft(submission.normalized ?? null)
        setLaunchDialog(null)
        router.push("/simulations")
      } else {
        await startAssessment(scenarioId, submission.normalized)
        if (submission.normalized) {
          setTargetUrl(submission.normalized)
        }
        setLaunchTargetDraft(submission.normalized ?? null)
        setLaunchDialog(null)
        router.push("/assessments")
      }
    } catch (caughtError) {
      setLaunchError(caughtError instanceof Error ? caughtError.message : "Failed to start scenario")
      console.error("[scenarios] launch failed", caughtError)
    } finally {
      setLaunching(null)
    }
  }

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-[250px] w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="type-display">Scenario Catalog</h1>
        <p className="type-body text-muted-foreground">
          Browse and execute security attack scenarios against your target environment.
        </p>
      </div>

      {catalogTargetFamily && (
        <div className="rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
          Current target profile: <span className="font-medium text-foreground">{getTargetFamilyLabel(catalogTargetFamily)}</span>. Matching scenarios are shown first, and known cross-lab scenarios are deprioritized.
        </div>
      )}

      <div className="grid gap-3 lg:grid-cols-[minmax(18rem,1.5fr)_repeat(6,minmax(8rem,1fr))_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            aria-label="Search scenarios"
            placeholder="Search by name, category, tag, ID, or control..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          aria-label="Category filter"
          value={selectedCategory}
          onChange={(event) => setSelectedCategory(event.target.value)}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <option value={ALL_FILTER_VALUE}>All categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
        <select
          aria-label="Framework filter"
          value={complianceFilters.framework}
          onChange={(event) => setComplianceFilters((current) => ({
            ...current,
            framework: event.target.value as ComplianceFilterState["framework"],
            baseline: event.target.value === "fedramp" ? current.baseline : ALL_FILTER_VALUE,
            family: event.target.value === "fedramp" ? current.family : ALL_FILTER_VALUE,
            safeguard: event.target.value === "hipaa" ? current.safeguard : ALL_FILTER_VALUE,
          }))}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <option value={ALL_FILTER_VALUE}>All frameworks</option>
          <option value="fedramp">FedRAMP</option>
          <option value="hipaa">HIPAA</option>
        </select>
        <select
          aria-label="FedRAMP baseline filter"
          value={complianceFilters.baseline}
          disabled={!isFedRampFrameworkSelected}
          onChange={(event) => setComplianceFilters((current) => ({
            ...current,
            baseline: event.target.value as ComplianceFilterState["baseline"],
          }))}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <option value={ALL_FILTER_VALUE}>All baselines</option>
          {FEDRAMP_BASELINES.map((baseline) => (
            <option key={baseline} value={baseline}>{baseline}</option>
          ))}
        </select>
        <select
          aria-label="FedRAMP family filter"
          value={complianceFilters.family}
          disabled={!isFedRampFrameworkSelected}
          onChange={(event) => setComplianceFilters((current) => ({
            ...current,
            family: event.target.value as ComplianceFilterState["family"],
          }))}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <option value={ALL_FILTER_VALUE}>All families</option>
          {FEDRAMP_CONTROL_FAMILIES.map((family) => (
            <option key={family} value={family}>{family}</option>
          ))}
        </select>
        <Input
          aria-label={getComplianceControlInputLabel(complianceFilters.framework)}
          list={getComplianceControlDatalistId(complianceFilters.framework)}
          placeholder={getComplianceControlInputPlaceholder(complianceFilters.framework)}
          value={complianceFilters.controlId}
          onChange={(event) => setComplianceFilters((current) => ({
            ...current,
            controlId: event.target.value,
          }))}
        />
        <datalist id="fedramp-control-options">
          {fedRampControlIds.map((controlId) => (
            <option key={controlId} value={controlId} />
          ))}
        </datalist>
        <datalist id="compliance-control-options">
          {complianceControlOptions.map((controlId) => (
            <option key={controlId} value={controlId} />
          ))}
        </datalist>
        <datalist id="hipaa-citation-options">
          {hipaaCitations.map((citation) => (
            <option key={citation} value={citation} />
          ))}
        </datalist>
        <select
          aria-label="HIPAA safeguard filter"
          value={complianceFilters.safeguard}
          disabled={!isHipaaFrameworkSelected}
          onChange={(event) => setComplianceFilters((current) => ({
            ...current,
            safeguard: event.target.value as ComplianceFilterState["safeguard"],
          }))}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <option value={ALL_FILTER_VALUE}>All safeguards</option>
          {HIPAA_SAFEGUARDS.map((safeguard) => (
            <option key={safeguard} value={safeguard}>{safeguard}</option>
          ))}
        </select>
        {hasActiveFilters && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSearchQuery("")
              setSelectedCategory(ALL_FILTER_VALUE)
              setComplianceFilters({
                framework: ALL_FILTER_VALUE,
                baseline: ALL_FILTER_VALUE,
                family: ALL_FILTER_VALUE,
                controlId: "",
                safeguard: ALL_FILTER_VALUE,
              })
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {launching && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-sm text-muted-foreground"
        >
          Starting the {launching.mode} run for this scenario. Additional launches will be available once the request finishes.
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          {hasActiveFilters
            ? "No scenarios match the current filters."
            : "No scenarios found."}
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(({ scenario, targetFamily, compatibility, blockingChecks }) => (
            <ScenarioCatalogCard
              key={scenario.id}
              scenario={scenario}
              targetFamily={targetFamily}
              compatibility={compatibility}
              blockingChecks={blockingChecks}
              launching={launching}
              onCardOpen={setSelectedScenario}
              onLaunch={openLaunchDialog}
            />
          ))}
        </div>
      )}

      <ScenarioDetailDialog
        scenario={selectedScenario}
        open={selectedScenario !== null}
        onOpenChange={(open) => { if (!open) setSelectedScenario(null) }}
      />

      <Dialog
        open={launchDialog !== null}
        onOpenChange={(open) => {
          if (!open && !launching) {
            closeLaunchDialog()
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {launchDialog ? `Launch ${launchDialog.scenario.name}` : "Launch Scenario"}
            </DialogTitle>
            <DialogDescription>
              Choose how to start this scenario and optionally override the target URL for this run.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Launch mode</legend>
              <div className="grid grid-cols-2 gap-2">
                  <label
                    className={getLaunchModeLabelClasses(launchDialog?.mode === "simulation", launching !== null)}
                  >
                    <input
                      type="radio"
                      name="launch-mode"
                      className="sr-only"
                      checked={launchDialog?.mode === "simulation"}
                      onChange={() => {
                        if (!launchDialog || launching) {
                          return
                        }
                        setLaunchError(null)
                        setLaunchDialog({ ...launchDialog, mode: "simulation" })
                      }}
                      disabled={launching !== null}
                    />
                    <Play aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" />
                    Simulation
                  </label>
                  <label
                    className={getLaunchModeLabelClasses(launchDialog?.mode === "assessment", launching !== null)}
                  >
                    <input
                      type="radio"
                      name="launch-mode"
                      className="sr-only"
                      checked={launchDialog?.mode === "assessment"}
                      onChange={() => {
                        if (!launchDialog || launching) {
                          return
                        }
                        setLaunchError(null)
                        setLaunchDialog({ ...launchDialog, mode: "assessment" })
                      }}
                      disabled={launching !== null}
                    />
                    <ClipboardList aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" />
                    Assessment
                  </label>
              </div>
            </fieldset>

            <div className="space-y-2">
              <label htmlFor="scenario-launch-target" className="text-sm font-medium">
                Target URL
              </label>
              <Input
                id="scenario-launch-target"
                placeholder="http://localhost:8880"
                value={launchDialog?.targetUrl ?? ""}
                aria-invalid={launchTargetState.error ? true : undefined}
                onChange={(event) => {
                  if (!launchDialog || launching) {
                    return
                  }
                  setLaunchError(null)
                  setLaunchTargetDraft(event.target.value)
                  setLaunchDialog({ ...launchDialog, targetUrl: event.target.value })
                }}
                disabled={launching !== null}
              />
              <p className="text-sm text-muted-foreground">
                Leave blank to fall back to the server default target for this run. Successful launches with an override also update the saved catalog target used for future launches. Saved catalog target status:{" "}
                {getTargetStatusLabel(targetStatus)}.
              </p>
            </div>

            {launchDialog?.mode === "simulation" && (
              <div className="rounded-md border border-border/60 bg-muted/20 px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="simulation-waf-blocking" className="text-sm font-medium">
                      Expect WAF blocking
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Turn this off when this simulation run should treat successful attack responses as the expected outcome for scenario-authored blocking checks that explicitly opt into simulation override.
                    </p>
                  </div>
                  <Switch
                    id="simulation-waf-blocking"
                    checked={launchDialog.expectWafBlocking}
                    onCheckedChange={(checked) => {
                      if (!launchDialog || launching) {
                        return
                      }
                      setLaunchDialog({ ...launchDialog, expectWafBlocking: checked })
                    }}
                    disabled={launching !== null}
                    aria-label="Expect WAF blocking"
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {launchOverridableBlockingChecks > 0
                    ? `${launchOverridableBlockingChecks} blocking ${launchOverridableBlockingChecks === 1 ? "check is" : "checks are"} marked as overridable in simulation mode for this scenario.`
                    : "This scenario does not mark any blocking checks as overridable, so this toggle will not change pass/fail behavior."}
                </p>
              </div>
            )}

            {launchTargetState.error && (
              <div
                role="alert"
                className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive"
              >
                {launchTargetState.error}
              </div>
            )}

            {(launchTargetState.error || (!targetUrl && !launchDialog?.targetUrl.trim())) && (
              <div className="rounded-md border border-border/60 bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                Compatibility guidance will appear once the target URL is valid.
              </div>
            )}

            {!launchTargetState.error && launchCompatibility === "incompatible" && launchTargetFamily && launchScenarioFamily && (
              <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-200">
                This scenario is labeled for <span className="font-medium">{getTargetFamilyLabel(launchScenarioFamily)}</span>, but the target URL looks like <span className="font-medium">{getTargetFamilyLabel(launchTargetFamily)}</span>. It may fail because the endpoint families do not line up.
              </div>
            )}

            {!launchTargetState.error && launchTargetFamily === "chimera" && launchBlockingChecks > 0 && (
              <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-200">
                This scenario includes <span className="font-medium">{launchBlockingChecks}</span> blocking {launchBlockingChecks === 1 ? "assertion" : "assertions"}. Live Chimera is intentionally vulnerable, so assessments may fail by design when those attacks succeed.
              </div>
            )}

            {launchError && (
              <div
                role="alert"
                className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive"
              >
                {launchError}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeLaunchDialog} disabled={launching !== null}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                void handleLaunch()
              }}
              disabled={
                launchDialog
                  ? launching !== null || launchTargetState.error !== null
                  : false
              }
            >
              {launchDialog && launching?.scenarioId === launchDialog.scenario.id ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Starting…
                </>
              ) : launchDialog?.mode === "assessment" ? (
                "Start assessment"
              ) : (
                "Start simulation"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface ScenarioCatalogCardProps {
  scenario: Scenario
  targetFamily: ScenarioTargetFamily
  compatibility: ScenarioTargetCompatibility
  blockingChecks: number
  launching: { scenarioId: string; mode: "simulation" | "assessment" } | null
  onCardOpen: (scenario: Scenario) => void
  onLaunch: (scenario: Scenario, mode: "simulation" | "assessment") => void
}

const ScenarioCatalogCard = memo(function ScenarioCatalogCard({
  scenario,
  targetFamily,
  compatibility,
  blockingChecks,
  launching,
  onCardOpen,
  onLaunch,
}: ScenarioCatalogCardProps) {
  return (
    <Card
      className="flex flex-col cursor-pointer transition-shadow hover:shadow-md hover:border-foreground/20"
      onClick={() => onCardOpen(scenario)}
    >
      <CardHeader>
        <div className="mb-2 flex items-start justify-between gap-3">
          <Badge variant={getDifficultyVariant(scenario.difficulty)}>
            {scenario.difficulty || "Beginner"}
          </Badge>
          <span className="type-timestamp text-muted-foreground uppercase">
            {scenario.category}
          </span>
        </div>
        <CardTitle className="line-clamp-1 text-base">{scenario.name}</CardTitle>
        <CardDescription className="line-clamp-2 h-10">
          {scenario.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="text-sm text-muted-foreground">
          <span className="type-data font-semibold text-foreground">{scenario.steps.length}</span> attack steps
          {blockingChecks > 0 ? ` - ${blockingChecks} blocking check${blockingChecks === 1 ? "" : "s"}` : ""}
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {scenario.compliance?.mappings
            .slice(0, 3)
            .map((mapping) => (
              <Badge key={getComplianceBadgeKey(mapping)} variant="secondary" className="type-tag">
                {formatComplianceBadge(mapping)}
              </Badge>
            ))}
          {targetFamily !== "unknown" && targetFamily !== "generic" && (
            <Badge variant={compatibility === "incompatible" ? "destructive" : "secondary"} className="type-tag">
              {getTargetFamilyLabel(targetFamily)}
            </Badge>
          )}
          {compatibility === "unknown" && blockingChecks > 0 && (
            <Badge variant="outline" className="type-tag">
              control checks
            </Badge>
          )}
          {scenario.tags?.slice(0, 3).map((tag: string) => (
            <Badge key={tag} variant="outline" className="type-tag">
              {tag}
            </Badge>
          ))}
        </div>
        {compatibility === "incompatible" && (
          <p className="mt-3 text-xs text-muted-foreground">
            Known mismatch with the current target family.
          </p>
        )}
      </CardContent>
      <CardFooter className="gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          disabled={launching !== null}
          onClick={(e) => {
            e.stopPropagation()
            onLaunch(scenario, "simulation")
          }}
        >
          {launching?.scenarioId === scenario.id && launching.mode === "simulation" ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Play className="mr-1.5 h-3.5 w-3.5" />
          )}
          {launching?.scenarioId === scenario.id && launching.mode === "simulation" ? "Starting…" : "Simulate"}
        </Button>
        <Button
          size="sm"
          className="flex-1"
          disabled={launching !== null}
          onClick={(e) => {
            e.stopPropagation()
            onLaunch(scenario, "assessment")
          }}
        >
          {launching?.scenarioId === scenario.id && launching.mode === "assessment" ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <ClipboardList className="mr-1.5 h-3.5 w-3.5" />
          )}
          {launching?.scenarioId === scenario.id && launching.mode === "assessment" ? "Starting…" : "Assess"}
        </Button>
      </CardFooter>
    </Card>
  )
})

function scenarioMatchesCompliance(scenario: Scenario, filter: ScenarioComplianceFilter): boolean {
  const mappings = scenario.compliance?.mappings ?? []

  return mappings.some((mapping) => {
    if (filter.framework && mapping.framework !== filter.framework) {
      return false
    }

    if (mapping.framework === "fedramp") {
      if (filter.citation || filter.safeguard) {
        return false
      }
      if (filter.baseline && mapping.baseline !== filter.baseline) {
        return false
      }
      if (filter.family && mapping.family !== filter.family) {
        return false
      }
      if (filter.controlId && mapping.controlId !== filter.controlId) {
        return false
      }
      return true
    }

    if (mapping.framework === "hipaa") {
      if (filter.baseline || filter.family) {
        return false
      }
      if (filter.citation && mapping.citation !== filter.citation) {
        return false
      }
      if (filter.safeguard && mapping.safeguard !== filter.safeguard) {
        return false
      }
      if (filter.controlId && mapping.controlId !== filter.controlId && mapping.citation !== filter.controlId) {
        return false
      }
      return true
    }

    return true
  })
}

type ScenarioComplianceMapping = NonNullable<Scenario["compliance"]>["mappings"][number]

function getComplianceSearchTerms(mapping: ScenarioComplianceMapping): string[] {
  if (mapping.framework === "fedramp") {
    return [mapping.framework, mapping.controlId, mapping.family, mapping.baseline]
      .filter(Boolean)
      .map((term) => term.toLowerCase())
  }

  return [
    mapping.framework,
    mapping.citation,
    mapping.controlId ?? "",
    mapping.safeguard,
  ].filter(Boolean).map((term) => term.toLowerCase())
}

function normalizeComplianceControlInput(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    return ""
  }

  return /^[a-z]{2}-/i.test(trimmed) ? trimmed.toUpperCase() : trimmed
}

function getComplianceControlInputLabel(framework: ComplianceFilterState["framework"]): string {
  if (framework === "hipaa") {
    return "HIPAA citation filter"
  }
  if (framework === "fedramp") {
    return "FedRAMP control ID filter"
  }
  return "Compliance control ID or citation filter"
}

function getComplianceControlInputPlaceholder(framework: ComplianceFilterState["framework"]): string {
  if (framework === "hipaa") {
    return "Citation"
  }
  if (framework === "fedramp") {
    return "Control ID"
  }
  return "Control ID / citation"
}

function getComplianceControlDatalistId(framework: ComplianceFilterState["framework"]): string {
  if (framework === "hipaa") {
    return "hipaa-citation-options"
  }
  if (framework === "fedramp") {
    return "fedramp-control-options"
  }
  return "compliance-control-options"
}

function getComplianceBadgeKey(mapping: ScenarioComplianceMapping): string {
  if (mapping.framework === "fedramp") {
    return `${mapping.framework}-${mapping.controlId}-${mapping.baseline}`
  }

  return `${mapping.framework}-${mapping.citation}-${mapping.safeguard}`
}

function formatComplianceBadge(mapping: ScenarioComplianceMapping): string {
  if (mapping.framework === "fedramp") {
    return `${mapping.controlId} ${mapping.baseline}`
  }

  return `${mapping.citation} ${mapping.safeguard}`
}

function validateLaunchTargetInput(value: string): LaunchTargetState {
  try {
    return {
      normalized: normalizeScenarioTargetUrl(value) ?? null,
      error: null,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Enter a valid target URL before starting the scenario."
    if (error instanceof ScenarioTargetUrlError) {
      switch (error.code) {
        case "protocol":
          return { normalized: null, error: "Enter an http:// or https:// target URL." }
        case "credentials":
          return { normalized: null, error: "Target URLs must not include credentials." }
        case "hostname":
          return { normalized: null, error: "Target URL must include a hostname." }
        case "invalid":
          return { normalized: null, error: "Target URL must be a valid absolute URL." }
      }
    }
    return {
      normalized: null,
      error: message,
    }
  }
}

function getTargetStatusLabel(status: "online" | "offline" | "unknown"): string {
  switch (status) {
    case "online":
      return "Reachable"
    case "offline":
      return "Offline"
    case "unknown":
      return "Unchecked"
  }
}

function getDifficultyVariant(difficulty?: string): "default" | "secondary" | "destructive" | "outline" {
  switch (difficulty?.toLowerCase()) {
    case 'advanced':
    case 'expert':
      return 'destructive'
    case 'intermediate':
      return 'default'
    case 'basic':
    case 'beginner':
    case 'easy':
      return 'secondary'
    default:
      return 'outline'
  }
}

function getLaunchModeLabelClasses(selected: boolean, disabled: boolean): string {
  const stateClasses = selected
    ? "border-primary bg-primary text-primary-foreground"
    : "border-border text-foreground"

  const interactionClasses = disabled
    ? "cursor-not-allowed opacity-60"
    : "cursor-pointer"

  return [
    "flex items-center justify-center rounded-md border px-3 py-2 text-sm font-medium",
    "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
    stateClasses,
    interactionClasses,
  ].join(" ")
}

function compareScenarioPriority(
  left: ScenarioCatalogEntry,
  right: ScenarioCatalogEntry,
  targetFamily: ScenarioTargetFamily,
): number {
  const leftRank = getCompatibilityRank(left.compatibility, left.targetFamily, targetFamily)
  const rightRank = getCompatibilityRank(right.compatibility, right.targetFamily, targetFamily)

  if (leftRank !== rightRank) {
    return leftRank - rightRank
  }

  return SCENARIO_NAME_COLLATOR.compare(left.scenario.name, right.scenario.name)
}

const SCENARIO_NAME_COLLATOR = new Intl.Collator(undefined, { sensitivity: "base" })

function getCompatibilityRank(
  compatibility: ScenarioTargetCompatibility,
  scenarioFamily: ScenarioTargetFamily,
  targetFamily: ScenarioTargetFamily,
): number {
  if (compatibility === "compatible") {
    return 0
  }

  if (compatibility === "unknown") {
    return scenarioFamily === targetFamily ? 0 : 1
  }

  return 2
}

function getTargetFamilyLabel(targetFamily: ScenarioTargetFamily): string {
  switch (targetFamily) {
    case "chimera":
      return "Chimera-first"
    case "crapi":
      return "crAPI"
    case "vampi":
      return "VAmPI"
    case "vp-demo":
      return "VP demo"
    case "generic":
      return "Generic"
    case "unknown":
      return "Unclassified"
    default: {
      const exhaustiveCheck: never = targetFamily
      console.warn("Unsupported scenario target family label", exhaustiveCheck)
      return `Unknown family (${String(exhaustiveCheck)})`
    }
  }
}
