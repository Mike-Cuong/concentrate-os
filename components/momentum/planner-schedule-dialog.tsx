'use client'

import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Field, FieldGroup, FieldLabel, FieldDescription, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { useWorkspace } from '@/hooks/use-workspace'
import { SCHEDULE_CATEGORIES, scheduleDuration, durationLabel, validateSchedule, weekDates } from '@/lib/momentum/planner'
import { formatDate } from '@/lib/momentum/format'
import type { ScheduleCategory, ScheduleEntry } from '@/lib/momentum/types'

export function PlannerScheduleDialog({ date, entry, onClose }: { date: string; entry?: ScheduleEntry; onClose: () => void }) {
  const { addSchedule, updateSchedule } = useWorkspace()
  const [startTime, setStartTime] = useState(entry?.startTime ?? '08:00')
  const [endTime, setEndTime] = useState(entry?.endTime ?? '09:00')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const duration = scheduleDuration({ startTime, endTime })

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    const values = new FormData(event.currentTarget)
    const next = { title: String(values.get('title') ?? '').trim(), date: String(values.get('date')), startTime, endTime, category: String(values.get('category')) as ScheduleCategory }
    const invalid = validateSchedule(next)
    if (invalid) { setError(invalid); return }
    const repeat = values.get('repeat')
    const dates = repeat === 'weekdays' ? weekDates(next.date).slice(0, 5) : repeat === 'week' ? weekDates(next.date) : [next.date]
    setSaving(true)
    try {
      if (entry) await updateSchedule({ ...next, id: entry.id })
      else await addSchedule(dates.map((scheduledDate) => ({ ...next, date: scheduledDate })))
      toast.success(entry ? 'Đã cập nhật lịch.' : dates.length > 1 ? `Đã thêm lịch cho ${dates.length} ngày.` : 'Đã thêm vào thời khóa biểu.', { description: 'Quỹ giờ trống đã được tính lại.' })
      onClose()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Chưa thể cập nhật. Hãy thử lại.') }
    finally { setSaving(false) }
  }

  return <Dialog open onOpenChange={(open) => { if (!open) onClose() }}><DialogContent className="workspace-dialog sm:max-w-lg"><DialogHeader><DialogTitle>{entry ? 'Chỉnh sửa lịch' : 'Thêm vào thời khóa biểu'}</DialogTitle><DialogDescription>Lịch học, ca làm hoặc một cuộc hẹn — dành chỗ cho những việc đã có giờ cụ thể.</DialogDescription></DialogHeader>
    <form onSubmit={submit} onKeyDown={(event) => { if (event.key === 'Enter' && (event.nativeEvent.isComposing || event.keyCode === 229)) event.preventDefault() }}><FieldGroup>
      <Field data-invalid={!!error}><FieldLabel htmlFor="schedule-title">Tên hoạt động</FieldLabel><Input id="schedule-title" name="title" placeholder="Ví dụ: Học trên lớp, làm việc tại văn phòng" defaultValue={entry?.title ?? ''} maxLength={120} autoFocus required aria-invalid={!!error} aria-describedby={error ? 'schedule-error' : undefined} /></Field>
      <FieldGroup className="form-two-columns"><Field><FieldLabel htmlFor="schedule-date">Ngày</FieldLabel><Input id="schedule-date" name="date" type="date" defaultValue={entry?.date ?? date} min="1900-01-01" max="9998-12-31" required /></Field><Field><FieldLabel htmlFor="schedule-category">Loại hoạt động</FieldLabel><NativeSelect id="schedule-category" name="category" defaultValue={entry?.category ?? 'study'} className="w-full">{Object.entries(SCHEDULE_CATEGORIES).map(([value, label]) => <NativeSelectOption key={value} value={value}>{label}</NativeSelectOption>)}</NativeSelect></Field></FieldGroup>
      <FieldGroup className="form-two-columns"><Field data-invalid={!!error}><FieldLabel htmlFor="schedule-start">Bắt đầu</FieldLabel><Input id="schedule-start" type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} required aria-invalid={!!error} aria-describedby={error ? 'schedule-error' : undefined} /></Field><Field data-invalid={!!error}><FieldLabel htmlFor="schedule-end">Kết thúc</FieldLabel><Input id="schedule-end" type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} required aria-invalid={!!error} aria-describedby={error ? 'schedule-error' : undefined} /></Field></FieldGroup>
      <p className="planner-note" aria-live="polite">{Number.isFinite(duration) && duration > 0 ? `Thời lượng: ${durationLabel(duration)}.${endTime < startTime ? ' Kết thúc vào ngày hôm sau; thời gian được chia cho từng ngày.' : ''}` : 'Giờ bắt đầu và kết thúc cần khác nhau.'}</p>
      {!entry && <Field><FieldLabel htmlFor="schedule-repeat">Thêm cho</FieldLabel><NativeSelect id="schedule-repeat" name="repeat" defaultValue="once" className="w-full"><NativeSelectOption value="once">Chỉ ngày đã chọn</NativeSelectOption><NativeSelectOption value="weekdays">Thứ 2–Thứ 6 trong tuần của ngày đã chọn</NativeSelectOption><NativeSelectOption value="week">Cả 7 ngày trong tuần của ngày đã chọn</NativeSelectOption></NativeSelect><FieldDescription>Tạo các bản sao độc lập trong một tuần, không tự lặp sang tuần sau.</FieldDescription></Field>}
      {entry && <p className="planner-note">Chỉ sửa lịch này, không ảnh hưởng các bản sao ở ngày khác. Lịch hiện tại: {formatDate(entry.date)}.</p>}
      {error && <FieldError id="schedule-error" role="alert">{error}</FieldError>}
      <p className="form-session-note">Chỉ giữ trong phiên hiện tại; tải lại trang sẽ mất dữ liệu.</p>
      <div className="dialog-actions"><Button type="button" variant="outline" onClick={onClose}>Hủy</Button><Button type="submit" disabled={saving}>{saving ? 'Đang cập nhật…' : entry ? 'Cập nhật lịch' : 'Thêm lịch'}</Button></div>
    </FieldGroup></form>
  </DialogContent></Dialog>
}
