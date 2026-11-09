/** Central's neutral sentries share a reachable conversation point on the front steps. */
export const TOWER_APPROACH={x:32,y:21.7};
export const TOWER_GUARDS=[
 {id:'root-guard-left',name:'ยามผนึกฝั่งซ้าย',x:31.6,y:21.4,row:0},
 {id:'root-guard-right',name:'ยามผนึกฝั่งขวา',x:32.4,y:20.6,row:1},
] as const;
export const TOWER_OFFER_TTL=30_000;
export const TOWER_TALK_RANGE=1.5;
