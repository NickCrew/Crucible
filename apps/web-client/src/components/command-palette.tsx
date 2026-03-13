"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
  Zap,
  Play,
  Pause,
  Square,
  Search,
  FileText,
  History,
  Activity,
  Trash2,
} from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import { useCatalogStore } from "@/store/useCatalogStore"

export function CommandPalette() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const { 
    scenarios, 
    executions, 
    pauseAll, 
    resumeAll, 
    cancelAll,
    startSimulation,
    startAssessment
  } = useCatalogStore()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false)
    command()
  }, [])

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => runCommand(() => resumeAll())}>
            <Play className="mr-2 h-4 w-4" />
            <span>Resume All Executions</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => pauseAll())}>
            <Pause className="mr-2 h-4 w-4" />
            <span>Pause All Executions</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => cancelAll())}>
            <Square className="mr-2 h-4 w-4" />
            <span>Stop All Executions</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => router.push("/scenarios"))}>
            <Search className="mr-2 h-4 w-4" />
            <span>Browse Scenarios</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/history"))}>
            <History className="mr-2 h-4 w-4" />
            <span>Execution History</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/"))}>
            <Activity className="mr-2 h-4 w-4" />
            <span>Dashboard Overview</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Scenarios">
          {scenarios.slice(0, 10).map((scenario) => (
            <CommandItem 
              key={scenario.id} 
              onSelect={() => runCommand(() => {
                startSimulation(scenario.id).then(id => {
                  router.push(`/?executionId=${id}`)
                })
              })}
            >
              <Zap className="mr-2 h-4 w-4" />
              <span>Run {scenario.name}</span>
              <CommandShortcut>Simulation</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Recent Executions">
          {executions.slice(0, 5).map((exec) => (
            <CommandItem 
              key={exec.id} 
              onSelect={() => runCommand(() => router.push(`/?executionId=${exec.id}`))}
            >
              <FileText className="mr-2 h-4 w-4" />
              <span>View {exec.scenarioId}</span>
              <CommandShortcut>{exec.status}</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
