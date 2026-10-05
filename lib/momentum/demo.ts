import { dateOffset } from './format'
import type { Workspace, Task } from './types'

export function createDemoWorkspace(today: string): Workspace {
  const tasks: Task[] = [
    { id: 'task-1', title: 'Nghiên cứu & tìm cảm hứng thiết kế', goalId: 'portfolio', scheduledDate: today, startTime: '08:00', minutes: 50, completed: true },
    { id: 'task-2', title: 'Luyện Listening — Cambridge 18', goalId: 'ielts', scheduledDate: today, startTime: '09:30', minutes: 35, completed: true },
    { id: 'task-3', title: 'Thiết kế wireframe trang chủ', goalId: 'portfolio', scheduledDate: today, startTime: '10:30', minutes: 50, completed: false },
    { id: 'task-4', title: 'Học 20 từ vựng chủ đề Education', goalId: 'ielts', scheduledDate: today, startTime: '14:00', minutes: 25, completed: false },
    { id: 'task-5', title: 'Đọc 20 trang Atomic Habits', goalId: 'reading', scheduledDate: today, startTime: '20:00', minutes: 25, completed: false },
  ]
  const milestones = {
    portfolio: ['Xác định phong cách cá nhân', 'Chọn dự án tiêu biểu', 'Viết giới thiệu bản thân', 'Phác thảo cấu trúc website', 'Hoàn thiện giao diện mobile', 'Xuất bản portfolio'],
    ielts: ['Làm bài kiểm tra đầu vào', 'Lên lộ trình ôn tập', 'Luyện Reading test 1', 'Viết Writing task 1', 'Luyện Speaking part 2', 'Ôn từ vựng Technology', 'Làm đề thi thử', 'Đánh giá tiến độ'],
    reading: ['Chọn danh sách sách', 'Đọc chương 1', 'Ghi chú chương 1', 'Đọc chương 2', 'Ghi chú chương 2', 'Đọc chương 3', 'Đọc chương 4', 'Tổng kết Atomic Habits', 'Bắt đầu Deep Work', 'Đọc chương 1 Deep Work', 'Ghi lại bài học'],
  }
  const completed = { portfolio: 4, ielts: 2, reading: 4 }
  Object.entries(milestones).forEach(([goalId, titles]) => {
    titles.forEach((title, index) => tasks.push({ id: `${goalId}-${index}`, title, goalId, scheduledDate: dateOffset(today, index < completed[goalId as keyof typeof completed] ? -2 : index + 1), startTime: '09:00', minutes: 25, completed: index < completed[goalId as keyof typeof completed] }))
  })
  return {
    routines: {},
    schedule: [],
    today,
    goals: [
      { id: 'portfolio', title: 'Thiết kế portfolio cá nhân', description: 'Kể câu chuyện của mình qua từng thiết kế.', category: 'SỰ NGHIỆP', color: 'mint', deadline: dateOffset(today, 21), archived: false },
      { id: 'ielts', title: 'Chinh phục IELTS 7.0', description: 'Một ngôn ngữ mới. Nhiều cánh cửa mới.', category: 'HỌC TẬP', color: 'lavender', deadline: dateOffset(today, 60), archived: false },
      { id: 'reading', title: 'Xây dựng thói quen đọc sách', description: 'Nuôi dưỡng tâm trí, 20 trang mỗi ngày.', category: 'PHÁT TRIỂN BẢN THÂN', color: 'peach', deadline: dateOffset(today, 30), archived: false },
    ],
    tasks,
    sessions: [50, 75, 100, 60, 125, 90, 85].map((minutes, index) => ({ id: `session-${index}`, startedAt: `${dateOffset(today, index - 6)}T08:00:00.000Z`, durationSeconds: minutes * 60 })),
    preferences: { dailyMinutes: 120, name: 'Minh An' },
  }
}
