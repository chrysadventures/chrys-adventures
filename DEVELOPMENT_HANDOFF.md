# Development handoff — Chrys's Adventures

This is the single authoritative source for project links, Git workflow, deployment and the required end-of-task handoff. It applies to every coding agent (Claude Code, Codex and others) and overrides any conflicting link or Git instruction elsewhere in the repository.

## 1. Project links

| | |
|---|---|
| Project | Chrys's Adventures |
| Local directory | `C:\Users\wanha\OneDrive\Dyscalculia App` |
| GitHub repository | https://github.com/chrysadventures/chrys-adventures |
| Live application | https://chrysadventures.github.io/chrys-adventures/ |
| GitHub Actions | https://github.com/chrysadventures/chrys-adventures/actions |
| Deployment branch | `main` |
| Git remote | `origin` → `https://github.com/chrysadventures/chrys-adventures.git` |

Links containing `jaredtehyh-cell` are outdated. Do not use them.

## 2. How deployment works

`.github/workflows/deploy.yml` runs **only on a push to `main`**. It installs `client/` dependencies, then runs `typecheck`, `audit:assets`, `audit:questions`, `test:regression` and `build`. If all of them pass, it publishes `client/dist` to GitHub Pages.

| Action | Publishes to the live app? |
|---|---|
| Editing files locally | No |
| `git commit` on any branch | No |
| `git push` of a feature branch | No |
| Opening a pull request | No |
| Merging into `main` (through a PR or a push to `main`) | **Yes**, once the Actions run succeeds |

A change is live only after the `main` workflow run has succeeded **and** the live URL shows it.

## 3. Rules for agents

1. **Never commit, push, merge or deploy without the user's explicit approval for that specific action.** Approval for one step does not cover the next.
2. Work on a feature branch, never directly on `main`.
3. Never stage with `git add -A` or `git add .` while unrelated or untracked files exist. Stage named paths only.
4. Do not assume local `main` is current. Run `git fetch origin` and compare with `origin/main` before branching, merging or describing what is live.
5. Preserve other people's uncommitted work and untracked files. Do not delete, stash or reset them without asking.
6. Any older instruction to push automatically, or to use a fixed commit message, is withdrawn.

## 4. Approved deployment procedure

Follow this only after the user has approved deployment:

1. Confirm the feature is ready: validation has passed and the user has completed visual review.
2. Confirm the intended branch: `git branch --show-current`.
3. Check for unrelated changes: `git status --short`.
4. Stage the intended files by path, commit, and push the **feature branch**.
5. Open a pull request into `main`. After approval, merge it on GitHub (the established workflow). This is the step that deploys.
6. Watch the run at https://github.com/chrysadventures/chrys-adventures/actions until it succeeds.
7. Open https://chrysadventures.github.io/chrys-adventures/ (hard refresh) and verify the change live.

## 5. Mandatory final response format

After **every** development task, the final response must contain these five sections.

### A. Work completed
A concise summary of what changed and why.

### B. Validation
List the results of `npm run typecheck`, `npm run test:regression`, `npm run audit:assets`, `npm run audit:questions`, `npm run build`, and the visual review: sizes, languages and screenshots. Name anything that was **not** tested.

### C. Git status
Check with `git status --short --branch`, `git log -1 --oneline` and `git fetch origin`, then state each item separately:

- Current branch
- Current commit (short hash and subject)
- Uncommitted changes: list them, separating this task's files from unrelated ones
- Committed: yes / no
- Pushed: yes / no, and to which remote branch
- Deployed live: yes / no. Say yes only if the change reached `origin/main` and the Actions run succeeded.

### D. Project links
Always include:

- Live App: https://chrysadventures.github.io/chrys-adventures/
- GitHub Repository: https://github.com/chrysadventures/chrys-adventures
- GitHub Actions: https://github.com/chrysadventures/chrys-adventures/actions

### E. PowerShell handoff commands
Give one copyable PowerShell block for the **next** Git action, matching the real branch and working-tree state, and say which commands publish to the live app. Pick the template that matches the current state.

**State 1: uncommitted changes on a feature branch.** Nothing here publishes.

```powershell
cd "C:\Users\wanha\OneDrive\Dyscalculia App"
git status --short --branch
git diff --stat
# Stage only this task's files (list them explicitly):
git add -- "path/one" "path/two"
git diff --cached --stat
git commit -m "Describe the change"
# Pushing a feature branch does NOT update the live app:
git push -u origin <feature-branch>
```

**State 2: committed and pushed, not yet in `main`.** Open a pull request; merging it is what deploys.

```powershell
cd "C:\Users\wanha\OneDrive\Dyscalculia App"
git fetch origin
git log --oneline origin/main..origin/<feature-branch>
# Open the pull request in the browser:
Start-Process "https://github.com/chrysadventures/chrys-adventures/compare/main...<feature-branch>?expand=1"
# After approval, click "Merge" on GitHub. THIS publishes to the live app.
Start-Process "https://github.com/chrysadventures/chrys-adventures/actions"
```

**State 3: merged into `main`.** Verify the deployment and bring local `main` up to date.

```powershell
cd "C:\Users\wanha\OneDrive\Dyscalculia App"
git fetch origin
git switch main
git pull --ff-only origin main
Start-Process "https://github.com/chrysadventures/chrys-adventures/actions"
Start-Process "https://chrysadventures.github.io/chrys-adventures/"
```

`<feature-branch>` must be replaced with the real branch name in the response. Never leave placeholders.

## 6. Local development commands

Run from `client/`:

```powershell
cd "C:\Users\wanha\OneDrive\Dyscalculia App\client"
$env:NODE_OPTIONS="--use-system-ca"   # required on this machine (SSL certificates)
npm run dev               # Vite dev server -> http://localhost:5173
npm run typecheck
npm run test:regression
npm run audit:assets
npm run audit:questions
npm run build             # -> client/dist (git-ignored)
```

These are the same checks the deployment workflow runs.

## 7. Work in progress

| Feature | Branch | State | Report |
|---|---|---|---|
| World Overview and forest extension | `feature/world-overview` (from `b1b45aa`) | Implemented locally; **not committed, not pushed, not deployed**. Awaiting visual review. | `design/world-overview/IMPLEMENTATION.md`, screenshots in `design/world-overview/implementation/` |

Update this table whenever a feature's state changes.
