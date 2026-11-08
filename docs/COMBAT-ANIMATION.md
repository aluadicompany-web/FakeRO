# Normal attacks and speed-dependent combos

## Asset review

Reviewed [Universal LPC](https://github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator) at commit `86160e7507d6841259cff624a51a63c1d4847ee3`, including its README licensing/credit guidance and the male `halfslash.png` sheet (384×256, six 64-pixel cells across four directions). The project supplies slash/backslash/thrust/shoot/spellcast animations, but its pixel bodies and costume layers do not match this game's painted SD proportions or atlas joints. Replacing the characters would change the approved art direction. No LPC art is imported or shipped; this update authors new keyframes on the existing character/weapon illustrations.

## Choreography

`shared/attack-animation.ts` supplies original windup, contact, follow-through and recovery poses for all 17 weapon profiles. Swords/axes alternate diagonal cuts, a descending cut and a thrust; knives alternate stab heights, a short slash and a returning thrust. Hammers use overhead/diagonal/sweeping strikes; shields vary the height and direction of their bash. Dual swords alternate and cross their paths. Bows draw/release with different ready positions, while staffs/wands lift, direct and recover their casts. Visual dual strikes still correspond to one authoritative ordinary attack.

Attack interval comes from the existing attributes and weapon speed. The number of consecutive variants is based on the interval divided by the weapon's speed multiplier: above 900 ms gives two steps, above 650 ms gives three, and 650 ms or lower gives four. The existing minimum cooldown and AGI cap remain. Contact windup scales with speed (bounded to at least 90 ms and at most half the attack interval); recovery ends at 98% of the interval. Fast recoveries join the next guard pose rather than forcing an idle pose after every swing. The renderer also briefly blends new attacks and relaxes the arms over 150 ms after stopping.

The server owns sequence/index/step/length, interval, windup and duration in optional `Motion.attack` metadata. The chain continues only for the same weapon and target within its grace window. Moving/stopping, changing target, leaving range, changing weapon, transferring map, dying or running out of MP resets the choreography. Equipment swaps preserve cooldown. No combo damage multiplier, extra hit or stat bonus is added. The 100 ms simulation tick still quantizes actual attack start times; the client interpolates the visual phases between snapshots.

## Articulation and grip

`client/articulated-arm.ts` splits each existing sleeve/glove image at the elbow during posing. Two rigid bones solve the shoulder/elbow/hand without stretching the entire arm. The weapon attaches below the glove on the same forearm joint. Two-handed weapons meet in front of the chest; support-hand targets follow the solved main grip. The right hand remains the main grip in all facings; bows retain the requested right-hand hold and left-hand string draw.

Torso twist, shoulder position, head counter-rotation and planted-foot weight shifts accompany the arms. Small boot/robe edge pixels previously left in the torso layer now follow their respective leg, preventing detached shoe fragments when turning or transferring weight. The approved one-handed idle grip remains in use in the map and inventory.

Held bows cache a limb-only texture generated from the original frame. The baked straight string is removed from that held texture only; inventory icons and source assets remain intact. A single string follows the actual limb endpoints and drawing hand. Bow width is foreshortened for the view. Arrows launch from the bow's centre; spells launch from the held weapon tip.

## Gameplay and effects

Effects receive the same server `releaseAt`, impact and combo data as the body animation. Melee trails change direction with the step, and their fade duration contracts at high speed to avoid accumulating opaque arcs. Arrows and magic begin flight after release, not during windup. Launch positions are frozen per projectile. Hit reactions tint the attacker without replacing an already active attack pose; death still overrides the motion and cancels pending attacks.

The previous pending-projectile lock prevented fast archers/casters from starting the next attack until their last projectile arrived. Attacks now follow the authoritative cooldown while multiple projectiles can be in flight. Damage-per-hit, range/alive/map/PvP validation, MP consumption and reward ownership remain authoritative. A regression verifies that overlapping arrows killing the same monster award only one kill and one coin reward.

## Validation

- `npm test`: 76 unit/integration cases, including timing, server combo order and forged fields, all 17 profiles × 8 facings, four distinct paths, rigid bone lengths, fast guard continuity, projectile overlap, cooldown, flinch and single rewards.
- `npm run test:combo-animation`: real HeroRig contact sheets for 17 profiles, four steps/five phases, both genders/eight facings, and recorded live slow/medium/fast comparisons for six weapon styles. Screenshots/video live in ignored `artifacts/combo`.
- `npm run test:combo-combat`: real authenticated game/server combat against a boss, two slow sword steps and four fast steps for each of the 17 profiles, stopping and changing weapons without resetting cooldown, no page errors or missing assets.
- `npm run test:refinement`: regression for equipment/inventory, stat spending, appearance/preview, six layouts, actual walking through eight facings and entering the main quest hall.

The animation remains an articulated painted sprite, rather than a newly drawn full-body frame strip. Monster/boss choreography is unchanged in this update. Ranged damage cadence now follows the intended cooldown instead of flight duration; balance should continue to be evaluated with real skills, armor and encounters as those systems develop.
