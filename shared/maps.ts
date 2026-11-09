import {MONSTERS} from './monsters.js';
import {centralLandmarks,centralDetails} from './central.js';
import {landscape,landscapeRandom} from './landscape.js';
import layout from '../docs/world/world-layout.json';
import type {Race} from './rules.js';
export type Biome='grass'|'snow'|'ember'|'rune'|'ore'|'marsh';
export interface Point{x:number;y:number}
export interface Prop extends Point{id:string;kind:'building'|'tree'|'rock'|'crystal'|'ruin'|'water'|'decor'|'hedge'|'npc';w:number;h:number;art:number;name:string;atlas?:'districts'|'citylife';approach?:Point;flipX?:boolean;blocking?:boolean;marketSlot?:number;service?:'bind'|'warp'|'heal'|'info'|'tower'|'guide'|'tower_guard';description?:string}
export interface Portal extends Point{id:string;to:string;name:string;arrival:Point}
export interface GameMap{id:string;name:string;kind:string;region:string|null;biome:Biome;rule:'safe'|'home'|'red';homeRace?:Race;level:number;levelRange?:{min:number;max:number};grid:Point;props:Prop[];portals:Portal[];boss?:{name:string;archetype:number};size:number;spawn:Point}
export const MAP_SIZE=28;
let occupancyReady=false;const occupancy=new WeakMap<GameMap,{version:number;cells:Uint8Array}>();const reachableCache=new WeakMap<GameMap,{version:number;cells:Set<number>}>();
const biomes:Record<string,Biome>={ember:'ember',ljos:'grass',eir:'snow',vana:'rune',aur:'ore',skug:'marsh'};
const art:Record<string,number>={ljos:0,eir:1,ember:2,vana:3,aur:4,skug:5};
// Atlas is deliberately made of individual map cells, with empty space between regions.
const anchors:Record<string,Point>={ljos:{x:1,y:2},eir:{x:6,y:0},vana:{x:11,y:2},aur:{x:11,y:9},ember:{x:6,y:11},skug:{x:1,y:9}};
const coords=(id:string,region:string|null):Point=>{
 if(id==='central_city')return{x:6,y:5};if(id==='central_commons')return{x:6,y:6};
 if(id==='red_ember_rift')return{x:9,y:10};if(id==='red_frost_scar')return{x:3,y:1};
 const a=anchors[region!];const offset=id.endsWith('_city')?{x:0,y:0}:id.endsWith('_field_1')?{x:1,y:0}:id.endsWith('_field_2')?{x:1,y:1}:id.endsWith('_field_3')?{x:2,y:1}:{x:0,y:1};return{x:a.x+offset.x,y:a.y+offset.y};
};
const slotsForScenery=[{x:14.5,y:2.5},{x:25.5,y:14.5},{x:14.5,y:25.5},{x:2.5,y:14.5},{x:24.5,y:4.5},{x:24.5,y:24.5},{x:4.5,y:24.5},{x:4.5,y:4.5}];
export const MAPS:GameMap[]=layout.nodes.map(n=>{
 const region=layout.regions.find(r=>r.id===n.region);const isCity=n.kind==='city'||n.kind==='racial_city';
 const m:GameMap={id:n.id,name:n.name,kind:n.kind,region:n.region,biome:biomes[n.region||'']||'grass',rule:n.pvp==='red_zone'?'red':n.kind==='racial_city'?'home':'safe',homeRace:region?.race as Race|undefined,level:n.kind==='red_zone'?(n.id==='red_frost_scar'?12:8):n.kind==='world_boss_arena'?20:n.id.endsWith('_field_3')?12:n.id.endsWith('_field_2')?5:1,grid:coords(n.id,n.region),props:[],portals:[],size:MAP_SIZE,spawn:{x:14.5,y:22.5}};
 if(n.id==='red_ember_rift')m.biome='ember';if(n.id==='red_frost_scar')m.biome='snow';
 if(isCity){
  const names=n.id==='central_city'?layout.centralBuildings: [
   {id:'hall',name:'หอเผ่า '+region!.city,purpose:'ฐานรวมตัวและเรื่องราวของเผ่า '+region!.city},
   {id:'inn',name:'โรงเตี๊ยม',purpose:'ตั้งเมืองเกิดใหม่และพักฟื้น'},
   {id:'waygate',name:'ลานวาร์ป',purpose:'เดินทางไปเมืองที่เคยค้นพบแล้ว'},
   {id:'supplies',name:'ร้านเสบียง',purpose:'อาคารร้านเสบียงประจำเมือง'},
   {id:'warehouse',name:'คลังประจำเมือง',purpose:'โกดังและจุดพักของคาราวาน'},
   {id:'artisan',name:region!.specialBuildings[0],purpose:'แหล่งเรียนรู้และวัฒนธรรมประจำเมือง'},
   {id:'council',name:region!.specialBuildings[1],purpose:'จุดพบปะของชาวเมือง'}];
  const descriptions:Record<string,string>={market:'ย่านค้าขายและจุดนัดพบของชาว Central',forge:'เตาหลอมเก่าแก่ที่หล่อเลี้ยงเหล่าช่างของเมือง',warehouse:'โกดังเก็บสินค้าของคาราวานที่เดินทางมาจากหกดินแดน',supplies:'เรือนเสบียงสำหรับการเดินทางอันยาวไกล',party_board:'ลานนัดพบของผู้เดินทางก่อนออกผจญภัย',council:'หอประชุมของตัวแทนหกเผ่าพันธุ์',artisan:'ตรอกช่างที่รวบรวมภูมิปัญญาจากทุกดินแดน',kitchen:'กลิ่นอาหารอุ่นลอยออกมาจากครัวของชาวเมือง',quay:'ท่าพักของคาราวานและนักเดินทางริมบึง',hall:'สถานที่รวมตัวของชาวเผ่า',root_hall:'ประตูสู่บททดสอบผู้เฝ้าผนึกรากโลก'};
  const positions=[{x:11,y:9},{x:5,y:5},{x:20,y:5},{x:4,y:13},{x:20,y:13},{x:4,y:20},{x:20,y:20},{x:10,y:3},{x:14,y:3},{x:10,y:19},{x:15,y:19},{x:3,y:9}];
  names.forEach((b,i)=>{const p=positions[i];m.props.push({id:b.id,kind:'building',...p,w:i===0?5:3,h:i===0?5:3,art:b.id==='root_hall'?6:b.id==='forge'?7:b.id==='warehouse'?8:n.id==='central_city'?({market:4,waygate:3,inn:0,supplies:4,party_board:0,council:1,artisan:4,kitchen:7,quay:5} as Record<string,number>)[b.id]??0:art[n.region||'ljos'],name:b.name,service:b.id==='inn'?'bind':b.id==='waygate'?'warp':b.id==='root_hall'?'tower':'info',description:descriptions[b.id]||b.purpose});});
 }else{
  // Obstacles stay off the broad crossroads and all portal approach lanes.
  const count=n.kind==='world_boss_arena'?10:24;
  let seed=[...n.id].reduce((sum,c)=>((sum*31+c.charCodeAt(0))>>>0),17);const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<count*5&&m.props.length<count;i++){const x=3+Math.floor(random()*22),y=3+Math.floor(random()*22);if(Math.abs(x-14)<3||Math.abs(y-14)<3||y>19&&x>10&&x<19||slotsForScenery.some(p=>Math.hypot(p.x-x,p.y-y)<3))continue;
   if(m.props.some(p=>Math.hypot(p.x-x,p.y-y)<2))continue;
   m.props.push({id:`scenery-${i}`,kind:i%4===0?'rock':m.biome==='rune'&&i%3===0?'crystal':m.biome==='ore'?'rock':'tree',x,y,w:1,h:1,art:0,name:''});
  }
  if(n.id.endsWith('_field_2')||n.id.endsWith('_field_3')){
   const landmark:Prop={id:'regional-landmark',kind:['grass','snow','ember','marsh'].includes(m.biome)?'water':'ruin',x:4,y:9,w:4,h:3,art:art[n.region||'ljos'],name:m.biome==='ember'?'ธารหินร้อน':m.biome==='ore'?'เหมืองเก่า':m.biome==='rune'?'หอรูนร้าง':'แอ่งน้ำแห่งภูมิภาค'};
   m.props=m.props.filter(p=>!(p.x<landmark.x+landmark.w+1&&p.x+p.w>landmark.x-1&&p.y<landmark.y+landmark.h+1&&p.y+p.h>landmark.y-1));m.props.push(landmark);
   if(n.id.endsWith('_field_3')){const ruin:Prop={id:'deep-landmark',kind:'ruin',x:19,y:7,w:4,h:3,art:art[n.region||'ljos'],name:'ซากอาคาร '+n.name};m.props=m.props.filter(p=>!(p.x<ruin.x+ruin.w+1&&p.x+p.w>ruin.x-1&&p.y<ruin.y+ruin.h+1&&p.y+p.h>ruin.y-1));m.props.push(ruin);}
  }
  if(n.kind==='world_boss_arena'&&region){m.boss={name:region.boss,archetype:layout.regions.indexOf(region)};m.props.push({id:'boss-ruin',kind:'ruin',x:10,y:4,w:5,h:2,art:art[n.region!],name:region.arena});}
 }
 return m;
});
MAPS.push({id:'root_trial',name:'หอผนึกรากโลก · ห้องผู้เฝ้าประตู',kind:'world_boss_arena',region:null,biome:'rune',rule:'safe',level:20,grid:{x:7,y:5},props:[{id:'seal',kind:'ruin',x:10,y:3,w:6,h:3,art:6,name:'ผนึกรากโลก'}],portals:[],boss:{name:'Root Warden',archetype:6},size:28,spawn:{x:14.5,y:22.5}});
export const MAP_BY_ID=new Map(MAPS.map(m=>[m.id,m]));
const slots:Point[]=[{x:14.5,y:2.5},{x:25.5,y:14.5},{x:14.5,y:25.5},{x:2.5,y:14.5},{x:24.5,y:4.5},{x:24.5,y:24.5},{x:4.5,y:24.5},{x:4.5,y:4.5}];
for(const edge of layout.edges){const a=MAP_BY_ID.get(edge.a)!,b=MAP_BY_ID.get(edge.b)!;const pa=slots[a.portals.length],pb=slots[b.portals.length];
 a.portals.push({id:`to-${b.id}`,to:b.id,name:b.name,...pa,arrival:{x:pb.x+(pb.x<14?1:-1),y:pb.y+(pb.y<14?1:-1)}});
 b.portals.push({id:`to-${a.id}`,to:a.id,name:a.name,...pb,arrival:{x:pa.x+(pa.x<14?1:-1),y:pa.y+(pa.y<14?1:-1)}});
}
MAP_BY_ID.get('root_trial')!.portals.push({id:'to-central_city',to:'central_city',name:'กลับ Central',x:14.5,y:25.5,arrival:{x:14.5,y:15.5}});
export function blocked(map:GameMap,x:number,y:number):boolean {
 if(!Number.isFinite(x)||!Number.isFinite(y)||x<1||y<1||x>=map.size-1||y>=map.size-1)return true;
 if(occupancyReady&&x%1===.5&&y%1===.5){let cached=occupancy.get(map);if(!cached||cached.version!==map.props.length){const cells=new Uint8Array(map.size*map.size);for(let cx=1;cx<map.size-1;cx++)for(let cy=1;cy<map.size-1;cy++)if(map.props.some(p=>p.blocking!==false&&cx+.5>=p.x-.2&&cx+.5<p.x+p.w+.2&&cy+.5>=p.y-.2&&cy+.5<p.y+p.h+.2))cells[cy*map.size+cx]=1;cached={version:map.props.length,cells};occupancy.set(map,cached);}return cached.cells[Math.floor(y)*map.size+Math.floor(x)]===1;}
 return map.props.some(p=>p.blocking!==false&&x>=p.x-.2&&x<p.x+p.w+.2&&y>=p.y-.2&&y<p.y+p.h+.2);
}
export const propEntrance=(p:Prop):Point=>p.approach||({x:p.x+p.w/2,y:p.y+p.h+.7});
export function homeMap(race:Race){return MAPS.find(m=>m.kind==='racial_city'&&m.homeRace===race)!.id;}
// Cardinal BFS on the same occupancy rules on both sides of the network.
export function findPath(map:GameMap,from:Point,to:Point):Point[]{
 if(blocked(map,to.x,to.y))return[];const sx=Math.floor(from.x),sy=Math.floor(from.y),tx=Math.floor(to.x),ty=Math.floor(to.y);
 if(sx===tx&&sy===ty)return[{x:to.x,y:to.y}];
 const start=sy*map.size+sx,end=ty*map.size+tx;const queue=[start],previous=new Map<number,number>();previous.set(start,-1);
 for(let q=0;q<queue.length;q++){const k=queue[q];if(k===end)break;const x=k%map.size,y=Math.floor(k/map.size);
  for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const nx=x+dx,ny=y+dy,nk=ny*map.size+nx;if(dx&&dy&&(blocked(map,x+dx+.5,y+.5)||blocked(map,x+.5,y+dy+.5)))continue;if(previous.has(nk)||blocked(map,nx+.5,ny+.5))continue;previous.set(nk,k);queue.push(nk);}
 }
 if(!previous.has(end))return[];const result:Point[]=[];for(let k=end;k!==start;k=previous.get(k)!){result.push({x:k%map.size+.5,y:Math.floor(k/map.size)+.5});}return result.reverse();
}
export function nearestWalkable(map:GameMap,p:Point):Point{if(!blocked(map,p.x,p.y))return p;for(let r=1;r<map.size;r++)for(let dx=-r;dx<=r;dx++)for(let dy=-r;dy<=r;dy++){const q={x:Math.floor(p.x)+dx+.5,y:Math.floor(p.y)+dy+.5};if(!blocked(map,q.x,q.y))return q;}return map.spawn;}
export function canPvp(map:GameMap,attackerRace:Race,targetRace:Race){return map.rule==='red'||map.rule==='home'&&attackerRace===map.homeRace&&targetRace!==map.homeRace;}

