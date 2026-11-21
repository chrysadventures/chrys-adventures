# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

## Response handoff and deployment safety

- Use the five-part final response format in [DEVELOPMENT_HANDOFF.md](DEVELOPMENT_HANDOFF.md#5-mandatory-final-response-format) after every development task.
- Never commit, push, merge or deploy without the user's explicit approval for that specific action. Pushing to `main` deploys the live app; pushing a feature branch does not.
- Stage named files only. Never use `git add -A` while unrelated or untracked files exist.

## Project guidance

Design, educational and interaction rules are kept in [AGENTS.md](AGENTS.md) and the documents it links to: `HUMAN_DESIGN_GUIDELINES.md`, `COUNTING_INTERACTION_RULES.md`, `DESIGN.md` and the review files. Follow them for every UI, lesson and asset change.

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
