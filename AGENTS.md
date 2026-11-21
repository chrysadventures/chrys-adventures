# AGENTS.md

This file provides guidance to Codex when working with code in this repository.

**Before any task, read and follow [DEVELOPMENT_HANDOFF.md](DEVELOPMENT_HANDOFF.md).** It is the single source for project links, the Git workflow, deployment, and the required final response format. If anything in this file conflicts with it, DEVELOPMENT_HANDOFF.md wins.

## Project Overview

**Chrys's Adventures** — a dyscalculia learning web app for children. Features a monkey character named Chrys in a banana-themed world. Modes: a Learning Adventure (an illustrated nine-place map of lessons), Test Mode, and an Advanced Adventure with its own missions and tests. All text is in English and Bahasa Melayu.

## Commands

All Git, link, deployment and handoff rules live in [DEVELOPMENT_HANDOFF.md](DEVELOPMENT_HANDOFF.md). Read it before starting any task and follow its final response format.

Run from `client/`:
```powershell
# Always set this env var first. It is required on this machine because of its SSL certificate setup.
$env:NODE_OPTIONS="--use-system-ca"

npm run dev               # Vite dev server -> http://localhost:5173 (?design-preview opens the dev-only review gallery)
npm run typecheck         # tsc --noEmit
npm run test:regression   # node --test scripts/regression.test.mjs
npm run audit:assets      # every referenced image and audio file exists with exact casing
npm run audit:questions   # answers, visuals and solution methods
npm run build             # production build -> client/dist (git-ignored)
npm run preview           # serve the production build locally
```

There is no `lint` script. The deployment workflow runs typecheck, both audits, the regression tests and the build.

## Response handoff

