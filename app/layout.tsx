import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from '@/components/momentum/providers'
import { createDemoWorkspace } from '@/lib/momentum/demo'
import './globals.css'

const inter = Inter({ subsets: ['latin', 'vietnamese'], variable: '--font-inter', display: 'swap' })

export const metadata: Metadata = {
  title: 'Focus OS · Không gian để tiến xa',
  description: 'Theo đuổi mục tiêu, lập thời khóa biểu và cân đối thời gian ngủ, di chuyển, sinh hoạt. Nhận diện từng khoảng giờ trống trong ngày và tổng thời gian trống cả tuần để tập trung vào điều quan trọng.',
  applicationName: 'Focus OS',
  icons: { icon: '/focus-icon.svg' },
}

export const viewport: Viewport = { colorScheme: 'dark', themeColor: '#111312', width: 'device-width', initialScale: 1 }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  return <html lang="vi" className={`dark ${inter.variable}`}><body className="antialiased"><Providers initialWorkspace={createDemoWorkspace(today)}>{children}</Providers></body></html>
}
