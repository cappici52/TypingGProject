# RUNEBLADE interaction contract

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
