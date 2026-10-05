'use client'

import { ArrowUpRight, BookOpen, BriefcaseBusiness, CalendarDays, CheckCheck, GraduationCap } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { useWorkspace } from '@/hooks/use-workspace'
import { useInterface } from '@/hooks/use-interface'
import { formatDate, goalProgress } from '@/lib/momentum/format'
import type { Goal } from '@/lib/momentum/types'

const icons = { mint: BriefcaseBusiness, lavender: GraduationCap, peach: BookOpen }
export function GoalCard({ goal }: { goal: Goal }) {
  const { workspace } = useWorkspace()
  const { viewGoal } = useInterface()
  const progress = goalProgress(goal.id, workspace.tasks)
  const Icon = icons[goal.color]
  return <Card className="goal-card" data-color={goal.color}>
    <CardHeader><div className="goal-topline"><span className="goal-icon"><Icon /></span><Badge variant="outline">{progress.percent === 100 ? 'Hoàn thành' : 'Đang thực hiện'}</Badge><Button variant="ghost" size="icon-sm" onClick={() => viewGoal(goal.id)} aria-label={`Chi tiết ${goal.title}`}><ArrowUpRight /></Button></div><p className="goal-category">{goal.category}</p><CardTitle><button className="goal-title-button" onClick={() => viewGoal(goal.id)}>{goal.title}</button></CardTitle><CardDescription>{goal.description}</CardDescription></CardHeader>
    <CardContent><div className="goal-progress-label"><span>Tiến độ hành trình</span><strong>{progress.percent}%</strong></div><Progress value={progress.percent} aria-label={`Tiến độ ${goal.title}`} /></CardContent>
    <CardFooter><span><CheckCheck />{progress.done}/{progress.total} nhiệm vụ</span><span><CalendarDays />{formatDate(goal.deadline)}</span></CardFooter>
  </Card>
}
