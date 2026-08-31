# ADR-003 — Instrumentation, north star metric, and the Lab question

## Context

The site had zero analytics. Its only goal is landing interviews, so every
structural decision made in Phases 1–4 (case studies moved above the fold,
Lab reframed as engineering depth rather than the main pitch, Services
removed) was made on reasoning, not evidence — there was no way to confirm
any of it was actually working, and no way to answer the one question this
whole repositioning turns on: **does the Lab help or dilute conversion?**

This ADR fixes the north star metric and its decision threshold **before**
any data exists, so the threshold can't be reverse-engineered from whatever
number shows up later.

## Options considered

1. **CV/contact click-through rate** — closer to the final conversion action,
   but it measures generic intent. A visitor can click "Download CV" without
   ever having read a case study; the number wouldn't say anything about
   whether the Phase 2/3 repositioning (case studies as the site's core)
   actually worked.
2. **Case study open rate** — the fraction of visitors who open at least one
   case study. This is the action closest to "a technical lead read a piece
   of product reasoning," which is the entire point of Phase 2 and 3. It's
   also the one number that can directly answer the Lab question (see below).
3. **Full multi-step funnel** (arrival → scroll → case study → CV/contact) —
   more complete, but overkill for a solo portfolio with no team to consume a
   dashboard. Rejected for now per the "don't build for hypothetical future
   requirements" rule; the individual events are still tracked (see below),
   so this funnel can be assembled later without re-instrumenting anything.

## Decision

**North star metric: `case_study_open_rate`**
= visitors who open ≥1 case study ÷ total visitors.

**Decision threshold, fixed now, before any data:**
- **< 15%** → the home page is not pushing visitors toward the case studies
  hard enough. Action: revisit the Work section's position/framing (Phase 2
  hierarchy), not the case study content itself.
- **≥ 15%** → the structural bet (case studies as the site's core, moved
  right after the Hero) is working. Action: optimize case study *content*
  quality from here, not site structure.

15% is a judgment call, not a benchmark pulled from external portfolio
data (none was available) — it's deliberately conservative for a page with
only one real CTA competing for that click (the case study cards are the
only thing between the Hero and everything else). If the real number lands
close to the line, treat it as inconclusive rather than forcing a verdict
either side of an arbitrary boundary.

## Instrumentation

**Tool: Vercel Web Analytics** (`@vercel/analytics`) — cookie-less,
first-party, already the hosting platform, zero added infra. Installed via
`<Analytics />` in `app/layout.tsx` (automatic pageview = "arrival").

Named events (`lib/analytics.ts`), one `track()` call site each:
| Event | Fires when | Call site |
|---|---|---|
| `scroll_past_hero` | Hero section scrolls out of view (top edge), once | `components/analytics/ScrollDepthTracker.tsx` |
| `case_study_open` | A project card with a case study link is clicked | `components/sections/Projects.tsx` |
| `cv_download` | The CV download link is clicked | `components/sections/Hero.tsx` |
| `contact_click` | The email link is clicked | `components/sections/Contact.tsx` |
| `lab_enter` | The Lab section first becomes visible (existing IntersectionObserver, not a new one) | `components/lab/LabSection.tsx` |

**The Lab question, answered with these events specifically:** compare
`case_study_open` rate for visitors who fired `lab_enter` before reaching
the case studies (Lab is positioned after Work in the current hierarchy, so
in practice this splits into "opened a case study, then also entered the
Lab" vs. "entered the Lab, never opened a case study") against visitors who
never fired `lab_enter` at all. If the group that engages with the Lab
converts to case-study opens at a meaningfully *lower* rate than the group
that doesn't, that's evidence the Lab is competing with the case studies for
attention rather than reinforcing them — the trigger to revisit its
position in the hierarchy, not just its framing.

## What this doesn't cover

- **Plan limits.** Custom events (`track()`) only surface in the Vercel
  Analytics dashboard on a **Pro** plan — this project is on **Hobby**,
  which shows pageviews only. The code is written the same way regardless;
  nothing needs to change when the plan is upgraded, but until then the
  named events are recorded by the SDK but not visible anywhere. This is a
  known, accepted gap — sacrificed for zero cost and zero new
  infrastructure on a solo portfolio, per the "no gratuitous new tooling"
  rule.
- **No session replay, no heatmaps, no funnel dashboard.** Deliberately out
  of scope — the six events above are sufficient to answer the specific
  questions this ADR exists to answer (is the case-study-first hierarchy
  working, does the Lab help or hurt).

## Consequences

- The 15% threshold is a real commitment: once real numbers exist, they
  have to change something (case study content vs. site structure), not
  just get reported.
- If custom events stay invisible for a long stretch (still on Hobby),
  `scroll_past_hero` / `case_study_open` / etc. are moot until upgraded —
  raw pageview counts per route are the only thing usable in the meantime,
  which is enough to sanity-check that traffic exists at all but not enough
  to compute `case_study_open_rate`.
