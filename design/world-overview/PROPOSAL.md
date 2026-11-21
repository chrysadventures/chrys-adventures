# World Overview — design proposal (for approval, not implemented)

Branch: `feature/world-overview` (from `b1b45aa`, identical to `origin/main`). Nothing in `client/` has changed.

**Reference caveat.** The approved watercolor reference was not attached to the message and is not present locally. This proposal uses the shipped Phase 3 watercolor art (painted from that reference) and colours sampled from the rendered world's edges. Final palette and texture must be checked against the reference once it is attached.

## 1. Two modes, one camera

| | Explore Mode (existing) | World Overview (new) |
|---|---|---|
| Purpose | Walk the trail, read signs, open lessons | See all nine places at once and choose where to go |
| Scale | Manual: **50% – 150%** (25% step removed) | Automatic fit-to-world, recomputed on resize/rotation. About 51% on a 1440×900 desktop, 38% on a portrait tablet, 19% on a 390px phone |
| Panning | Two-axis drag, unchanged | None needed: everything is visible |
| Destinations | Existing wooden nameboards open lessons | Numbered pins (live UI) with name + status labels; labels hidden on phones |
| Pinch | Continuous, clamped at 50% | Pinch-out or **+** leaves the overview into Explore at 50% around that point |

**Entering:** a labelled **Whole map / Seluruh peta** button joins the zoom group. It becomes **Explore / Teroka** while active (`aria-pressed`). The camera eases in about 450 ms; reduced motion switches instantly.

**Leaving:** the Explore button, **+**, pinch-out, Esc, or choosing a pin.

**Choosing a pin (recommended):** the camera flies to that station at 100% in Explore Mode and focuses its nameboard. The child then taps the sign to start, so a tiny pin never launches a lesson by mistake.

**Phone portrait:** a "Next adventure" card under the map names the first unfinished lesson and gives a large **Go / Pergi** button. Pins use the existing wood-disc style: check = completed, gold ring = next, flag = Start. Status always appears as text in labels and accessible names, never colour alone. Every pin keeps a 44px hit area and follows curriculum order for Tab.

## 2. Seamless forest beyond the map

The current problem: a hard rectangle sits over a separately cropped `wc-backdrop.webp`, and mirrored terrain fills the clearance strips. The proposal has four layers, and none of them copies, repeats, mirrors or stretches the map:

1. **Painted surround.** A procedural watercolour wash in colours sampled from the world's own edges: sky `#a0bad8`, verge `#90a056`, grass `#a7b848`, floor `#7c8a4a`, deepening gently towards the screen edge. Soft pigment blots and a paper-grain filter add texture.
2. **Feathered map edge.** An irregular, noise-displaced soft mask dissolves the world's rectangle into the surround. The feather is about 40–90 world units. It stays clear of the summit star, camp sign and river stones.
3. **Foliage frame.** Watercolour cutouts at the screen corners and edges overlap both the dissolved map edge and the surround, so the eye reads one continuous banana forest. They are decorative, `aria-hidden` and ignore pointer input.
4. **Sky and floor extensions (portrait).** When the screen is taller than the world, painted sky and distant ridges continue above the map's own sky, and forest understorey continues below it.

The same surround also replaces the backdrop whenever Explore Mode at 50% leaves empty space (screens 10 vs 11).

## 3. Additional artwork required — please approve before implementation

The prototype uses **stand-ins**: two existing watercolour sprites (`wc-banana-clean`, `wc-rocks-clean`) placed a few times, plus CSS gradients for the sky ridge. Desktop and landscape already look coherent with them. **Portrait tablet and phone do not.** The bands above and below the map read as empty fog, and the repeated banana sprite would become visible repetition. Recommended new watercolour pieces, matched to the reference, all transparent PNG masters with WebP derivatives:

| # | Piece | Purpose | Suggested master |
|---|---|---|---|
| A | Sky and distant-ridge band | Continues the world's sky and misty mountains upward on portrait screens. Lower edge feathered, no landmarks. | 2400 × 1000 |
| B | Forest-floor understorey band | Ferns, banana understorey, hibiscus and roots below the world on portrait screens. Upper edge feathered. | 2400 × 900 |
| C | Canopy corner clusters ×4 (all different) | Overhanging leaves and trunks framing each corner | 1024–1536 each |
| D | Mid-edge foliage pieces ×4 (all different) | Left/right banana-leaf and vine edges, top/bottom ferns | ~1024 × 768 each |

These replace `wc-backdrop.webp` (1150×578, too small for large screens) in the map surround. Image generation is not available in this session. Pieces A–D need the same production route as Phase 3, then your visual approval.

**Interim option:** ship with the procedural surround and the existing two sprites, then swap in A–D later. This is acceptable on desktop and landscape, but weak on portrait.

## 4. Preserved

Lessons, routes, completion predicates, stars, saves, sounds, both languages, Chrys and Alyse, the existing nameboards, the stone numerals, and the single route are unchanged. Overview pins are the only new interactive elements, and they navigate the camera only.

## 5. Decisions needed

1. Pin tap: **fly to station (recommended)** or open the lesson directly?
2. Phone "Next adventure" card: Go flies to the station, or opens the lesson directly?
3. Artwork: commission A–D now, or ship the interim surround first?
4. Should the app open in Explore at the camp (today's behaviour) or in World Overview the first time each session?

## Prototype and evidence

- `prototype.html?lang=en|ms&mode=overview|explore&edge=new|current`: a standalone design prototype, not app code. The world plate is a fresh render of the current map (`assets/world-plain.jpg`) with its signs hidden.
- `screens/`: 1440 and 1920 desktop, 768 and 1024 tablet, 390 phone portrait and 844 phone landscape, in English and Malay. Every capture showed all 9 pins on screen and no horizontal overflow.
- `review.html`: current behaviour next to the proposal.
- Not covered: the real camera transition, touch and pinch feel, screen readers. These need the implementation.
