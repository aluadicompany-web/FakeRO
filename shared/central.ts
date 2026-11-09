import {TOWER_GUARDS,TOWER_APPROACH} from './tower.js';
import {GUIDE} from './adventure.js';
import {CENTRAL_SIZE,CENTRAL_PLAZA,CENTRAL_SPAWN,CENTRAL_WEST_GATE,CENTRAL_SOUTH_GATE,CENTRAL_MARKET_SLOTS,CENTRAL_COLONNADE_RADIUS,CENTRAL_COLUMNS,CENTRAL_PONDS,roadDistance,colonnadeGap} from './central-layout.js';
import type {GameMap,Point,Prop} from './maps.js';
export {CENTRAL_SIZE,CENTRAL_PLAZA,CENTRAL_MARKET_SLOTS} from './central-layout.js';
export const CENTRAL_GARDENS=CENTRAL_PONDS.map(p=>({x:p.x-1,y:p.y-1,w:p.w+2,h:p.h+2}));
export const CENTRAL_MARKET_LANE={x:8,y:40,w:32,h:32};
function overlaps(a:Prop,b:Prop,pad=.35){return a.x<b.x+b.w+pad&&a.x+a.w>b.x-pad&&a.y<b.y+b.h+pad&&a.y+a.h>b.y-pad;}
const prop=(id:string,x:number,y:number,w:number,h:number,art:number,name:string,extra:Partial<Prop>={}):Prop=>({id,x,y,w,h,art,name,kind:'building',atlas:'central-v2',...extra});
export function centralLandmarks(map:GameMap){map.size=CENTRAL_SIZE;map.spawn={...CENTRAL_SPAWN};map.props=[];
 const first=map.portals[0];if(first){Object.assign(first,CENTRAL_WEST_GATE);first.name='ประตูตะวันตก · ทุ่งกลาง';map.portals=[first,{id:'to-central_commons-south',to:'central_commons',name:'ประตูทิศใต้ · ทุ่งกลาง',...CENTRAL_SOUTH_GATE,arrival:{x:14.5,y:4.5}}];}
 map.props.push(
 prop('clock-tower',38.5,38.5,3,3,0,'หอนาฬิกาแห่งการเริ่มต้น',{renderWidth:300,service:'info',description:'ลานวงกลมทั้งหมดเป็นเขตพักฟื้น HP / MP ของผู้เดินทาง และเป็นจุดเริ่มต้นของ Central'}),
 prop('root_hall',13,13,8,8,24,'ประตูอิกดราซิล',{service:'tower',approach:{...TOWER_APPROACH},groundAnchor:{...TOWER_APPROACH},renderWidth:1350,description:'ประตูสู่บททดสอบกลางต้นไม้โลก — ต้องพูดคุยกับยามผนึกก่อนเข้า'}),
 prop('council',10,34,7,7,1,'สภาสูงแห่งหกเผ่า',{service:'info',renderWidth:660,approach:{x:13.5,y:42},description:'สภากลางของเมืองหลวงและลานพิธีของทั้งหกเผ่า'}),
 prop('forge',21,38,5,5,3,'โรงคราฟอาวุธ',{service:'info',approach:{x:23.5,y:44},description:'ย่านช่างอาวุธใกล้ลานสภา — เตรียมสำหรับระบบคราฟของพ่อค้า'}),
 prop('supplies',53,32,4,4,2,'ร้านเสบียงปีกสีแดง',{service:'info',approach:{x:55,y:38},description:'ยา อาหาร ของใช้เดินทาง และอุปกรณ์พื้นฐาน'}),
 prop('waygate',56,17,4,4,6,'ลานวาร์ปของ Central',{service:'warp',approach:{x:58,y:22},description:'เดินทางไปพื้นที่ที่เคยสำรวจแล้ว'}),
 prop('inn',62,11,4,4,4,'โรงเตี๊ยมรุ่งอรุณ',{service:'bind',approach:{x:64,y:16},description:'บันทึก Central เป็นเมืองเกิด'}),
 prop('warehouse',66,7,5,5,5,'คลังคาราวาน',{service:'info',approach:{x:68.5,y:13},description:'คลังประจำเมืองและจุดพักสินค้า'}),
 prop('party_board',52,64,2,2,8,'บอร์ดข่าวสารและเควส',{kind:'decor',service:'info',renderWidth:170,approach:{x:53,y:67},description:'พื้นที่บอร์ดรับเควสและข่าวของเซิร์ฟเวอร์ เตรียมเปิดเควสเพิ่มเติมในอนาคต'}),
 prop('market',28,52,1,1,8,'ตลาด Silfr · 24 แผง',{kind:'decor',blocking:false,renderWidth:100,service:'info',approach:{x:28.5,y:51},description:'ถนนตลาดสองฝั่งสำหรับร้านผู้เล่น 24 แผง'}),
 prop('root-court-gate',26,26,2,2,10,'ซุ้มประตูลานต้นไม้โลก',{kind:'decor',blocking:false,groundAnchor:{x:27,y:27},renderWidth:460}),
 );
 for(const [i,p]of [{x:15.5,y:46.5},{x:19,y:47},{x:22.5,y:47.5}].entries())map.props.push(prop('training-dummy-'+i,p.x-.4,p.y-.4,.8,.8,9,'หุ่นฟางฝึกต่อสู้',{kind:'decor',service:'training',renderWidth:80,approach:{x:Math.floor(p.x)+1.5,y:Math.floor(p.y)+.5},description:'ฝึกโจมตีด้วยอาวุธที่ถือ ไม่มี EXP หรือไอเท็มจากการฝึก'}));
 for(const guard of TOWER_GUARDS)map.props.push({id:guard.id,kind:'npc',x:guard.x-.3,y:guard.y-.3,w:.6,h:.6,art:guard.row,name:guard.name,blocking:false,service:'tower_guard',approach:{...TOWER_APPROACH},description:'หน่วยพิทักษ์กลาง — ยืนยันก่อนเข้าบททดสอบอิกดราซิล'});
 map.props.push({id:GUIDE.id,kind:'npc',x:GUIDE.x-.5,y:GUIDE.y-.5,w:1,h:1,art:0,name:GUIDE.name,blocking:false,service:'guide',approach:{x:GUIDE.x,y:GUIDE.y+1},description:'Eira ผู้ดูแลลานเริ่มต้นและเขตฟื้นฟูทั้งลาน'});
 for(const slot of CENTRAL_MARKET_SLOTS)map.props.push(prop(slot.id,slot.x,slot.y,2,2,12+(slot.bank===-1?0:3)+Math.floor((slot.number-1)/2)%3,`แผง ${String(slot.number).padStart(2,'0')}`,{kind:'decor',marketSlot:slot.number,service:'info',approach:slot.approach,renderWidth:180,description:`ร้านริมตลาดหมายเลข ${slot.number} · พื้นที่สำหรับร้านผู้เล่นในอนาคต`}));
 for(const [i,p]of CENTRAL_PONDS.entries())map.props.push({id:'capital-pond-'+i,kind:'water',...p,art:0,name:'บ่อน้ำสวนเมือง'});
 for(let i=0;i<CENTRAL_COLUMNS;i++){const angle=i*Math.PI*2/CENTRAL_COLUMNS;if(colonnadeGap(angle))continue;const x=CENTRAL_PLAZA.x+Math.cos(angle)*CENTRAL_COLONNADE_RADIUS,y=CENTRAL_PLAZA.y+Math.sin(angle)*CENTRAL_COLONNADE_RADIUS;map.props.push(prop('plaza-column-'+i,Math.floor(x),Math.floor(y),1,1,11,'เสาระเบียงลานกลาง',{kind:'decor',groundAnchor:{x,y},renderHeight:165}));}
 // The root forecourt arch has two solid bases and a genuinely open passage.
 for(const [i,p]of [{x:25,y:29},{x:29,y:25}].entries())map.props.push(prop('root-gate-base-'+i,p.x-.5,p.y-.5,1,1,11,'ฐานประตู',{kind:'decor',hidden:true,renderWidth:42}));
 let home=0;const addHome=(x:number,y:number)=>{const p=prop('capital-home-'+(++home),x,y,3,3,6,'บ้านเรือน Central');const center={x:x+1.5,y:y+1.5};const marketT=(center.y-center.x)/2,marketNormal=Math.abs(center.x+center.y-80)/Math.SQRT2;if(marketT>10&&marketT<34&&marketNormal>6.5&&marketNormal<10.5||x<27&&x+3>10&&y<49&&y+3>42||CENTRAL_PONDS.some(g=>x<g.x+g.w+1.8&&x+3>g.x-1.8&&y<g.y+g.h+1.8&&y+3>g.y-1.8))return;if(x<3||y<3||x+3>77||y+3>77||Math.hypot(center.x-40,center.y-40)<17||roadDistance(center)<3||x<25&&y<25||map.props.some(o=>o.blocking!==false&&overlaps(p,o,o.id.startsWith('capital-home')?0:.4))||map.props.some(o=>o.service&&o.approach&&o.approach.x>=x-.8&&o.approach.x<=x+3.8&&o.approach.y>=y-.8&&o.approach.y<=y+3.8)){home--;return;}p.art=[6,7,18,19,20,21][home%6];map.props.push(p);};
 for(let y=5;y<=75;y+=5)for(let x=5;x<=74;x+=3)addHome(x,y);
}
export function centralDetails(map:GameMap,protectedPoints:Point[]){let seq=0;const add=(x:number,y:number,art:number,width:number,kind:Prop['kind']='decor',w=1,h=1)=>{const p=prop('capital-detail-'+seq++,x,y,w,h,art,'',{kind,renderWidth:width});if(x<2||y<2||x+w>78||y+h>78||roadDistance({x:x+w/2,y:y+h/2})<.7||Math.hypot(x+w/2-40,y+h/2-40)<14.5||map.props.some(o=>o.blocking!==false&&overlaps(p,o,o.kind==='water'?0:.6))||protectedPoints.some(q=>Math.hypot(q.x-x-w/2,q.y-y-h/2)<1.1))return;if(kind==='hedge'){p.atlas='districts';p.art=8;}if(map.props.some(o=>o.kind==='building'&&Math.hypot((o.approach?.x??o.x+o.w/2)-x-w/2,(o.approach?.y??o.y+o.h+.7)-y-h/2)<1.5))return;map.props.push(p);};
 // A planted edge behind both market rows, never in the trading aisle.
 for(let t=12;t<=32;t+=3.4)for(const side of [-1,1]){const x=40-t+side*6,y=40+t+side*6;add(x-.6,y-.6,22,155,'tree',1.2,1.2);}
 for(const pond of CENTRAL_PONDS){for(let x=pond.x-1;x<=pond.x+pond.w;x+=1.5){add(x,pond.y-1,8,88,'hedge');add(x,pond.y+pond.h,8,88,'hedge');}for(let y=pond.y+1;y<pond.y+pond.h;y+=1.5){add(pond.x-1,y,8,88,'hedge');add(pond.x+pond.w,y,8,88,'hedge');}for(const [x,y]of [[pond.x-2,pond.y-2],[pond.x+pond.w+1,pond.y+pond.h+1]])add(x,y,22,145,'tree');}
 for(let t=3;t<77;t+=5)for(const p of [{x:t,y:3},{x:3,y:t},{x:t,y:76},{x:76,y:t}])add(p.x,p.y,22,160,'tree');
 for(const [x,y]of [[33,47],[46,34],[34,28],[28,34],[48,48],[48,52],[52,48],[62,65],[65,62]])add(x,y,23,150);
 // Street trees outside the northern residential avenue and beside the city gate.
 for(let t=20;t<=32;t+=4)for(const side of [-1,1])add(t+side*5,t-side*5,22,150,'tree');
}
