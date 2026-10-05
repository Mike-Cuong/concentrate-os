'use client'

import { useState, type FormEvent } from 'react'
import { Moon, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel, FieldDescription, FieldError, FieldSet, FieldLegend } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useWorkspace } from '@/hooks/use-workspace'
import { clockTime, hasRoutineTiming, timeToMinutes, validateRoutine, weekDates } from '@/lib/momentum/planner'
import type { DailyRoutine } from '@/lib/momentum/types'
import { PlannerRoutinePeriods } from './planner-routine-periods'

export function PlannerRoutine({ date, routine, configured }: { date: string; routine: DailyRoutine; configured: boolean }) {
  const { setRoutine } = useWorkspace()
  const [sleep, setSleep] = useState(String(routine.sleepMinutes))
  const [sleepStart, setSleepStart] = useState(routine.sleepStartTime ?? '23:00')
  const [extraPeriods, setExtraPeriods] = useState(routine.extraPeriods ?? [])
  const wakeMinutes = timeToMinutes(sleepStart) + Number(sleep)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    const values = new FormData(event.currentTarget)
    const next: DailyRoutine = {
      sleepMinutes: Number(sleep), sleepStartTime: sleepStart,
      commuteMinutes: Number(values.get('commute')), commuteStartTime: String(values.get('commuteStart') ?? ''),
      personalMinutes: Number(values.get('personal')), personalStartTime: String(values.get('personalStart') ?? ''),
      extraPeriods,
    }
    const invalid = validateRoutine(next)
    if (invalid) { setError(invalid); return }
    const allWeek = (event.nativeEvent as SubmitEvent).submitter?.getAttribute('value') === 'week'
    setSaving(true)
    try {
      await setRoutine(allWeek ? weekDates(date) : [date], next)
      setError(null)
      toast.success(allWeek ? 'Đã áp dụng nhịp sinh hoạt cho cả tuần.' : 'Đã cập nhật nhịp sinh hoạt ngày này.', { description: 'Giờ trống đã được tính lại. Chỉ lưu trong phiên hiện tại.' })
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Chưa thể cập nhật. Hãy thử lại.') }
    finally { setSaving(false) }
  }

  return <Card className="planner-routine">
    <CardHeader><CardTitle><span className="panel-title-icon"><Moon aria-hidden="true" />Nhịp sinh hoạt</span></CardTitle><CardDescription>{configured ? 'Tùy chỉnh riêng cho ngày đang chọn.' : 'Mặc định: ngủ 8 giờ, di chuyển 1 giờ, sinh hoạt 2 giờ.'}</CardDescription></CardHeader>
    <CardContent><form onSubmit={submit} onKeyDown={(event) => { if (event.key === 'Enter' && (event.nativeEvent.isComposing || event.keyCode === 229)) event.preventDefault() }}>
      <FieldGroup>
        <FieldSet><FieldLegend variant="label">Thời gian ngủ mỗi ngày</FieldLegend>
          <ToggleGroup aria-label="Số giờ ngủ" value={[sleep]} onValueChange={(values) => { if (values.length) setSleep(String(values[0])) }} variant="outline" className="w-full" spacing={1}>
            {[6, 6.5, 7, 7.5, 8].map((hours) => <ToggleGroupItem key={hours} value={String(hours * 60)} aria-label={`Ngủ ${hours.toLocaleString('vi-VN')} tiếng`} className="min-w-0 flex-1 px-1">{hours.toLocaleString('vi-VN')}h</ToggleGroupItem>)}
          </ToggleGroup><FieldDescription>Chọn từ 6 đến 8 tiếng để dành chỗ cho nghỉ ngơi.</FieldDescription>
        </FieldSet>
        <Field data-invalid={!!error}>
          <FieldLabel htmlFor="routine-sleep-start">Giờ đi ngủ</FieldLabel>
          <Input id="routine-sleep-start" type="time" value={sleepStart} onChange={(event) => setSleepStart(event.target.value)} required aria-invalid={!!error} aria-describedby={error ? 'routine-error' : 'routine-wake-time'} />
          <FieldDescription id="routine-wake-time" aria-live="polite">{Number.isFinite(wakeMinutes) ? `Thức dậy lúc ${clockTime(wakeMinutes % 1440)}${wakeMinutes >= 1440 ? ' hôm sau' : ''}.` : 'Nhập giờ đi ngủ để tính giờ thức dậy.'}</FieldDescription>
        </Field>
        <FieldGroup className="planner-routine-inputs">
          <Field data-invalid={!!error}><FieldLabel htmlFor="routine-commute-start">Bắt đầu di chuyển</FieldLabel><Input id="routine-commute-start" name="commuteStart" type="time" defaultValue={routine.commuteStartTime ?? '07:00'} required aria-invalid={!!error} aria-describedby={error ? 'routine-error' : undefined} /></Field>
          <Field data-invalid={!!error}><FieldLabel htmlFor="routine-commute">Di chuyển (phút)</FieldLabel><Input id="routine-commute" name="commute" type="number" inputMode="numeric" min={0} max={1440} step={1} defaultValue={routine.commuteMinutes} aria-invalid={!!error} aria-describedby={error ? 'routine-error' : undefined} required /></Field>
          <Field data-invalid={!!error}><FieldLabel htmlFor="routine-personal-start">Bắt đầu sinh hoạt</FieldLabel><Input id="routine-personal-start" name="personalStart" type="time" defaultValue={routine.personalStartTime ?? '18:00'} required aria-invalid={!!error} aria-describedby={error ? 'routine-error' : undefined} /></Field>
          <Field data-invalid={!!error}><FieldLabel htmlFor="routine-personal">Sinh hoạt (phút)</FieldLabel><Input id="routine-personal" name="personal" type="number" inputMode="numeric" min={0} max={1440} step={1} defaultValue={routine.personalMinutes} aria-invalid={!!error} aria-describedby={error ? 'routine-error' : undefined} required /></Field>
        </FieldGroup>
        <p className="planner-note">Mỗi dòng là một khoảng liên tục. Đặt 0 phút nếu không có; thêm khung bên dưới cho lượt về, bữa ăn hoặc sinh hoạt ở giờ khác.</p>
        <PlannerRoutinePeriods periods={extraPeriods} onChange={setExtraPeriods} invalid={!!error} />
        {error && <FieldError id="routine-error" role="alert">{error}</FieldError>}
        <p className="planner-note">{!hasRoutineTiming(routine) ? 'Các giờ điền sẵn chỉ là gợi ý. Điều chỉnh rồi nhấn cập nhật để nhận các khoảng trống cụ thể.' : 'Kết quả dùng giờ đã lưu. Nhấn cập nhật để áp dụng các thay đổi vừa nhập.'}</p>
        <div className="planner-routine-actions"><Button type="submit" value="day" disabled={saving}><Check data-icon="inline-start" />Cập nhật ngày này</Button><Button type="submit" value="week" variant="outline" disabled={saving}><Copy data-icon="inline-start" />Áp dụng cả tuần</Button></div>
        <p className="planner-note">Áp dụng cả tuần thay nhịp sinh hoạt của 7 ngày đang xem, không thay đổi lịch đã nhập.</p>
      </FieldGroup>
    </form></CardContent>
  </Card>
}
