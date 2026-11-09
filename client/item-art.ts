import type {LootItem} from '../shared/rules';
import {supplyFor} from '../shared/supplies';
import {EQUIPMENT_BY_ID} from '../shared/items';
import {equipmentIcon} from './equipment-ui';
export function itemIcon(item:LootItem){const gear=item.catalogId&&EQUIPMENT_BY_ID.get(item.catalogId);if(gear)return equipmentIcon(gear);const frame=supplyFor(item)?.icon??21;return `<span class="supply-icon" style="background-position:${-frame%6*64}px ${-Math.floor(frame/6)*64}px" aria-hidden="true"></span>`;}
