# Chrys's Adventures — Human-Centred Art & Interface Guidelines

## Status and scope

**Standing design standard.** Apply this document to all future menus, lessons, game interfaces, characters, animations, effects and visual assets in Chrys's Adventures. It complements `DESIGN.md`, `COUNTING_INTERACTION_RULES.md`, accessibility requirements and the existing application behaviour; it does **not** override educational, interaction, security or functional requirements.

**Design intent:** A lovingly illustrated, professionally art-directed children's adventure game—not a generic AI-generated dashboard, template, or collection of decorated cards. The game is intended for children learning mathematics, including children with dyscalculia. Delight must support orientation, agency and confidence, not distract from learning.

## 1. Preserve the established world

- Keep the existing Chrys's Adventures visual language: painterly meadow/jungle and sunset scenery, friendly typography, warm storybook atmosphere and recognizable characters.
- Reuse existing artwork and assets when they suit the purpose. Inspect the repository's image and animation library before adding replacements.
- **Chrys is a monkey and Alyse is a snake.** Preserve their established designs and proportions. Do not silently replace their character designs.
- Learning Adventure should feel bright, curious and inviting. Advanced Adventure should feel more adventurous and dramatic while still belonging to the same illustrated world.
- Treat current in-app visuals and current source code as the ground truth if older notes describe a superseded visual direction. Document intentional deviations.
- Review any user-supplied references for composition, level of craft and interaction ideas; do not copy protected artwork or import reference images without permission.

## 2. Recognizable signs of generic AI-style UI to avoid

Avoid by default:
- Identical rounded rectangles repeated as the entire layout, or overly symmetrical template grids.
- Excessive glassmorphism, blurs, translucent panels, neon edging, glow-on-everything, purple/blue gradients or arbitrarily floating objects.
- Generic emoji replacing intentional illustration, inconsistent icon families or stock-style art that clashes with the existing world.
- Too many pills, badges, headings and micro-labels competing for attention.
- Random decoration whose scale, light direction, perspective or visual purpose does not fit the scene.
- Repetitive automated motion: everything bobbing, pulsing, spinning or animating together.
- Visual novelty that hides a lesson title, completion state, navigation action, or the underlying mathematical content.

These are failure patterns, **not** bans on rounded corners, gradients, cards, glow, symmetry or animation. Use them deliberately where they improve the scene.

## 3. Human art direction and composition

- Design each screen around **one clear focal point** and an intentional visual hierarchy.
- Make the game world and interface feel integrated: illustrated paths, signs, flags or landmarks may communicate destinations better than generic tiles—but only when labels and actions remain obvious.
- Balance large, medium and small shapes; allow restrained asymmetry, natural spacing and organic contours where appropriate.
- Maintain consistent light, depth, texture, line quality, character proportions and palette across each scene.
- Use negative space to protect readability. Decorative objects should frame, not compete with, text and controls.
- Give each learning destination its own meaningful identity, connected to the mathematics, while keeping a shared navigation grammar.
- Prefer purposeful environmental storytelling over adding more UI chrome.
- Avoid copying a different game's art style wholesale. This project needs its own recognizable identity.

## 4. Characters and emotional connection

- Chrys should feel like an encouraging companion, not a constantly moving advertisement for the next action.
- Use existing character poses or compatible art for occasional greetings, discoveries and celebrations.
- Character motion should have clear motivation, anticipation and gentle follow-through. Keep idle movement low intensity.
- Never obscure mathematical demonstrations or necessary instructional text with a character animation.
- Do not invent or distort character assets merely to populate empty space.

## 5. Motion, magic and interaction

- Menus may feel alive; **lessons and counting demonstrations must remain calm and instructional**.
- Use staggered and organic motion instead of synchronized loops. Make transitions responsive, brief and interruptible.
- Decorative magic can be playful and occasionally surprising, but must not affect stars, mastery, unlock rules, saves or answers.
- Randomness should be curated: vary among a small set of polished effects, not unbounded particle storms. Avoid obvious same-effect repeats where practical.
- Keep effects clear of primary buttons and text, ensure they finish and clean up, and limit overlapping activations.
- Respect `prefers-reduced-motion`: remove or replace decorative motion with a static/low-motion response. Never rely on animation alone to signal completion or correctness.
- Preserve the audio-synchronized, user-started object counting rules in `COUNTING_INTERACTION_RULES.md`. Decorative motion must never alter counting timings or states.

## 6. Usability and accessibility for children

- Maintain readable English and Malay text, strong contrast, keyboard focus visibility and accessible names.
- Use sufficiently large touch targets (target at least 44 × 44 CSS px) and test narrow mobile layouts.
- Show completion, availability and locked status in **text and shapes**, not color alone.
- Don't add unnecessary decisions, controls or sensory load to increase a screen's apparent complexity.
- Keep navigation predictable. A child should be able to identify the next action immediately.
- Evaluate readability and cognitive load with the actual illustrated background visible, not only in isolated design mocks.
- Test responsive layouts, long translations, touch input, reduced motion and keyboard-only navigation.

## 7. Asset creation and sourcing

1. **Inventory existing assets first.** Prefer reusing or carefully composing consistent established artwork.
2. If new artwork is necessary, define its purpose, target dimensions, palette, perspective, linework, texture and relation to existing assets.
3. Avoid mixing incompatible visual styles. Do not use unlicensed stock/reference material as production art.
4. Favor lightweight production assets and performant effects; do not add large assets when CSS/SVG or existing art can provide the result.
5. Do not misrepresent rough placeholders as finished art. Flag missing assets honestly rather than substituting unrelated emojis or synthetic-looking images.
6. Make effects and decorations noninteractive unless a real action is intended, and hide purely decorative elements from assistive technologies.

## 8. Mandatory design review before completion

Inspect actual screenshots at **desktop, tablet and 320–390px mobile** sizes in **English and Bahasa Melayu**. Ask:

1. Would this feel like one coherent, human-art-directed illustrated children's game?
2. Does it preserve Chrys's Adventures' identity and the quality of its existing scenery?
3. Is the next action clear within a few seconds?
4. Are composition and hierarchy varied without creating confusion?
5. Are illustrations and decorations relevant to each lesson or mission?
6. Is any card, gradient, glow, badge or animation generic, repeated without purpose or visually noisy?
7. Do text, mission status and focus states remain legible with the full background visible?
8. Does the experience remain usable on mobile, with reduced motion and by keyboard?
9. Have current educational content, counting/audio rules, saved progress and navigation remained unchanged unless explicitly requested?

Refine problems found in the rendered UI. Passing a build alone does not constitute design acceptance.

## 9. Definition of done

A change satisfies this standard only when it:
- Looks intentional, cohesive, charming and recognizably part of Chrys's Adventures.
- Clearly improves children's navigation, comprehension or sense of discovery.
- Uses animation and visual effects sparingly and meaningfully.
- Preserves educational logic, accessibility and existing functioning behaviours.
- Has been reviewed visually in actual layouts, not just evaluated from source code.

**Guiding principle:** *Handcrafted wonder, clear learning.* Make the world more memorable through art direction and meaningful interactions—not through piling on effects.
