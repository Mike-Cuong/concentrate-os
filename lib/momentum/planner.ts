import type { DailyRoutine, ScheduleEntry, Task, Workspace } from './types'

export const DEFAULT_ROUTINE: DailyRoutine = { sleepMinutes: 480, commuteMinutes: 60, personalMinutes: 120 }
export const SCHEDULE_CATEGORIES = { study: 'Học tập', work: 'Công việc', other: 'Lịch khác' } as const
const DAY_MINUTES = 1440

export function shiftDate(date: string, days: number) {
  const value = new Date(`${date}T12:00:00Z`)
  value.setUTCDate(value.getUTCDate() + days)
  return value.toISOString().slice(0, 10)
}

export function startOfWeek(date: string) {
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay()
  return shiftDate(date, -((weekday + 6) % 7))
}

export function weekDates(date: string) {
  const monday = startOfWeek(date)
  return Array.from({ length: 7 }, (_, index) => shiftDate(monday, index))
}

export function timeToMinutes(time: string) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return NaN
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export function clockTime(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

export function durationLabel(minutes: number) {
  const value = Math.max(0, Math.round(minutes))
  const hours = Math.floor(value / 60)
  return hours ? `${hours} giờ${value % 60 ? ` ${value % 60} phút` : ''}` : `${value} phút`
}

export function scheduleDuration(entry: Pick<ScheduleEntry, 'startTime' | 'endTime'>) {
  const start = timeToMinutes(entry.startTime)
  const end = timeToMinutes(entry.endTime)
  return end < start ? DAY_MINUTES - start + end : end - start
}

export function hasRoutineTiming(routine?: DailyRoutine): boolean {
  if (!routine) return false
  return Number.isFinite(timeToMinutes(routine.sleepStartTime ?? ''))
    && (routine.commuteMinutes === 0 || Number.isFinite(timeToMinutes(routine.commuteStartTime ?? '')))
    && (routine.personalMinutes === 0 || Number.isFinite(timeToMinutes(routine.personalStartTime ?? '')))
    && (routine.extraPeriods ?? []).every((period) => Number.isFinite(timeToMinutes(period.startTime)))
}

export function validateRoutine(routine: DailyRoutine) {
  if (!Number.isInteger(routine.sleepMinutes) || routine.sleepMinutes < 360 || routine.sleepMinutes > 480) return 'Thời gian ngủ phải từ 6 đến 8 tiếng.'
  if (![routine.commuteMinutes, routine.personalMinutes].every((value) => Number.isInteger(value) && value >= 0 && value <= DAY_MINUTES)) return 'Nhập số phút nguyên từ 0 đến 1.440 cho di chuyển và sinh hoạt.'
  const extra = routine.extraPeriods ?? []
  if (extra.length > 24) return 'Chỉ thêm tối đa 24 khung sinh hoạt mỗi ngày.'
  if (extra.some((period) => !['commute', 'personal'].includes(period.category) || !Number.isInteger(period.minutes) || period.minutes <= 0 || period.minutes > DAY_MINUTES || !Number.isFinite(timeToMinutes(period.startTime)))) return 'Mỗi khung bổ sung cần loại hoạt động, giờ bắt đầu hợp lệ và thời lượng từ 1 đến 1.440 phút.'
  const hasTimes = [routine.sleepStartTime, routine.commuteStartTime, routine.personalStartTime].some((time) => time !== undefined) || extra.length > 0
  if (hasTimes && !hasRoutineTiming(routine)) return 'Nhập giờ bắt đầu hợp lệ cho giấc ngủ và các hoạt động có thời lượng lớn hơn 0.'
  if (routine.sleepMinutes + routine.commuteMinutes + routine.personalMinutes + extra.reduce((sum, period) => sum + period.minutes, 0) > DAY_MINUTES) return 'Tổng thời gian ngủ, di chuyển và sinh hoạt không được vượt quá 24 giờ.'
  return null
}

export function validateSchedule(entry: Omit<ScheduleEntry, 'id'>) {
  if (!entry.title.trim() || entry.title.trim().length > 120) return 'Tên lịch cần từ 1 đến 120 ký tự.'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.date) || Number.isNaN(Date.parse(`${entry.date}T12:00:00Z`)) || new Date(`${entry.date}T12:00:00Z`).toISOString().slice(0, 10) !== entry.date || entry.date < '1900-01-01' || entry.date > '9998-12-31') return 'Chọn ngày hợp lệ từ năm 1900 đến 9998.'
  const duration = scheduleDuration(entry)
  if (!Number.isFinite(duration) || duration <= 0) return 'Giờ bắt đầu và kết thúc phải hợp lệ và khác nhau.'
  if (!Object.hasOwn(SCHEDULE_CATEGORIES, entry.category)) return 'Chọn một loại lịch hợp lệ.'
  return null
}

export interface TimeRange {
  start: number
  end: number
}

export interface DayBlock extends TimeRange {
  id: string
  entry?: ScheduleEntry
  task?: Task
}

