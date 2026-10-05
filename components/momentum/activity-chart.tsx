'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { useWorkspace } from '@/hooks/use-workspace'
import { dateOffset, minutesOnDate } from '@/lib/momentum/format'

export function ActivityChart() {
  const { workspace } = useWorkspace()
  const data = Array.from({ length: 7 }, (_, index) => {
    const date = dateOffset(workspace.today, index - 6)
    const day = new Date(`${date}T12:00:00Z`).getUTCDay()
    return { day: day === 0 ? 'CN' : `T${day + 1}`, minutes: Math.round(minutesOnDate(workspace.sessions, date)), fill: index === 6 ? 'var(--chart-1)' : 'var(--chart-2)' }
  })
  return <ChartContainer config={{ minutes: { label: 'Phút tập trung', color: 'var(--chart-1)' } }} className="activity-chart" aria-label="Thời gian tập trung trong 7 ngày qua"><BarChart accessibilityLayer data={data} barSize={25} margin={{ left: -27, right: 0, top: 6, bottom: 0 }}><CartesianGrid vertical={false} strokeDasharray="3 5" /><YAxis tickLine={false} axisLine={false} fontSize={10} tickCount={4} unit="p" /><XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={10} fontSize={10} /><ChartTooltip cursor={false} content={<ChartTooltipContent />} /><Bar dataKey="minutes" radius={[4, 4, 0, 0]} isAnimationActive={false} /></BarChart></ChartContainer>
}
