export type GoalColor = 'mint' | 'lavender' | 'peach'

export interface Goal {
  id: string
  title: string
  description: string
  category: string
  color: GoalColor
  deadline: string
  archived: boolean
}

export interface Task {
  id: string
  title: string
  goalId: string
  scheduledDate: string
  startTime: string
  minutes: number
  completed: boolean
}

export interface FocusSession {
  id: string
  startedAt: string
  durationSeconds: number
  taskId?: string
}

export interface RoutinePeriod {
  id: string
  category: 'commute' | 'personal'
  startTime: string
  minutes: number
}

export interface DailyRoutine {
  sleepMinutes: number
  commuteMinutes: number
  personalMinutes: number
  sleepStartTime?: string
  commuteStartTime?: string
  personalStartTime?: string
  extraPeriods?: RoutinePeriod[]
}

export type ScheduleCategory = 'study' | 'work' | 'other'

export interface ScheduleEntry {
  id: string
  title: string
  date: string
  startTime: string
  endTime: string
  category: ScheduleCategory
}

export interface Workspace {
  routines: Record<string, DailyRoutine>
  schedule: ScheduleEntry[]
  today: string
  goals: Goal[]
  tasks: Task[]
  sessions: FocusSession[]
  preferences: { dailyMinutes: number; name: string }
}
