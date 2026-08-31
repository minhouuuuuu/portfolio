# ADR-002 — Case studies become the core of the site

## Context

Before this repositioning, the three case-study-eligible project cards
(Askar, Brasserie Licorne, a third slot) linked to `/projects/[slug]` pages
filled with literal lorem ipsum, sitting eighth in the page's scroll order
— after Hero, About, Services, and a marquee. A technical lead reading the
site top to bottom hit zero evidence of product reasoning before reaching a
fabricated-looking case study. See `POSITIONNEMENT.md` §1 and §3.

## Options considered

1. **Leave the order alone, just fix the content** — write real case study
   copy but keep Work/Projects in its original 8th-of-11 position.
2. **Move Work immediately after the Hero, rebuild the case study template
   around decisions instead of a generic context/process/results shape.**
3. **Make case studies a separate page**, off the main scroll entirely,
   linked from a nav item.

## Decision

Option 2. Position and structure both had to change, not just content:

- **Position**: `Work` (renamed from `Projects`, ADR-001 note on the nav
  rename) moved to immediately follow the Hero in `app/page.tsx` — a
  visitor who scrolls once now reaches the case studies before About, Lab,
  or anything else. This directly answers the Phase 2 non-negotiable: a
  product-reasoning proof must appear before any technical demonstration.
- **Template structure**: the case study page (`lib/case-studies.ts`,
  `components/case-study/CaseStudyClient.tsx`) was rebuilt around six
  sections in a fixed order — problem → who it's for → decisions made and
  why → what I chose not to do → what I'd measure → what I'd redo
  differently — replacing the old context/process/results/quote shape. The
  fabricated client testimonial quote is gone; "what I'd redo differently"
  replaces it as the section that closes each case study, because an
  invented quote proves nothing and an honest retrospective does.
- **Content**: all four case studies (Askar, Brasserie Licorne, FileDrop,
  Wattwiller) were written from real project material, including things
  that don't flatter the work unprompted — FileDrop states up front that it
  started as a tutorial, Brasserie Licorne documents a reverted API
  integration as its best decision, Askar names a scoping trade-off (prices
  hardcoded, not CMS-editable) that would be made differently today.

## What this sacrifices

- Option 3 (separate page off the scroll) would have kept the home page
  shorter and more skimmable for a non-technical recruiter on first pass.
  Rejected because it re-creates the exact problem being fixed: proof of
  reasoning has to be encountered, not opt-in-only.
- The lorem-ipsum routes were unpublished (`generateStaticParams` returning
  `[]`, dropped from the sitemap) the moment this project started, and
  re-published only once every section had real content — no case study
  went live half-written.

## Consequences

- The old `context` / `process` / `processList` / `results` / `resultsBody`
  / `quote` fields no longer exist on the `CaseStudy` type. Any future case
  study has to be written in the new six-section shape — there is no path
  back to a generic "here's what we built" narrative without reverting this
  ADR.
- Four case studies now carry more of the site's total weight than any
  other single section. Keeping them honest (see the "what I chose not to
  do" and "what I'd redo" sections in each) is what keeps that weight from
  reading as a sales pitch.
