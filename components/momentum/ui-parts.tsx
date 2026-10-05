import type { ReactNode } from 'react'
import { Target } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'

export function PageHeading({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children?: ReactNode }) {
  return <header className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="page-description">{description}</p></div><div className="page-heading-actions">{children}</div></header>
}

export function SectionHeading({ title, count, children }: { title: string; count?: number; children?: ReactNode }) {
  return <div className="section-heading"><h2>{title}{count !== undefined && <Badge variant="secondary">{String(count).padStart(2, '0')}</Badge>}</h2>{children}</div>
}

export function EmptyState({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return <Empty><EmptyHeader><EmptyMedia variant="icon"><Target /></EmptyMedia><EmptyTitle>{title}</EmptyTitle><EmptyDescription>{description}</EmptyDescription></EmptyHeader>{children && <EmptyContent>{children}</EmptyContent>}</Empty>
}
