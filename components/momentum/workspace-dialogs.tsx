'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Archive, ArrowUpRight, Search, Plus, Target, Info } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Field, FieldGroup, FieldLabel, FieldDescription } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useInterface } from '@/hooks/use-interface'
import { useWorkspace } from '@/hooks/use-workspace'
import { useFocus } from '@/hooks/use-focus'
import { dateOffset, goalProgress } from '@/lib/momentum/format'
import type { GoalColor } from '@/lib/momentum/types'
import { TaskRow } from './task-row'
import { EmptyState } from './ui-parts'

const titles = { goal: 'Một mục tiêu mới. Một khởi đầu mới.', task: 'Thêm một bước tiến nhỏ', detail: 'Hành trình của cậu', settings: 'Không gian của cậu', help: 'Chào mừng đến với Focus OS', search: 'Tìm trong không gian của cậu' }
const descriptions = { goal: 'Điều gì cậu muốn chinh phục tiếp theo?', task: 'Chọn một việc cụ thể, vừa sức để bắt đầu.', detail: 'Mỗi nhiệm vụ hoàn thành đưa cậu đến gần hơn.', settings: 'Điều chỉnh nhịp độ phù hợp với bản thân.', help: 'Ít xao nhãng hơn. Nhiều điều ý nghĩa hơn.', search: 'Tìm mục tiêu hoặc nhiệm vụ để tiếp tục hành trình.' }

export function WorkspaceDialogs() {
  const actions = useInterface()
  return <Dialog open={!!actions.dialog} onOpenChange={(open) => { if (!open) actions.close() }}><DialogContent className="workspace-dialog sm:max-w-lg"><DialogHeader><DialogTitle>{actions.dialog ? titles[actions.dialog.type] : ''}</DialogTitle><DialogDescription>{actions.dialog ? descriptions[actions.dialog.type] : ''}</DialogDescription></DialogHeader>{actions.dialog && <DialogBody key={`${actions.dialog.type}-${actions.dialog.goalId ?? ''}`} />}</DialogContent></Dialog>
}

