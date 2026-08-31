import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CaseStudyClient } from '@/components/case-study/CaseStudyClient'
import {
  CASE_STUDIES,
  getCaseStudy,
  getNextCaseStudy,
} from '@/lib/case-studies'

const PUBLISHED = true

export function generateStaticParams() {
  return PUBLISHED ? CASE_STUDIES.map(({ slug }) => ({ slug })) : []
}

export async function generateMetadata(
  props: PageProps<'/projects/[slug]'>,
): Promise<Metadata> {
  if (!PUBLISHED) return {}
  const { slug } = await props.params
  const caseStudy = getCaseStudy(slug)
  if (!caseStudy) return {}

  return {
    title: `${caseStudy.title} — Case Study`,
    description: caseStudy.metaDescription,
    openGraph: {
      title: `${caseStudy.title} — Case Study`,
      description: caseStudy.metaDescription,
      images: [{ url: caseStudy.image, alt: caseStudy.title }],
    },
  }
}

export default async function CaseStudyPage(
  props: PageProps<'/projects/[slug]'>,
) {
  if (!PUBLISHED) notFound()
  const { slug } = await props.params
  const caseStudy = getCaseStudy(slug)
  if (!caseStudy) notFound()

  return (
    <CaseStudyClient
      caseStudy={caseStudy}
      nextCaseStudy={getNextCaseStudy(slug)}
    />
  )
}
