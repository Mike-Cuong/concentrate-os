'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowDownRight, ArrowRight, ArrowUpRight, AudioLines, CalendarDays, CheckCheck, ChevronRight, Clock3, Flame, Focus, Pause, Play, Plus, Target, TrendingUp } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Progress } from '@/components/ui/progress'
import { useWorkspace } from '@/hooks/use-workspace'
import { useInterface } from '@/hooks/use-interface'
import { useFocus } from '@/hooks/use-focus'
import { focusStreak, formatDate, formatMinutes, formatTimer, goalProgress, minutesOnDate } from '@/lib/momentum/format'
import { cn } from '@/lib/utils'
import { PageHeading, SectionHeading, EmptyState } from './ui-parts'
import { GoalCard } from './goal-card'
import { TaskRow } from './task-row'
import { ActivityChart } from './activity-chart'

export function QuickFocus() {
  const focus = useFocus()
  const { workspace } = useWorkspace()
  const task = workspace.tasks.find((item) => item.id === focus.taskId)
  const busy = focus.status === 'running' || focus.status === 'paused'
  return <Card className="quick-focus"><CardHeader><CardTitle><span className="panel-title-icon"><Focus />Góc tập trung</span></CardTitle><CardAction><Link href="/focus" className="icon-link" aria-label="Mở phòng tập trung"><ArrowUpRight /></Link></CardAction><CardDescription>Một việc. Toàn bộ sự chú ý.</CardDescription></CardHeader><CardContent><ToggleGroup className="focus-duration-toggle" value={[String(focus.duration)]} onValueChange={(values) => { if (values[0]) focus.setDuration(Number(values[0])) }} disabled={busy} aria-label="Thời lượng phiên tập trung"><ToggleGroupItem value="25">25 phút</ToggleGroupItem><ToggleGroupItem value="50">50 phút</ToggleGroupItem></ToggleGroup><div className="quick-timer"><span className={cn('timer-status-line', focus.status === 'running' && 'is-running')} /><output role="timer" aria-live="off" aria-label="Thời gian còn lại">{formatTimer(focus.remaining)}</output><span className="timer-status-line" /></div><p className="quick-task-title">{focus.status === 'running' ? 'Đang tập trung' : focus.status === 'paused' ? 'Phiên đang tạm dừng' : task?.title ?? 'Sẵn sàng cho điều tiếp theo'}</p><Button className="w-full" variant="secondary" onClick={focus.toggle}>{focus.status === 'running' ? <Pause data-icon="inline-start" /> : <Play data-icon="inline-start" />}{focus.status === 'running' ? 'Tạm dừng' : focus.status === 'paused' ? 'Tiếp tục phiên' : 'Bắt đầu phiên'}</Button></CardContent></Card>
}

