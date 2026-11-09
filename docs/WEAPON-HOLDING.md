# Weapon holding and perspective

The supplied RO reference sheets show separate weapon views for direction and action: broad blade faces, thin edges, reverse faces, foreshortening, hands over handles, and bow draw/release shapes. Weapon images, body frames and effect trails are separate. These are visual observations; without ACT data we do not infer original timing or offsets. No pixels from those references are included in this game.

## Implementation

- Preserve all 96 white/blue catalogue item identities. Prepare 952 trimmed weapon frames from our item art, including seven melee/shield perspective views and eight-facing, three-stage bows. These views are projected from original master paintings, not individually hand-painted angles.
- Add original master paintings for axe, katana, great hammer, longbow, shortbow and dual blades, plus twelve shield rear faces with handles and straps.
- Add 768 painted body frames: twelve outfits × eight directions × eight bow/two-hand poses. They extend the existing 1,536 base frames; walking, hurt and fallen states retain their existing frames. Heads and hair remain modular.
- Register anatomical right/left palms and neck per frame. The primary weapon follows the right-hand slot; two-hand weapons align their shaft through both palms and can move between upper/lower hilt contacts. Hand overlays cover the handle. Rear-facing weapons and shields use appropriate body depth.
- Bow limbs stay upright in world projection, with direction-specific width. The string follows its endpoints and drawing hand. A nocked arrow disappears at the authoritative server windup; the existing combat projectile then handles flight. This adds no hits, changes no stats and resets no cooldowns.
- Weapon tips use explicit per-frame anchors for trails, rather than the centre of a padded texture.

`shared/weapon-holding.ts` selects poses/views from the existing server clip. `client/hero-rig.ts` renders them in the world, creation/character preview and GM studio. High-speed chains reuse the existing server combo step to vary poses without resetting to idle every hit.

## Asset preparation and limits

Run `npm run art:weapon-holding`. Source paintings are in `docs/art/weapon-holding/`. `scripts/pack-held-weapons.py` prepares weapon projections; `scripts/pack-holding-bodies.py` extracts painted frames, removes registration colours and packs body/hands atlases. Missing or occluded markers use nearby registered body pixels and are recorded in `public/art/holding-bodies/registration-report.json`; these are not all manually authored anchors.

The weapon atlas is 2048×1024 (8 MiB RGBA). Added body atlases are 2048×2624 and 2048×2560 (40.5 MiB combined). Including the existing body/head textures brings this character set to roughly 120.5 MiB before other game textures. All are at most 4096 pixels per axis; mobile texture loading still needs future profiling and selective loading.

## Verification

`npm test` includes body registration, two-hand axis and server-timed bow release checks. `npm run test:weapon-holding` renders the real Phaser rig, covers all 768 new body frames, 17 weapon profiles and 96 catalogue skins, and checks 2,848 grip placements against actual opaque hilt pixels. It also checks release timing and missing assets. Galleries are written to ignored `artifacts/weapon-holding/` for visual review. `test:combo-combat` exercises real server combat, slow/fast chains and weapon-switch cooldowns.

Validated in the cloud workspace: production build passed; 94 unit tests passed; renderer checks passed for 768 holding frames / 96 skins / 2,848 grip placements with no page errors or missing assets. Real combat passed all 17 profiles with two-step slow and four-step fast chains, retaining weapon-switch cooldowns. GM workshop smoke test passed rotation/pause stability and verified inspection did not change the saved character.
