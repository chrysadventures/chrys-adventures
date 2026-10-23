# Chrys's Adventures: section-by-section improvement review

Review date: 21 October 2026 (Malaysia time).

Update, 23 October 2026: see `BUGFIX_REVIEW.md` for the verified incremental fixes,
regression evidence and unresolved findings. The original findings below are kept
as historical audit context, not a claim that every defect remains unchanged.

Scope: source review of the entry flow, both adventure menus, every routed basic and advanced lesson, both test menus, shared quizzes/solutions, counting/audio, transfers, drawing, feedback, and responsive styling. This is not a completed visual test of every screen/device. Layout risks below are explicitly distinguished from defects established by code. No app behavior was changed by this review.

References use current `client/src/App.tsx` line numbers unless another file is named.

## Priority findings established by code

### 1. Incorrect comparison feedback — high priority

- Location: `AdvancedComparePractice`, around lines 5390–5398; question at line 4494.
- Trigger: answer the 5-car versus 12-car visual question incorrectly.
- The comparison sign is derived from the original operands (`5 < 12`), but the feedback prints `max(a,b)`, that sign, then `min(a,b)`. It therefore says **12 < 5**, in both English and Malay.
- Reproduced the expression independently during this review.
- Improvement: preserve operand order in the equation, or always use `>` when presenting larger-first. Check rendered feedback separately from stored answer data.

### 2. Muted counting skips the objects — high priority

- Locations: `AdvancedSeventeenPlaceValueDemo` (3683), `AdvancedPart2WorkedBeat` (6653), `AdvancedSubtractionWorkedBeat` (7186); shared `speakCountingSequence` (17760).
- The shared function returns immediately when muted. These callers respond to no progress by setting the count straight to the final value.
- A child using mute sees ten or seven objects become counted together rather than seeing each object counted. The same problem affects worked addition/subtraction operands.
- Improvement: provide one cancellation-aware counting sequence that drives the same callback with or without audio. Reduced motion should reduce movement, not remove the sequence of numbers.

### 3. Teen values highlight two active objects simultaneously — high priority

- Location: `TeenValueObjects` (7590), through `LabeledValueGroup` (9011) and `CountedObjectRow` (13292).
- Both the banana group and the second object group receive the same `visibleCount` and `active` state. Each group highlights its current object yellow.
- This conflicts with the required single active object and makes one spoken number refer to two simultaneously highlighted objects.
- Improvement: count the two groups separately, keeping the completed first group cyan while counting the second. Then reveal the equal totals.

### 4. Completion timing is inconsistent — high priority

- Locations: `ManualCountedObjectRow` (15364), `SequencingAnchorPhase` (5528), `AdvancedSubtractionWorkedBeat` (7186), `RealWorldOperationExample` (10058).
- The shared audio count resolves after the final audio ends; it does not include the required 500 ms result delay.
- The listed callers can immediately clear the active count, enable the next stage, announce a total, or reveal the final answer. In the real-world example, `setPhase("done")` immediately exposes the answer.
- Improvement: explicitly finish the last highlight, wait 500 ms, then reveal results. Keep this rule in one shared implementation so individual screens cannot omit it.

### 5. Solution counting cannot be replayed

- Location: `ManualCountedObjectRow` (15364); used by comparison/combine solutions and `SequentialCountResult` (17381).
- The button is hidden once `visibleCount >= count`, and the handler rejects a completed count. It also disappears as soon as the final number begins, before its audio has necessarily finished.
- Improvement: keep the button visible and disabled during the entire count, then show **Count again / Kira lagi**. Reset labels, result visibility and callbacks coherently on replay.

### 6. Navigation can allow an old async sequence to resume

- Locations: `ManualCountedObjectRow` (15364), `AdvancedPart2WorkedBeat` (6653), `AdvancedSubtractionWorkedBeat` (7186), `CarryInteraction` (3496).
- The manual counter checks its run ID after counting, but not after awaiting the opening prompt and before starting the count. Leaving during the prompt can therefore start old number audio after unmount.
- The advanced worked examples stop current audio on unmount but have no run-ID checks around their awaited continuations. For example, an old operand count can continue into total narration after leaving. Carry interaction also has an uncancelled 1900 ms continuation.
- Improvement: invalidate one run token on exit, reset, question change and language change; check it after every await and before starting subsequent audio or calling completion handlers.

### 7. Carry practice does not meet object-counting or transfer rules

- Locations: `CarryInteraction` (3496), `AdvancedTenFrame` (3327); active practice questions at 1699 and 1701.
- Filled ten-frame cells all have yellow borders and no per-object number badges. The activity repeatedly asks for individual increments rather than offering a separate full-group count.
- The carry animation moves the whole frame by a percentage transform; it does not measure the actual tens-column destination. Its narration claims the ten is moving to that column.
- Improvement: retain deliberate construction steps if useful, but add a full-group counting control with individual badges and one active yellow object. Move the completed ten to a measured destination slot and synchronize landing with animation completion.

