'use client'

import { CalendarDays, Clock3, Moon, Route, Coffee, ListTodo, Info } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { clockTime, durationLabel, type DayBudget } from '@/lib/momentum/planner'
import { formatDate } from '@/lib/momentum/format'
import { PlannerFreeTime } from './planner-free-time'

export function WeekSummary({ days }: { days: DayBudget[] }) {
  const total = days.reduce((sum, day) => sum + day.freeMinutes, 0)
  const average = Math.round(total / 7)
  const busiest = days.reduce((result, day) => day.freeMinutes < result.freeMinutes ? day : result, days[0])
  const overloaded = days.filter((day) => day.overbookedMinutes > 0).length
  const estimated = days.filter((day) => day.freeSlots === null).length
  const usesFallback = days.some((day) => day.usesPreviousDayFallback)
  return <Card className="planner-week-summary">
    <CardHeader><CardTitle><span className="panel-title-icon"><CalendarDays aria-hidden="true" />QUỸ THỜI GIAN CỦA CẬU</span></CardTitle><CardDescription>Nhìn rõ thời gian, dành chỗ cho điều quan trọng.</CardDescription></CardHeader>
    <CardContent><dl className="planner-week-metrics" aria-live="polite" aria-atomic="true">
      <div><dt>Trống trong tuần</dt><dd data-testid="weekly-free">{durationLabel(total)}</dd><p>trên tổng 168 giờ</p></div>
      <div><dt>Trung bình mỗi ngày</dt><dd data-testid="daily-average">{durationLabel(average)}</dd><p>để cậu chủ động sắp xếp</p></div>
      <div><dt>Ngày bận nhất</dt><dd>{formatDate(busiest.date, { weekday: 'long' })}</dd><p>còn {durationLabel(busiest.freeMinutes)}</p></div>
    </dl>
      <details className="planner-week-details">
        <summary>Xem khoảng trống của 7 ngày</summary>
        <ul className="planner-week-free-list" data-testid="weekly-free-slots">{days.map((day) => <li key={day.date}>
          <div><strong>{formatDate(day.date, { weekday: 'long', day: '2-digit', month: '2-digit' })}</strong><span>{durationLabel(day.freeMinutes)}{day.freeSlots === null ? ' · ước tính' : ''}</span></div>
          <p>{day.freeSlots === null ? 'Chưa thiết lập giờ sinh hoạt cụ thể.' : day.freeSlots.length ? day.freeSlots.map((slot) => `${clockTime(slot.start)}–${clockTime(slot.end)}`).join(' · ') : 'Không còn khoảng trống.'}</p>
        </li>)}</ul>
      </details>
    </CardContent>
    <CardFooter><div className="flex flex-col gap-2"><p className="planner-note"><Info aria-hidden="true" />{estimated ? `Tổng tuần còn ${estimated} ngày ước tính theo thời lượng, chưa xác định được khung giờ. Thiết lập giờ sinh hoạt hoặc áp dụng cả tuần để xem đầy đủ.` : 'Tổng tuần bằng tổng các khoảng trống của 7 ngày. Mỗi phút chỉ tính một lần, kể cả khi lịch chồng nhau.'}</p>{overloaded > 0 && <p className="planner-note">{overloaded} ngày vượt quỹ 24 giờ theo thời lượng đã nhập.</p>}{usesFallback && <p className="planner-note">Với phần sinh hoạt qua đêm từ ngày chưa thiết lập, tạm dùng nhịp của ngày đang tính. Cậu có thể nhập riêng ngày trước đó để chính xác hơn.</p>}</div></CardFooter>
  </Card>
}

export function DaySummary({ budget }: { budget: DayBudget }) {
  const parts = [
    { label: 'Lịch & nhiệm vụ', minutes: budget.scheduledMinutes, icon: ListTodo },
    { label: 'Giấc ngủ', minutes: budget.routineMinutes.sleep, icon: Moon },
    { label: 'Di chuyển', minutes: budget.routineMinutes.commute, icon: Route },
    { label: 'Sinh hoạt', minutes: budget.routineMinutes.personal, icon: Coffee },
  ]
  return <Card className="planner-day-summary">
    <CardHeader><CardTitle><span className="panel-title-icon"><Clock3 aria-hidden="true" />Thời gian còn lại trong ngày</span></CardTitle><CardDescription>{formatDate(budget.date, { weekday: 'long', day: '2-digit', month: '2-digit' })}</CardDescription></CardHeader>
    <CardContent><div className="planner-day-result" aria-live="polite"><strong data-testid="daily-free">{durationLabel(budget.freeMinutes)}</strong><span>{budget.freeSlots === null ? 'ước tính · chưa có giờ sinh hoạt cụ thể' : `${budget.freeSlots.length} khoảng trống trong 24 giờ`}</span></div>
      <PlannerFreeTime slots={budget.freeSlots} />
      <dl className="planner-breakdown">{parts.map(({ label, minutes, icon: Icon }) => <div key={label}><dt><Icon aria-hidden="true" />{label}</dt><dd>{durationLabel(minutes)}</dd></div>)}</dl>
      {budget.overbookedMinutes > 0 && <p className="planner-warning" role="status">Vượt quỹ ngày {durationLabel(budget.overbookedMinutes)}. Cậu cần giảm thời gian đã phân bổ; giờ trống của ngày này được tính là 0.</p>}
      {budget.routineOverlapMinutes > 0 && <p className="planner-warning" role="status">Có {durationLabel(budget.routineOverlapMinutes)} bị tính lặp giữa sinh hoạt, giấc ngủ hoặc lịch / nhiệm vụ. Đã gộp các khoảng chồng nhau, không trừ hai lần.</p>}
      {budget.usesPreviousDayFallback && <p className="planner-note">Ngày trước chưa có giờ sinh hoạt cụ thể: phần qua đêm tạm dùng nhịp của ngày này. Thiết lập ngày trước đó nếu giờ sinh hoạt khác.</p>}
    </CardContent>
    <CardFooter><p className="planner-note">{budget.freeSlots === null ? 'Tổng giờ đang được ước tính từ thời lượng. Cần giờ bắt đầu sinh hoạt để xác định các khoảng trống cụ thể.' : 'Khoảng trống là phần còn lại từ 00:00 đến 24:00 sau khi gộp lịch, nhiệm vụ, giấc ngủ, di chuyển và sinh hoạt. Khung qua đêm được chia đúng ngày; không tự xếp thêm hoạt động.'}</p></CardFooter>
  </Card>
}
