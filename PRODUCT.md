# Local-only product decision

The user explicitly requested on 2026-10-26: permanently remove the hosted online RUNEBLADE site and use the game privately on this computer, without ChatGPT login. The user separately authorized permanent online site deletion. The Sites settings UI confirmed completion by returning to an empty Sites list. Do not create or deploy a hosted site unless the user explicitly requests hosting again.

The application must work offline after building, bind its server only to loopback, use a stable origin, and persist scores, unlocks and paused combat locally. Preserve existing visual identity. Import replaces a local save only after the player reviews and confirms it. No third-party runtime services or sign-in calls belong in local-dist.
