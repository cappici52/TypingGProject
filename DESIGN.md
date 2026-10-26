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
- Don't imply guest runs are synced to an account.

