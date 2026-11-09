# Inventory, basic supplies and ground items

This update keeps the existing 96 white/blue weapon designs and adds 34 functional item definitions with 36 original painted icons. All current boss-core/seal rewards, including legacy items without a catalogue ID, resolve to an appropriate icon; unidentified legacy loot uses a tied bag rather than an empty placeholder. Art preparation uses transparent row gutters to prevent neighbouring icons leaking into a cell.

## Supplies and effects

| Item | Effect | Cooldown / restriction |
|---|---|---|
| Red potion small / medium / large | HP +50 / 180 / 600 | shared potion cooldown 3 s |
| Blue potion small / medium / large | MP +30 / 100 / 300 | shared potion cooldown 3 s |
| Yggdrasil elixir | HP and MP +25% maximum | shared potion cooldown 10 s |
| Herb bread | HP 1% maximum per second for 30 s | only after 5 s without combat; separate cooldown |
| Wind potion | movement speed +10% for 60 s | cannot stack; separate 60 s cooldown |
| Town scroll | return to saved town after 3 s | cancelled by movement, attacks, damage, death or transfer; forbidden in root trial |
| Escape feather | random reachable map cell after 1 s | adventure maps only, forbidden in cities/root trial |
| Revival crystal | nearby dead player restored to 25% HP/MP after 3 s | 2-cell range; target rechecked at completion; channel can be interrupted |
| Bag ticket | +5 slots up to 50 | bought with Silfr, no payment integration |

Consumables are consumed only when their effect succeeds, not when a channel begins. Full-resource potions, failed revivals and cancelled travel do not consume the item. The server owns quantities, prices, ranges, cooldowns and healing caps. Potion effects show floating text, an expanding ring and rising sparks. Active food/wind timers, potion cooldown and channel remaining time appear below the profile.

Death now waits 15 seconds before automatic town respawn, allowing a three-second ally revival. The existing death/return behavior otherwise remains. This is an initial tuning value, not a claim of final combat/economy balance.

## Equipment and materials

Four armor slots are active: body, cloak, boots, accessory. Twelve initial designs cover white Lv.1, blue Lv.20 and gold Lv.50; bonuses affect real DEF/maximum HP/MP and are removed immediately on unequip, sale or drop. All races share requirements. Armor does **not** replace the visible racial costume in this version. Weapons continue to use their actual equipped catalogue appearance.

White armor is sold by NPC shops and included in the one-time starter pack. Blue/gold armor definitions are prepared for testing through the GM item selector; their player crafting/boss acquisition loops are not opened in this update. This does not substitute an NPC shop for the planned merchant crafting system. Gold/red weapon systems remain separate.

Six gathering materials and three boss materials have icons. Normal-monster winners have a 25% material chance; existing boss rewards keep their names/origin. Gathering skills and crafting recipes are separate future work.

## Inventory, shop and drops

- Start with 25 slots. Stacks: potions/food/travel 20, special supplies 10, materials 99; equipment does not stack. Weight capacity is `120 + effective STR × 5`; equipment weighs 8 unless an explicit item weight exists. Existing overweight saves are retained but cannot receive extra weight until cleared.
- Eira gives one starter pack per character: 5 red small, 3 blue small, 2 bread, 2 town scrolls and four white armor pieces. Space and weight are checked before committing the whole pack. Older characters can claim it too; reconnecting cannot claim twice.
- Shops sell 17 basic definitions near supplies/market/inn entrances. NPC-stocked goods sell back for floor(30% price). Other goods use explicit initial rarity/level values. GM test items cannot be sold for money.
- Drop confirmation supports partial stack quantities. A full drop retains the instance ID. Anyone can collect it; clicking from afar walks toward it, then the server checks same map, distance, slots and weight. First successful pickup removes the ground entry atomically; repeated commands cannot duplicate it.
- Ground lifetime is exactly 30 minutes from drop time. It is preserved across normal server restarts; expired drops are removed during restore/tick. Ground entries and character inventories share the existing SQLite checkpoint transaction. Limits are 200 drops/map and 2,000/server to bound snapshots and rendering.
- Ground art uses the actual weapon icon or the same supply icon, with a rarity-colored ring, hover label and subtle bob. Ground items are not colliders.

The UI supports use/equip/unequip/drop/sell, quantities, weight, descriptions, armor bonuses, a contextual shop, and selecting a dead player for revival. Inspecting the shop remotely is allowed; purchase/sale is checked server-side. The map and camera input remain gated while inventory is open.

## Reproduce and test

`npm run art:items` packs `docs/art/items/basic-source.png` into the runtime atlas. `npm test` includes potion/cooldown, armor-removal, drop conservation, replay, atomic persistence/expiry, range/weight/slot, starter-kit, shop-price, bag-cap, buff, travel and revival checks. `npm run test:items` uses an isolated real server/database and Chromium for painted icons, armor, stack drop/pickup, haste, bag expansion, shop and portrait/landscape mobile layouts. Screenshots are saved under ignored `artifacts/items/`. `test:refinement` covers existing weapons, inventory stats, movement and responsive layouts.

Validation in this workspace: production build passed, 108 unit tests passed, real-server item browser checks passed with no page errors or missing art. Existing refinement checks also passed: weapon/shield/two-hand equipment, live stats, eight-direction walking, guarded tower entry and six viewport layouts. Item UI was reviewed at 1440×1000, 390×844 and 844×390.
