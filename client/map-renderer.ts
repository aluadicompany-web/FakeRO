import {capitalFloor} from './central-renderer';
import {landscape,landscapeRandom} from '../shared/landscape';
import Phaser from 'phaser';
import {MAP_BY_ID,findPath,nearestWalkable,type GameMap,type Prop} from '../shared/maps';
export const TILE=48;
export const iso=(x:number,y:number)=>({x:(x-y)*TILE,y:(x+y)*TILE*.5});
const biomeIndex={grass:0,snow:1,ember:2,rune:3,ore:4,marsh:5};
export const palettes={grass:[0x3f8051,0x71ad59,0xb4d878],snow:[0x8baebc,0xc4dce1,0xf0f7ed],ember:[0x614c54,0x8d5e50,0xd79b64],rune:[0x62658e,0x9297bd,0xc4cda3],ore:[0x877359,0xb59a6b,0xe0c38a],marsh:[0x365e5d,0x5a8a76,0x94b18b]};
export function sliceAtlas(scene:Phaser.Scene,key:string,cols:number,rows:number){
 const source=scene.textures.get(key).getSourceImage() as HTMLImageElement,w=source.width,h=source.height;const scratch=document.createElement('canvas');scratch.width=w;scratch.height=h;const ctx=scratch.getContext('2d')!;ctx.drawImage(source,0,0);const pixels=ctx.getImageData(0,0,w,h),labels=new Int32Array(w*h),queue=new Int32Array(w*h);
 const components:{minX:number;minY:number;maxX:number;maxY:number;slot:number;count:number}[]=[{minX:0,minY:0,maxX:0,maxY:0,slot:-1,count:0}];
 // Follow alpha-connected silhouettes across nominal cell edges; never cut a tusk or roof.
 for(let seed=0;seed<labels.length;seed++){if(labels[seed]||pixels.data[seed*4+3]<160)continue;const id=components.length;let head=0,tail=1,sumX=0,sumY=0;queue[0]=seed;labels[seed]=id;const component={minX:w,minY:h,maxX:0,maxY:0,slot:0,count:0};
  while(head<tail){const k=queue[head++],x=k%w,y=Math.floor(k/w);component.minX=Math.min(component.minX,x);component.maxX=Math.max(component.maxX,x);component.minY=Math.min(component.minY,y);component.maxY=Math.max(component.maxY,y);sumX+=x;sumY+=y;component.count++;
   for(const next of [x>0?k-1:-1,x<w-1?k+1:-1,y>0?k-w:-1,y<h-1?k+w:-1])if(next>=0&&!labels[next]&&pixels.data[next*4+3]>=160){labels[next]=id;queue[tail++]=next;}
  }
  component.slot=Math.min(rows-1,Math.floor(sumY/component.count/h*rows))*cols+Math.min(cols-1,Math.floor(sumX/component.count/w*cols));components.push(component);
 }
 for(let slot=0;slot<cols*rows;slot++){const chunks=components.filter(c=>c.slot===slot&&c.count>=16);if(!chunks.length)continue;const minX=Math.min(...chunks.map(c=>c.minX)),minY=Math.min(...chunks.map(c=>c.minY)),maxX=Math.max(...chunks.map(c=>c.maxX)),maxY=Math.max(...chunks.map(c=>c.maxY));const canvas=document.createElement('canvas');canvas.width=maxX-minX+5;canvas.height=maxY-minY+5;const dest=canvas.getContext('2d')!,out=dest.createImageData(canvas.width,canvas.height);
  for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){const k=y*w+x,label=labels[k],component=components[label];if(label&&component.slot===slot&&component.count>=16){const q=((y-minY+2)*canvas.width+x-minX+2)*4;out.data.set(pixels.data.subarray(k*4,k*4+4),q);}}
  dest.putImageData(out,0,0);scene.textures.addCanvas(`${key}-${slot}`,canvas);
 }
}

