import {coherentPreviewBounds} from '../shared/coherent-animation';
import type {ClipFamily} from '../shared/painted-frame';
import Phaser from 'phaser';
import {HeroRig} from './hero-rig';
import {characterFrames} from '../shared/character-art';
import {attackTiming} from '../shared/attack-animation';
import {derived,type Hero,type Motion} from '../shared/rules';
import {weaponById} from '../shared/weapons';
export interface CharacterPreviewRequest {hero:Hero;canvas:HTMLCanvasElement;facing?:number;action?:'idle'|'walk'|'attack'|'cast'|'hurt'|'dead';time?:number;pose?:number;phase?:number;family?:ClipFamily;part?:string;anchors?:boolean;eyes?:'open'|'closed'|'hurt'}
type Preview={rig:HeroRig;texture:Phaser.GameObjects.RenderTexture;busy:boolean;pending?:CharacterPreviewRequest;disposed?:boolean;marks:Phaser.GameObjects.Graphics};
/** Persistent small render targets for inventory and GM inspection, never a second world/gameplay state. */
export class CharacterPreviewRenderer{
 previews=new Map<HTMLCanvasElement,Preview>();
 constructor(public scene:Phaser.Scene){window.addEventListener('inventory-preview',this.handle);window.addEventListener('character-preview',this.handle);const cleanup=scene.time.addEvent({delay:800,loop:true,callback:()=>{for(const [canvas,preview]of this.previews)if(!canvas.isConnected)this.remove(canvas,preview);}});scene.events.once('shutdown',()=>{cleanup.remove();window.removeEventListener('inventory-preview',this.handle);window.removeEventListener('character-preview',this.handle);for(const [canvas,preview]of this.previews)this.remove(canvas,preview);});}
 handle=(event:Event)=>this.render((event as CustomEvent<CharacterPreviewRequest>).detail);
 remove(canvas:HTMLCanvasElement,p:Preview){p.disposed=true;p.texture.destroy();p.rig.destroy();this.previews.delete(canvas);}
 render(request:CharacterPreviewRequest){const {canvas}=request;if(!canvas?.isConnected)return;let p=this.previews.get(canvas);if(!p){const rig=new HeroRig(this.scene,request.hero);rig.removeFromDisplayList();const texture=this.scene.add.renderTexture(-2000,-2000,canvas.width,canvas.height).setVisible(false),marks=this.scene.add.graphics();rig.add(marks);p={rig,texture,marks,busy:false};this.previews.set(canvas,p);}if(p.busy){p.pending=request;return;}p.busy=true;
 const preview=p,rig=p.rig,hero={...request.hero,appearance:{...request.hero.appearance}},facing=request.facing??1,action=request.pose===15?'dead':request.pose===14?'hurt':request.action??'idle',t=request.time??0;
 if(action==='cast'&&!['staff','wand'].includes(hero.weapon||''))hero.weapon='staff';const weapon=weaponById(hero.weapon),interval=Math.max(300,derived(hero).interval*weapon.speed),timing=attackTiming(weapon.id,interval),index=Math.floor(t/interval);
 const motion:Motion={action:action==='cast'?'attack':action,facing,since:0,until:1e12,weapon:weapon.id};let clock=t;if(action==='attack'||action==='cast'){motion.since=index*interval;motion.until=motion.since+timing.duration;motion.attack={...timing,index,step:index%timing.length,sequence:index+1};}if(action==='hurt')clock=t%500;if(action==='dead')clock=t%1700;
 for(const joint of rig.joints.values())joint.setVisible(true);for(const part of rig.parts.values())part.setVisible(true);rig.hands.setVisible(true);rig.offHands.setVisible(true);rig.weapon.setVisible(true);rig.bowString.setVisible(true);rig.nockedArrow.setVisible(true);rig.currentWeapon='';rig.expressionKey='';rig.expressionOverride=request.eyes??(request.time===undefined?'open':undefined);if(action==='walk')rig.travel=t/1000*derived(hero).speed;
 rig.poseOverride=request.pose;rig.clipPhaseOverride=request.phase;rig.clipFamilyOverride=request.family;rig.updatePose(hero,motion,clock);const part=request.part||'all';if(part!=='all'){
  const visible=part==='head'||part==='hair'?['head','back']:hero.outfitTier==='final'?['body','armR','armL']:['body'];for(const [name,joint]of rig.joints)joint.setVisible(visible.includes(name));rig.weapon.setVisible(false);rig.secondary.setVisible(false);rig.bowString.setVisible(false);rig.nockedArrow.setVisible(false);rig.hands.setVisible(hero.outfitTier==='final'&&['body','outfit'].includes(part));rig.offHands.setVisible(hero.outfitTier==='final'&&['body','outfit'].includes(part));
  if(part==='hair')for(const name of ['base','eyes','lids'])rig.parts.get('head-'+name)!.setVisible(false);
 }
 (rig.getByName('ground-shadow') as Phaser.GameObjects.Ellipse)?.setVisible(['all','outfit','body'].includes(part));p.marks.clear();if(request.anchors){
 const neck=rig.frameMeta.neck,angle=rig.frameMeta.headRotation??0;p.marks.lineStyle(.7,0xf3d16d,1).strokeCircle(neck.x,neck.y,1.8).lineBetween(neck.x,neck.y,neck.x+Math.sin(angle)*12,neck.y-Math.cos(angle)*12);
 for(const [hand,color]of [['right',0xf16f63],['left',0x5ba8ee]] as const){const q=rig.frameMeta.palms[hand];p.marks.lineStyle(.7,color,1).strokeRect(q.x-2,q.y-2,4,4);}
 const q=rig.frameMeta.palms.right,a=rig.weapon.rotation;p.marks.lineStyle(.65,0x42c99c,1).lineBetween(q.x-Math.sin(a)*4,q.y+Math.cos(a)*4,q.x+Math.sin(a)*8,q.y-Math.cos(a)*8);rig.bringToTop(p.marks);
 }
 const frames=characterFrames(hero.race,hero.appearance.gender,hero.appearance.hair,facing),defaultScale=canvas.width>300?3.5:3;
 // Bounds come from the whole clip, not a moving blade tip. This remains constant during playback.
 const bounds=rig.frameMeta.family?coherentPreviewBounds(frames.body,rig.frameMeta.family,rig.weapon.height,part==='all',action==='idle'&&request.phase===undefined&&request.pose===undefined):{extent:part==='all'&&action==='attack'?Math.max(32,rig.weapon.height*.85+24):32,height:110};
 const scale=Math.min(defaultScale,(canvas.width-24)/(bounds.extent*2),(canvas.height-50)/bounds.height);rig.setScale(scale);p.texture.clear().draw(rig,canvas.width/2,canvas.height-34);
 canvas.dataset.previewScale=scale.toFixed(6);canvas.dataset.clipFamily=String(rig.frameMeta.family??'legacy');canvas.dataset.clipPhase=String(rig.frameMeta.phase??-1);canvas.dataset.headRotation=String(rig.frameMeta.headRotation??0);canvas.dataset.headScale=String(rig.joints.get('head')!.scaleX);
 canvas.dataset.artReady=String(rig.getData('artReady'));canvas.dataset.outfitTier=hero.outfitTier||'starter';canvas.dataset.headArt='painted-hd';canvas.dataset.bodyFrame=String(rig.frameMeta.id);canvas.dataset.headFrame=String(frames.head);canvas.dataset.facing=String(facing);canvas.dataset.pose=String(rig.pose);canvas.dataset.expression=String(rig.getData('expression'));
 p.texture.snapshot(image=>{if(!preview.disposed&&canvas.isConnected){const ctx=canvas.getContext('2d')!;ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(image as HTMLImageElement,0,0);canvas.parentElement?.classList.add('rig-ready');}preview.busy=false;if(preview.pending&&!preview.disposed){const next=preview.pending;preview.pending=undefined;this.render(next);}});
 }
}
