'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

export type InterfaceDialog = { type: 'goal' | 'task' | 'detail' | 'settings' | 'help' | 'search'; goalId?: string; scheduledDate?: string } | null
interface InterfaceValue {
  dialog: InterfaceDialog
  close: () => void
  newGoal: () => void
  newTask: (goalId?: string, scheduledDate?: string) => void
  viewGoal: (goalId: string) => void
  openSettings: () => void
  openHelp: () => void
  openSearch: () => void
}
const InterfaceContext = createContext<InterfaceValue | null>(null)
export function InterfaceProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<InterfaceDialog>(null)
  return <InterfaceContext.Provider value={{ dialog, close: () => setDialog(null), newGoal: () => setDialog({ type: 'goal' }), newTask: (goalId, scheduledDate) => setDialog({ type: 'task', goalId, scheduledDate }), viewGoal: (goalId) => setDialog({ type: 'detail', goalId }), openSettings: () => setDialog({ type: 'settings' }), openHelp: () => setDialog({ type: 'help' }), openSearch: () => setDialog({ type: 'search' }) }}>{children}</InterfaceContext.Provider>
}
export function useInterface() {
  const context = useContext(InterfaceContext)
  if (!context) throw new Error('InterfaceProvider is required')
  return context
}