function material(scene:Phaser.Scene,index:number,size=128){const source=scene.textures.get('materials').getSourceImage() as HTMLImageElement;const patch=document.createElement('canvas');patch.width=size;patch.height=size;patch.getContext('2d')!.drawImage(source,index%3*source.width/3,Math.floor(index/3)*source.height/3,source.width/3,source.height/3,0,0,size,size);return patch;}
function wallTextures(scene:Phaser.Scene,capital=false){for(const direction of [1,-1]){const key=`wall-${capital?'capital-':''}${direction}`;if(scene.textures.exists(key))continue;const height=capital?86:38,top=capital?10:0,canvas=document.createElement('canvas');canvas.width=50;canvas.height=height+top+26;const c=canvas.getContext('2d')!;c.setTransform(48/128,direction*24/128,0,height/128,0,top+(direction===1?0:24));c.drawImage(material(scene,3),0,0);if(capital){c.setTransform(1,0,0,1,0,0);for(const t of [.05,.4,.75]){const x=48*t,y=top+(direction===1?24*t:24-24*t);c.fillStyle='#e3dfc8';c.beginPath();c.moveTo(x,y-9);c.lineTo(x+9,y-9+direction*4.5);c.lineTo(x+9,y+direction*4.5+2);c.lineTo(x,y+2);c.closePath();c.fill();c.strokeStyle='#8b947f';c.lineWidth=.7;c.stroke();}}scene.textures.addCanvas(key,canvas);}}
function ground(scene:Phaser.Scene,map:GameMap){if(scene.textures.exists('ground-active'))scene.textures.remove('ground-active');const canvas=document.createElement('canvas');canvas.width=map.size*48;canvas.height=map.size*24;const c=canvas.getContext('2d')!;const source=scene.textures.get('terrain').getSourceImage() as HTMLImageElement;const sw=Math.floor(source.width/3),sh=Math.floor(source.height/2),idx=biomeIndex[map.biome];const patch=document.createElement('canvas');patch.width=220;patch.height=220;patch.getContext('2d')!.drawImage(source,(idx%3)*sw,Math.floor(idx/3)*sh,sw,sh,0,0,220,220);
 c.beginPath();c.moveTo(canvas.width/2,0);c.lineTo(canvas.width,canvas.height/2);c.lineTo(canvas.width/2,canvas.height);c.lineTo(0,canvas.height/2);c.closePath();c.clip();c.fillStyle=c.createPattern(patch,'repeat')!;c.fillRect(0,0,canvas.width,canvas.height);
 const random=landscapeRandom(map.id+'-ground'),config=landscape(map);
 const pos=(x:number,y:number)=>({x:map.size*24+(x-y)*24,y:(x+y)*12});
 if(map.kind.includes('city')){const index=map.biome==='ember'?1:map.biome==='rune'?5:map.biome==='marsh'?4:map.biome==='ore'?2:0;c.fillStyle=c.createPattern(material(scene,index,map.id==='central_city'?80:110),'repeat')!;c.fillRect(0,0,canvas.width,canvas.height);}
 if(map.id==='central_city')capitalFloor(c,map,(index,size)=>material(scene,index,size));
 // Uneven soil, moss and sunlight break up the repeating terrain without covering roads.
 const hues={grass:['#b2cf6c','#426b41','#e4d6a4'],snow:['#ffffff','#93b6c5','#c9dfd6'],ember:['#bf854f','#383c3e','#d6b179'],rune:['#b5b5df','#555f81','#b9c9a6'],ore:['#cdbb86','#827455','#e2ce9f'],marsh:['#92ab62','#244c48','#b5c49b']}[map.biome];
 if(!config.city)for(let i=0;i<260;i++){const q=pos(random()*28,random()*28),r=12+random()*53;c.save();c.translate(q.x,q.y);c.scale(1,.5);const gradient=c.createRadialGradient(0,0,0,0,0,r);gradient.addColorStop(0,hues[i%3]+'88');gradient.addColorStop(1,hues[i%3]+'00');c.fillStyle=gradient;c.fillRect(-r,-r,r*2,r*2);c.restore();}
 for(const tree of map.props.filter(p=>p.kind==='tree')){const q=pos(tree.x+.5,tree.y+.5);c.fillStyle=map.biome==='snow'?'#688e9d22':'#25473328';c.beginPath();c.ellipse(q.x+8,q.y,25,10,-.2,0,Math.PI*2);c.fill();}
 for(const pond of map.props.filter(p=>p.kind==='water')){const corners=[pos(pond.x,pond.y),pos(pond.x+pond.w,pond.y),pos(pond.x+pond.w,pond.y+pond.h),pos(pond.x,pond.y+pond.h)];c.beginPath();const start={x:(corners[3].x+corners[0].x)/2,y:(corners[3].y+corners[0].y)/2};c.moveTo(start.x,start.y);corners.forEach((q,i)=>{const next=corners[(i+1)%4];c.quadraticCurveTo(q.x,q.y,(q.x+next.x)/2,(q.y+next.y)/2);});c.closePath();c.lineWidth=8;c.strokeStyle=map.biome==='ember'?'#936745':map.biome==='snow'?'#dfebeb':'#638657';c.stroke();c.fillStyle=c.createPattern(material(scene,map.biome==='ember'?8:map.biome==='marsh'?7:6),'repeat')!;c.fill();}
 const roadPattern=c.createPattern(material(scene,map.biome==='snow'?0:2),'repeat')!,routes=map.portals.map(g=>[pos(g.x,g.y),...findPath(map,g,nearestWalkable(map,{x:14.5,y:14.5})).map(p=>pos(p.x,p.y))]);c.lineCap='round';c.lineJoin='round';
 const trace=()=>{if(map.id==='central_city')return;for(const route of routes){c.beginPath();route.forEach((q,i)=>i?c.lineTo(q.x,q.y):c.moveTo(q.x,q.y));c.stroke();}};
 const earth=map.biome==='snow'?'#d7e5dc':map.biome==='marsh'?'#918b69':map.biome==='ember'?'#9a7d65':'#b3a17b';
 for(const width of [34,30,25]){c.lineWidth=width;c.globalAlpha=width===34?.15:width===30?.35:1;c.strokeStyle=config.city?roadPattern:earth;trace();}c.globalAlpha=1;
 if(!config.city){c.lineWidth=22;c.globalAlpha=.18;c.strokeStyle=roadPattern;trace();c.globalAlpha=1;for(const route of routes)for(const q of route)for(let i=0;i<6;i++){const x=q.x+(random()-.5)*20,y=q.y+(random()-.5)*11;c.fillStyle=i%2?'#fff0cb55':'#544d3940';c.beginPath();c.ellipse(x,y,.5+random()*1.2,.4+random()*.6,0,0,Math.PI*2);c.fill();}}
 scene.textures.addCanvas('ground-active',canvas);return scene.add.image(0,0,'ground-active').setOrigin(.5,0).setDisplaySize(map.size*96,map.size*48).setDepth(-10000);
}
function propView(scene:Phaser.Scene,map:GameMap,p:Prop){const point=iso(p.x+p.w/2,p.y+p.h/2),group=scene.add.container(point.x,point.y).setDepth(point.y+24);const colors=palettes[map.biome];
 if(p.kind==='building'||p.kind==='ruin'){const width=p.id.startsWith('capital-home')?260:(p.w+p.h)*34;const image=scene.add.image(0,0,`${p.atlas||'buildings'}-${p.art}`).setOrigin(.5,.9);image.setDisplaySize(width,width*image.height/image.width);group.add(scene.add.ellipse(7,6,width*.65,width*.24,0x284148,.25));group.add(image);group.setData('occluder',{x:point.x,y:point.y,width,height:image.displayHeight});if(p.service){group.add(scene.add.text(0,22,`${p.service==='warp'?'✦':p.service==='bind'?'◆':p.service==='tower'?'ᛟ':'•'} ${p.name}`,{fontFamily:'sans-serif',fontSize:p.marketSlot?'10px':'13px',color:'#fff7db',backgroundColor:'#264657e0',padding:{x:7,y:4}}).setOrigin(.5,0));}}
 else if(p.kind==='decor'){const image=scene.add.image(0,0,`${p.atlas||'capital'}-${p.art}`).setOrigin(.5,.92),width=p.marketSlot?150:p.atlas==='citylife'?[190,180,72,75,76,80,70,75,65,75,58,65][p.art]:[220,70,105,140,105,88,115,66,145,78,100,230][p.art]||80;image.setFlipX(!!p.flipX);image.setDisplaySize(width,width*image.height/image.width);group.add(scene.add.ellipse(5,4,width*.55,width*.18,0x263e37,.18));if(!p.atlas&&p.art===1)group.add(scene.add.ellipse(0,2,50,24,0xffd78b,.15));group.add(image);if(image.displayHeight>80)group.setData('occluder',{x:point.x,y:point.y,width,height:image.displayHeight});}
 else if(p.kind==='hedge'){const image=scene.add.image(0,0,'districts-8').setOrigin(.5,.9);image.setDisplaySize(92,92*image.height/image.width);group.add(image);}
 else if(p.kind==='water'){const g=scene.add.graphics();group.add(g);const corners=[iso(p.x,p.y),iso(p.x+p.w,p.y),iso(p.x+p.w,p.y+p.h),iso(p.x,p.y+p.h)].map(q=>({x:q.x-point.x,y:q.y-point.y}));g.lineStyle(2,0xe8f4d7,.6);for(let i=0;i<4;i++)g.lineBetween(-35+i*15,-13+i*6,10+i*15,-13+i*6);group.setDepth(-500);}
 else {const random=landscapeRandom(map.id+p.id),index=p.kind==='tree'?(map.biome==='grass'?(random()<.24?1:0):({snow:2,ember:4,rune:3,ore:1,marsh:5} as Record<string,number>)[map.biome]):map.biome==='snow'?8:map.biome==='ember'?9:map.biome==='ore'||p.kind==='crystal'?10:6;const image=scene.add.image(0,0,p.atlas?`${p.atlas}-${p.art}`:`nature-${index}`).setOrigin(.5,.94);const width=p.kind==='tree'?(landscape(map).forest?145:115)+random()*55:65+random()*22;image.setFlipX(random()<.5);image.setDisplaySize(width,width*image.height/image.width);group.add(scene.add.ellipse(6,5,width*.55,width*.18,0x284148,.2));group.add(image);if(map.biome==='snow'&&p.kind!=='tree')image.setTint(0xc7e2ef);group.setData('occluder',{x:point.x,y:point.y,width,height:image.displayHeight});}

 return group;
}
function undergrowth(scene:Phaser.Scene,map:GameMap){const views:Phaser.GameObjects.GameObject[]=[];if(map.id==='central_city')return views;const config=landscape(map),random=landscapeRandom(map.id+'-plants');const center=nearestWalkable(map,{x:14.5,y:14.5}),roads=map.portals.flatMap(g=>findPath(map,g,center));
 for(let i=0;i<config.details*6&&views.length<config.details;i++){const x=1.5+random()*25,y=1.5+random()*25;if(map.portals.some(g=>Math.hypot(x-g.x,y-g.y)<2.4)||Math.hypot(x-map.spawn.x,y-map.spawn.y)<2||roads.some(p=>Math.hypot(x-p.x,y-p.y)<.95)||map.props.some(p=>p.kind!=='tree'&&x>p.x-.5&&x<p.x+p.w+.5&&y>p.y-.5&&y<p.y+p.h+.5)||map.boss&&Math.hypot(x-14.5,y-10.5)<5)continue;
  // Town gardens sit near the perimeter, preserving plazas and service entrances.
  if(config.city&&x>5&&x<23&&y>5&&y<23)continue;
  const index=map.biome==='grass'?(random()<.55?7:6):map.biome==='snow'?8:map.biome==='ember'?9:map.biome==='ore'?10:map.biome==='marsh'?11:random()<.55?6:10,p=iso(x,y),width=(config.city?35:38)+random()*35;const plant=scene.add.image(p.x,p.y,`nature-${index}`).setOrigin(.5,.9).setDepth(p.y+2).setFlipX(random()<.5);plant.setDisplaySize(width,width*plant.height/plant.width);views.push(plant);
 }
 return views;
}
export function drawMap(scene:Phaser.Scene,mapId:string){const map=MAP_BY_ID.get(mapId)!,views:Phaser.GameObjects.GameObject[]=[];wallTextures(scene,map.id==='central_city');views.push(ground(scene,map),...undergrowth(scene,map));for(const p of map.props)views.push(propView(scene,map,p));
 if(map.kind.includes('city')){
  for(const side of [0,1,2,3])for(let cell=1;cell<map.size-1;cell++){
   if(Math.abs(cell-(map.id==='central_city'?32:14))<3&&(map.id!=='central_city'||side===0))continue;
   const a=side===0?iso(cell,1):side===1?iso(map.size-1,cell):side===2?iso(cell,map.size-1):iso(1,cell),b=side===0?iso(cell+1,1):side===1?iso(map.size-1,cell+1):side===2?iso(cell+1,map.size-1):iso(1,cell+1);
   const wall=scene.add.image(Math.min(a.x,b.x),Math.min(a.y,b.y)-(map.id==='central_city'?96:38),`wall-${map.id==='central_city'?'capital-':''}${(b.x-a.x)*(b.y-a.y)>0?1:-1}`).setOrigin(0,0).setDepth(Math.max(a.y,b.y)+20);if(map.id==='central_city')wall.setData('occluder',{x:(a.x+b.x)/2,y:Math.max(a.y,b.y),width:58,height:96});if(map.biome==='ember')wall.setTint(0xaaa0a6);views.push(wall);
  }
 }
 for(const gate of map.portals){const p=iso(gate.x,gate.y),target=MAP_BY_ID.get(gate.to)!;const color=target.rule==='red'?0xe25854:target.rule==='home'?0xe7bc70:0x7bd5d7;const ring=scene.add.ellipse(p.x,p.y,75,38,0xeffff3,.45).setStrokeStyle(3,color).setDepth(p.y);const icon=scene.add.image(p.x,p.y-7,`portals-${biomeIndex[map.biome]}`).setOrigin(.5,.65).setDisplaySize(100,70).setDepth(p.y+1);const label=scene.add.text(p.x,p.y+23,gate.name,{fontFamily:'sans-serif',fontSize:'12px',color:'#fff9de',backgroundColor:'#274957e8',padding:{x:8,y:5}}).setOrigin(.5,0).setDepth(p.y+60);views.push(ring,icon,label);if(map.id==='central_city'){const arch=scene.add.image(p.x,p.y-12,'capital-11').setOrigin(.5,.91);arch.setDisplaySize(235,235*arch.height/arch.width).setDepth(p.y+25);views.push(arch);}}
 if(map.id==='central_city'){for(const sign of [{x:28,y:40,text:'← ตลาด Silfr · 24 แผง'},{x:37,y:40,text:'ย่านช่างและวาร์ป →'},{x:32,y:25,text:'↑ หอผนึกรากโลก'},{x:32,y:48,text:'ย่านที่พักและสวน ↓'}]){const p=iso(sign.x,sign.y);views.push(scene.add.text(p.x,p.y-32,sign.text,{fontFamily:'sans-serif',fontSize:'14px',color:'#f4e2ae',backgroundColor:'#334a3fec',padding:{x:10,y:6}}).setOrigin(.5).setDepth(p.y+60));}}
 if(map.kind.includes('city')){const p=iso(map.spawn.x,map.spawn.y);views.push(scene.add.ellipse(p.x,p.y,100,50,0x8cf5d0,.22).setStrokeStyle(2,0xc6fff0,.9).setDepth(p.y-1));}
 return views;
}