Every final response must use the five-part format in [DEVELOPMENT_HANDOFF.md](DEVELOPMENT_HANDOFF.md#5-mandatory-final-response-format): work completed, validation, Git status, project links, and PowerShell handoff commands that match the real branch state. Never commit, push, merge or deploy without the user's explicit approval. The old fixed `git add -A` / `git push` block and the `jaredtehyh-cell` links are withdrawn.

## Permanent visual standard

Read and follow [HUMAN_DESIGN_GUIDELINES.md](HUMAN_DESIGN_GUIDELINES.md) for every UI, animation, character, and visual-asset change. Preserve educational and functional requirements; review actual bilingual desktop/mobile screenshots. The current sunset navigation direction supersedes older cyber-menu notes below.

## Architecture

The following was verified against the repository on 21 November 2026.

### Repository structure
```
Dyscalculia App/
├── client/                      # The deployed app: React 19 + TypeScript 5.9 + Vite 7 + Tailwind CSS v4
├── supabase/                    # Edge Function `game-saves` and SQL migrations (cloud save storage)
├── server/                      # Minimal Express 5 stub: only GET /api/health; not used by the deployed app
├── attached_assets/             # Character art imported through the `@assets` alias
└── .github/workflows/deploy.yml # Builds and deploys client/ to GitHub Pages on every push to main
```
`ART_ASSET_LIBRARY/` is a local, Git-excluded art archive (source PNGs and prompts). It is never deployed.

### Frontend (`client/src/`)
- `main.tsx` renders `App.tsx`. `App.tsx` is a single large file holding the screens, lessons and tests. Screens switch through a `screen` state (`useState<Screen>`), not a router. (`wouter` is installed, but only the unused `PageWrapper.tsx` imports it.)
- `components/` holds feature components such as `IllustratedLearningMap` (the Learning Adventure map), `AdventureMap` (the Advanced menu), `StorybookNavigation` and `AdventureUI`. `components/ui/` holds shared primitives.
- `lib/` holds the logic:
  - `gameSaves.ts`: saves through the Supabase `game-saves` Edge Function, with a local offline fallback
  - learning map data: `learningMapLayout.ts`, `learningMapArt.ts`
  - the map camera: `useMapCamera.ts`, `mapCameraConfig.ts`
- `questions/` holds question banks.
- `design-preview.tsx` is a dev-only review gallery (`?design-preview&screen=...&lang=...`).
- In `vite.config.ts`, `base: "./"` gives relative asset paths for GitHub Pages. The aliases are `@` → `client/src` and `@assets` → `attached_assets/`.

### Tailwind CSS v4 (important: different from v3)
- There is **no `tailwind.config.js`**. Configuration lives in `client/src/index.css` inside an `@theme inline {}` block.
- It is integrated through the `@tailwindcss/vite` plugin, not PostCSS.
- Fonts come from a Google Fonts import at the top of `index.css`: Fredoka for body text and numbers, and Baloo 2 for display text.
- Feature styles live in separate CSS files, such as `learning-map.css`, `adventure-map.css` and `storybook-navigation.css`.

### Images
- Chrys and Alyse art is imported from `attached_assets/` through `@assets`, for example `import chrys from "@assets/chrys_sitting_new_user_nobg.png"`. Files ending in `_nobg` have transparent backgrounds.
- Learning map watercolor art is in `client/public/assets/learning-map/`, with sprite sizes in `lib/learningMapArt.ts`.
- Run `npm run audit:assets` after adding or renaming any asset.

### Backend
- Cloud saves are handled by `supabase/functions/game-saves`, which `client/src/lib/gameSaves.ts` calls directly.
- `server/` is a placeholder Express app. It is not needed to run or deploy the app, and Vite has no `/api` proxy.

### Existing recorded math-cue audio
- English: `client/public/audio/en-plus-clear.mp3`, `en-equals-to-clear.mp3` and `en-minus-clear.mp3`.
- Malay: `client/public/audio/Tambah.mp3`, `Sama dengan.mp3` and `ms-minus.mp3`.
- Reuse these recordings through `MATH_CUE_AUDIO_FILES` and `speakMathCue` in `App.tsx`. Always look in `client/public/audio/` before using text-to-speech or creating audio, because the recording you need may already exist.

### Child-friendly instructional copy
- Keep directions short and use one idea per sentence.
- Do not repeat instructions already shown in the lesson card, button labels, or animation.
- Prefer direct wording such as “Count both groups” or “Add the ones.” Avoid long multi-clause directions unless every detail is needed to solve the task.
- Keep English and Malay instructions equally concise without changing the mathematical meaning.

### Object counting and transfer animation rules
- **Mandatory reference:** Read and follow `COUNTING_INTERACTION_RULES.md` whenever creating, changing, or reviewing any object-counting interaction.
- In every mode and lesson, only the object currently being counted uses a yellow border, yellow ring, and yellow number badge. Previously counted objects stay blue/cyan and uncounted objects stay faded. Never use blue for the active counting highlight, and never highlight the entire tray, basket, box, or group.
- Every count must be started by a visible button, every counted object must have a number label, and number audio must advance from the same `speakCountingSequence` `onCount` callback as the visual highlight.
- When an object moves between containers, hide its source copy as the movement begins, animate it along a smooth curved path, and target the exact object slot where it will land. Do not fly objects to the centre of a tray, basket, or box.
- Keep the flying copy visible over its destination until the landed object has rendered, then remove it so the handoff looks continuous. Object positions must not collide or overlap during the movement.

### Advanced Adventure visual rule
- Advanced Adventure uses the dark cyber palette. Do not introduce `bg-white`, white image cards, or other white/light panel backgrounds in advanced menus, lessons, practice, feedback, or completion screens.
- Chrys and Alyse assets ending in `_nobg` have transparent backgrounds. Keep them transparent and place them directly on dark slate/cyan/emerald cyber surfaces; never add a white plate behind them.
- When reusing a shared component in Advanced Adventure, provide a cyber variant so its background, borders, text, and interaction states remain consistent with the dark theme.