### 8. The 17 place-value transfer uses straight paths and fixed timers

- Location: `AdvancedSeventeenPlaceValueDemo` (3683), inline animation definitions at 3823.
- Basket and seven-object flights interpolate directly from source to target rather than following the required curved path. Landing is coordinated with 1250/1150 ms waits and an additional 80 ms delay.
- Improvement: reuse the curved, measured-slot approach already present in `AdvancedAdditionRowScenario`. Use animation completion and a rendered landing frame for handoff, rather than assuming a timer means the destination has painted.

### 9. Real-world counting has inconsistent object states

- Location: `RealWorldOperationExample` (10058–10228).
- The starting group remains fully visible before each object is counted. Previously counted result objects use violet outlines rather than the required blue/cyan.
- It renders shell/cookie emoji directly even though matching sprite assets exist, so those objects can look different from the same objects elsewhere and across platforms.
- Improvement: use the shared sprite and count-state rendering. Keep future objects faded, earlier objects cyan, and only the current object yellow.

### 10. Drawing coordinates are not updated when the canvas changes size

- Locations: `TracePad` (16388), `WriteNumberPad` (16526).
- Bitmap dimensions and context scaling are initialized in effects tied to number/drawing props. There is no resize observer. Pointer coordinates are taken from the current rectangle.
- A resize or orientation change can stretch existing strokes and make new pointer positions disagree with the old canvas coordinate system. Write mode also changes its column width when showing the model.
- Improvement: preserve normalized strokes and rebuild the bitmap on size changes. Handle pointer cancellation/capture explicitly. Keep the self-check model; do not describe it as automatic handwriting recognition.

## Further improvements and risks

### Responsive layouts requiring browser confirmation

- **Advanced test menu:** at 13774, icon, title and status badge share one nonwrapping flex row. The icon and status cannot shrink, leaving very little room for the title on narrow phones, particularly with Malay completion text. Stack the status below the title on small widths.
- **Carry ten-frame:** five fixed 48 px cells plus four 8 px gaps, padding and borders require about 304 px before outer panel padding (`AdvancedTenFrame`, 3327). Narrow nested panels can be smaller. Use container-sized columns or an explicitly responsive ten-frame without shrinking badges into collisions.
- **PIN entry:** six widely spaced characters sit between two fixed icons inside several padded panels (2272). Check the full six-digit entry at 320/360 px and with the mobile keyboard open.
- **Number-value layouts:** `LayoutGroup` (15561) labels a six-object arrangement “Row” while constraining it to `max-w-48` with wrapping. Use an intentional arrangement that clearly differs from “Two groups” and “Spread out”, or name it accurately.
- **Object transfers:** current viewport-based bounds can become stale if the user scrolls or rotates during a flight. Exercise this explicitly; use a stable overlay/coordinate system and predictable resize cancellation.

### Progress, tests and navigation

- Autosave is debounced 700 ms (`App`, 1836). Exiting a game starts a save but immediately discards the active player; failure is swallowed (`leaveCurrentGame`, 1967). Add a visible retry/recovery path and preserve pending changes. Check out-of-order saves and immediate refresh after earning a star.
- Shared `Quiz` permits retry by deleting an answer (13921), then calculates the score from the latest answers (13881). That is appropriate for practice, but test mastery can reflect corrected attempts rather than independent first attempts. Choose and label the intended scoring policy; retain first-attempt results separately if mastery is meant to measure independent performance.
- Basic test cards record completion through the presence of a progress key (13801); advanced cards distinguish completed from mastered. Make these labels consistent, without treating completion and mastery as equivalent.
- Advanced test success always says “You earned a star” when passed (13750), while `finishAdvancedTest` only awards a star for first mastery (1924). On repeat passes, say “Mastery maintained” or otherwise avoid promising an additional star.
- Current routing uses local `screen` state. Lesson step, question position and drawings are not represented in resumable navigation. Consider resuming the current lesson/step and showing an explicit exit choice for unfinished tests.

### Visual consistency, access and performance

