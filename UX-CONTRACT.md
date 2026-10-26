# RUNEBLADE local interaction contract

## Current local edition — 2026-10-26

Authority: PRODUCT.md and the user's latest instructions. The user chose local-only play without ChatGPT login and separately authorized permanent deletion of the old hosted site. This section supersedes the historical online contract retained below.

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Gameplay | lib/game.ts | User brief and STAGES | ready / playing / paused / won / lost; wave / boss | scripts/game.test.mjs and browser |
| Mode selection | Game.tsx mode buttons | lib/words.ts and lib/sentences.ts | Thai / English / JavaScript / Python | browser |
| Dialog | components/game/Dialog.tsx | Native dialog focus/inert behavior | help / journal / bestiary / result | browser keyboard and Escape |
| Scrollbar | app/globals.css | DESIGN.md | global baseline | browser |
| Feedback | Game.tsx status and storage banner | Battle / storage outcome | hit / hurt / saved / error | browser |
| Save | lib/save.ts + hooks/use-local-save.ts | PRODUCT.md | checkpoint / history / export / import | unit and browser reload |
| File input | Journal.tsx native file input | JSON schema in lib/save.ts | preview and confirmed replacement | browser import |

Exact full words attack automatically. Typing errors reduce accuracy; missed enemies damage hearts. Each stage starts with 5 hearts. Species rotate through 15 distinct monsters. Every 5th stage except multiples of 10 ends with a medium miniboss and harder words; every 10th stage ends with a large boss and full sentences/code statements. Wave completion alone does not win guardian stages: HP drops once per full command, and only zero guardian HP clears the stage. Deadline expiry damages the hero and refreshes the command while keeping the boss alive. The 30-stage campaign contains 3 minibosses and 3 major bosses.

ESC pauses/resumes outside modals; Thai IME commits at composition end. Hidden tabs pause. Paused combat freezes animation and WPM clock. Retreat ends the round and records its score without unlocking another stage. Unlocks are per mode and survive history trimming.

All play is local, with no login or remote API dependency. The stable loopback origin http://127.0.0.1:4173 retains browser saves. Saves contain 100 recent runs, durable personal records/unlocks, selection and a paused checkpoint. Write every second, at completed words/status/selection changes, pagehide and beforeunload. Restore waits paused. Storage errors are visible; unreadable saves are not silently overwritten. JSON imports are size-limited, schema-validated, previewed and explicitly confirmed before replacing data. Failed imports preserve current data. Clearing browser data/private browsing can lose saves; My Journal explains backups. Export enables migration across browsers/devices. No competitive leaderboard.

The static server binds only to loopback, validates Host, exposes no write API and confines files to local-dist. The launcher verifies the server identity before reusing port 4173 and never stops other processes. Do not recreate or publish a hosted Site without a new user request.

## Historical online contract (retired; retained for provenance)

Source of product rules: user request in this chat (medieval forest typing combat, word input, levels, languages/code, hearts, account login, all pixel art). Hosting identity and account boundaries follow the Sites platform identity contract, implemented in app/chatgpt-auth.ts and app/api/runs/route.ts.

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Gameplay | lib/game.ts | User brief and stage definitions | ready / playing / paused / won / lost | node --test scripts/game.test.mjs and browser |
| Mode selection | Game.tsx mode buttons | lib/game.ts word banks | Thai / English / JavaScript / Python | browser |
| Dialog | game/Dialog.tsx | native dialog focus/inert behavior | help / account / result | browser keyboard and Escape |
| Scrollbar | app/globals.css | DESIGN.md | global baseline | browser |
| Feedback | Game.tsx announcement and inline save state | current run/API result | error / saving / saved / guest | browser |
| Account | app/chatgpt-auth.ts | Sites identity headers | anonymous / authenticated | local mock sign-in; hosted platform sign-in |

Typing a complete exact word defeats that enemy automatically. Incorrect input affects accuracy, but only missed enemies cost hearts. Thai composition is processed at composition end. ESC pauses/resumes unless a dialog is open. Background tabs pause combat. Every stage starts with five hearts. A stage unlocks the next stage only in the same practice mode.

Authenticated runs belong only to the server-authenticated user. Client-supplied user IDs are never used. POST verifies same-origin and schema. Results are idempotent by run UUID; retries preserve UUID. Pending saves remain visible and prevent starting another run. Guest history stays in browser local storage and never gets silently merged into an account. No leaderboard; scores are personal practice records reported by the local game client. History is bounded to the most recent 100 runs; full account history view shows the latest 20 of those. Network errors have explicit retry controls. Local development identity is simulated; production identity comes from Sites.
