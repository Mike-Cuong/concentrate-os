'use client'

import { Clock3, Flame, Target } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { useWorkspace } from '@/hooks/use-workspace'
import { dateOffset, focusStreak, formatDate, formatMinutes } from '@/lib/momentum/format'
import { PageHeading, SectionHeading } from './ui-parts'
import { ActivityChart } from './activity-chart'

export function InsightsPage() {
  const { workspace } = useWorkspace()
  const sessions = workspace.sessions.filter((session) => session.startedAt.slice(0, 10) >= dateOffset(workspace.today, -6))
  return <div className="secondary-page"><PageHeading eyebrow="NHỮNG NỖ LỰC NHỎ ĐANG TÍCH LŨY" title="Nhìn lại để tiến xa." description="Tiến bộ không phải lúc nào cũng rõ ràng. Nhưng luôn đang diễn ra." /><div className="insight-metrics"><Card><CardHeader><CardDescription><Clock3 />Tập trung trong 7 ngày</CardDescription><CardTitle>{formatMinutes(sessions.reduce((total, session) => total + session.durationSeconds / 60, 0))}</CardTitle></CardHeader></Card><Card><CardHeader><CardDescription><Flame />Chuỗi ngày bền bỉ</CardDescription><CardTitle>{focusStreak(workspace.sessions, workspace.today)} ngày</CardTitle></CardHeader></Card><Card><CardHeader><CardDescription><Target />Phiên tập trung tuần này</CardDescription><CardTitle>{sessions.length} phiên</CardTitle></CardHeader></Card></div><Card className="insight-chart-panel"><CardHeader><CardTitle>Nhịp độ của cậu</CardTitle><CardDescription>Thời gian tập trung trong 7 ngày qua</CardDescription></CardHeader><CardContent><ActivityChart /></CardContent></Card><section><SectionHeading title="Những khoảnh khắc tập trung" count={sessions.length} /><div className="session-list">{[...sessions].reverse().map((session) => <div key={session.id}><span className="session-icon"><Clock3 /></span><div><strong>{workspace.tasks.find((task) => task.id === session.taskId)?.title ?? 'Phiên tập trung'}</strong><small>{formatDate(session.startedAt.slice(0, 10), { weekday: 'long', day: '2-digit', month: 'long' })}</small></div><span>{formatMinutes(session.durationSeconds / 60)}</span></div>)}</div></section></div>
}
