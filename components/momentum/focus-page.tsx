'use client'

import { Headphones, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Field, FieldLabel } from '@/components/ui/field'
import { useFocus } from '@/hooks/use-focus'
import { useWorkspace } from '@/hooks/use-workspace'
import { QuickFocus } from './overview'
import { PageHeading } from './ui-parts'

export function FocusPage() {
  const focus = useFocus()
  const { workspace } = useWorkspace()
  const busy = focus.status === 'running' || focus.status === 'paused'
  const tasks = workspace.tasks.filter((task) => !task.completed && workspace.goals.some((goal) => goal.id === task.goalId && !goal.archived))
  return <div className="secondary-page"><PageHeading eyebrow="MỘT VIỆC. TOÀN BỘ SỰ CHÚ Ý." title="Trở về với hiện tại." description="Cất những xao nhãng sang một bên. Đây là thời gian của cậu." /><div className="focus-room"><div className="focus-room-icon"><Headphones /></div><Field><FieldLabel htmlFor="focus-task">Cậu muốn tập trung vào điều gì?</FieldLabel><NativeSelect id="focus-task" className="w-full" value={focus.taskId ?? ''} onChange={(event) => focus.selectTask(event.target.value)} disabled={busy}><NativeSelectOption value="">Tập trung tự do</NativeSelectOption>{tasks.map((task) => <NativeSelectOption key={task.id} value={task.id}>{task.title}</NativeSelectOption>)}</NativeSelect></Field><QuickFocus /><Button variant="ghost" onClick={focus.reset} disabled={focus.status === 'idle'}><RotateCcw data-icon="inline-start" />Đặt lại phiên</Button><p className="focus-room-note">Phiên hoàn thành sẽ được cộng vào thống kê.<br />Hãy giữ trang này mở; tải lại sẽ đặt lại phiên.</p></div></div>
}
