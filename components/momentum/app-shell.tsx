'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import { ArrowUpRight, AudioLines, CalendarDays, ChartNoAxesColumnIncreasing, ChevronRight, CircleHelp, Command, Focus, LayoutGrid, Menu, Search, Settings2, Sparkles, Target, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useWorkspace } from '@/hooks/use-workspace'
import { useInterface } from '@/hooks/use-interface'
import { useFocus } from '@/hooks/use-focus'
import { formatTimer } from '@/lib/momentum/format'
import { cn } from '@/lib/utils'

const navigation = [
  { href: '/', label: 'Tổng quan', icon: LayoutGrid },
  { href: '/goals', label: 'Mục tiêu', icon: Target },
  { href: '/planner', label: 'Lên kế hoạch', icon: CalendarDays },
  { href: '/focus', label: 'Phòng tập trung', icon: Focus },
  { href: '/insights', label: 'Thống kê', icon: ChartNoAxesColumnIncreasing },
]

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const actions = useInterface()
  const { workspace } = useWorkspace()
  const focus = useFocus()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [ready, setReady] = useState(false)
  const current = navigation.find((item) => item.href === pathname) ?? navigation[0]
  useEffect(() => { setReady(true) }, [])
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); actions.openSearch() }
      if (event.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [actions])
  const initials = workspace.preferences.name.split(' ').slice(-2).map((word) => word[0]).join('').toUpperCase()
  const pendingToday = workspace.tasks.filter((task) => !task.completed && task.scheduledDate === workspace.today && workspace.goals.some((goal) => goal.id === task.goalId && !goal.archived)).length
  const navLinks = <nav aria-label="Điều hướng chính">{navigation.map((item) => <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={cn('nav-item', pathname === item.href && 'active')} aria-current={pathname === item.href ? 'page' : undefined}><item.icon /><span>{item.label}</span>{item.href === '/planner' && pendingToday > 0 && <span className="nav-count">{pendingToday}</span>}{item.href === '/focus' && focus.status === 'running' && <span className="status-dot" />}</Link>)}</nav>
  return <div className="app-shell" data-ready={ready ? 'true' : 'false'}>
    <a href="#main-content" className="skip-link">Đến nội dung chính</a>
    <aside className="app-sidebar"><Link href="/" className="brand" aria-label="Focus OS - Tổng quan"><span className="brand-mark"><Focus /></span><span>focus<span className="brand-os">os</span><small>YOUR PERSONAL OPERATING SYSTEM</small></span></Link><div className="workspace-switch"><span className="workspace-symbol"><Sparkles /></span><div>Không gian cá nhân<small>Make room for what matters.</small></div><ChevronRight /></div><span className="nav-section-label">WORKSPACE</span>{navLinks}<div className="sidebar-bottom"><div className="sidebar-focus-card"><div className="focus-card-top"><AudioLines /><span>CHẬM LẠI MỘT NHỊP</span><span className="status-dot" /></div><p>Một chút tập trung.<br />Một bước tiến xa.</p><Link href="/focus">{focus.status === 'running' ? `Đang tập trung · ${formatTimer(focus.remaining)}` : 'Vào phòng tập trung'}<ArrowUpRight /></Link></div><button className="sidebar-utility" onClick={actions.openSettings}><Settings2 />Cài đặt</button><button className="sidebar-utility" onClick={actions.openHelp}><CircleHelp />Một chút hướng dẫn<ArrowUpRight /></button><Separator /><button className="profile-button" onClick={actions.openSettings}><span className="profile-avatar">{initials}</span><span>{workspace.preferences.name}<small>Đang trở thành phiên bản tốt hơn</small></span><Settings2 /></button></div><span className="sidebar-version">FOCUS OS <span>V.1.0</span></span></aside>
    <div className="app-main"><header className="app-topbar"><div className="topbar-left"><Button className="mobile-menu-button" variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? 'Đóng menu' : 'Mở menu'} aria-expanded={mobileOpen}>{mobileOpen ? <X /> : <Menu />}</Button><span className="breadcrumb-home"><LayoutGrid />Không gian cá nhân</span><ChevronRight className="breadcrumb-chevron" /><span>{current.label}</span></div><div className="topbar-right"><button className="demo-badge" onClick={actions.openHelp}><span className="status-dot" />Bản trải nghiệm</button><span className="topbar-divider" /><button className="search-button" onClick={actions.openSearch} aria-label="Tìm kiếm mục tiêu và nhiệm vụ"><Search /><kbd><Command />K</kbd></button></div></header>{mobileOpen && <div className="mobile-navigation">{navLinks}<button className="sidebar-utility" onClick={() => { setMobileOpen(false); actions.openSettings() }}><Settings2 />Cài đặt</button></div>}<main id="main-content" className="main-content">{children}<footer className="page-footer"><span>ĐƯỢC TẠO RA ĐỂ CẬU TIẾN XA HƠN.</span><span><span className="status-dot" />Ít hơn, nhưng tốt hơn.</span></footer></main></div>
  </div>
}
