import {MONSTERS} from '../shared/monsters.js';
import {blocked,reachableCells,nearestWalkable,type GameMap,type Point} from '../shared/maps.js';
import type {Mob} from '../shared/rules.js';
const pointCache=new Map<string,Point[]>();
export function spawnCandidates(map:GameMap){let points=pointCache.get(map.id);if(points)return points;const cells=reachableCells(map);points=[];for(let x=2;x<map.size-2;x++)for(let y=2;y<map.size-2;y++){const p={x:x+.5,y:y+.5};if(!blocked(map,p.x,p.y)&&cells.has(y*map.size+x)&&Math.hypot(p.x-map.spawn.x,p.y-map.spawn.y)>3&&map.portals.every(g=>Math.hypot(p.x-g.x,p.y-g.y)>3))points.push(p);}pointCache.set(map.id,points);return points;}
export function mapPopulation(map:GameMap):Mob[]{if(map.kind.includes('city')||map.boss)return[];const candidates=spawnCandidates(map);const entrance=map.portals.find(g=>g.to.endsWith('_city')||map.id.endsWith('_field_2')&&g.to.endsWith('_field_1')||map.id.endsWith('_field_3')&&g.to.endsWith('_field_2'));const origin=entrance||map.spawn;
 const species=MONSTERS.filter(d=>d.mapId===map.id),fallback=MONSTERS.filter(d=>d.region===(map.biome==='snow'?'eir':map.biome==='ember'?'ember':'ljos'));const defs=species.length?species:map.rule==='red'?fallback.slice(10,16):fallback.slice(0,3);const starter=map.id.endsWith('_field_1')||map.id==='central_commons',desired=map.rule==='red'?28:map.id==='central_commons'?18:map.id.endsWith('_field_1')?20:map.id.endsWith('_field_2')?24:28;
 const occupied:Point[]=[],mobs:Mob[]=[];const place=(near=false)=>{let best:Point|undefined,score=-Infinity;for(const p of candidates){const gap=occupied.length?Math.min(...occupied.map(q=>Math.hypot(p.x-q.x,p.y-q.y))):100;if(gap<2.05)continue;const value=near?-Math.hypot(p.x-origin.x,p.y-origin.y):gap+Math.sin(p.x*17+p.y*29)*.05;if(value>score){score=value;best=p;}}const result=best||candidates.find(p=>occupied.every(q=>Math.hypot(p.x-q.x,p.y-q.y)>1.8));if(!result)return undefined;occupied.push(result);return result;};
 const make=(def:typeof MONSTERS[number],id:string,point:Point,small=false)=>mobs.push({id,species:def.id,name:small?'ลูก '+def.name:def.name,mapId:map.id,level:small?1:def.level,...point,hp:small?38:def.hp,maxHp:small?38:def.hp,deadUntil:0});
 if(starter){const point=place(true);if(point)make(defs[0],map.id+'-starter',point,true);}
 // Preserve canonical species IDs. Subsequent spawns are additional individuals of those species.
 for(const def of defs){const point=place();if(point)make(def,def.mapId===map.id?def.id:map.id+'-'+def.id,point);}
 for(let i=mobs.length;i<desired;i++){const small=starter&&i<defs.length+4,point=place(small);if(!point)break;const def=defs[(i-defs.length+defs.length)%defs.length];make(def,small?map.id+'-starter-'+i:map.id+'-'+def.id+'-copy-'+i,point,small);}
 return mobs;
}
