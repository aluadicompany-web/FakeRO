import manifest from './character-rig.json';
export const CHARACTER_ART_VERSION='painted-sd-v4';
export const CHARACTER_RACES=['muspel','alf','jotun','vanir','nid','skug'] as const;
export const CHARACTER_FRAME={width:256,height:384,runtimeWidth:128,runtimeHeight:192,footY:376};
export const CHARACTER_PARTS=['body','cloth','armL','armR','gloveL','gloveR','legL','legR','bootL','bootR','upperArmL','upperArmR','forearmL','forearmR'] as const;
export const CHARACTER_HEAD_PARTS=['base','hair-front','hair-back','eyes','lids'] as const;
export const CHARACTER_VIEWS=['ตะวันออก','เฉียงหน้าขวา','ด้านหน้า','เฉียงหน้าซ้าย','ตะวันตก','เฉียงหลังซ้าย','ด้านหลัง','เฉียงหลังขวา'] as const;
export const CHARACTER_ASSET_ROOT='/art/characters-v4/';
export const CHARACTER_MANIFEST=manifest;
export function characterFrames(race:string,gender:'male'|'female',hair:number,facing=1){
 facing=((Math.round(facing)%8)+8)%8;const raceIndex=Math.max(0,CHARACTER_RACES.indexOf(race as typeof CHARACTER_RACES[number])),sex=gender==='female'?1:0,body=facing*12+sex*6+raceIndex,head=facing*10+sex*5+Math.max(0,Math.min(4,hair)),bodyMeta=manifest.bodies[body],headMeta=manifest.heads[head];
 return{body,head,facing,bodyMeta,headMeta,longHair:headMeta.hasBackHair};
}
export function characterExpression(action:string,now:number,id:string,hurtAt?:number){if(action==='dead')return'closed';if(action==='hurt'||hurtAt!==undefined&&now-hurtAt>=0&&now-hurtAt<140)return'hurt';if(action==='attack'||action==='cast')return'open';let seed=0;for(const c of id)seed=(seed*31+c.charCodeAt(0))>>>0;const phase=(now+seed%4100)%4100;return phase>=3950&&phase<4050?'closed':'open';}
/** Rendering attachment names are anatomical; directional art is already reflected and registered. */
export function characterHeadOffset(body:number,head:number){const socket=manifest.bodies[body].neck,anchor=manifest.heads[head].neck;return{x:socket.x-anchor.x,y:socket.y-anchor.y};}
