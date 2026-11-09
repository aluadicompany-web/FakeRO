import Phaser from 'phaser';
import {HeroRig} from './hero-rig';
import {characterFrames} from '../shared/character-art';
import {attackTiming} from '../shared/attack-animation';
import {derived,type Hero,type Motion} from '../shared/rules';
import {weaponById} from '../shared/weapons';
export interface CharacterPreviewRequest {hero:Hero;canvas:HTMLCanvasElement;facing?:number;action?:'idle'|'walk'|'attack'|'cast'|'hurt'|'dead';time?:number;part?:string;anchors?:boolean;eyes?:'open'|'closed'|'hurt'}
type Preview={rig:HeroRig;texture:Phaser.GameObjects.RenderTexture;busy:boolean;pending?:CharacterPreviewRequest;disposed?:boolean;marks:Phaser.GameObjects.Graphics};
/** Persistent small render targets for inventory and GM inspection, never a second world/gameplay state. */
export class CharacterPreviewRenderer{
 previews=new Map<HTMLCanvasElement,Preview>();
 constructor(public scene:Phaser.Scene){window.addEventListener('inventory-preview',this.handle);window.addEventListener('character-preview',this.handle);const cleanup=scene.time.addEvent({delay:800,loop:true,callback:()=>{for(const [canvas,preview]of this.previews)if(!canvas.isConnected)this.remove(canvas,preview);}});scene.events.once('shutdown',()=>{cleanup.remove();window.removeEventListener('inventory-preview',this.handle);window.removeEventListener('character-preview',this.handle);for(const [canvas,preview]of this.previews)this.remove(canvas,preview);});}
 handle=(event:Event)=>this.render((event as CustomEvent<CharacterPreviewRequest>).detail);
 remove(canvas:HTMLCanvasElement,p:Preview){p.disposed=true;p.texture.destroy();p.rig.destroy();this.previews.delete(canvas);}
 render(request:CharacterPreviewRequest){const {canvas}=request;if(!canvas?.isConnected)return;let p=this.previews.get(canvas);if(!p){const rig=new HeroRig(this.scene,request.hero);rig.removeFromDisplayList();const texture=this.scene.add.renderTexture(-2000,-2000,canvas.width,canvas.height).setVisible(false),marks=this.scene.add.graphics();rig.add(marks);p={rig,texture,marks,busy:false};this.previews.set(canvas,p);}if(p.busy){p.pending=request;return;}p.busy=true;
 const preview=p,rig=p.rig,hero={...request.hero,appearance:{...request.hero.appearance}},facing=request.facing??1,action=request.action??'idle',t=request.time??0;
 if(action==='cast'&&!['staff','wand'].includes(hero.weapon||''))hero.weapon='staff';const weapon=weaponById(hero.weapon),interval=Math.max(300,derived(hero).interval*weapon.speed),timing=attackTiming(weapon.id,interval),index=Math.floor(t/interval);
 const motion:Motion={action:action==='cast'?'attack':action,facing,since:0,until:1e12,weapon:weapon.id};let clock=t;if(action==='attack'||action==='cast'){motion.since=index*interval;motion.until=motion.since+timing.duration;motion.attack={...timing,index,step:index%timing.length,sequence:index+1};}if(action==='hurt')clock=t%500;if(action==='dead')clock=t%1700;
 for(const joint of rig.joints.values())joint.setVisible(true);for(const part of rig.parts.values())part.setVisible(true);rig.hands.setVisible(true);rig.weapon.setVisible(true);rig.bowString.setVisible(true);rig.nockedArrow.setVisible(true);rig.currentWeapon='';rig.expressionKey='';rig.expressionOverride=request.eyes??(request.time===undefined?'open':undefined);if(action==='walk')rig.travel=t/1000*derived(hero).speed;
 rig.updatePose(hero,motion,clock);const part=request.part||'all';if(part!=='all'){
  const visible=part==='head'||part==='hair'?['head','back']:['body'];for(const [name,joint]of rig.joints)joint.setVisible(visible.includes(name));rig.weapon.setVisible(false);rig.secondary.setVisible(false);rig.bowString.setVisible(false);rig.nockedArrow.setVisible(false);rig.hands.setVisible(false);
  if(part==='hair')for(const name of ['base','eyes','lids'])rig.parts.get('head-'+name)!.setVisible(false);
 }
 (rig.getByName('ground-shadow') as Phaser.GameObjects.Ellipse)?.setVisible(['all','outfit','body'].includes(part));p.marks.clear();if(request.anchors){p.marks.lineStyle(.6,0x1bbca1,.95);for(const point of [rig.frameMeta.neck,...Object.values(rig.frameMeta.palms)]){p.marks.strokeCircle(point.x,point.y,1.4);p.marks.lineBetween(point.x-3,point.y,point.x+3,point.y);p.marks.lineBetween(point.x,point.y-3,point.x,point.y+3);}rig.bringToTop(p.marks);}
 const defaultScale=canvas.width>300?3.5:3,tips=part==='all'?[rig.weapon,...(rig.secondary.visible?[rig.secondary]:[])].filter(w=>w.visible).map(w=>w.tipWorld()):[],extent=Math.max(32,...tips.map(p=>Math.abs(p.x)+8)),height=Math.max(100,...tips.map(p=>-p.y+8)),scale=Math.min(defaultScale,(canvas.width-24)/(extent*2),(canvas.height-50)/height);rig.setScale(scale);p.texture.clear().draw(rig,canvas.width/2,canvas.height-34);const frames=characterFrames(hero.race,hero.appearance.gender,hero.appearance.hair,facing);canvas.dataset.bodyFrame=String(rig.frameMeta.id);canvas.dataset.headFrame=String(frames.head);canvas.dataset.facing=String(facing);canvas.dataset.pose=String(rig.pose);canvas.dataset.expression=String(rig.getData('expression'));
 p.texture.snapshot(image=>{if(!preview.disposed&&canvas.isConnected){const ctx=canvas.getContext('2d')!;ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(image as HTMLImageElement,0,0);canvas.parentElement?.classList.add('rig-ready');}preview.busy=false;if(preview.pending&&!preview.disposed){const next=preview.pending;preview.pending=undefined;this.render(next);}});
 }
}
