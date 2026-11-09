import {CENTRAL_ROOT_APPROACH} from './central-layout.js';
/** Central's neutral sentries share a reachable conversation point on the front steps. */
export const TOWER_APPROACH=CENTRAL_ROOT_APPROACH;
export const TOWER_GUARDS=[
 {id:'root-guard-left',name:'ยามผนึกฝั่งซ้าย',x:22.6,y:23.4,row:0},
 {id:'root-guard-right',name:'ยามผนึกฝั่งขวา',x:23.4,y:22.6,row:1},
] as const;
export const TOWER_OFFER_TTL=30_000;
export const TOWER_TALK_RANGE=1.5;
