---
version: alpha
name: RUNEBLADE
description: A fully pixel art medieval woodland typing adventure.
colors:
  background: "#101916"
  surface: "#19231e"
  border: "#465047"
  primary: "#e9bd65"
  text: "#f0e9d5"
  muted: "#a4afa0"
  success: "#a4c883"
  danger: "#e66b64"
typography:
  display:
    fontFamily: "'Press Start 2P', monospace"
  body:
    fontFamily: "'VT323', 'Thai Pixel', monospace"
rounded:
  DEFAULT: "0px"
spacing:
  section-gap: "24px"
  page-max: "1440px"
components:
  button: {}
  dialog: {}
  input: {}
---

# RUNEBLADE Design System

## Overview
An actual playable 16-bit fantasy cartridge presented in a browser. The user explicitly requires pixel art everywhere: arena, sprites, icons, keyboard, borders and controls. Reference: full generated desktop concept at docs/concept.png. Audience: Thai-speaking players practicing Thai, English and code. Product register. The signature is a luminous ancient forest stage above a complete pixel keyboard, with a quiet campaign rail to the right. Avoid modern rounded SaaS cards, smooth vector icons and glossy gradients.

Runtime ownership: app/globals.css :root is canonical; this document mirrors exact values. All shared components use those CSS variables, no additional theme adapters.

## Colors
Forest ink background, stone-green surfaces, ivory type, warm gold primary action and selected states. Red means missed attacks or lost hearts; sage means correct input. Dark theme only. Forced colors defer to system colors.

## Typography
Press Start 2P for restrained display and logo; VT323 for readable pixel UI, keyboard, metrics and gameplay. Syy UDT is an OFL Thai pixel font fallback, with 1.6 line height for combining marks. Code is case sensitive. Large labels remain legible instead of rendering the entire UI as a background image.

## Layout
24px gutters, maximum 1440px; game and 280px campaign rail. Below 1000px rail moves below game, below 600px compact controls and OS keyboard input remain usable. Natural page scrolling. Media geometry reserved. No horizontal page overflow.

## Elevation & Depth
Square 2px stone borders, inset 1px highlights and hard offset shadows. No blurred card shadows. Atmosphere comes from raster pixel artwork and sparse square fireflies.

## Shapes
Zero radius. Stepped corners and crisp rectangular keycaps. Pixel icons are handmade rectilinear SVG with shape-rendering crispEdges, never smooth curves.

## Components
Buttons share hover gold border, focus-visible outline, depressed active state and disabled opacity. Gold is reserved for start/resume/continue. Shared native dialog provides inert background, Escape and focus management. Mode controls are explicit buttons so all popups remain app-owned. Typing input has visible error/correct feedback, supports Thai IME and mobile input. Status feedback is a live region. Account history and game instructions share dialog styling. Sound uses small synthesised square waves on user interaction. Combat motion conveys hits and misses; reduced-motion disables ambient animations and shake.

## Do's and Don'ts
- Do preserve the user's arena / keyboard / stage rail information architecture.
- Do keep text and controls semantic and code native.
- Don't add a marketing page before the playable game.
- Don't imply local saves sync across devices or require an account. The online site was permanently retired at the user's request; this is a local-only game.

## Local edition additions

The campaign pages through 30 stages in groups of five; minibosses at 5/15/25 and major bosses at 10/20/30. Preserve the established palette and typography. My Journal replaces account controls and shares the existing dialog language with Bestiary and instructions. A true 4-column by 3-row hero atlas supplies four idle, attack and hurt frames. Fifteen distinct normal monster sprites use a 5-by-3 atlas and species-specific idle motions. Hits flash and recoil; defeat motion lasts 550ms. Minibosses use medium 174px boxes, major bosses 238px boxes, reduced on mobile. The boss command panel owns HP and deadline bars. Pause freezes combat animation; reduced-motion uses static action frames and highlights. Save import previews and explicit replacement confirmation use the same square pixel control grammar.


Motion behavior: the user explicitly requested animated combat. The game Motion switch defaults on independently of operating system motion settings and persists the chosen state. Off removes movement and supplies static attack/hurt frames. Ambient fireflies continue to respect system reduced-motion. Pause freezes combat frames.

Soundtrack controls reuse the square stone frame and motion-toggle button, with a labeled native range slider styled in gold. Music is independently controlled from combat effects, starts only after a player click, pauses in hidden tabs, and remembers volume. The original offline lute/recorder dance is public/audio/whispering-woods.wav.

Combat effects use original short wooden mechanism taps with muted iron overtones, three alternating variants and six concurrent typing voices. Final enemy HP triggers a separate impact/fall/lute flourish; guardian defeat uses a longer cadence. The existing header effects button owns typing and combat sounds, defaults on, remembers the preference, and remains independent of MusicControls.