export function Overview() {
  const { workspace } = useWorkspace()
  const actions = useInterface()
  const goals = workspace.goals.filter((goal) => !goal.archived)
  const tasks = workspace.tasks.filter((task) => goals.some((goal) => goal.id === task.goalId))
  const todaysTasks = tasks.filter((task) => task.scheduledDate === workspace.today).sort((a, b) => a.startTime.localeCompare(b.startTime))
  const doneToday = todaysTasks.filter((task) => task.completed).length
  const activeGoals = goals.filter((goal) => goalProgress(goal.id, tasks).percent < 100)
  const todayMinutes = minutesOnDate(workspace.sessions, workspace.today)
  const streak = focusStreak(workspace.sessions, workspace.today)
  const weekMinutes = workspace.sessions.filter((session) => session.startedAt.slice(0, 10) >= new Date(new Date(`${workspace.today}T12:00:00Z`).getTime() - 6 * 86400000).toISOString().slice(0, 10)).reduce((total, session) => total + session.durationSeconds / 60, 0)
  const metrics = [
    { label: 'Mục tiêu đang theo đuổi', value: String(activeGoals.length).padStart(2, '0'), unit: 'mục tiêu', icon: Target, note: 'Mỗi mục tiêu, một hành trình', type: 'goals' },
    { label: 'Thời gian tập trung', value: formatMinutes(todayMinutes), unit: '', icon: Clock3, note: `Mục tiêu ${formatMinutes(workspace.preferences.dailyMinutes)} / ngày`, type: 'time' },
    { label: 'Nhiệm vụ hôm nay', value: String(doneToday).padStart(2, '0'), unit: `/ ${String(todaysTasks.length).padStart(2, '0')}`, icon: CheckCheck, note: `${todaysTasks.length - doneToday} bước tiến đang chờ cậu`, type: 'tasks' },
    { label: 'Chuỗi ngày bền bỉ', value: String(streak).padStart(2, '0'), unit: 'ngày', icon: Flame, note: 'Giữ nhịp. Đừng dừng lại.', type: 'streak' },
  ]
  return <div className="overview-page"><PageHeading eyebrow={formatDate(workspace.today, { weekday: 'long', day: '2-digit', month: 'long' }).toUpperCase()} title="Không gian để tiến xa." description="Chào cậu. Mỗi bước nhỏ hôm nay đều tạo nên sự khác biệt."><Badge variant="outline"><span className="status-dot" />Sẵn sàng bứt phá</Badge><Button onClick={() => actions.newGoal()}><Plus data-icon="inline-start" />Tạo mục tiêu</Button></PageHeading>
    <div className="hero-layout"><section className="hero-panel" aria-labelledby="hero-title"><div className="hero-grid" aria-hidden="true" /><div className="hero-copy"><div className="hero-eyebrow"><span className="status-dot" />BUILD YOUR OWN MOMENTUM</div><h2 id="hero-title">Tập trung hôm nay.<br /><span>Vững vàng ngày mai.</span></h2><p>Không cần hoàn hảo. Chỉ cần tiến bộ.<br />Biến mục tiêu lớn thành những bước nhỏ.</p><div className="hero-actions"><Link href="/focus" className={cn(buttonVariants({ size: 'lg' }), 'hero-start')}><Play data-icon="inline-start" fill="currentColor" />Bắt đầu tập trung<ArrowUpRight data-icon="inline-end" /></Link><Link href="/planner" className="hero-plan">Lên kế hoạch<ArrowRight /></Link></div></div><div className="hero-art" aria-hidden="true"><Image src="/images/focus-orbit.png" alt="" width={1264} height={848} priority sizes="(max-width: 767px) 200px, 420px" /><span className="hero-art-coordinate">01 / IN MOTION</span></div><span className="hero-index" aria-hidden="true">M / 001</span></section><QuickFocus /></div>
    <section className="metrics-grid" aria-label="Chỉ số tổng quan">{metrics.map((metric) => <div className="metric" key={metric.type}><div className="metric-label"><span>{metric.label}</span><metric.icon /></div><div className="metric-value">{metric.value}<span>{metric.unit}</span>{metric.type === 'goals' && <span className="metric-mini-orbit"><Target /></span>}{metric.type === 'time' && <span className="metric-spark"><i /><i /><i /><i /><i /><i /><i /></span>}{metric.type === 'streak' && <Flame className="metric-flame" />}</div><div className="metric-note">{metric.type === 'time' ? <span className="mini-progress"><span style={{ width: `${Math.min(100, todayMinutes / workspace.preferences.dailyMinutes * 100)}%` }} /></span> : <span className={cn('metric-note-icon', metric.type === 'streak' && 'text-primary')}><TrendingUp /></span>}{metric.note}</div></div>)}</section>
    <section className="goals-overview"><SectionHeading title="Mục tiêu đang theo đuổi" count={activeGoals.length}><Link href="/goals" className="text-link">Xem tất cả<ArrowUpRight /></Link></SectionHeading>{activeGoals.length ? <div className="overview-goals-grid">{activeGoals.slice(0, 3).map((goal) => <GoalCard key={goal.id} goal={goal} />)}</div> : <EmptyState title="Một hành trình mới đang chờ" description="Tạo mục tiêu đầu tiên và bắt đầu từ một bước nhỏ."><Button onClick={() => actions.newGoal()}>Tạo mục tiêu</Button></EmptyState>}</section>
    <div className="overview-bottom-grid"><Card className="today-panel"><CardHeader><CardTitle><span className="panel-title-icon"><CalendarDays />Lộ trình hôm nay</span></CardTitle><CardDescription>Ưu tiên điều quan trọng. Hoàn thành từng việc.</CardDescription><CardAction><Button variant="ghost" size="icon-sm" aria-label="Thêm nhiệm vụ hôm nay" onClick={() => actions.newTask()}><Plus /></Button></CardAction></CardHeader><CardContent><div className="today-summary"><span>{doneToday}/{todaysTasks.length} nhiệm vụ hoàn thành</span><span>{todaysTasks.length ? Math.round(doneToday / todaysTasks.length * 100) : 0}%</span></div><Progress value={todaysTasks.length ? doneToday / todaysTasks.length * 100 : 0} aria-label="Tiến độ nhiệm vụ hôm nay" /><div className="today-task-list">{todaysTasks.length ? todaysTasks.map((task) => <TaskRow key={task.id} task={task} compact />) : <EmptyState title="Hôm nay còn nhiều khoảng trống" description="Thêm một nhiệm vụ vừa sức để bắt đầu." />}</div><Link href="/planner" className="today-plan-link">Mở không gian lên kế hoạch<ArrowRight /></Link></CardContent></Card><Card className="weekly-panel"><CardHeader><CardTitle><span className="panel-title-icon"><AudioLines />Nhịp độ của cậu</span></CardTitle><CardAction><Badge variant="outline">7 ngày qua</Badge></CardAction><CardDescription>Những nỗ lực nhỏ đang tích lũy.</CardDescription></CardHeader><CardContent><div className="weekly-total"><strong>{formatMinutes(weekMinutes)}</strong><span>tập trung trong tuần</span></div><ActivityChart /><div className="weekly-insight"><span className="weekly-insight-icon"><TrendingUp /></span><p><strong>Đều đặn quan trọng hơn hoàn hảo.</strong><br />{streak} ngày qua, cậu đã chọn tiến về phía trước.</p></div><Link href="/insights" className="text-link">Khám phá hành trình<ArrowUpRight /></Link></CardContent></Card></div>
    <div className="daily-quote"><span className="quote-mark">“</span><p>Cậu không cần nhìn thấy cả cầu thang. Chỉ cần bước lên bậc đầu tiên.</p><span className="eyebrow">ONE STEP AT A TIME</span></div>
  </div>
}
