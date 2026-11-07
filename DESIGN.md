# Chrys's Adventures — storybook adventure trail

## Scope and principles

Keep the illustrated world and existing Chrys artwork. Give menus a little life,
while keeping instructional objects still until the learner starts an interaction.
Clarity beats decoration: one primary action, predictable controls, visible text
labels, no time pressure, and no reward dependent on animation alone.

## Phase 1 — top 15 UI issues

Code review of shared screens, followed by local browser review of the four pilot screens:

1. Multiple nested heavy borders compete for attention.
2. Large gradient containers repeat without communicating hierarchy.
3. Mobile menu headers push actual activities below the first screen.
4. Saved games look like generic panels rather than personal adventures.
5. Star rewards are buried in metadata.
6. An ellipsis alone does not explain save-loading status.
7. Eight journey markers require horizontal scrolling on small screens.
8. The journey has no concise overall completion summary.
9. Mission states need text as well as color differentiation.
10. Progress changes are abrupt and lack accessible meter semantics.
11. Lesson explanation cards lack a consistent instructional surface.
12. Primary and secondary actions compete visually in some lessons.
13. Answer/feedback microinteractions are inconsistent.
14. Repeated attention pulses can distract from the current task.
15. Hover, keyboard focus, and reduced-motion behavior need shared rules.

## Phase 2 — direction

Warm paper cards sit on a gentle jungle world. Leaf-green progress and cream
instruction cards provide continuity. Existing mission colors identify subjects;
they are not correctness signals. Stars appear as small labeled reward badges.
Use checkmarks and “Completed — play again” for finished missions. Existing
activities remain open: do not invent locks or change unlocking rules for decoration.

Menus can have two drifting clouds and two low-contrast sparkles. Lesson and quiz
screens do not inherit that ambient movement. No confetti storm, blinking panels,
or automatic counting. Completion feedback should appear once, gently.

## Phase 3 — tokens and components

### Color

| Token | Value | Purpose |
| --- | --- | --- |
| adventure-ink | #214d40 | Text on light surfaces |
| adventure-paper | #fffdf4 | Cards and instructional surfaces |
| adventure-leaf | #27845a | Progress and supporting icons |
| adventure-edge | #c6dfcb | Quiet panel boundaries |
| reward | #fff4c4 / #714909 | Reward badge background/text |
| focus | #0369a1 | Keyboard focus outline |

Advanced Adventure stays dark: slate/cyan surfaces, cyan text, emerald progress.
Never put transparent character artwork on a white plate. Active counting yellow,
previously counted cyan, and faded waiting objects remain governed by
COUNTING_INTERACTION_RULES.md, not by these decorative tokens.

### Typography and spacing

Retain the installed display/body fonts and number-specific rendering. Use display
type for short headings only; keep directions brief. Mobile headings 24–32px,
body instructions 16–20px, metadata 14px. Preserve zoom and wrapping; no fixed
text heights. Use a 4px spacing base: 8px icon gaps, 12–16px control gaps,
16–24px panel padding, 24–32px section gaps. Interactive targets at least 44px.
Keep number labels and counting rings clear of neighbors and container edges.

### Components

- `AmbientWorld`: decorative, aria-hidden, pointer-events none; navigation only.
- `AdventureProgress`: labeled fraction plus semantic progressbar; smooth fill.
  Keep score separate: answered questions and correct answers are different metrics.
- Saved card: paper surface, green top edge, labeled stars, explicit opening state.
- Mission card: existing subject icon/color, numbered order, completed text/checkmark,
  gentle lift, visible focus. Four trail columns on phones, eight on wider screens.
- Explanation: book icon, soft paper surface, green edge, unchanged teaching text.
- Practice: quieter paper surface, separate prompt/visual/answers, small feedback reveal.
- Secondary actions should be lighter than the primary Next/Continue action.

### Motion

| Interaction | Rule |
| --- | --- |
| Hover | 2–3px lift, 150–180ms; fine pointers only |
| Press | 2px down / 0.985 scale; no layout movement |
| Feedback | 6px reveal, 280ms, once |
| Progress | 500ms ease-out fill |
| Cloud drift | 30px over 28s, alternating; menus only |
| Sparkles | low-contrast opacity drift over 7s; menus only |
| Next hint | finite, two cycles in basic learning |
| Reduced motion | remove decorative animation and transitions |

Counting stays explicitly button-started and audio-synchronized through the existing
onCount callback. Never attach hover/bounce animation to individual counted objects
through a generic selector. This phase does not change counting or scoring logic.

## Phases 4–5 — implementation and review

Pilot screens: GameFileScreen, MenuScreen, AdditionIntroStep, and shared Quiz.
Shared CSS is in client/src/adventure-ui.css; semantic shared elements are in
client/src/components/AdventureUI.tsx. Existing dark styles remain separate.

Development preview: run the frontend and visit `/?design-preview`. The preview uses
real components with in-memory save fixtures, never cloud save operations. It is
guarded by Vite DEV and excluded from the production entry path. Use its tabs to
review saved/journey/lesson/practice and its language button for Malay wrapping.

Verification: TypeScript, production build, asset audit (234 references), and
question audit (232 questions) passed. Browser review covered all four pilot screens
at a narrow viewport, including Malay journey labels and a correct answer updating
the score and answered progress independently. Existing large JS bundle warning remains. This is not an
exhaustive claim that every lesson, audio sequence, or advanced screen is bug-free.

