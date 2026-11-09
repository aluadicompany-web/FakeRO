# Side/rear weapon carry and head attachment

The reported inventory views exposed three separate issues: some rear palm markers resolved to belt decoration instead of a glove; rear idle blades pointed upward through the back; and the modular head's opaque neck ended just above the costume socket, making the two neck caps read as separate parts. The old side paintings also merged the near arm into the torso silhouette.

## Changes

- Repaint 144 side frames: twelve outfits × east/west profiles × six idle/breath/walk poses. The full-body paintings have a visible shoulder, elbow, forearm and glove, with one common scale and foot registration across each six-frame strip. No runtime arm rotation, stretching or IK is introduced. The total base body frame count remains 1,536.
- Correct rear carry palm registration for idle, breathing and walking. Near northeast/north right gloves stay at the hip; the northwest right hand and northeast left hand are occluded in front of the body. Belt buckles are no longer used as resting palm points. Pose-specific attack registrations remain separate.
- Relaxed rear swords, daggers, hammers and dual blades point down alongside the legs. The offhand blade follows its own hand, rather than producing crossed blades over the back. Staves lean outward according to their actual palm side, avoiding a shaft through the neck/face. Shields remain upright at the left forearm, showing the rear handle face when appropriate.
- Fit the downward carry angle to the actual weapon tip so different catalogue blade lengths clear the ground without moving the grip. Inventory/GM preview scale also fits the real weapon extent, preventing a long or outward-pointing blade being clipped by the portrait canvas.
- Register all 80 modular head sockets from the opaque bottom neck pixels and use a three-world-pixel overlap into the costume collar. Four rear head base layers are effectively transparent under hair; these use the matching direction/sex head socket. Hair, eyes, hairstyle and color choices remain independent. Fallen heads retain their existing registration.
- Apply the same head attachment correction to the SVG loading/creator fallback and the actual Phaser world, inventory and GM previews.

Paintings are in `docs/art/characters-v5/side-profiles/`. `scripts/side-profile-art.py` reads the six-frame strips and removes registration dots. `scripts/pack-character-v5.py` packs the repaired full frames into the existing atlases. Reviewed carry offsets are recorded in `registration-overrides.json`; missing/occluded markers remain documented in the generated registration report. These are not all automatically detected visible-hand markers.

The existing body/head texture dimensions are unchanged. White/blue weapon designs, combat timing, weapon stats, item systems and server progression are unchanged.

## Checks

`tests/character-carry.test.ts` checks the 144 painted profile selections, downward rear carry, rear glove/occlusion registration, all 80 head sockets and outward stave angles. `test:painted-frames` exercises all 1,536 base frames in the real renderer. `test:weapon-holding` checks all 17 weapon profiles and 96 catalogue skins, twelve outfits, and actual head/grip attachment in the renderer. It saves enlarged side/rear examples for sword, staff, shield and dual blades; use `npx tsx scripts/playtest-weapon-holding.ts --review` to capture just those views.

Validated in this workspace: production build passed; 114 unit tests passed; all 1,536 base body frames rendered; 3,424 grip/head attachment checks passed across 17 profiles, 96 skins and twelve outfits, including rear blade floor clearance. Enlarged side/rear screenshots were reviewed for sword/shield, staff and dual blades. GM workshop smoke checks passed pause/rotation stability and verified that inspection did not change saved character data. No page errors or missing art were reported.
