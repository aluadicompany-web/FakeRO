/** One plan shared by city art, collision, healing, NPCs and migration. Screen-left is (-x,+y). */
export const CENTRAL_LAYOUT_VERSION=2;
export const CENTRAL_SIZE=80;
export const CENTRAL_PLAZA={x:40,y:40,radius:12.4};
export const CENTRAL_COLONNADE_RADIUS=13.5;
export const CENTRAL_COLUMNS=48;
export const CENTRAL_SPAWN={x:44.5,y:45.5};
export const CENTRAL_GUIDE={x:44,y:43};
export const CENTRAL_ROOT_APPROACH={x:23,y:23};
export const CENTRAL_WEST_GATE={x:2.5,y:71.5};
export const CENTRAL_SOUTH_GATE={x:70.5,y:77.5};
export const CENTRAL_NPC_RESERVATIONS=[{x:34,y:35},{x:35,y:34},{x:36,y:33}];
export const CENTRAL_PONDS=[{x:45,y:54,w:5,h:8},{x:54,y:45,w:8,h:5}];
export const CENTRAL_ROADS=[
 {id:'market',width:5.2,points:[{x:40,y:40},{x:8,y:72},CENTRAL_WEST_GATE]},
 {id:'south',width:6,points:[{x:40,y:40},{x:70.5,y:70.5},CENTRAL_SOUTH_GATE]},
 {id:'root',width:6,points:[{x:40,y:40},{x:23,y:23}]},
 {id:'residential',width:5.2,points:[{x:40,y:40},{x:70,y:10}]},
 {id:'council',width:3.5,points:[{x:29,y:51},{x:23.5,y:44},{x:13.5,y:42}]},
 {id:'supplies',width:3,points:[{x:50,y:30},{x:59,y:30},{x:59,y:38},{x:55,y:38}]},
 {id:'quests',width:3,points:[{x:61,y:61},{x:53,y:67}]},
];
export const CENTRAL_MARKET_SLOTS=Array.from({length:24},(_,i)=>{const t=12+Math.floor(i/2)*1.7,bank=i%2===0?-1:1,c={x:40-t+bank*3,y:40+t+bank*3};return{id:`central-stall-${String(i+1).padStart(2,'0')}`,number:i+1,x:c.x-1,y:c.y-1,w:2,h:2,bank,approach:{x:40-t+bank*1.2,y:40+t+bank*1.2}};});
export function roadDistance(p:{x:number;y:number}){let best=Infinity;for(const r of CENTRAL_ROADS)for(let i=1;i<r.points.length;i++){const a=r.points[i-1],b=r.points[i],dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy)));best=Math.min(best,Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy)-r.width/2);}return best;}
export function colonnadeGap(angle:number){const wrap=(x:number)=>Math.atan2(Math.sin(x),Math.cos(x));return [1,3,5,7].some(n=>Math.abs(wrap(angle-n*Math.PI/4))<.21);}
export function migrateCentralPosition(h:{mapId:string;x:number;y:number;centralLayoutVersion?:number},spawn=CENTRAL_SPAWN){if(h.mapId==='central_city'&&h.centralLayoutVersion!==CENTRAL_LAYOUT_VERSION){Object.assign(h,spawn);h.centralLayoutVersion=CENTRAL_LAYOUT_VERSION;}}
