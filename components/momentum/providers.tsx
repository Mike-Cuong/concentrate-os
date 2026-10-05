'use client'

import type { ReactNode } from 'react'
import { WorkspaceProvider } from '@/hooks/use-workspace'
import { FocusProvider } from '@/hooks/use-focus'
import { InterfaceProvider } from '@/hooks/use-interface'
import { Toaster } from '@/components/ui/sonner'
import type { Workspace } from '@/lib/momentum/types'
import { WorkspaceDialogs } from './workspace-dialogs'
import { AppShell } from './app-shell'

export function Providers({ children, initialWorkspace }: { children: ReactNode; initialWorkspace: Workspace }) {
  return <WorkspaceProvider initialWorkspace={initialWorkspace}><FocusProvider><InterfaceProvider><AppShell>{children}</AppShell><WorkspaceDialogs /><Toaster theme="dark" position="bottom-right" richColors /></InterfaceProvider></FocusProvider></WorkspaceProvider>
}
