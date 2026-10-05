'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import useSWR, { SWRConfig } from 'swr'
import type { DailyRoutine, FocusSession, Goal, ScheduleEntry, Task, Workspace } from '@/lib/momentum/types'
import { validateRoutine, validateSchedule } from '@/lib/momentum/planner'

const InitialWorkspaceContext = createContext<Workspace | null>(null)

export function WorkspaceProvider({ initialWorkspace, children }: { initialWorkspace: Workspace; children: ReactNode }) {
  const [cache] = useState(() => new Map())
  return <SWRConfig value={{ provider: () => cache, revalidateOnFocus: false, revalidateOnReconnect: false }}><InitialWorkspaceContext.Provider value={initialWorkspace}>{children}</InitialWorkspaceContext.Provider></SWRConfig>
}

export function useWorkspace() {
  const initial = useContext(InitialWorkspaceContext)
  if (!initial) throw new Error('WorkspaceProvider is required')
  const { data, mutate } = useSWR<Workspace>('focus-os-workspace', null, { fallbackData: initial })
  const workspace = data ?? initial
  const update = (fn: (current: Workspace) => Workspace) => mutate((current) => fn(current ?? initial), { revalidate: false })
  return {
    workspace,
    addGoal: (goal: Omit<Goal, 'id' | 'archived'>) => update((current) => ({ ...current, goals: [...current.goals, { ...goal, id: crypto.randomUUID(), archived: false }] })),
    addTask: (task: Omit<Task, 'id' | 'completed'>) => update((current) => ({ ...current, tasks: [...current.tasks, { ...task, id: crypto.randomUUID(), completed: false }] })),
    toggleTask: (id: string) => update((current) => ({ ...current, tasks: current.tasks.map((task) => task.id === id ? { ...task, completed: !task.completed } : task) })),
    archiveGoal: (id: string) => update((current) => ({ ...current, goals: current.goals.map((goal) => goal.id === id ? { ...goal, archived: !goal.archived } : goal) })),
    addSession: (session: FocusSession) => update((current) => current.sessions.some((item) => item.id === session.id) ? current : { ...current, sessions: [...current.sessions, session] }),
    setPreferences: (preferences: Workspace['preferences']) => update((current) => ({ ...current, preferences })),
    setRoutine: (dates: string[], routine: DailyRoutine) => {
      const error = validateRoutine(routine)
      if (error) throw new Error(error)
      return update((current) => ({ ...current, routines: { ...current.routines, ...Object.fromEntries(dates.map((date) => [date, { ...routine, extraPeriods: routine.extraPeriods?.map((period) => ({ ...period })) }])) } }))
    },
    addSchedule: (entries: Omit<ScheduleEntry, 'id'>[]) => {
      for (const entry of entries) {
        const error = validateSchedule(entry)
        if (error) throw new Error(error)
      }
      return update((current) => ({ ...current, schedule: [...current.schedule, ...entries.map((entry) => ({ ...entry, title: entry.title.trim(), id: crypto.randomUUID() }))] }))
    },
    updateSchedule: (entry: ScheduleEntry) => {
      const error = validateSchedule(entry)
      if (error) throw new Error(error)
      return update((current) => ({ ...current, schedule: current.schedule.map((item) => item.id === entry.id ? { ...entry, title: entry.title.trim() } : item) }))
    },
    removeSchedule: (id: string) => update((current) => ({ ...current, schedule: current.schedule.filter((entry) => entry.id !== id) })),
  }
}
