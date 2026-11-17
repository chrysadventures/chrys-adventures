# Connected adventure map review — 17 November 2026

## Scope and structure
Learning and Advanced navigation only. The large duplicate Learning tracker is replaced by a compact progress summary and one continuous measured route. Desktop Learning order is 1–2–3, 4–5–6 right-to-left, then 7–8; the three stages remain small labelled landmarks. Advanced is 1–2–3, 4–5–6 right-to-left, then the separate test-camp flag. Tablet and mobile retain curriculum order on a vertical trail.

The original lesson titles, descriptions, routes, completed predicates and mission locks are retained. Thematic place names are secondary and translated into Malay. Each destination remains one native button; disabled missions remain disabled. The next recommended stop has Chrys, an outlined route marker and a label. All Learning activities remain available.

## Artwork
Reused current meadow/sunset backgrounds and sitting/running Chrys; existing tree, book, basket, log, banana, leaf, flower, pencil and star sprites. Small composed landmarks replace identical ground platforms. The treehouse/orchard/bridge names are conceptual rather than literal buildings. No new raster assets, AI generation, reference-game art or third-party services. No missing illustration is required to run this design; literal bespoke treehouses, bridges or villages would require a future matching illustrator commission, not placeholder generated imagery.

## Files changed
- `client/src/App.tsx`: compact navigation headers, map wrappers, stage signs, single destination buttons, companion placement; no lesson/exercise code changes.
- `client/src/components/AdventureMap.tsx`: shared responsive route measurement and bilingual place names; cleans up ResizeObserver, scheduled frame and window listener.
- `client/src/lib/adventureRoute.ts`: continuous route geometry in DOM/curriculum order, with outer-verge turns on desktop.
- `client/src/adventure-map.css`: scoped map, nameboard, landmark, state, focus and responsive layouts.
- `client/src/components/StorybookNavigation.tsx`: existing sprite combinations, removes repeated island platforms; magic logic unchanged.
- `client/src/main.tsx`: imports map stylesheet.
- `client/scripts/regression.test.mjs`: preserves route/completion assertions for the new single destination control; adds continuity/row-turn/mobile geometry coverage.
- `DESIGN.md`, this report: latest design direction and evidence.
- `client/src/storybook-navigation.css` already contained the previous turn's uncommitted tracker enlargement; preserved. The new map no longer renders that old tracker.

## Validation
- TypeScript passed.
- 25 regression tests passed, including bilingual routes/completion, all 64 Advanced completion combinations with/without builder override, magic lifecycle, existing counting/audio/save regressions, and new continuous route geometry.
- Question audit: 232 answers/visuals and 217 solution methods passed.
- Asset audit: 245 referenced image/audio files passed exact-case checks.
- Production build passed; existing >500 kB JS chunk warning remains (~810 kB minified).
- Actual full-page screenshots reviewed for both modes, both languages, at 320/390/768/1280px (16 combinations). No document horizontal overflow or broken images; all 8 Learning and 7 Advanced/test markers present. Fixed an inherited grid-area positioning bug that initially placed mobile artwork under labels.
- Keyboard: Tab showed a visible solid focus outline on Advanced mission 2; Enter opened its comparison lesson. Learning destination 3 Enter opened Number Order. Fixture missions 5/6 remained native disabled controls.

## Screenshot artifacts
`C:/Users/wanha/.codex/visualizations/2026/10/21/01a15e3e-8352-7820-84fa-6d8d8cf94a06/adventure-map-nov17/review.html`

Includes full route screenshots for all 16 combinations and separate desktop/mobile viewport captures of both modes.

## Limits
Preview fixtures were used; live learner data, cloud sync and PIN services were not touched. No new locks, rewards or educational logic. Fixed scenic backgrounds are visible throughout normal scrolling; full-page browser captures show the base colour below the first viewport (capture limitation). Background artwork contains its own painted character, preserved unchanged. Physical touch and screen-reader testing were not performed; reduced-motion relies on scoped CSS and existing magic policy tests rather than a fresh OS preference toggle. The new location translations should receive native-speaker editorial review.

No commit, push or deployment performed.
