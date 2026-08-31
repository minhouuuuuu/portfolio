// ─── Analytics events ─────────────────────────────────────────────────────────
// Vercel Web Analytics (@vercel/analytics). Named events per ADR-003 — the
// site's only goal is landing interviews, so every event here maps to a step
// in that funnel. North star: case_study_open_rate (see ADR-003).
//
// Custom events require a Pro plan to appear in the dashboard (Hobby only
// shows raw pageviews). track() is a safe no-op on Hobby — call sites don't
// need to change when the plan is upgraded.

import { track as vercelTrack } from '@vercel/analytics'

export type AnalyticsEvent =
  | { name: 'scroll_past_hero' }
  | { name: 'case_study_open'; slug: string }
  | { name: 'cv_download'; locale: string }
  | { name: 'contact_click'; method: 'email' }
  | { name: 'lab_enter' }

export function track(event: AnalyticsEvent) {
  const { name, ...props } = event
  vercelTrack(name, props)
}
