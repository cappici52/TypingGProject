# Local edition sprite assets

All new pixel assets were generated/edited with the built-in Image Gen tool and copied into this workspace. Runtime image files:

- `public/art/monsters-final.png`: 15 unique sprites, 5 columns x 3 rows: slime, mushroom, goblin, skeleton, bat; wolf, imp, ghost, treant, spider; boar, eyeball, carnivorous plant, crystal golem, sorcerer. Art briefs require left-facing full-body SNES sprites, alpha-transparent canvas and generous separation. A final atlas repair reduced each sprite inside its fixed cell to remove neighboring sprite bleed.
- `public/art/hero-final.png`: same green-caped silver knight as the original, 4 columns x 3 rows. First row: four breathing/cape idle poses. Second: windup, thrust, gold slash, recovery. Third: hurt recoil/red glint/step back/recovery. Repaired fixed cell registration and full sword padding, transparent backdrop.
- `public/art/bosses-transparent.png`: six separate transparent pixel cutouts in 3 columns x 2 rows: oak guardian, armored ogre, antlered witch; green dragon, crystal titan, fire dragon. Medium guardians and large bosses use real HP; art contains no HUD or text.

Shared source brief: "Production pixel sprite atlas for a medieval fantasy forest game. Hard square SNES pixel clusters, dark outlines, no scene, UI, labels or gridlines, complete silhouettes fit inside equal fixed cells, truly transparent pixels outside sprites." Final prompts specified each creature and its exact cell order, with 10–20% clear padding and baseline registration. Hero poses and normal/boss frame sets remain distinct assets.

Backgrounds, pixel fonts and original image provenance remain documented in ASSETS.md and asset-prompts.md. All game assets and fonts are local; no remote runtime image or AI requests occur during play.
