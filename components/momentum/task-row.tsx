'use client'

import { useRouter } from 'next/navigation'
import { Play, Clock3 } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { useWorkspace } from '@/hooks/use-workspace'
import { useFocus } from '@/hooks/use-focus'
import { cn } from '@/lib/utils'
import type { Task } from '@/lib/momentum/types'

export function TaskRow({ task, compact = false }: { task: Task; compact?: boolean }) {
  const { workspace, toggleTask } = useWorkspace()
  const goal = workspace.goals.find((item) => item.id === task.goalId)
  const focus = useFocus()
  const router = useRouter()
  return <div className={cn('task-row', compact && 'is-compact', task.completed && 'is-complete')}>
    <Checkbox checked={task.completed} onCheckedChange={() => void toggleTask(task.id)} aria-label={`Hoàn thành: ${task.title}`} />
    <div className="task-row-copy"><span className="task-title">{task.title}</span><span className="task-metadata"><span className="goal-dot" data-color={goal?.color} />{goal?.title}<span className="task-time"><Clock3 />{task.minutes} phút</span></span></div>
    <time className="task-start-time">{task.startTime}</time>
    {!task.completed && <Button variant="ghost" size="icon-sm" aria-label={`Tập trung: ${task.title}`} onClick={() => { focus.selectTask(task.id); router.push('/focus') }}><Play /></Button>}
  </div>
}
