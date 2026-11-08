# Right hand / Equipment window / Central square

## Character rig

Atlas `armL`/`armR` are pieces on the left/right of the source image, not anatomical names. `shared/hero-pose.ts` resolves anatomical right for each of the eight facings, accounting for rear art and global reflection. Main weapon always mounts on that hand. Offhand shields/second swords mount on the opposite hand. Two-handed weapons keep the right hand as their main grip and solve the other arm toward the second grip. Bows are held in the right hand with the left hand drawing the string, following the requested right-hand main-weapon rule.

The hilt anchors come from the lower opaque glove pixels in all 24 arm atlas frames (`shared/hand-anchors.json`). Rigs update their attachment positions when direction, costume or gender changes. Weapon sprites draw underneath the glove rather than above it. Front-view short blades rest forward across the waist; their handles sit inside the closed palm rather than pointing back behind the forearm. Windup art and weapon cooldown rules remain tied to the existing authoritative motion.

Walking phase accumulates distance from the interpolated ground position of the rendered character. One complete left/right stride spans 1.28 world tiles. Each leg has alternating lift/stance, restrained hip rotation and a small body response; no wall-clock foot animation while standing. Teleports/map changes do not count as steps. This is still the original layered sprite rig, not newly drawn animation strips.

## Inventory (B)

The parchment/gold inventory has a left tab rail, equipment/status panel, live character preview and 25-slot storage. The preview renders the same Phaser `HeroRig` with current appearance and weapons into a small render texture; the immediate painted SVG fallback is replaced once its snapshot is ready. Temporary rigs/textures are disposed after drawing.

Status replaces the equipment column and shows all six attributes with base/racial contributions, HP/MP, ATK/MATK/DEF, attacks per second and interval using the held weapon's speed multiplier, critical rate/multiplier, attack range, walking speed, EXP, available points and kills. Values use the shared runtime formulas; combat frequency excludes chasing and projectile travel. Stat buttons spend normal server-validated points. No fake HIT/FLEE/MDEF numbers are shown for mechanics not yet implemented.

Select an owned item to inspect requirements and equip it. Snapshot refreshes preserve the window, tab, selection, scroll and focused stat controls. Main weapon and offhand slots reflect the server state. The other equipment slots identify starter clothing and features still unavailable rather than pretending armor is implemented. Materials remain visible; claiming pending deliveries and the built-in starter knife remain available. Tabs support arrow/Home/End keys and Escape closes the window. Gameplay shortcuts remain blocked while it is open.

## Central

Eira moves from (34.5,37.5) to (33.7,36.1). The two long garden/hedge strips around the fountain are removed from both visual layout and shared collision. Six wood/gold benches with attached flower planters line the outer square; their footprints block movement while the guide, fountain, main avenue and service routes remain accessible. The plaza uses surrounding stone material with a restrained narrow rim rather than a solid inset disc.

The tower sprite is anchored at the front edge of the hall footprint so its visible steps line up with the existing server-validated entrance. The root hall gets a new original ivory/gold/teal tower with cyan seal doors and separate tapered root tips. Its art has no baked soil disc. `scripts/pack-tower-art.py` normalizes the generated alpha matte and writes lossless PNG/WebP. Source is preserved in `docs/art/root-seal-tower-source.png`.

Ground earth now fades via an irregular noisy distance field into the existing paving, with no outlined oval or clipped solid patch. Thinner continuous tapered roots replace repeated round stroke segments. Bark follows the length of each root; smaller painted root clusters, broken paving and disturbed soil remain. Roots end before the fountain instead of flooding the square. Ground detail is decorative; the original hall service/entrance and main quest route remain unchanged.

## Validation

`npm test`: 67 tests cover game rules and the handedness/gait regressions. `npm run test:refinement`: real browser checks 25 slots, live rig pixels, equipment/status tabs, allocating a point, sword+shield then bow swapping, six viewport sizes and actual walking in all eight facings. Screenshots are stored in ignored `artifacts/refinement/`. Existing adventure, HUD (seven layouts and actual combat), and all 17 weapon combat playtests pass as additional regression coverage. The final visual pass also walks through the hall entrance into root_trial. Run `npm run build` before browser tests.

## Front knife grip correction

The starter knife uses white atlas frame 5. Its longer leather handle is centred near pixel row 115, while the earlier generic 84%-height pivot fell near the pommel. The explicit calibration is preserved in the art packer. Palm anchors sit one display pixel above the glove-bottom landmarks. Front short-blade resting angles follow the costume artwork facing direction, so the blade extends forward across the waist; reflected and rear views keep the correct right hand. The same HeroRig feeds the map and inventory preview.

`npm run test:weapon-grip` captures the actual rig at enlarged scale, both genders across eight facings, and eight one-hand styles in idle/attack poses. The real inventory playtest also equips the starter knife and saves `artifacts/refinement/starter-knife-real-inventory.png`. No game assets or accounts are changed by the isolated pose gallery.