// Plant groves around protected travel corridors; simulation and renderer share the trunks.
for(const map of MAPS){
 const config=landscape(map);if(config.city)continue;const random=landscapeRandom(map.id),protectedPoints:Point[]=[map.spawn,{x:14.5,y:14.5}];
 const goals:Point[]=[...map.portals,{x:14.5,y:14.5},...(map.boss?[{x:14.5,y:10.5}]:Array.from({length:7},(_,i)=>nearestWalkable(map,{x:5.5+(i*5%18),y:6.5+(i*7%12)})))];
 for(const other of MAPS)for(const gate of other.portals)if(gate.to===map.id)goals.push(gate.arrival);
 for(const goal of goals)protectedPoints.push(goal,...findPath(map,map.spawn,goal));
 const clusters=Array.from({length:7},()=>({x:3+random()*22,y:3+random()*22}));
 for(let attempt=0;attempt<1600&&map.props.filter(p=>p.kind==='tree').length<config.trees;attempt++){
  const center=clusters[attempt%clusters.length];const x=Math.floor(attempt%4?center.x+(random()-.5)*10:2+random()*24),y=Math.floor(attempt%4?center.y+(random()-.5)*10:2+random()*24),point={x:x+.5,y:y+.5};
  if(blocked(map,point.x,point.y)||x<2||y<2||x>25||y>25||protectedPoints.some(p=>Math.hypot(point.x-p.x,point.y-p.y)<1.75)||map.boss&&Math.hypot(point.x-14.5,point.y-10.5)<6||map.props.some(p=>point.x>p.x-(config.forest?.2:.8)&&point.x<p.x+p.w+(config.forest?.2:.8)&&point.y>p.y-(config.forest?.2:.8)&&point.y<p.y+p.h+(config.forest?.2:.8)))continue;
  map.props.push({id:`grove-${attempt}`,kind:'tree',x,y,w:1,h:1,art:0,name:''});
 }
}

