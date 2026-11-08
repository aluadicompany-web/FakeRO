import {randomUUID} from 'node:crypto';
import {MAPS,MAP_BY_ID,blocked,findPath,reachableCells,type Point} from '../shared/maps.js';
import {WORLD_BOSSES,WORLD_BOSS_INTERVAL} from '../shared/norse.js';
import type {Mob} from '../shared/rules.js';
export const WORLD_BOSS_MAPS=MAPS.filter(m=>!m.kind.includes('city')&&m.id!=='root_trial');
const pointCache=new Map<string,Point[]>();
export function spawnPoints(mapId:string):Point[]{if(pointCache.has(mapId))return pointCache.get(mapId)!;const map=MAP_BY_ID.get(mapId)!;const candidates:Point[]=[];const reachable=reachableCells(map);for(let x=3;x<25;x++)for(let y=3;y<25;y++){const p={x:x+.5,y:y+.5};if([{x:0,y:0},{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}].some(d=>blocked(map,p.x+d.x,p.y+d.y)))continue;if(Math.hypot(p.x-map.spawn.x,p.y-map.spawn.y)<5||map.portals.some(g=>Math.hypot(g.x-p.x,g.y-p.y)<4)||map.boss&&Math.hypot(p.x-14.5,p.y-10.5)<6)continue;if(reachable.has(y*map.size+x))candidates.push(p);}pointCache.set(mapId,candidates);return candidates;}
export class WorldBossDirector {
 nextSpawnAt:number;active:Mob|undefined;revision=0;
 constructor(now=Date.now(),private random:()=>number=Math.random){this.nextSpawnAt=now+WORLD_BOSS_INTERVAL;}
 tick(now:number):Mob|undefined {
  if(!Number.isFinite(now)||now<this.nextSpawnAt)return;
  // Keep a fixed schedule. Missed slots are not queued and death does not reset the clock.
  this.nextSpawnAt+=(Math.floor((now-this.nextSpawnAt)/WORLD_BOSS_INTERVAL)+1)*WORLD_BOSS_INTERVAL;this.revision++;
  if(this.active&&this.active.hp>0)return;
  const maps=WORLD_BOSS_MAPS.map(m=>({map:m,points:spawnPoints(m.id)})).filter(m=>m.points.length);
  if(!maps.length)return;const pick=<T,>(items:readonly T[])=>items[Math.min(items.length-1,Math.max(0,Math.floor(this.random()*items.length)))];
  const place=pick(maps),position=pick(place.points),definition=pick(WORLD_BOSSES);
  this.active={id:'world-'+randomUUID(),name:definition.name,mapId:place.map.id,...position,level:definition.level,hp:definition.hp,maxHp:definition.hp,boss:true,worldBoss:definition.id,archetype:WORLD_BOSSES.indexOf(definition),deadUntil:0};return this.active;
 }
 killed(id:string){if(this.active?.id===id){this.active=undefined;this.revision++;}}
 exportState(){return{nextSpawnAt:this.nextSpawnAt,active:this.active?{...this.active}:null};}
 restore(value:unknown,now=Date.now()){
  if(!value||typeof value!=='object')return;const v=value as {nextSpawnAt?:number;active?:Mob};
  if(typeof v.nextSpawnAt==='number'&&Number.isFinite(v.nextSpawnAt)&&v.nextSpawnAt>0)this.nextSpawnAt=v.nextSpawnAt;
  this.active=undefined;const a=v.active,def=WORLD_BOSSES.find(d=>d.id===a?.worldBoss);
  if(a&&def&&typeof a.id==='string'&&a.hp>0&&Number.isFinite(a.hp)&&WORLD_BOSS_MAPS.some(m=>m.id===a.mapId)){
   const map=MAP_BY_ID.get(a.mapId)!;const point=!blocked(map,a.x,a.y)&&findPath(map,map.spawn,a).length?{x:a.x,y:a.y}:spawnPoints(a.mapId)[0];
   if(point)this.active={...a,...point,hp:Math.min(def.hp,a.hp),maxHp:def.hp,level:def.level,boss:true,deadUntil:0,archetype:WORLD_BOSSES.indexOf(def)};
  }
  // A persisted active creature is restored before evaluating overdue slots.
  if(!Number.isFinite(this.nextSpawnAt))this.nextSpawnAt=now+WORLD_BOSS_INTERVAL;
 }
}
