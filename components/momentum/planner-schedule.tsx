'use client'

import { BookOpen, BriefcaseBusiness, CalendarDays, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardAction, CardFooter } from '@/components/ui/card'
import { useWorkspace } from '@/hooks/use-workspace'
import { useInterface } from '@/hooks/use-interface'
import { clockTime, durationLabel, SCHEDULE_CATEGORIES, type DayBudget } from '@/lib/momentum/planner'
import type { ScheduleEntry } from '@/lib/momentum/types'
import { TaskRow } from './task-row'
import { EmptyState } from './ui-parts'

const categoryIcons = { study: BookOpen, work: BriefcaseBusiness, other: CalendarDays }

export function PlannerSchedule({ budget, onAdd, onEdit }: { budget: DayBudget; onAdd: () => void; onEdit: (entry: ScheduleEntry) => void }) {
  const { removeSchedule, addSchedule } = useWorkspace()
  const actions = useInterface()
  const schedules = budget.blocks.filter((block) => block.entry)
  const tasks = budget.blocks.flatMap((block) => block.task ? [block.task] : [])

  async function remove(entry: ScheduleEntry) {
    try {
      await removeSchedule(entry.id)
      toast.success('Đã xóa lịch.', { action: { label: 'Hoàn tác', onClick: () => { void addSchedule([entry]) } } })
    } catch { toast.error('Chưa thể xóa lịch. Hãy thử lại.') }
  }

  return <Card className="planner-schedule">
    <CardHeader><CardTitle><span className="panel-title-icon"><CalendarDays aria-hidden="true" />Thời khóa biểu</span></CardTitle><CardDescription>{schedules.length} lịch · {tasks.length} nhiệm vụ</CardDescription><CardAction><Button size="icon-sm" variant="outline" onClick={onAdd} aria-label="Thêm lịch cho ngày đang chọn"><Plus /></Button></CardAction></CardHeader>
    <CardContent>
      {schedules.length > 0 ? <ul className="planner-schedule-list">{schedules.map((block) => {
        const entry = block.entry!
        const Icon = categoryIcons[entry.category]
        return <li key={block.id}><div className="planner-schedule-time"><time>{clockTime(block.start)}</time><span>{clockTime(block.end)}</span></div><span className="planner-schedule-icon" data-category={entry.category}><Icon aria-hidden="true" /></span><div className="planner-schedule-copy"><strong>{entry.title}</strong><span>{SCHEDULE_CATEGORIES[entry.category]} · {durationLabel(block.end - block.start)}{entry.date !== budget.date ? ' · từ hôm trước' : entry.endTime < entry.startTime ? ' · qua đêm' : ''}</span></div><div className="planner-schedule-actions"><Button variant="ghost" size="icon-xs" aria-label={`Sửa ${entry.title}`} onClick={() => onEdit(entry)}><Pencil /></Button><Button variant="ghost" size="icon-xs" aria-label={`Xóa ${entry.title}`} onClick={() => remove(entry)}><Trash2 /></Button></div></li>
      })}</ul> : <EmptyState title="Thêm nhịp điệu cho ngày của cậu" description="Nhập lịch học, giờ làm hoặc cuộc hẹn để biết mình còn bao nhiêu thời gian."><Button variant="outline" size="sm" onClick={onAdd}><Plus data-icon="inline-start" />Thêm lịch đầu tiên</Button></EmptyState>}
      {budget.overlapMinutes > 0 && <p className="planner-warning" role="status">Có {durationLabel(budget.overlapMinutes)} bị tính lặp giữa các lịch / nhiệm vụ. Hệ thống đã gộp khoảng chồng nhau, không trừ giờ trống hai lần.</p>}
      <details className="planner-linked-tasks" open><summary>Nhiệm vụ từ mục tiêu ({tasks.length})</summary><p className="planner-note">Đã tính vào thời gian bận, kể cả nhiệm vụ hoàn thành.</p><div className="today-task-list">{tasks.map((task) => <TaskRow key={task.id} task={task} />)}{!tasks.length && <p className="planner-note">Chưa có nhiệm vụ nào trong ngày này.</p>}</div><Button size="sm" variant="ghost" onClick={() => actions.newTask(undefined, budget.date)}><Plus data-icon="inline-start" />Thêm nhiệm vụ</Button></details>
    </CardContent>
    <CardFooter><p className="planner-note">Tổng lịch và nhiệm vụ sau khi gộp: <strong>{durationLabel(budget.scheduledMinutes)}</strong>. Lịch qua đêm được chia sang ngày kế tiếp.</p></CardFooter>
  </Card>
}
