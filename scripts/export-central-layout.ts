import {writeFileSync} from 'node:fs';
import {MAP_BY_ID,propEntrance} from '../shared/maps.js';
import {CENTRAL_PLAZA,CENTRAL_NPC_RESERVATIONS,CENTRAL_ROADS,CENTRAL_PONDS,CENTRAL_MARKET_SLOTS,CENTRAL_COLUMNS} from '../shared/central-layout.js';
import {CENTRAL_REST_ZONE,GUIDE} from '../shared/adventure.js';
const m=MAP_BY_ID.get('central_city')!;
writeFileSync('docs/world/central-layout-v2.json',JSON.stringify({version:2,size:m.size,projection:'parallel isometric 2:1',plaza:CENTRAL_PLAZA,healing:CENTRAL_REST_ZONE,spawn:m.spawn,guide:GUIDE,reservedNpcs:CENTRAL_NPC_RESERVATIONS,roads:CENTRAL_ROADS,ponds:CENTRAL_PONDS,colonnadeSegments:CENTRAL_COLUMNS,portals:m.portals,homes:m.props.filter(p=>p.id.startsWith('capital-home')).length,trees:m.props.filter(p=>p.kind==='tree').length,marketSlots:CENTRAL_MARKET_SLOTS,services:m.props.filter(p=>p.service&&!p.marketSlot).map(p=>({id:p.id,name:p.name,service:p.service,approach:propEntrance(p)}))},null,2)+'\n');