function clipToDay(time: string, duration: number, previousDay: boolean): TimeRange | null {
  const rawStart = timeToMinutes(time) - (previousDay ? DAY_MINUTES : 0)
  const start = Math.max(0, rawStart)
  const end = Math.min(DAY_MINUTES, rawStart + duration)
  return Number.isFinite(start) && Number.isFinite(end) && end > start ? { start, end } : null
}

function mergeRanges(ranges: TimeRange[]) {
  const merged: TimeRange[] = []
  for (const range of [...ranges].sort((a, b) => a.start - b.start || a.end - b.end)) {
    const last = merged[merged.length - 1]
    if (last && range.start <= last.end) last.end = Math.max(last.end, range.end)
    else merged.push({ start: range.start, end: range.end })
  }
  return merged
}

function totalMinutes(ranges: TimeRange[]) {
  return ranges.reduce((sum, range) => sum + range.end - range.start, 0)
}

export function dayBudget(workspace: Workspace, date: string) {
  const routine = workspace.routines[date] ?? DEFAULT_ROUTINE
  const previous = shiftDate(date, -1)
  const blocks: DayBlock[] = []
  function addBlock(sourceDate: string, time: string, duration: number, source: Omit<DayBlock, 'start' | 'end'>) {
    if (sourceDate !== date && sourceDate !== previous) return
    const range = clipToDay(time, duration, sourceDate === previous)
    if (range) blocks.push({ ...source, ...range })
  }
  workspace.schedule.forEach((entry) => addBlock(entry.date, entry.startTime, scheduleDuration(entry), { id: `schedule-${entry.id}`, entry }))
  const activeGoals = new Set(workspace.goals.filter((goal) => !goal.archived).map((goal) => goal.id))
  workspace.tasks.filter((task) => activeGoals.has(task.goalId)).forEach((task) => addBlock(task.scheduledDate, task.startTime, task.minutes, { id: `task-${task.id}`, task }))
  blocks.sort((a, b) => a.start - b.start || a.end - b.end)
  const scheduledMinutes = totalMinutes(mergeRanges(blocks))
  const overlapMinutes = totalMinutes(blocks) - scheduledMinutes
  const extra = routine.extraPeriods ?? []
  const routineMinutes = {
    sleep: routine.sleepMinutes,
    commute: routine.commuteMinutes + extra.filter((period) => period.category === 'commute').reduce((sum, period) => sum + period.minutes, 0),
    personal: routine.personalMinutes + extra.filter((period) => period.category === 'personal').reduce((sum, period) => sum + period.minutes, 0),
  }
  const usedMinutes = scheduledMinutes + routineMinutes.sleep + routineMinutes.commute + routineMinutes.personal
  const base = { date, routine, blocks, scheduledMinutes, overlapMinutes, routineMinutes }

  // Keep duration-only routines compatible; exact gaps cannot be inferred without clock times.
  if (!hasRoutineTiming(routine)) return {
    ...base, freeSlots: null as TimeRange[] | null, freeMinutes: Math.max(0, DAY_MINUTES - usedMinutes),
    overbookedMinutes: Math.max(0, usedMinutes - DAY_MINUTES), routineOverlapMinutes: 0, usesPreviousDayFallback: false,
  }

  const previousIsConfigured = hasRoutineTiming(workspace.routines[previous])
  const previousRoutine = previousIsConfigured ? workspace.routines[previous] : routine
  const routineBlocks: (TimeRange & { category: 'sleep' | 'commute' | 'personal' })[] = []
  let usesPreviousDayFallback = false
  for (const [source, isPrevious] of [[routine, false], [previousRoutine, true]] as const) {
    const periods = [
      { category: 'sleep' as const, startTime: source.sleepStartTime ?? '', minutes: source.sleepMinutes },
      { category: 'commute' as const, startTime: source.commuteStartTime ?? '', minutes: source.commuteMinutes },
      { category: 'personal' as const, startTime: source.personalStartTime ?? '', minutes: source.personalMinutes },
      ...(source.extraPeriods ?? []),
    ]
    for (const period of periods) {
      const range = clipToDay(period.startTime, period.minutes, isPrevious)
      if (range) {
        routineBlocks.push({ ...range, category: period.category })
        if (isPrevious && !previousIsConfigured) usesPreviousDayFallback = true
      }
    }
  }
  for (const category of ['sleep', 'commute', 'personal'] as const) {
    routineMinutes[category] = totalMinutes(mergeRanges(routineBlocks.filter((block) => block.category === category)))
  }
  const busySlots = mergeRanges([...blocks, ...routineBlocks])
  const freeSlots: TimeRange[] = []
  let cursor = 0
  for (const busy of busySlots) {
    if (busy.start > cursor) freeSlots.push({ start: cursor, end: busy.start })
    cursor = busy.end
  }
  if (cursor < DAY_MINUTES) freeSlots.push({ start: cursor, end: DAY_MINUTES })
  return {
    ...base, freeSlots, freeMinutes: totalMinutes(freeSlots), overbookedMinutes: 0,
    routineOverlapMinutes: scheduledMinutes + totalMinutes(routineBlocks) - totalMinutes(busySlots), usesPreviousDayFallback,
  }
}

export type DayBudget = ReturnType<typeof dayBudget>
