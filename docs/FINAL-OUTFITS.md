# Final-tier outfits and HD modular heads

Twelve original final-tier costume designs cover the six current race/role families, with male and female cuts. The collection now includes **3,072 painted whole-body frames: 12 outfits × 8 directions × 4 continuous tracks × 8 phases**, attached to the live character renderer, inventory preview and GM workshop. The original three-view design catalog remains available for comparing materials and silhouettes.

| Race / role | Set | Palette and silhouette |
| --- | --- | --- |
| Muspelborn / swordsman | Ember Crown Vanguard | Charcoal steel, crimson split mantle, silver edges; heavy overlapping shoulders |
| Ljosalfar / archer | Dawnleaf Sentinel | Emerald, moss, ivory and pale gold; light leaf plates and short shoulder mantle |
| Jotunborn / healer | Glacier Covenant | Pearl, glacial silver, navy and pale gold; ceremonial tabards and pleated panels |
| Vanirkin / mage | Worldroot Arcanist | Plum, lavender, muted silver and turquoise; high collar, layered robe tails and folio |
| Nidavellir / merchant and runesmith | Auric Forgemaster | Bronze, petrol teal, chestnut leather and steel; divided tool apron and reinforced boots |
| Skuggar / thief | Eclipse Wayfarer | Obsidian, indigo, wine-purple and silver; fitted light armor and asymmetric coat tails |

The five supplied references inform construction: the black high-collar swordsman coat, articulated dark silver knight plates, lavender ceremonial tabard, blue/silver panels, and gold/blue mantle with white pleating. These are combined and recolored for each role, with original root, leaf, snow and knot motifs. Both genders retain protective clothing, visible arms and boots, with different waist, coat and robe construction.

## Animation and attachment

Each outfit has eight consecutive phases for walking, a right-handed stroke, a two-handed stroke, and bow draw/release. The complete body is painted in each phase; the runtime does not stretch or rotate body pieces. Attack tracks begin and finish in the same painted guard. Alternate cuts traverse that same right arm in reverse. Source phase 4 is selected at the existing server hit time in either direction, including fast attacks. Walking advances with distance traveled.

The previous independent pose collection is retained only for the fallen/hurt legacy resources. It is no longer the source for ordinary final-tier motion. Increasing the number of unrelated poses did not solve anatomical continuity.

`docs/art/coherent-clips/` contains the 48 new strips and the shared eight-direction authoring diagrams. The diagrams are authoring references, not runtime body bones. Literal colored right and left gloves identify the anatomical hands. The packer recolors and separates those exact pixels into main/off glove layers that cover the hilt. It measures the visible source shaft; a two-handed weapon uses the line between the two actual fists, without a timed 180-degree orientation flip. An occluded hand uses the authoring diagram and explicit hidden metadata, rather than snapping to a nearby coat pixel. Evidence is recorded in `coherent-registration.json`.

The head joint is now at the nape, not the foot-origin of the head image. Head roll follows the authored torso motion, with a common 0.86 scale and collar overlap. Collar checks run after technical registration colors have been removed, so a hand near the cheek cannot count as the collar. Each strip uses one normalization scale, never a separate scale per frame. Inventory/workshop framing fits the whole motion track rather than zooming with the current sword tip. White/blue equipment skins remain selected from the existing catalog.

## HD heads

Eighty newly painted directional heads cover five hairstyles × two genders × eight views. Face shading, hair locks, eyelashes, irises and mouth detail are repainted rather than enlarged from the old runtime images. Source faces share a consistent scale within each gender; separate face/neck registration avoids letting hair volume resize the face.

Heads are packed in 384×384 source frames, displayed in the same 96-world-pixel registration space. Face, front hair, back hair, iris and eyelids remain separate. Existing hairstyle, six hair colors, five eye colors, blink/hurt expressions and fallen orientations continue to work. These heads are used by starter and final outfits in the creator, HUD portrait, inventory, world and workshop. The independent layers let long hair sort around the body while the neck overlaps the collar.

## Testing in game

1. Open **GM tools → outfit test → final-class outfit → equip in map**. The selection persists across reloads. Choose starter to revert.
2. Open **GM tools → character workshop** and select the final outfit tier, race, gender, action and weapon. Automatic playback runs real animation timing. The reference-frame selector can hold any phase 1–8 for inspecting palms, collar and weapon layering.
3. The design catalog's **inspect this outfit's animation** button opens the actual renderer with the selected race and gender.

The GM outfit selection is cosmetic: it does not alter level, attributes, equipment, item ownership, money or combat bonuses. The server validates the GM role and tier and audits the operation. Ordinary account creation cannot inject this field. These set names remain proposed final-tier visual identities; this update does not introduce job advancement or ordinary-player unlock rules.

## Assets and reproduction

- `docs/art/final-outfits/`: approved three-view design sources and comparison images.
- `docs/art/final-frames/`: 18 painted base animation sheets, including independently painted left-facing views, and the registration override.
- `docs/art/final-holding/`: 12 dedicated bow/two-handed sheets.
- `docs/art/heads-hd/`: four high-detail modular head sheets and a registered preview.
- `docs/art/coherent-clips/`: the 48 continuous motion sources and four eight-direction authoring guides.
- `npm run art:final-animation` packs body/main-glove/off-glove atlases, exports `shared/coherent-animation.json`, and checks actual packed collar/glove contacts.
- `npm run art:heads-hd` separates and registers the existing HD head layers.
- `npm run test:final-animation` renders the tracks through the actual `HeroRig` and saves sequential side/front/back contact sheets.
- `npm run art:final-previews` exports slow, fixed-scale renderer loops, including the forward/return stroke, two-handed and bow tracks.
- Packing requires Python, Pillow, NumPy and SciPy. Players use the shipped WebP files.

Atlases are loaded lazily by race/gender. No texture axis exceeds 4096; the twelve-outfit inspector intentionally loads more textures than a normal single-character view. GPU memory and mobile optimization remain separate work.

## Verification

Production build and 124 unit tests passed. The browser tour rendered all 3,072 frames, the packed collar/glove checks passed, and the isolated live-game equip/walk/inventory/workshop/reload/combat/revert tour passed without page errors or missing assets. The starter/equipment regression tour also passed for 17 profiles and 96 catalog skins. Sequential side/front/back examples were inspected visually.

Registration checks alone do not establish a natural pose. Review the sequential renderer contact sheets and slow loops in addition to the automated checks.

- Unit tests check 3,072 frame registrations, closed guard loops, common two-hand shaft lines, and hit-time sampling across attack speeds.
- `npm run test:final-animation` checks the actual transformed nape, main/support hilt contacts, literal glove parent layers, and loading/errors across all tracks.
- `npm run test:final-outfit-game` uses an isolated real GM account/server to equip, walk, inspect inventory, use the workshop, reload, attack in a field, and revert.
- `scripts/check-final-art.py` verifies collars and real glove pixels in the packed atlases, including the cell-edge wrap regression.
- Browser screenshots and reports are written to ignored `artifacts/final-animation/` and `artifacts/final-outfit-game/`.

![In-engine final outfits with HD heads](art/final-frames/in-engine-lineup.webp)

![Walking preview](art/final-frames/walking-preview.gif)

![Combat preview](art/final-frames/combat-preview.gif)