occupancyReady=true;
const capital=MAP_BY_ID.get('central_city')!;centralLandmarks(capital);const protectedCapital:Point[]=[capital.spawn,...capital.portals];
for(const target of [...capital.portals,...capital.props.filter(p=>p.service).map(propEntrance)])protectedCapital.push(target,...findPath(capital,capital.spawn,target));
centralDetails(capital,protectedCapital);

for(const map of MAPS)for(const gate of map.portals)if(gate.to==='central_city')gate.arrival=map.id==='root_trial'?{x:32.5,y:23.5}:{x:32.5,y:4.5};

for(const map of MAPS){const entries=MONSTERS.filter(m=>m.mapId===map.id);if(entries.length){map.level=entries[0].level;map.levelRange={min:map.id.endsWith('_field_1')?1:entries[0].level,max:entries.at(-1)!.level};}if(map.rule==='red'){const entries=MONSTERS.filter(m=>m.region===(map.biome==='snow'?'eir':'ember')).slice(10,16);map.levelRange={min:entries[0].level,max:entries.at(-1)!.level};}}

export function reachableCells(map:GameMap):Set<number>{const cached=reachableCache.get(map);if(cached&&cached.version===map.props.length)return cached.cells;const start=Math.floor(map.spawn.y)*map.size+Math.floor(map.spawn.x),cells=new Set<number>([start]),queue=[start];for(let i=0;i<queue.length;i++){const k=queue[i],x=k%map.size,y=Math.floor(k/map.size);for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const nx=x+dx,ny=y+dy,key=ny*map.size+nx;if(cells.has(key)||blocked(map,nx+.5,ny+.5)||dx&&dy&&(blocked(map,x+dx+.5,y+.5)||blocked(map,x+.5,y+dy+.5)))continue;cells.add(key);queue.push(key);}}reachableCache.set(map,{version:map.props.length,cells});return cells;}