- Advanced comparison's incorrect-answer panel uses `bg-yellow-100` (5447), and save failure uses `bg-red-50/95` even on advanced screens (2026). These light panels conflict with the supplied advanced dark-surface rule. Use dark amber/red surfaces with readable light text.
- Keep English/Malay errors equally useful: PIN and game-file generic failures currently display raw caught messages. Translate expected failures and reserve technical detail for diagnostics.
- Full lesson narration is intentionally disabled (`WORD_AUDIO_ENABLED = false`, 170; `startLessonNarration`, 15064). This is an improvement opportunity for reading support, not a currently visible broken button. Inspect and reuse existing recordings before adding any new audio.
- Loading calls `preloadNumberAudioFiles` before the PIN gate is cleared (1855). It requests many audio files, including advanced and object-total recordings. Load the next lesson's recordings on demand and cache them.
- The earlier build produced an approximately 806 KB JS bundle and a 1.05 MB running-character PNG. Split lesson code and assess image compression. Preserve transparent character backgrounds.
- Shared `SpriteIcon` has no load-error fallback (666). Existing local references passed their audit, but that does not prove successful network delivery or image decoding. A fallback and runtime failed-request checks would improve robustness.
- Move lesson families and audio/counting orchestration out of the 18,000-line `App.tsx`. Multiple independent count implementations are already producing different mute, replay and completion behavior.

## Section coverage

| Section | Review outcome / next improvement |
| --- | --- |
| PIN entry | Validation and busy state present; review narrow input fit and localized failures. |
| Game files / save loading / creation | Loading states present; improve pending-save recovery and failed-exit handling. |
| Home / mode selection | Preserve current user-edited mascot styling; validate spacing at small widths. |
| Basic learning menu | Separate lesson completion, practice performance and test mastery consistently. |
| Recognize numbers | Review tracing/writing resize behavior; preserve drawings during model comparison. |
| Number values | Improve arrangement examples and use consistent replayable counting for comparisons/solutions. |
| Basic sequencing | Review dense number lines and shared solution counting; retain distinct up/down wording. |
| Grouping | Construction controls exist; distinguish building objects from a complete group count, and handle rapid repeated audio requests. |
| Basic addition | Slot-based story interactions exist; verify every transfer under scroll/resize and every result delay. |
| Basic subtraction | Existing curved flights and paint-aware landing are a useful reference; verify all three stories, especially the zero result. |
| Real-world applications | Fix final delay, object fading and sprite/state consistency in shell and cookie examples. |
| Advanced menu / mission completion | Check unlock labels, dark-theme error states and completion/reward wording. |
| Teen numbers | Fix simultaneous yellow highlights; verify all 10–20 quantities and both object groups. |
| Compare bigger | Fix the false inequality; retain independent group counts; darken incorrect-answer feedback. |
| Advanced sequencing | Add the missing completed-count delay in the anchor and starting-group phases. |
| Advanced addition part 1 | Curved measured-slot flights are present; prefer actual animation completion over fixed waits. |
| Advanced addition part 2 | Fix muted counting, stale async continuations, place-value flights and carry-practice ten-frame behavior. |
| Advanced subtraction | Fix muted counting, cancellation and completed-count timing; validate borrowing and whole-tens examples. |
| Basic tests: numbers, operations, real-world | Clarify retry scoring; improve reusable solutions and replay. |
| Advanced tests: teen, comparison, sequencing, addition, subtraction | Basic external-data checks passed; improve narrow completed-card layout and repeat-mastery messages. |
| Shared quiz / answer controls / worked methods | Preserve keyboard answer navigation; unify counting, retry semantics and cleanup on question changes. |
| Glossary / language / sound | Search and dialog labels present; stop/restart lesson audio coherently when language or mute changes. |
| Celebration / stars | Reduced-motion support exists; avoid a star-earned message when no additional star is awarded. |
| Sprites / backgrounds / audio / styling | Earlier reference audit passed; runtime delivery and responsive visual regression remain necessary. |

## Verification and limits

- Earlier in this chat: production build and TypeScript passed; the asset script found 234 valid references; the question script reported 232 checked records and 217 checked methods.
- Correction to the earlier broad interpretation: `audit-questions.mjs` parses direct `q(...)` calls in `App.tsx`. It does not automatically cover imported advanced test arrays, custom comparison-feedback templates, animations, or layout.
- This review additionally loaded the exported advanced question data: five test sets containing 64 questions plus eight subtraction-practice records. Correct answers were present in nonempty choices, and checked addition/subtraction arithmetic had no failures. This is a basic data check, not validation of every explanation or sequence.
- The incorrect 5-versus-12 feedback expression was reproduced as `12 < 5`.
- Vite has no `/api` proxy in `client/vite.config.ts`; this explains the previously observed HTML response to `/api/health`. That local configuration issue alone does not establish a failure of the separately configured cloud-save service.
- Browser visual coverage remains incomplete. Before calling the app visually verified, exercise every listed section at 320/360/390 px, tablet and desktop widths in English and Malay, with sound on/off and reduced motion. Include replay, mid-count exit, rapid clicks, scrolling during flight, orientation changes, wrong answers, zero results and repeat mastery.
- No source review or finite test run can establish that the app has absolutely zero bugs. The defects above should be addressed before claiming a clean counting/animation audit.