Follow-up QA: desktop/tablet layouts, OS reduced-motion mode, keyboard-only journey,
full quiz completion, and all counting/transfer interactions in both languages.
Existing functional findings in APP_REVIEW.md remain a separate workstream.
# Menu refinement — October 2026

The mode selector, Learning journey and Advanced mission menu reuse the existing fonts, Chrys illustrations and meadow/sunset backgrounds. Reference games inform only spacing and atmosphere; no reference artwork is shipped.

- Mode cards remain equal desktop columns, stacking on small screens. Keep one foreground Chrys above the greeting; scenic card backgrounds retain their original artwork. Use one progress sentence, a slim bar and a clear full-width action.
- Learning uses lighter cream surfaces, smaller icons and step markers, and three stage groupings. Completion keeps both a tick and a text label. Journey labels wrap instead of truncating.
- Advanced uses single warm plum mission rows with gold accents, one title/description, and explicit completed or locked text. Preserve mission routes and unlock rules. Trail dimming must match actual mission availability.
- Menu hover lift is at most 3px; mode scale is 1.005. Keep visible keyboard focus and suppress transforms under reduced motion. No ambient motion is applied to mathematical objects.
- Menu styles are scoped in `client/src/adventure-ui.css`; lesson and practice components are outside this refinement.
- The development-only design preview provides fixed sample progress for review without reading or writing live player saves.


## Final navigation refinement — 29 October 2026

Learning navigation now uses dedicated `meadow-lesson` buttons instead of the shared oversized MenuCard structure. Stage headings sit outside the card grids; the first two stages retain three columns and the last retains two. The eight original colored milestones are buttons connected by a subtle line. The first unfinished destination is identified as the next adventure, without locking any lesson or changing saved-completion predicates. On small screens the journey wraps into two connected groups of four.

Advanced missions each render one button with a numbered badge, one title/description, completion or unlock text, and a navigation arrow. Advanced Test Mode uses a separate row with a flag and dashed border. Locked rows remain disabled. Existing sunset artwork and Chrys placement remain intact.

Mode-card proportions and imagery remain unchanged. Keyboard focus now gives the card the same restrained lift and shadow as hover. Characters baked into the landscape are retained to avoid damaging existing artwork. No image files were changed.

Verification: typecheck, 17 regression tests, 232-question audit, 234-asset audit and production build passed. New tests exercise all eight milestone/card callbacks and completion states in both languages, plus single-button mission rendering. Browser checks covered 1280px desktop, 768px tablet and 390px mobile, Malay wrapping, no horizontal overflow, loaded images, keyboard focus and activation. Screenshots use isolated sample progress; no live player data was read or changed. The existing large-bundle build warning remains. No push or deployment was performed.


## Navigation calm-down — 31 October 2026

Builds on the 29 October structure; no artwork, routes, unlock rules, completion predicates or saved-progress handling changed.

- Mode selection: smaller Chrys and greeting on phones; card scenes use the wide meadow/sunset art so Chrys and the landscape stay visible instead of empty sky; removed the fixed card heights that left blank space.
- Learning: stage headings are compact labels sized to their text (no more edge-to-edge bands on phones); lesson cards drop their minimum height and tighten spacing; the decorative hero badges are hidden on phones so the journey appears sooner.
- Advanced: the six non-clickable number circles are replaced by a labelled six-segment progress bar whose segments use the same lock predicates as the rows. Each mission is one button with its number, title, description and a single state line (Completed — play again / Start mission / lock + unlock hint); the repeated "Adventure mission N" eyebrow is gone and the number is in the accessible name. The greeting now reads "Hi, Name! …" instead of "Name, Explore …". Advanced Test Mode sits in its own section below a dashed divider.
- Design preview accepts `?design-preview&screen=modes|menu|advancedMenu&lang=en|ms&nav=0` for reproducible screenshots (dev only).

Verification: typecheck; 18 regression tests (new one checks the six mission rows, summary/unlock agreement with and without testing mode, and the separate test row; mutation-checked); 232-question audit; 234-asset audit; production build (existing large-bundle warning). Screenshots at 1280/768/390px in English and Malay are in `screenshots/menu-refinement-2026-10-31/{before,after}` — no horizontal overflow and no broken images. Keyboard: Tab reaches every enabled milestone/card/mission, skips locked missions, shows a visible outline, and Enter opens the mission. Reduced motion (emulated) removes hover/focus transforms and transitions. Not covered: the real signed-in app shell (preview uses fixtures), physical touch devices and screen readers.

## Shared lesson motion (November 2026)
- Control transitions: 180 ms; content reveals: 280 ms; feedback: 360 ms.
- Use gentle 2 px hover lift and a small press response. Keyboard focus stays visible.
- Attention pulses run twice rather than indefinitely. Respect reduced-motion preferences.
- Keep teaching/audio timing independent of decorative CSS animation duration.
- During object counting only the current object changes to yellow; containers remain stable.
- Keep mobile lesson navigation predictable: secondary controls together, primary Next below.

## Expressive navigation pass
Navigation now uses deeper illustrated destination cards, tactile mission emblems, striped progress fills, a prominent next-adventure action, and a stamped completion entrance. Ambient clouds and motes belong only on navigation screens. Children can pause scenery or trigger a short optional sparkle interaction; these effects never change stars, completion, counting, or saves. Reduced-motion disables decorative movement. Preserve the current font, scenery, and character assets.
