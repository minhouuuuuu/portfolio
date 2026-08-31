# ADR-001 — Remove the Services block from the home and nav

## Context

The home page had a "SERVICES & CRAFT" section between About and Projects,
listing three offerings (3D & WebGL, Motion & Interaction, Creative
Engineering), and "Services" was a top-level nav item alongside Projects,
Lab, and Contact. See `POSITIONNEMENT.md` — this was one of the clearest
"creative agency" signals on the site: 2 of 3 cards were animation/WebGL
offerings, and the one engineering-flavored card was captioned "with a
designer's eye" and listed last.

## Options considered

1. **Keep it, recaption it** — reword the three cards to sound more
   engineering-flavored without changing structure.
2. **Remove from the page and nav, keep the component** — the block stops
   being part of the product-engineer pitch, but nothing is deleted.
3. **Delete the component entirely.**

## Decision

Option 2. A product engineer applying for a role does not present a menu of
"services" — that framing itself (not just the wording inside it) reads as
freelance/agency positioning, independent of how the three cards are
worded. The skills it tried to demonstrate (WebGL, motion, clean code) are
better shown as *evidence* inside the case studies and the Lab than
*declared* in a service card.

The component (`components/sections/Services.tsx`) and its dictionary
entries are **not deleted** — `Services` is simply no longer imported in
`app/page.tsx`, and `"Services"` is removed from `NAV_LINKS`
(`lib/constants.ts`) and the nav label map (`components/layout/Navbar.tsx`).
It can be resurrected for a separate freelance-facing page later without
rewriting it.

## What this sacrifices

- A visible list of "what I can do for you," which suits a client-facing
  freelance pitch. That pitch is not the current goal (interviews, not
  freelance leads), so its absence is the point, not a loss.
- The `Ingénierie Créative` / `Creative Engineering` card was the one place
  the pre-repositioning copy gestured at general engineering skill at all.
  It is now gone rather than repositioned — the case studies (ADR-002,
  Phase 3) carry that weight instead, with actual evidence instead of a
  self-description.

## Consequences

- Nav is now: Work, About, Lab, Contact — four items, all pointing at
  content that exists and proves something, none of them a service menu.
- If a freelance-facing variant of the site is ever needed, `Services.tsx`
  is a ready-made starting point, not a rebuild.
