'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { useWorkspace } from './use-workspace'

type FocusStatus = 'idle' | 'running' | 'paused' | 'completed'
interface FocusValue {
  duration: number
  remaining: number
  status: FocusStatus
  taskId?: string
  setDuration: (minutes: number) => void
  selectTask: (id: string) => void
  toggle: () => void
  reset: () => void
}
const FocusContext = createContext<FocusValue | null>(null)

export function FocusProvider({ children }: { children: ReactNode }) {
  const { addSession } = useWorkspace()
  const [duration, setMinutes] = useState(25)
  const [remaining, setRemaining] = useState(25 * 60)
  const [status, setStatus] = useState<FocusStatus>('idle')
  const [taskId, setTaskId] = useState<string>()
  const deadline = useRef(0)
  const session = useRef<{ id: string; startedAt: string } | null>(null)
  const saveSession = useRef(addSession)
  saveSession.current = addSession

  const complete = useCallback(() => {
    if (!session.current) return
    const finished = session.current
    session.current = null
    void saveSession.current({ ...finished, taskId, durationSeconds: duration * 60 })
    setRemaining(0)
    setStatus('completed')
    toast.success('Một phiên tập trung trọn vẹn!', { description: `${duration} phút đã được thêm vào hành trình. Hãy nghỉ ngơi một chút nhé.` })
  }, [duration, taskId])

  useEffect(() => {
    if (status !== 'running') return
    const tick = () => {
      const seconds = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000))
      setRemaining(seconds)
      if (seconds === 0) complete()
    }
    tick()
    const interval = setInterval(tick, 250)
    return () => clearInterval(interval)
  }, [status, complete])

  const toggle = () => {
    if (status === 'running') {
      const seconds = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000))
      if (!seconds) { complete(); return }
      setRemaining(seconds)
      setStatus('paused')
    } else {
      const seconds = status === 'completed' ? duration * 60 : remaining
      if (status !== 'paused') session.current = { id: crypto.randomUUID(), startedAt: new Date().toISOString() }
      deadline.current = Date.now() + seconds * 1000
      setRemaining(seconds)
      setStatus('running')
    }
  }

  return <FocusContext.Provider value={{ duration, remaining, status, taskId, toggle,
    setDuration: (minutes) => { if (status === 'running' || status === 'paused' || ![25, 50].includes(minutes)) return; setMinutes(minutes); setRemaining(minutes * 60); setStatus('idle') },
    selectTask: (id) => { if (status === 'running' || status === 'paused') { toast.info('Hãy hoàn thành hoặc đặt lại phiên hiện tại trước khi đổi nhiệm vụ.'); return }; setTaskId(id || undefined) },
    reset: () => { session.current = null; setRemaining(duration * 60); setStatus('idle') },
  }}>{children}</FocusContext.Provider>
}

export function useFocus() {
  const context = useContext(FocusContext)
  if (!context) throw new Error('FocusProvider is required')
  return context
}
