import {rootTerrain} from './root-terrain';
import {CENTRAL_GARDENS,CENTRAL_PLAZA,CENTRAL_MARKET_SLOTS,CENTRAL_MARKET_LANE} from '../shared/central';
import {findPath,propEntrance,type GameMap} from '../shared/maps';
export function capitalFloor(c:CanvasRenderingContext2D,map:GameMap,material:(index:number,size?:number)=>HTMLCanvasElement,details?:(index:number)=>HTMLCanvasElement){const pos=(x:number,y:number)=>({x:map.size*24+(x-y)*24,y:(x+y)*12});
 const area=(x:number,y:number,w:number,h:number)=>{const points=[pos(x,y),pos(x+w,y),pos(x+w,y+h),pos(x,y+h)];c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();};
 area(6,8,19,43);c.fillStyle=c.createPattern(material(2,90),'repeat')!;c.fill();c.strokeStyle='#c6aa77';c.lineWidth=4;c.stroke();
 for(const garden of CENTRAL_GARDENS){area(garden.x,garden.y,garden.w,garden.h);c.fillStyle='#648956';c.fill();c.strokeStyle='#eee4c6';c.lineWidth=3;c.stroke();}
 for(const b of map.props.filter(p=>p.kind==='building')){area(b.x-.3,b.y-.3,b.w+.6,b.h+.9);c.fillStyle=c.createPattern(material(b.service?2:1,95),'repeat')!;c.fill();c.strokeStyle='#b4a17e';c.lineWidth=2;c.stroke();}
 // Broad boulevards and a ring street read clearly above narrower market aisles.
 const line=(points:{x:number;y:number}[],width:number,color:string|CanvasPattern)=>{c.lineWidth=width;c.strokeStyle=color;c.beginPath();points.map(p=>pos(p.x,p.y)).forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();};c.lineJoin='round';c.lineCap='round';
 for(const width of [66,60,50]){const style=width===66?'#9c8966':width===60?'#e9d7a9':c.createPattern(material(0,78),'repeat')!;line([{x:32.5,y:2.5},{x:32.5,y:13}],width,style);line([{x:32.5,y:23},{x:32.5,y:60}],width,style);line([{x:3,y:42},{x:61,y:42}],width,style);}
 for(const width of [25,20]){const style=width===25?'#c4ad7a':c.createPattern(material(0,90),'repeat')!;line([{x:2.5,y:2.5},{x:61.5,y:2.5},{x:61.5,y:61.5},{x:2.5,y:61.5},{x:2.5,y:2.5}],width,style);}
 const lane=CENTRAL_MARKET_LANE;area(lane.x,lane.y,lane.w,lane.h);c.fillStyle=c.createPattern(material(0,78),'repeat')!;c.fill();c.strokeStyle='#cbb587';c.lineWidth=4;c.stroke();
 for(const slot of CENTRAL_MARKET_SLOTS){area(slot.x-.1,slot.y-.1,slot.w+.2,slot.h+.5);c.save();c.globalAlpha=.35;c.fillStyle=c.createPattern(material(4,80),'repeat')!;c.fill();c.restore();}
 // Service and storefront walks always follow the same collision-aware routes as gameplay.
 for(const goal of [...map.portals,...map.props.filter(p=>p.service&&!p.marketSlot).map(propEntrance)]){const route=findPath(map,map.spawn,goal);line([map.spawn,...route],13,'#e5d6b2');}
 const plaza=pos(CENTRAL_PLAZA.x,CENTRAL_PLAZA.y);for(const [r,color]of [[270,'#ad946a'],[263,'#eadbb8'],[250,'#8faaa7'],[243,'#eee4cd']]as const){c.fillStyle=color;c.beginPath();c.ellipse(plaza.x,plaza.y,r,r*.5,0,0,Math.PI*2);c.fill();}
 c.save();c.beginPath();c.ellipse(plaza.x,plaza.y,242,121,0,0,Math.PI*2);c.clip();c.globalAlpha=.2;c.fillStyle=c.createPattern(material(0,96),'repeat')!;c.fillRect(plaza.x-243,plaza.y-122,486,244);c.restore();
 const colors=['#c85d4c','#579655','#6aaacb','#9772b6','#c4a14b','#424852'];for(let i=0;i<6;i++){const angle=i*Math.PI/3;c.fillStyle=colors[i];c.beginPath();c.ellipse(plaza.x+Math.cos(angle)*222,plaza.y+Math.sin(angle)*111,13,6.5,0,0,Math.PI*2);c.fill();}
 rootTerrain(c,map,details);
 const arrival=pos(map.spawn.x,map.spawn.y);c.strokeStyle='#b9a06b';c.lineWidth=3;c.beginPath();c.ellipse(arrival.x,arrival.y,55,27.5,0,0,Math.PI*2);c.stroke();
}
