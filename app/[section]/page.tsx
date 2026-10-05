import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { GoalsPage } from '@/components/momentum/goals-page'
import { PlannerPage } from '@/components/momentum/planner-page'
import { FocusPage } from '@/components/momentum/focus-page'
import { InsightsPage } from '@/components/momentum/insights-page'

const pages = { goals: { title: 'Mục tiêu', Component: GoalsPage }, planner: { title: 'Kế hoạch tuần', Component: PlannerPage }, focus: { title: 'Phòng tập trung', Component: FocusPage }, insights: { title: 'Thống kê', Component: InsightsPage } }
export async function generateMetadata({ params }: { params: Promise<{ section: string }> }): Promise<Metadata> {
  const { section } = await params
  return { title: `${pages[section as keyof typeof pages]?.title ?? 'Không tìm thấy'} · Focus OS` }
}
export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params
  if (!Object.hasOwn(pages, section)) notFound()
  const { Component } = pages[section as keyof typeof pages]
  return <Component />
}