function DialogBody() {
  const actions = useInterface()
  const { workspace, addGoal, addTask, archiveGoal, setPreferences } = useWorkspace()
  const focus = useFocus()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const dialog = actions.dialog!
  const goals = workspace.goals.filter((goal) => !goal.archived)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    const values = new FormData(event.currentTarget)
    const title = String(values.get('title') ?? '').trim()
    if (dialog.type !== 'settings' && !title) { toast.error('Cậu hãy nhập tên trước nhé.'); return }
    setSaving(true)
    try {
      if (dialog.type === 'goal') {
        const category = String(values.get('category'))
        const color: GoalColor = category === 'HỌC TẬP' ? 'lavender' : category === 'PHÁT TRIỂN BẢN THÂN' ? 'peach' : 'mint'
        await addGoal({ title, description: String(values.get('description') ?? '').trim(), category, color, deadline: String(values.get('deadline')), })
        toast.success('Hành trình mới đã bắt đầu.', { description: 'Thêm nhiệm vụ đầu tiên để từng bước tiến lên.' })
      } else if (dialog.type === 'task') {
        const goalId = String(values.get('goalId'))
        if (!goals.some((goal) => goal.id === goalId)) throw new Error('Hãy chọn một mục tiêu đang hoạt động.')
        await addTask({ title, goalId, scheduledDate: String(values.get('date')), startTime: String(values.get('time')), minutes: Number(values.get('minutes')) })
        toast.success('Đã thêm nhiệm vụ vào lộ trình.')
      } else if (dialog.type === 'settings') {
        const name = String(values.get('name') ?? '').trim()
        const dailyMinutes = Number(values.get('dailyMinutes'))
        if (!name || !Number.isInteger(dailyMinutes) || dailyMinutes < 15 || dailyMinutes > 720) throw new Error('Nhập tên và thời gian từ 15 đến 720 phút.')
        await setPreferences({ name, dailyMinutes })
        toast.success('Đã cập nhật tùy chỉnh trong phiên này.')
      }
      actions.close()
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Chưa thể cập nhật. Hãy thử lại nhé.') }
    finally { setSaving(false) }
  }

  if (dialog.type === 'help') return <div className="help-content"><div className="help-symbol"><Target /></div><p>Focus OS là không gian để biến mục tiêu lớn thành những bước nhỏ, có chủ đích.</p><ol><li><strong>Đặt mục tiêu</strong><span>Xác định điều quan trọng với cậu.</span></li><li><strong>Lên kế hoạch</strong><span>Chia hành trình thành nhiệm vụ mỗi ngày.</span></li><li><strong>Tập trung và tiến bộ</strong><span>Dành 25 hoặc 50 phút cho một việc duy nhất.</span></li></ol><p className="demo-disclaimer"><Info />Đây là bản trải nghiệm với dữ liệu mẫu. Thay đổi chỉ tồn tại trong phiên hiện tại; tải lại trang sẽ đặt lại dữ liệu. Không có tài khoản hoặc kết nối máy chủ.</p><Button onClick={actions.close}>Bắt đầu khám phá<ArrowUpRight data-icon="inline-end" /></Button></div>

  if (dialog.type === 'search') {
    const query = search.trim().toLocaleLowerCase('vi-VN')
    const matchingGoals = goals.filter((goal) => goal.title.toLocaleLowerCase('vi-VN').includes(query))
    const tasks = workspace.tasks.filter((task) => goals.some((goal) => goal.id === task.goalId) && task.title.toLocaleLowerCase('vi-VN').includes(query)).slice(0, 7)
    return <div className="search-content"><Field><FieldLabel htmlFor="workspace-search" className="sr-only">Tìm kiếm</FieldLabel><Input id="workspace-search" autoFocus placeholder="Tên mục tiêu, nhiệm vụ..." value={search} onChange={(event) => setSearch(event.target.value)} /></Field><div className="search-results">{matchingGoals.map((goal) => <button key={goal.id} onClick={() => actions.viewGoal(goal.id)}><Target /><span>{goal.title}<small>Mục tiêu</small></span><ArrowUpRight /></button>)}{tasks.map((task) => <button key={task.id} onClick={() => { focus.selectTask(task.id); actions.close(); router.push('/focus') }}><Search /><span>{task.title}<small>Nhiệm vụ</small></span><ArrowUpRight /></button>)}{!matchingGoals.length && !tasks.length && <EmptyState title="Chưa tìm thấy kết quả" description="Thử tìm với một từ khóa ngắn hơn nhé." />}</div></div>
  }

  if (dialog.type === 'detail') {
    const goal = workspace.goals.find((item) => item.id === dialog.goalId)
    if (!goal) return null
    const progress = goalProgress(goal.id, workspace.tasks)
    return <div className="goal-detail"><h3>{goal.title}</h3><p>{goal.description}</p><div className="goal-progress-label"><span>{progress.done}/{progress.total} nhiệm vụ hoàn thành</span><strong>{progress.percent}%</strong></div><Progress value={progress.percent} aria-label="Tiến độ mục tiêu" /><div className="goal-detail-tasks">{workspace.tasks.filter((task) => task.goalId === goal.id).map((task) => <TaskRow key={task.id} task={task} compact />)}{!progress.total && <EmptyState title="Bắt đầu với một nhiệm vụ" description="Một bước nhỏ là đủ để tạo đà." />}</div><div className="dialog-actions"><Button variant="ghost" onClick={async () => { await archiveGoal(goal.id); actions.close(); toast.success(goal.archived ? 'Đã khôi phục mục tiêu.' : 'Đã chuyển mục tiêu vào lưu trữ.') }}><Archive data-icon="inline-start" />{goal.archived ? 'Khôi phục' : 'Lưu trữ'}</Button>{!goal.archived && <Button onClick={() => actions.newTask(goal.id)}><Plus data-icon="inline-start" />Thêm nhiệm vụ</Button>}</div></div>
  }

  if (dialog.type === 'task' && !goals.length) return <EmptyState title="Tạo mục tiêu trước nhé" description="Mỗi nhiệm vụ cần một đích đến để hướng tới."><Button onClick={actions.newGoal}>Tạo mục tiêu</Button></EmptyState>

  return <form onSubmit={handleSubmit} onKeyDown={(event) => { if (event.key === 'Enter' && (event.nativeEvent.isComposing || event.keyCode === 229)) event.preventDefault() }}><FieldGroup>
    {dialog.type === 'settings' ? <><Field><FieldLabel htmlFor="profile-name">Tên của cậu</FieldLabel><Input id="profile-name" name="name" defaultValue={workspace.preferences.name} maxLength={50} required /></Field><Field><FieldLabel htmlFor="daily-minutes">Mục tiêu tập trung mỗi ngày (phút)</FieldLabel><Input id="daily-minutes" name="dailyMinutes" type="number" min={15} max={720} step={1} defaultValue={workspace.preferences.dailyMinutes} required /><FieldDescription>Một nhịp độ vừa sức sẽ giúp cậu đi xa hơn.</FieldDescription></Field></> : <><Field><FieldLabel htmlFor="item-title">{dialog.type === 'goal' ? 'Tên mục tiêu' : 'Nhiệm vụ của cậu'}</FieldLabel><Input id="item-title" name="title" placeholder={dialog.type === 'goal' ? 'Ví dụ: Hoàn thiện portfolio cá nhân' : 'Ví dụ: Phác thảo giao diện trang chủ'} maxLength={120} autoFocus required /></Field>
    {dialog.type === 'goal' ? <><Field><FieldLabel htmlFor="goal-description">Điều này có ý nghĩa gì với cậu?</FieldLabel><Input id="goal-description" name="description" placeholder="Một lý do để tiếp tục mỗi ngày" maxLength={200} /></Field><Field><FieldLabel htmlFor="goal-category">Lĩnh vực</FieldLabel><NativeSelect id="goal-category" name="category" className="w-full"><NativeSelectOption>SỰ NGHIỆP</NativeSelectOption><NativeSelectOption>HỌC TẬP</NativeSelectOption><NativeSelectOption>PHÁT TRIỂN BẢN THÂN</NativeSelectOption></NativeSelect></Field><Field><FieldLabel htmlFor="goal-deadline">Ngày đích đến</FieldLabel><Input id="goal-deadline" name="deadline" type="date" min={workspace.today} defaultValue={dateOffset(workspace.today, 30)} required /></Field></> : <><Field><FieldLabel htmlFor="task-goal">Thuộc mục tiêu</FieldLabel><NativeSelect id="task-goal" name="goalId" defaultValue={dialog.goalId ?? goals[0]?.id} className="w-full">{goals.map((goal) => <NativeSelectOption key={goal.id} value={goal.id}>{goal.title}</NativeSelectOption>)}</NativeSelect></Field><div className="form-two-columns"><Field><FieldLabel htmlFor="task-date">Ngày thực hiện</FieldLabel><Input id="task-date" name="date" type="date" defaultValue={dialog.scheduledDate ?? workspace.today} required /></Field><Field><FieldLabel htmlFor="task-time">Giờ bắt đầu</FieldLabel><Input id="task-time" name="time" type="time" defaultValue="09:00" required /></Field></div><Field><FieldLabel htmlFor="task-minutes">Thời gian dự kiến (phút)</FieldLabel><Input id="task-minutes" name="minutes" type="number" min={5} max={480} step={1} defaultValue={25} required /></Field></>}
    </>}
    <p className="form-session-note">Chỉ lưu trong phiên trải nghiệm hiện tại.</p><div className="dialog-actions"><Button variant="outline" type="button" onClick={actions.close}>Để sau</Button><Button type="submit" disabled={saving}>{saving ? 'Đang cập nhật...' : dialog.type === 'goal' ? 'Tạo mục tiêu' : dialog.type === 'task' ? 'Thêm nhiệm vụ' : 'Lưu tùy chỉnh'}<ArrowUpRight data-icon="inline-end" /></Button></div>
  </FieldGroup></form>
}
