# Bug-fix review — 23 October 2026

This is an incremental, local-only change set. Nothing was pushed, deployed, or
changed in the hosted database. Educational activities, question data, both
languages, artwork and saved-game schema are retained.

## Verified and changed

| File | Confirmed defect and change | Verification |
| --- | --- | --- |
| `client/src/App.tsx`, AdvancedComparePractice | Visual feedback reordered operands but retained the original sign. Both languages now retain `a sign b`. | Regression evaluates the actual feedback template for all 0–20 operand pairs, both languages, visual and symbolic modes (1,764 combinations). Failed before the fix. |
| `client/src/App.tsx`, speakCountingSequence | Muting returned before onCount, allowing callers to jump to the total. The same callback now advances every muted/missing-audio beat; final completion waits 500ms. Mid-count mute silences the clip without invalidating the count. | Real function extracted with TypeScript AST and run with deterministic audio/time doubles; English/Malay, sound on/off, cancellation, replay and mid-count mute. Failed before the fix. |
| `client/src/App.tsx`, ManualCountedObjectRow | Completed button disappeared; delayed prompt could start a count after exit. Uses shared muted sequence, checks lifecycle after prompt, retains bilingual replay button, resets progress, and defers final parent progress until completion. | Typecheck and source review; shared sequence tests. Full rendered replay integration still needs browser QA. |
| `client/src/App.tsx`, CarryInteraction / advanced worked addition and subtraction | Awaited continuations could set state or start narration after leaving/resetting/changing language. Epoch checks now follow every awaited statement in those handlers; cleanup/reset invalidates the epoch. Language changes release busy states. | AST coverage plus executable cancellation tests for carry flight and addition operand narration. These tests do not simulate all React lifecycle ordering. |
| `client/src/App.tsx`, App | Exit discarded state before save acknowledgment; older autosave results could mark newer progress saved. Exit now awaits success, keeps the game on failure, offers bilingual retry, and ignores obsolete UI acknowledgments. Screen/language/save changes stop current audio. | Typecheck and review; persistence tests below. Real browser exit/offline integration still required. |
| `client/src/lib/pendingProgress.ts` | Debounce and tab closure could lose committed UI progress; overlapping requests could arrive out of order. Synchronous local journal, per-save serialized writes, and matching-only acknowledgment added. | Tests verify durable recovery snapshot, failed write/retry, old acknowledgment retaining new progress, and overlapping writes. |
| `client/src/lib/gameSaves.ts` | Load could discard pending work; network failure could be reported as cloud-save success. Load overlays pending progress after successful authorization or existing offline-cache recovery. Failed cloud writes retain journal and report failure. Removed hard-coded valid PIN allowlist. | Persistence tests, no-PIN-list regression, typecheck. No live save records used in tests. |
| `client/package.json`, `client/scripts/regression.test.mjs` | No targeted regression suite existed. Added Node's built-in test runner using installed TypeScript, no dependency/service added. | `npm run test:regression`. |
| `.github/workflows/deploy.yml` | Build was deployed without typecheck/audits. Added typecheck, asset/question audits and regression tests before build/upload. | Workflow source review; commands run locally. Hosted Actions not triggered. |

## PIN security review

The Edge Function checks a six-digit PIN hash against `access_pins` for every
operation. Save reads/writes are scoped by the resulting PIN id. The initial
migration enables RLS and revokes anon/authenticated direct table access; the
service-role key is read server-side, not shipped in the client.

Confirmed remaining risks:

- No server-side attempt limit in `supabase/functions/game-saves/index.ts`.
  CORS does not prevent direct requests. A browser-only limit would not fix this.
- Existing migrations/history expose unsalted PIN hashes, and a testing PIN is
  still used by advanced-menu testing mode. Six-digit hashes have a small search
  space. Removing the current client allowlist cannot undo historical disclosure.
- Cached local saves retain the existing PIN-keyed storage format for compatibility.
  Local recovery is not server authentication. It is available only when a cache
  already exists and the request fails at the network layer, not on HTTP 401.
- First-time offline use of a formerly hard-coded PIN is no longer accepted.
  Existing cached games are retained; obtain a cloud-backed save before offline use.

The Supabase skill guided this review. Its documented rate-limit example uses an
additional Redis service, which was not added under the no-new-services constraint:
https://supabase.com/docs/guides/functions/examples/rate-limiting
A follow-up should implement an atomic, bounded attempt counter in the existing
database with a trusted request identifier and tested permissions. PIN rotation
and test-PIN retirement need an owner-approved access migration to avoid locking
out children. Neither live access nor schema was changed here.

## Remaining counting and save risks

- This is not full counting unification: legacy screen-local silent loops and
  `speakNumberValuesSequence` still exist. Some callers add their own delay after
  the shared sequence; these can now wait longer than 500ms. Extra delays were
  removed in the reviewed 17-place-value and advanced addition worked examples.
- The earlier teen dual-active-object, carry object-label/transfer, curved-flight,
  real-world object-state and canvas-resize findings are not claimed fixed.
- Cancellation is improved in the named components, not proven across every
  asynchronous handler in the 18k-line component file. Complete a screen-by-screen
  exit/reset/language-change audit before declaring global cancellation complete.
- Journal recovery depends on available browser storage. If storage is full or
  disabled, cloud saving is still attempted, but closing the tab during a failed
  request cannot guarantee recovery. No unload-time network request is trusted.
- Serialization is per browser runtime, not cross-tab/device. Server-side revisions
  and conflict handling are still needed for simultaneous devices. A pending local
  snapshot currently takes precedence when reopening that save.
- An HTTP request without a transport timeout can keep the queue waiting. Adding
  retries/timeouts safely requires server revision/idempotency handling so an
  aborted request cannot later overwrite a newer write.
- Tests mock audio/time/storage. Actual audio decoding, browser layout and animation
  handoff still require English/Malay, muted/unmuted, reduced-motion device testing.

## Verification

Run from `client` with `NODE_OPTIONS=--use-system-ca`:

1. `npm run typecheck`
2. `npm run test:regression`
3. `npm run audit:questions` — 232 questions / 217 methods
4. `npm run audit:assets` — 234 referenced assets
5. `npm run build`

All passed in this change set. The existing large JavaScript chunk warning remains.
The six initial comparison/counting tests were run before changes and failed;
subsequent passing tests provide the red/green evidence for that first increment.
