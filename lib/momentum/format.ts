import type { FocusSession, Task } from './types'

export function dateOffset(date: string, days: number) {
  return new Date(new Date(`${date}T12:00:00Z`).getTime() + days * 86400000).toISOString().slice(0, 10)
}

export function formatDate(date: string, options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit' }) {
  return new Intl.DateTimeFormat('vi-VN', { ...options, timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`))
}

export function formatMinutes(value: number) {
  const minutes = Math.max(0, Math.round(value))
  const hours = Math.floor(minutes / 60)
  return hours ? `${hours}h${minutes % 60 ? ` ${String(minutes % 60).padStart(2, '0')}p` : ''}` : `${minutes}p`
}

export function formatTimer(seconds: number) {
  const safeSeconds = Math.max(0, Math.ceil(seconds))
  return `${String(Math.floor(safeSeconds / 60)).padStart(2, '0')}:${String(safeSeconds % 60).padStart(2, '0')}`
}

export function goalProgress(goalId: string, tasks: Task[]) {
  const relevant = tasks.filter((task) => task.goalId === goalId)
  const done = relevant.filter((task) => task.completed).length
  return { done, total: relevant.length, percent: relevant.length ? Math.round(done / relevant.length * 100) : 0 }
}

export function minutesOnDate(sessions: FocusSession[], date: string) {
  return sessions.filter((session) => session.startedAt.slice(0, 10) === date).reduce((total, session) => total + session.durationSeconds / 60, 0)
}

export function focusStreak(sessions: FocusSession[], today: string) {
  const days = new Set(sessions.filter((session) => session.durationSeconds > 0).map((session) => session.startedAt.slice(0, 10)))
  let cursor = days.has(today) ? today : dateOffset(today, -1)
  let streak = 0
  while (days.has(cursor)) {
    streak += 1
    cursor = dateOffset(cursor, -1)
  }
  return streak
}
