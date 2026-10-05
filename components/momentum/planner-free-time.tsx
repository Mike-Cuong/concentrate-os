import { clockTime, durationLabel, type TimeRange } from '@/lib/momentum/planner'
import { EmptyState } from './ui-parts'

export function PlannerFreeTime({ slots }: { slots: TimeRange[] | null }) {
  return <section className="planner-free-time" aria-labelledby="free-time-heading" data-testid="daily-free-slots">
    <h3 id="free-time-heading">Các khoảng trống trong ngày</h3>
    {slots === null ? <p className="planner-note">Chưa có giờ sinh hoạt cụ thể. <a href="#routine-sleep-start">Nhập giờ ngủ, di chuyển và sinh hoạt</a> rồi cập nhật để xem cậu trống lúc nào.</p>
      : slots.length === 0 ? <EmptyState title="Không còn khoảng trống" description="Lịch và sinh hoạt đã phủ kín ngày này. Tổng thời gian trống là 0 phút." />
      : <ul className="planner-free-slots">{slots.map((slot) => <li key={slot.start}>
        <span className="planner-free-slot-time">{clockTime(slot.start)} <span aria-hidden="true">–</span><span className="sr-only">đến</span> {clockTime(slot.end)}</span>
        <span>{durationLabel(slot.end - slot.start)}</span>
      </li>)}</ul>}
  </section>
}
