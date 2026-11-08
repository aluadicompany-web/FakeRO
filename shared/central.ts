import {GUIDE} from './adventure.js';
import type {GameMap,Point,Prop} from './maps.js';
const cityRandom=(id:string)=>{let seed=2166136261;for(const c of id)seed=Math.imul(seed^c.charCodeAt(0),16777619);return()=>{seed=(seed+0x6d2b79f5)|0;let t=Math.imul(seed^(seed>>>15),1|seed);t^=t+Math.imul(t^(t>>>7),61|t);return((t^(t>>>14))>>>0)/4294967296;};};
export const CENTRAL_SIZE=64;
export const CENTRAL_PLAZA={x:32,y:34,radius:8};
export const CENTRAL_GARDENS=[{x:3,y:49,w:11,h:10},{x:19,y:40,w:7,h:4},{x:40,y:40,w:8,h:4},{x:28,y:47,w:7,h:6},{x:3,y:2,w:22,h:2},{x:42,y:2,w:19,h:2}];
export const CENTRAL_MARKET_LANE={x:12,y:9,w:7,h:41};
const marketRows=[10,13,16,19,22,25,28,31,34,37,43,46];
export const CENTRAL_MARKET_SLOTS=Array.from({length:24},(_,i)=>({id:`central-stall-${String(i+1).padStart(2,'0')}`,number:i+1,x:i%2===0?8:20,y:marketRows[Math.floor(i/2)],w:3,h:2,approach:{x:i%2===0?12.5:18.5,y:marketRows[Math.floor(i/2)]+1},flipX:i%2===1}));
const servicePositions:Record<string,{x:number;y:number;w:number;h:number}>={root_hall:{x:28,y:14,w:8,h:7},market:{x:9,y:4,w:5,h:4},forge:{x:47,y:27,w:5,h:4},warehouse:{x:3,y:34,w:3,h:4},waygate:{x:43,y:9,w:5,h:4},inn:{x:25,y:49,w:5,h:4},supplies:{x:51,y:46,w:5,h:4},party_board:{x:25,y:5,w:4,h:4},council:{x:36,y:5,w:5,h:4},artisan:{x:43,y:46,w:5,h:4},kitchen:{x:32,y:48,w:5,h:4},quay:{x:4,y:49,w:5,h:4}};
export function centralLandmarks(map:GameMap){map.size=CENTRAL_SIZE;map.spawn={x:32.5,y:43.5};for(const p of map.props)if(servicePositions[p.id])Object.assign(p,servicePositions[p.id]);for(const portal of map.portals){portal.x=32.5;portal.y=2.5;}
 map.props.push({id:GUIDE.id,kind:'npc',x:GUIDE.x-.5,y:GUIDE.y-.5,w:1,h:1,art:0,name:GUIDE.name,blocking:false,service:'guide',approach:{x:GUIDE.x,y:GUIDE.y+1},description:'คำแนะนำสำหรับผู้เดินทางใหม่และพื้นที่ฟื้นฟูรอบน้ำพุ'});
 map.props.push({id:'capital-fountain',kind:'decor',x:31,y:33,w:2,h:2,art:0,name:'น้ำพุหกเผ่า'},{id:'capital-pond',kind:'water',x:3,y:55,w:10,h:5,art:0,name:'บึงสวนคาราวาน'});
 for(const slot of CENTRAL_MARKET_SLOTS){const random=cityRandom(slot.id),variant=Math.floor(random()*3),goods=2+Math.floor(random()*6);map.props.push({...slot,kind:'decor',art:variant===0?3:variant===1?10:11,atlas:variant===0?undefined:'districts',marketSlot:slot.number,name:`แผง ${String(slot.number).padStart(2,'0')}`,service:'info',description:`แผงตลาดริมถนนหมายเลข ${slot.number} · เตรียมพื้นที่สำหรับพ่อค้า ระบบเช่าและซื้อขายจะพัฒนาต่อ`});
  for(let j=0;j<2;j++)map.props.push({id:slot.id+'-goods-'+j,kind:'decor',atlas:'citylife',art:j===0?goods:8+Math.floor(random()*3),x:slot.x+(slot.flipX?.15:2),y:slot.y+.35+j*.9,w:.7,h:.7,blocking:false,flipX:slot.flipX,name:''});
 }
 for(const [i,x,y]of [[0,2,2],[1,60,2],[2,2,60],[3,60,60],[4,28,2],[5,35,2]])map.props.push({id:'capital-bastion-'+i,kind:'decor',atlas:'citylife',art:i%2,x,y,w:2,h:2,name:'ป้อมกำแพง Central'});
 const overlap=(p:Prop)=>map.props.some(o=>{const margin=o.id.startsWith('capital-home')?0:.6;return o.blocking!==false&&p.x<o.x+o.w+margin&&p.x+p.w>o.x-margin&&p.y<o.y+o.h+margin&&p.y+p.h>o.y-margin;});
 let home=0;const addHome=(x:number,y:number)=>{const p:Prop={id:`capital-home-${home+1}`,kind:'building',x,y,w:3,h:3,art:Math.floor(cityRandom(`home-${x}-${y}`)()*8),atlas:'districts',name:'บ้านเรือนชาว Central'};if(x<2||y<2||x+3>62||y+3>62||x<39&&x+3>26&&y<45&&y+3>22||overlap(p))return;map.props.push(p);home++;};
 // Attached rows share party walls; two-tile lanes between rows lead to every doorway.
 for(const y of [54,59])for(const x of [16,19,22,27,30,33,39,42,45,51,54,57])addHome(x,y);
 for(const y of [17,22,34,39])for(const x of [43,46,49,55,58])addHome(x,y);
 for(const y of [3])for(const x of [3,6,17,20,45,48,54,57])addHome(x,y);
 for(const y of [39,44])for(const x of [3,23])addHome(x,y);
 for(const y of [15,20])addHome(38,y);
 const plant=(x:number,y:number,hedge=false)=>{const p:Prop={id:`capital-${hedge?'hedge':'tree'}-${x}-${y}`,kind:hedge?'hedge':'tree',x,y,w:1,h:1,art:hedge?8:9,atlas:'districts',name:''};if(map.props.some(o=>{const margin=hedge&&o.kind==='hedge'?0:.3;return o.blocking!==false&&x<o.x+o.w+margin&&x+1>o.x-margin&&y<o.y+o.h+margin&&y+1>o.y-margin;})||map.props.some(o=>o.kind==='building'&&Math.hypot((o.approach?.x??o.x+o.w/2)-x-.5,(o.approach?.y??o.y+o.h+.7)-y-.5)<1.5))return;map.props.push(p);};

 for(const y of [6,12,18,24,30,36,44,50,56])for(const x of [3,60]){plant(x,y);for(let d=1;d<4;d++)plant(x,y+d,true);}
 for(const x of [6,13,25,27,39,52,61])for(const y of [8,13,19,25,31,38,44,52,58])if(!(x>=26&&x<=39&&y>=23&&y<=43))plant(x,y);

}
export function centralDetails(map:GameMap,protectedPoints:Point[]){let sequence=0;
 const add=(x:number,y:number,art:number,kind:Prop['kind']='decor',atlas?:Prop['atlas'])=>{const p:Prop={id:`capital-detail-${sequence++}`,kind,x,y,w:1,h:1,art,atlas,name:''};if(x<2||y<2||x>61||y>61||map.props.some(o=>x<o.x+o.w+.3&&x+1>o.x-.3&&y<o.y+o.h+.3&&y+1>o.y-.3)||protectedPoints.some(q=>Math.hypot(q.x-x-.5,q.y-y-.5)<1.2))return false;map.props.push(p);return true;};
 // Formal planted dividers leave frequent openings between the market and ceremonial square.

 for(const x of [27,37])for(const y of [24,42])add(x,y,9,'tree','districts');
 for(let d=4;d<61;d+=5)for(const [x,y]of [[d,2],[d,61],[2,d],[61,d]])add(x,y,d%2?1:5);
 for(const b of [...map.props].filter(p=>p.service&&!p.marketSlot)){add(b.x-2,b.y+b.h,1);add(b.x+b.w+1,b.y+b.h,5);}
 for(const [x,y,art]of [[27,22,6],[37,22,6],[27,41,6],[38,41,6],[3,49,2],[14,53,2],[18,42,2],[42,42,2],[40,50,8],[54,29,4],[53,32,9],[5,40,9],[25,8,5],[41,8,5]])add(x,y,art);
 for(const garden of CENTRAL_GARDENS)for(let x=garden.x;x<garden.x+garden.w;x+=3)for(let y=garden.y;y<garden.y+garden.h;y+=3){add(x,y,(x+y)%3?7:9,(x+y)%3?'decor':'tree',(x+y)%3?undefined:'districts');}
 // Open fountain square: seating around the outside leaves the guide, water and approach lanes clear.
 for(const [i,x,y,flip]of [[0,27,32,0],[1,29,38,0],[2,35,39,1],[3,38,34,1],[4,36,29,1],[5,29,29,0]])map.props.push({id:'fountain-bench-'+i,kind:'decor',x,y,w:1.6,h:.8,art:2,blocking:true,flipX:!!flip,name:'ม้านั่งลานน้ำพุ'});
 // Shade trees, benches and lanterns punctuate the broad ring road and residential streets.
 for(const x of [5,19,40,54])for(const y of [8,38,52,58])add(x,y,9,'tree','districts');
}
