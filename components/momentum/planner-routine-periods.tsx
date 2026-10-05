'use client'

import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { clockTime, timeToMinutes } from '@/lib/momentum/planner'
import type { RoutinePeriod } from '@/lib/momentum/types'

export function PlannerRoutinePeriods({ periods, onChange, invalid }: {
  periods: RoutinePeriod[]
  onChange: (periods: RoutinePeriod[]) => void
  invalid: boolean
}) {
  function update(id: string, changes: Partial<RoutinePeriod>) {
    onChange(periods.map((period) => period.id === id ? { ...period, ...changes } : period))
  }

  return <FieldSet>
    <FieldLegend variant="label">Các khung bổ sung (tùy chọn)</FieldLegend>
    <FieldGroup>
      {periods.map((period, index) => {
        const prefix = `routine-extra-${period.id}`
        const end = timeToMinutes(period.startTime) + period.minutes
        return <FieldSet key={period.id} className="planner-extra-period">
          <FieldLegend variant="label">Khung bổ sung {index + 1}</FieldLegend>
          <div className="flex items-center gap-2">
            <Field data-invalid={invalid}>
              <FieldLabel htmlFor={`${prefix}-category`} className="sr-only">Loại hoạt động {index + 1}</FieldLabel>
              <NativeSelect id={`${prefix}-category`} className="w-full" value={period.category} onChange={(event) => update(period.id, { category: event.target.value as RoutinePeriod['category'] })} aria-invalid={invalid}>
                <NativeSelectOption value="personal">Sinh hoạt · ăn uống, việc nhà…</NativeSelectOption>
                <NativeSelectOption value="commute">Di chuyển · đi hoặc về</NativeSelectOption>
              </NativeSelect>
            </Field>
            <Button type="button" variant="ghost" size="icon-sm" aria-label={`Xóa khung bổ sung ${index + 1}`} onClick={() => onChange(periods.filter((item) => item.id !== period.id))}><Trash2 /></Button>
          </div>
          <FieldGroup className="planner-routine-inputs">
            <Field data-invalid={invalid}><FieldLabel htmlFor={`${prefix}-start`}>Bắt đầu</FieldLabel><Input id={`${prefix}-start`} type="time" value={period.startTime} onChange={(event) => update(period.id, { startTime: event.target.value })} required aria-invalid={invalid} aria-describedby={invalid ? 'routine-error' : undefined} /></Field>
            <Field data-invalid={invalid}><FieldLabel htmlFor={`${prefix}-minutes`}>Thời lượng (phút)</FieldLabel><Input id={`${prefix}-minutes`} type="number" inputMode="numeric" min={1} max={1440} step={1} value={Number.isNaN(period.minutes) ? '' : period.minutes} onChange={(event) => update(period.id, { minutes: event.target.valueAsNumber })} required aria-invalid={invalid} aria-describedby={invalid ? 'routine-error' : undefined} /></Field>
          </FieldGroup>
          {Number.isFinite(end) && period.minutes > 0 && <p className="planner-note">Kết thúc lúc {clockTime(end % 1440)}{end >= 1440 ? ' hôm sau' : ''}.</p>}
        </FieldSet>
      })}
      <Button type="button" variant="outline" size="sm" disabled={periods.length >= 24} onClick={() => onChange([...periods, { id: crypto.randomUUID(), category: 'personal', startTime: '12:00', minutes: 30 }])}><Plus data-icon="inline-start" />Thêm khung sinh hoạt</Button>
    </FieldGroup>
  </FieldSet>
}
