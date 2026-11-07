# UI and animation review — 7 November 2026

## Scope and evidence
Reviewed the existing application source, prior bug reviews, and counting rules. Browser smoke checks covered all 31 isolated preview sections in desktop English and 390px-wide Malay: navigation, saved-game fixture, seven Learning lesson families, six Advanced lesson families, three Learning tests, five Advanced tests, and shared practice/completion screens. No broken loaded images or document-level horizontal overflow appeared in these opening-screen checks. All 13 lesson-to-practice transitions rendered. Browser error log was empty during these checks.

These are smoke checks, not exhaustive playback of every lesson slide, question, audio recording, or animation. Preview uses fixture progress and does not prove live cloud save/authentication health.

## Confirmed fixes and polish
| File | Change | Verification |
| --- | --- | --- |
| client/src/App.tsx | Teen groups previously used the same active counter, highlighting two objects together. Count each group serially through the shared counting sequence, guard continuation, cancel on practice navigation, and avoid a second total delay. | EN/MS regression tests; muted browser count completed both groups with separate labels and replay; navigated to practice during replay. |
| client/src/App.tsx | Keep counted group containers stable; the object alone receives active emphasis. | Source inspection and browser counting review. |
| client/src/App.tsx | Resize drawing canvases with a preserved bitmap and refreshed coordinate transform; capture drawing pointers and release drawing state on cancellation. | Regression checks preservation, dimensions, transform, and unchanged-size no-op. Touch/stylus and repeated-resize fidelity still need device testing. |
| client/src/App.tsx | Shared lesson control hooks and mobile Advanced Test entry alignment. | Desktop and mobile Malay smoke checks. |
| client/src/interaction-polish.css; client/src/main.tsx | Shared 180/280/360ms control/reveal/feedback timing, gentle hover/press, visible keyboard focus, limited attention pulses, mobile action-row layout, reduced-motion rules. | Build, source checks, representative lesson screenshot. Teaching audio durations remain independent. |
| client/src/design-preview.tsx | Add all lesson/test entry points and audio toggle for isolated review without live saves. | All 31 options rendered; lesson practice transitions checked. |
| client/scripts/regression.test.mjs | Add EN/MS serial group/cancellation tests and canvas-resize test. | All 21 regression tests passed. |
| DESIGN.md | Document common motion and counting emphasis rules. | Reviewed against implementation. |

Existing user/Claude changes in adventure-ui.css and other modified files were preserved.

## Validation
- Typecheck: passed.
- Regression: 21 passed.
- Questions: 232 answers/visuals and 217 solution methods passed.
- Assets: 234 image/audio paths passed exact-case existence checks.
- Production build: passed; existing large JS chunk warning remains (~808 kB minified).
- git diff --check: passed (Git reports normal LF/CRLF conversion warnings).

## Remaining review areas
- Older independent counting and transfer implementations still require per-sequence playback and consolidation; this change does not assert that every animation is standardized.
- Intermediate transfer positioning, cancellation at every awaited step, and all solution animations need a dedicated interaction matrix beyond the opening-screen pass.
- Existing sunset styling and older Cyber Mission copy are inconsistent in terminology. Preserved current visual identity rather than performing an unrequested theme/content migration.
- Live PIN security, cloud saves, and multi-device conflicts were not modified or tested against real learner data.
- Canvas bitmap scaling can soften ink after repeated resizes; vector stroke storage would be a separate enhancement.

No commit, push, database change, or deployment was performed.
