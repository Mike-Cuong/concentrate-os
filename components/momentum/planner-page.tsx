'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Info, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useWorkspace } from '@/hooks/use-workspace'
import { dateOffset, formatDate, formatMinutes } from '@/lib/momentum/format'
import { dayBudget, durationLabel, startOfWeek, weekDates } from '@/lib/momentum/planner'
import type { ScheduleEntry } from '@/lib/momentum/types'
import { cn } from '@/lib/utils'
import { PageHeading } from './ui-parts'
import { DaySummary, WeekSummary } from './planner-summary'
import { PlannerRoutine } from './planner-routine'
import { PlannerSchedule } from './planner-schedule'
import { PlannerScheduleDialog } from './planner-schedule-dialog'

export function PlannerPage() {
  const { workspace } = useWorkspace()
  const [selected, setSelected] = useState(workspace.today)
  const [weekStart, setWeekStart] = useState(() => startOfWeek(workspace.today))
  const [editor, setEditor] = useState<{ entry?: ScheduleEntry } | null>(null)
  const days = weekDates(weekStart).map((date) => dayBudget(workspace, date))
  const budget = days.find((day) => day.date === selected) ?? dayBudget(workspace, selected)

  function changeWeek(offset: number) {
    setWeekStart(dateOffset(weekStart, offset))
    setSelected(dateOffset(selected, offset))
  }

  return <div className="secondary-page weekly-planner">
    <PageHeading eyebrow="KẾ HOẠCH TUẦN" title="Dành chỗ cho điều quan trọng." description="Lên lịch, cân bằng nhịp sống và tìm ra quỹ thời gian của riêng cậu."><Button onClick={() => setEditor({})}><Plus data-icon="inline-start" />Thêm lịch</Button></PageHeading>
    <nav className="planner-navigation" aria-label="Điều hướng tuần"><div className="flex items-center gap-2"><Button variant="outline" size="icon-sm" aria-label="Tuần trước" onClick={() => changeWeek(-7)}><ChevronLeft /></Button><Button variant="outline" size="icon-sm" aria-label="Tuần sau" onClick={() => changeWeek(7)}><ChevronRight /></Button></div><span>{formatDate(weekStart)} – {formatDate(dateOffset(weekStart, 6), { day: '2-digit', month: '2-digit', year: 'numeric' })}</span><Button variant="outline" size="sm" onClick={() => { setWeekStart(startOfWeek(workspace.today)); setSelected(workspace.today) }}>Tuần này</Button></nav>
    <WeekSummary days={days} />
    <div className="planner-days" role="group" aria-label="Chọn ngày trong tuần">{days.map((day) => <button type="button" key={day.date} className={cn('planner-day', selected === day.date && 'selected')} aria-pressed={selected === day.date} aria-current={day.date === workspace.today ? 'date' : undefined} aria-label={`${formatDate(day.date, { weekday: 'long', day: '2-digit', month: '2-digit' })}, trống ${durationLabel(day.freeMinutes)}${day.overbookedMinutes ? ', vượt quỹ thời gian' : ''}`} onClick={() => setSelected(day.date)}><span>{formatDate(day.date, { weekday: 'short' })}{day.date === workspace.today && <i className="planner-today-dot" aria-hidden="true" />}</span><strong>{day.date.slice(-2)}</strong><small className={cn(day.overbookedMinutes > 0 && 'planner-overbooked')}>{formatMinutes(day.freeMinutes)}<span>trống</span></small></button>)}</div>
    <section aria-labelledby="planner-selected-day" className="planner-selected-section"><div className="planner-selected-heading"><h2 id="planner-selected-day">{formatDate(selected, { weekday: 'long', day: '2-digit', month: '2-digit' })}</h2><span>{workspace.routines[selected] ? 'Nhịp sinh hoạt riêng' : 'Nhịp sinh hoạt mặc định'}</span></div>
      <div className="planner-detail-grid"><PlannerSchedule budget={budget} onAdd={() => setEditor({})} onEdit={(entry) => setEditor({ entry })} /><PlannerRoutine key={`${selected}-${JSON.stringify(budget.routine)}`} date={selected} routine={budget.routine} configured={!!workspace.routines[selected]} /></div>
      <DaySummary budget={budget} />
    </section>
    <p className="planner-session-note"><Info aria-hidden="true" />Chế độ trải nghiệm: lịch chỉ giữ trong phiên hiện tại. Tải lại trang sẽ mất dữ liệu. Các nhiệm vụ có sẵn là dữ liệu mẫu.</p>
    {editor && <PlannerScheduleDialog date={selected} entry={editor.entry} onClose={() => setEditor(null)} />}
  </div>
}
