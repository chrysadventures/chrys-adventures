# World Overview — local implementation (for visual review, not committed)

Branch `feature/world-overview`, based on `b1b45aa`. Nothing has been committed, pushed or deployed.

## Changed files

| File | Change |
|---|---|
| `client/src/lib/mapCameraConfig.ts` (new) | `MAP_CAMERA` holds the zoom stops (50–150%), the default zoom and the focus zoom. It also has `clampZoom`, `nextZoomStop`, and `fitWorld`, the pure maths that fits the whole world to the screen. |
| `client/src/lib/useMapCamera.ts` | One camera with two modes, `explore` and `overview`. The 25% step is removed. Adds overview fit, refit on resize, saving and restoring the Explore view, Esc to leave, and a View Transition crossfade (instant with reduced motion). In overview, panning and pinching are turned off. |
| `client/src/components/IllustratedLearningMap.tsx` | Adds the World Overview / Return to map button and a "World Overview" status that replaces the percentage. Nine fixed-size overview pins, in EN and MS. The painted terrain moves into a masked layer. Adds the forest surround and the edge foliage. |
| `client/src/learning-map.css` | Removes the mirrored clearance strips and the stretched `wc-backdrop`. Adds the surround layers (ground, sky, hills, paper grain), the feathered edge mask, the overview mode, pins and controls, and phone layouts. |
| `client/src/lib/learningMapLayout.ts` | Appends `overviewMarkers` (landmark centres) and `edgeFoliage`. Stations, route and stones are unchanged. |
| `client/public/assets/learning-map/wc-world-edge.svg` (new, 0.6 KB) | An irregular, soft alpha mask for the terrain edge. |
| `client/scripts/regression.test.mjs` | Three new tests: zoom bounds, overview fit on desktop, tablet, phone and phone landscape, and that the forest stays clear of every station. |
| `client/src/design-preview.tsx`, `client/src/App.tsx` | Development preview only: `?frame=app` renders the map inside the real header and frame, so it can be checked without a PIN. `App.tsx` only adds `Header` to an export list. |

## Camera and overview logic

- **Explore Mode:** works as before, with native-scroll panning and transform zoom. All limits come from `MAP_CAMERA`. The minus button and pinch both stop at 50%, the minus button disables at 50%, and the indicator shows the real scale.
- **Entering World Overview:** the camera saves the world point at the centre of the screen and the current zoom. It then measures the floating interface: the header, save status, hint, progress and controls. `fitWorld` tries two layouts, keeping clear above and below the interface or keeping clear of side columns, and picks the larger. It returns a proportion-preserving scale and centres the world in the free space. That gives 46% on a 1440×900 desktop, 52% on a portrait tablet, 26% on a portrait phone and 19% on a phone in landscape. The fit is recalculated whenever the viewport resizes.
- **Leaving without choosing:** the "Return to map" button and Esc restore the saved zoom and position exactly; this was checked at scroll position 180,260.
- **Choosing a pin:** returns to Explore Mode at 100%, centred between the landmark and its sign, and focuses that sign. Opening a lesson still needs a tap on the sign, so no lesson starts from a tiny target.
- **Pins:** pins sit inside the world, so they always line up with the art. A counter-scale keeps them at 38px (34px on phones). Signs are hidden in the overview, so keyboard focus moves through the pins in route order. On phones the pins show numbers only, and the hint chip names the next adventure.

## How the forest extension was made

The only compatible art in the project is the Phase 3 watercolour set. Of the decorative sprites, only `wc-banana-clean` and `wc-rocks-clean` fit; the other forest pieces are in the older cartoon style. No image generation was available in this session, so:

1. **Feathered edge.** Only the painted terrain is masked by `wc-world-edge.svg`, which turns the rectangle into an irregular, soft watercolour edge. Landmarks, the route, characters, signs and the summit star sit above the mask and never fade.
2. **Painted surround,** attached to the world so it lines up in both modes:
   - forest ground in colours sampled from the map's edges, bright beside the map and deepening outwards
   - sky continuing upwards
   - soft distant hills echoing the map's mountains
   - paper grain over everything
3. **Edge foliage.** Ten placements of the two existing sprites, flipped and resized, straddle the dissolved edge and continue below it on tall screens.

Nothing mirrors, repeats or stretches the map.

## Results

Checked against the dev server, inside the real header and frame:
- `npm run typecheck` passed.
- `npm run test:regression` passed 28 of 28.
- `npm run audit:assets` and `npm run audit:questions` passed.
- `npm run build` passed. Its only warning is the large-chunk notice.

| Check | Result |
|---|---|
| Minus stops and disables at 50% | ✔ desktop and tablet |
| Real two-finger touch pinch stops at 50% | ✔ 390×844 |
| All 9 pins on screen and clear of the interface | ✔ 1440×900, 768×1024, 1024×768, 390×844, 844×390, EN and MS |
| Summit and camp fully visible | ✔ |
| Choosing a pin returns to Explore focused on that station | ✔ river (desktop), market (phone) |
| Previous view restored on Return or Esc | ✔ |
| Refit after a resize | ✔ 1440→768 |
| Tab order and focus ring in overview | ✔ |
| No sideways page overflow | ✔ every size |

The screenshots are in `implementation/`. `00-comparison-before-after.png` shows the old hard rectangle next to the new edge.

## Remaining limitations

- **The surround is a plain wash, not painted forest.** Hard edges and the mirrored strips are gone, but the area around the map has less detail than the map itself. On large screens it reads as a soft vignette rather than more forest. Commissioned pieces A–D from PROPOSAL.md would close the gap: a sky and ridge band, a forest-floor band, four corner canopies and four edge pieces.
- **Only two sprites build the edge foliage,** so repetition is visible if you look closely. The map itself already reuses the same two sprites about 20 times.
- **The watercolour reference never arrived,** so the colours were matched to the shipped art.
- **The live app behind the PIN screen was not opened.** Testing used the dev preview, which renders the same component, header and frame.
- **Not tested:** real touch devices, screen readers, and Safari's View Transition fallback (which switches instantly).
