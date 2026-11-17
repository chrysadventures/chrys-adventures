# Storybook navigation review — 17 November 2026

## Delivered
- Learning: three connected illustrated clearings, eight original destinations, existing subject symbols, signpost labels, completion pennants/checks, and the existing first-unfinished shortcut. Desktop destinations follow a horizontal path; mobile uses a vertical trail.
- Advanced: six sunset landmarks in a connected expedition, explicit current/completed/available/locked states, and a separate flag checkpoint for Advanced Test Mode. Chrys remains transparent beside the greeting.
- Magic: daytime butterflies, leaf swirl, rainbow and Chrys greeting; sunset fireflies, shooting star, gold shimmer and Chrys greeting. Random selection excludes the immediately previous effect, limits particles to seven, blocks overlapping activations, and removes effects after 2.6 seconds. Mode/language changes and unmount clean up the active state/timer.
- Reduced motion: static ornament/message instead of moving magic, with decorative entrances and hover transforms suppressed.
- Pause/Resume Scenery and Malay equivalents, pause state, and obsolete effect styling removed. No replacement animation settings.
- AGENTS.md now requires HUMAN_DESIGN_GUIDELINES.md for future visual changes.

## Files
- AGENTS.md; DESIGN.md; HUMAN_DESIGN_GUIDELINES.md: permanent standard and implementation notes.
- client/src/App.tsx: menu presentation and next-mission indication; existing routes, predicates and educational components preserved.
- client/src/components/StorybookNavigation.tsx: composed existing sprite landmarks and self-contained magic component.
- client/src/lib/navigationMagic.ts: pure effect-selection and reduced-motion policy.
- client/src/storybook-navigation.css; client/src/main.tsx: scoped navigation layouts, interaction states and styles.
- client/src/interaction-polish.css: remove obsolete scenery/pause implementation.
- client/scripts/regression.test.mjs: added magic selection/lifecycle and exhaustive next-mission state coverage; retained existing navigation tests.

## Verification actually run
- TypeScript: passed.
- Regression: 24 passed, including all 64 mission-completion combinations in normal and builder modes, EN/MS original menu routes and completion states, effect-selection pools/no immediate repeats, reduced-motion policy, timer/listener cleanup and rapid-tap guard.
- Questions: 232 answers/visuals and 217 solution methods passed.
- Assets: 244 image/audio references passed exact-case checks.
- Production build: passed. Existing large JS chunk warning remains (~813 kB minified).
- git diff --check: passed.
- Browser: both menus at 320, 390, 768 and 1280px in English and Malay (16 combinations). No document horizontal overflow, broken loaded images or navigation targets smaller than 44px. Actual screenshots reviewed; fixed inherited CSS that hid clearings, the mobile action-row ordering, and the old Advanced header surface.
- Keyboard: visible focus and Enter activation verified for Learning's next-destination shortcut and Advanced's next mission. Locked mission buttons remain native disabled buttons.
- Live magic: observed shimmer then fireflies, disabled trigger during playback, and removal of temporary effect DOM afterward.

## Scope and limitations
No curriculum, question data, counting/audio synchronization, score, saved-game, PIN, backend, Supabase, or unlock changes. Preview screenshots use fixture progress, not real learners' saves. Physical touch devices and screen readers were not tested. OS reduced-motion behavior is covered by implementation/policy tests and CSS inspection, not a browser media-emulation run. Background art is viewport-fixed; full-page captures show its base color outside the initially captured viewport, while normal scrolling keeps the scenery behind the menus. Existing art was reused; no external art or dependency was added.

No push or deployment performed.
