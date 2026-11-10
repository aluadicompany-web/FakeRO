import {STARTER_HEAD_SCALE,STARTER_HEAD_OVERLAP,starterHeadRotation,starterTwoHandGrip} from '../shared/starter-motion';
import Phaser from 'phaser';
import {holdingBody,holdingPose,holdingStyle,holdingLayers} from '../shared/weapon-holding';
import {finalBodyFrame,finalBodyTexture} from '../shared/final-animation';
import {coherentFamily,coherentFrame,coherentLogicalPose,coherentPhase,manualCoherentFrame} from '../shared/coherent-animation';
import type {ClipFamily,PaintedFrame} from '../shared/painted-frame';
import {offhandRestAngle,groundSafeCarryAngle} from '../shared/hero-pose';
import hd from '../shared/heads-hd.json';
import {HAIR_COLORS,EYE_COLORS} from '../shared/appearance';
import {characterFrames,CHARACTER_ART_VERSION,characterExpression} from '../shared/character-art';
import {FRAME_ART_ROOT,bodyPoseFrame,spritePose,frameWeaponAngle} from '../shared/character-animation';
import {attackTiming} from '../shared/attack-animation';
import type {Hero,Motion} from '../shared/rules';
import {HeldWeapon,preloadEquipmentArt} from './weapon-art';
export function preloadHeroArt(scene:Phaser.Scene){
 preloadEquipmentArt(scene);
 for(const sex of ['male','female']){
  scene.load.atlas('character-body-'+sex,FRAME_ART_ROOT+'body-'+sex+'.webp',FRAME_ART_ROOT+'body-'+sex+'.json');
  scene.load.atlas('holding-body-'+sex,'/art/holding-bodies/'+sex+'.webp','/art/holding-bodies/'+sex+'.json');
  scene.load.atlas('head-hd-'+sex,`/art/heads-hd/head-${sex}.webp`,`/art/heads-hd/head-${sex}.json`);
 }
}
const queued=new WeakMap<Phaser.Scene,Set<string>>();
function finalArtReady(scene:Phaser.Scene,race:string,gender:string){
 const key=finalBodyTexture(race,gender);if(scene.textures.exists(key))return true;
 let set=queued.get(scene);if(!set){set=new Set();queued.set(scene,set);}
 if(!set.has(key)){set.add(key);scene.load.atlas(key,`/art/final-frames/${race}-${gender}.webp`,`/art/final-frames/${race}-${gender}.json`);if(!scene.load.isLoading())scene.load.start();}
 return false;
}
/** Painted body clips; modular heads pivot at the nape and actual finger layers cover the grip. */
export class HeroRig extends Phaser.GameObjects.Container{
 joints=new Map<string,Phaser.GameObjects.Container>();parts=new Map<string,Phaser.GameObjects.Image>();
 weapon:HeldWeapon;secondary:HeldWeapon;bowString:Phaser.GameObjects.Graphics;nockedArrow:Phaser.GameObjects.Graphics;
 bodyImage:Phaser.GameObjects.Image;hands:Phaser.GameObjects.Image;offHands:Phaser.GameObjects.Image;
 headLayers=new Map<string,Phaser.GameObjects.Image>();facing=1;currentWeapon='';expressionKey='';expressionOverride?:'open'|'closed'|'hurt';
 hero:Hero;travel=0;lastGround?:{x:number;y:number;map:string};wasWalking=false;pose=0;poseOverride?:number;clipPhaseOverride?:number;clipFamilyOverride?:ClipFamily;
 frameMeta:PaintedFrame=bodyPoseFrame(17,0);
 constructor(scene:Phaser.Scene,h:Hero){
  super(scene,0,0);this.hero=h;scene.add.existing(this);this.setData('characterArt',CHARACTER_ART_VERSION);
  this.add(scene.add.ellipse(0,0,29,12,0x173e3a,.25).setName('ground-shadow'));
  for(const name of ['back','body','armR','armL','head']){const c=scene.add.container();this.joints.set(name,c);this.add(c);}
  this.bodyImage=scene.add.image(0,0,'__WHITE').setOrigin(.5,1);this.joints.get('body')!.add(this.bodyImage);this.parts.set('body-body',this.bodyImage);
  this.weapon=new HeldWeapon(scene);this.secondary=new HeldWeapon(scene);this.joints.get('armR')!.add(this.weapon);this.joints.get('armL')!.add(this.secondary);
  this.hands=scene.add.image(0,0,'__WHITE').setOrigin(.5,1);this.offHands=scene.add.image(0,0,'__WHITE').setOrigin(.5,1).setVisible(false);this.add([this.hands,this.offHands]);
  for(const name of ['base','hair','eyes','lids']){const im=scene.add.image(0,0,'__WHITE').setOrigin(.5,1);this.joints.get('head')!.add(im);this.headLayers.set(name,im);this.parts.set('head-'+name,im);}
  const back=scene.add.image(0,0,'__WHITE').setOrigin(.5,1);this.joints.get('back')!.add(back);this.headLayers.set('back',back);this.parts.set('back-hair',back);
  this.bowString=scene.add.graphics();this.nockedArrow=scene.add.graphics();this.add([this.bowString,this.nockedArrow]);this.updatePose(h,undefined,0);
 }
 updatePose(h:Hero,motion:Motion|undefined,now:number){
  this.hero=h;this.facing=motion?.facing??this.facing;const facing=this.facing;
  const action=motion&&motion.until>now?motion.action:h.hp<=0?'dead':'idle',elapsed=now-(motion?.since??now);
  const parent=this.parentContainer,ground={x:parent?.x??h.x,y:parent?.y??h.y,map:h.mapId};
  if(action==='walk'&&this.lastGround?.map===h.mapId){const dx=(ground.x-this.lastGround.x)/48,dy=(ground.y-this.lastGround.y)/24,step=Math.hypot((dx+dy)/2,(dy-dx)/2);if(step<1)this.travel+=step;}
  if(action!=='walk'&&!this.wasWalking)this.travel=0;this.lastGround=ground;this.wasWalking=action==='walk';
  const id=(action==='attack'?motion?.weapon:h.weapon)||'knife',clip=action==='attack'?(motion?.attack||{...attackTiming(id,Math.max(400,(motion?.until??1000)-(motion?.since??0))),index:0,step:0,sequence:0}):undefined;
  const look=characterFrames(h.race,h.appearance.gender,h.appearance.hair,facing),final=h.outfitTier==='final';
  this.pose=this.poseOverride??(holdingPose(id,action,clip,elapsed)??spritePose(action,now,motion?.since??now,this.travel,id,clip));
  let meta:PaintedFrame;
  if(final){
   if(this.poseOverride===15||action==='dead'&&elapsed>=150){this.pose=15;meta=finalBodyFrame(look.body,15);}
   else if(this.poseOverride===14){this.pose=14;meta=finalBodyFrame(look.body,14);}
   else if(this.poseOverride!==undefined)meta=manualCoherentFrame(look.body,id,this.poseOverride);
   else{
    const frozen=(action==='hurt'||action==='dead')&&this.frameMeta.family;
    const family=this.clipFamilyOverride??(frozen?this.frameMeta.family!:action==='walk'?'walk':coherentFamily(id));
    const phase=this.clipPhaseOverride??(frozen?this.frameMeta.phase!:coherentPhase(action,this.travel,id,elapsed,clip));
    meta=coherentFrame(look.body,family,phase);
   }
   if(meta.family)this.pose=coherentLogicalPose(meta.family,meta.phase!);
  }else{meta=this.pose>=16?holdingBody(look.body,this.pose):bodyPoseFrame(look.body,this.pose);meta={...meta,headScale:STARTER_HEAD_SCALE,headOverlap:STARTER_HEAD_OVERLAP,headRotation:meta.headPose==='fallen'?0:starterHeadRotation(meta.id)};}
  this.frameMeta=meta;
  if(final&&!finalArtReady(this.scene,h.race,h.appearance.gender)){this.setData('artReady',false);this.setVisible(false);return;}
  this.setVisible(true);this.setData('artReady',true);this.setScale(1);this.setRotation(0);this.setAlpha(1);
  const texture=final?finalBodyTexture(h.race,h.appearance.gender):(this.pose>=16?'holding-body-':'character-body-')+h.appearance.gender;
  this.bodyImage.setTexture(texture,meta.frameKey??'body-'+meta.id).setDisplaySize(96,96);
  this.joints.get('body')!.setPosition(0,0).setRotation(0);this.joints.get('armR')!.setPosition(meta.palms.right.x,meta.palms.right.y).setRotation(0);this.joints.get('armL')!.setPosition(meta.palms.left.x,meta.palms.left.y).setRotation(0);
  if(meta.family){
   this.joints.get('armR')!.add(this.hands);this.joints.get('armL')!.add(this.offHands);
   this.hands.setTexture(texture,meta.mainHandKey!).setDisplaySize(96,96).setPosition(-meta.palms.right.x,-meta.palms.right.y).setVisible(true);
   this.offHands.setTexture(texture,meta.offHandKey!).setDisplaySize(96,96).setPosition(-meta.palms.left.x,-meta.palms.left.y).setVisible(true);
  }else{
   this.add(this.hands);this.hands.setTexture(texture,'hands-'+meta.id).setDisplaySize(96,96).setPosition(0,0).setVisible(true);this.offHands.setVisible(false);
  }
  const state=this.expressionOverride||characterExpression(action,now,h.id,motion?.hurtAt),prefix=meta.headPose==='fallen'?'fallen-'+meta.headTurn+'-':'',head=this.joints.get('head')!,back=this.joints.get('back')!;
  const pivot=(hd.headSockets as Record<string,{x:number;y:number}>)[look.head],overlap=meta.headPose==='fallen'?0:meta.headOverlap??(final ? .8 :3),headScale=meta.headScale??(final ? .86 :1),headAngle=meta.headRotation??0;
  // The joint really is the neck. Rotating the old foot-origin head image swung the nape away.
  head.setPosition(meta.neck.x,meta.neck.y+overlap).setRotation(headAngle).setScale(headScale);back.setPosition(head.x,head.y).setRotation(headAngle).setScale(headScale);
  for(const [part,image]of this.headLayers){
   const layer=part==='hair'?'hair-front':part==='back'?'hair-back':part==='lids'?'lids':part,index=look.head+(part==='lids'&&state==='hurt'?80:0);
   image.setTexture('head-hd-'+h.appearance.gender,prefix+layer+'-'+index).setDisplaySize(96,96).setPosition(-pivot.x,-pivot.y).setTint(part==='hair'||part==='back'?parseInt(HAIR_COLORS[h.appearance.hairColor].hex.slice(1),16):part==='eyes'?parseInt(EYE_COLORS[h.appearance.eyes].hex.slice(1),16):0xffffff).setVisible(part==='eyes'?state==='open'&&look.headMeta.hasEyes:part==='lids'?state!=='open'&&look.headMeta.hasEyes:true);
  }
  this.expressionKey=look.head+'-'+state;this.setData('expression',state);this.setData('outfitTier',h.outfitTier||'starter');this.setData('headArt','painted-hd');this.setData('spriteFrame',meta.id);this.setData('spritePose',this.pose);this.setData('clipFamily',meta.family??'legacy');this.setData('clipPhase',meta.phase??-1);this.setData('animationMode',meta.family?'coherent-painted-clips':'painted-frames');this.setData('mainHand','armR');this.setData('handedness','right');this.setData('comboStep',clip?.step??0);this.setData('comboLength',clip?.length??0);
  const catalog=action==='attack'?motion?.catalogId:h.equippedCatalogId,offhand=action==='attack'?motion?.offhandCatalogId:h.offhandCatalogId,key=[id,catalog,offhand].join('-');
  if(key!==this.currentWeapon){this.currentWeapon=key;this.weapon.setWeapon(id,catalog);this.secondary.setVisible(false);if(offhand||id.endsWith('_shield'))this.secondary.setWeapon('shield',offhand,true).setVisible(true);else if(id==='dual_swords')this.secondary.setWeapon('dual_swords').setVisible(true);}
  const two=meta.family?meta.family==='two':holdingStyle(id)==='two',bow=holdingStyle(id)==='bow',aim=Math.atan2(Math.sin(facing*Math.PI/4)*.55,Math.cos(facing*Math.PI/4));
  let mainAngle:number,lower=false,gap=0;
  if(meta.family){mainAngle=meta.weaponAngle!;lower=meta.gripLower??false;gap=two?Math.hypot(meta.palms.right.x-meta.palms.left.x,meta.palms.right.y-meta.palms.left.y):0;}
  else{const grip=starterTwoHandGrip(facing,this.pose,meta.palms);mainAngle=bow?0:two&&this.pose>=20?grip.angle:frameWeaponAngle(id,facing,this.pose,meta.palms);lower=two&&this.pose>=20&&grip.lower;gap=grip.gap;}
  const view=meta.family&&!bow&&(meta.projection??1)<.6?(facing>=5?5:6):undefined;
  this.weapon.selectPose(facing,meta.family&&!bow?0:this.pose,clip?.step??0,view).setGripLower(lower,gap).setPosition(0,0).setRotation(id==='shield'?0:mainAngle).setScale(1);
  const offAngle=meta.family?(meta.palms.left.x<meta.neck.x?-.35:.35):action==='attack'?aim+Math.PI/2+((clip?.step??0)%2?-.5:.6):offhandRestAngle(facing);
  this.secondary.selectPose(facing,meta.family?0:this.pose,(clip?.step??0)+1).setGripLower(false,0).setPosition(0,0).setRotation(id==='dual_swords'?offAngle:0).setScale(1);
  this.weapon.setVisible(action!=='dead');this.secondary.setVisible(action!=='dead'&&!!(offhand||id.endsWith('_shield')||id==='dual_swords'));
  if(!meta.family&&facing>=5&&this.pose<=5){if(!bow&&id!=='staff'&&id!=='shield')this.weapon.setRotation(groundSafeCarryAngle(this.weapon.rotation,meta.palms.right.y,this.weapon.tipInGripSpace(),1));if(id==='dual_swords')this.secondary.setRotation(groundSafeCarryAngle(this.secondary.rotation,meta.palms.left.y,this.secondary.tipInGripSpace(),-1));}
  const depth=meta.family?{mainBehind:!!meta.mainBehind,offBehind:!!meta.offBehind}:holdingLayers(facing,this.pose,meta.rightBehindBody);
  const order=look.headMeta.hairOverBody?['body','back','armL','armR','head']:['back','body','armL','armR','head'];
  for(const [name,behind]of [['armL',depth.offBehind],['armR',depth.mainBehind]] as const)if(behind){order.splice(order.indexOf(name),1);order.splice(order.indexOf('body'),0,name);}
  for(const name of order)this.bringToTop(this.joints.get(name)!);if(!meta.family)this.bringToTop(this.hands);this.bringToTop(head);
  this.bowString.clear();this.nockedArrow.clear();const nocked=bow&&action==='attack'&&!!clip&&elapsed<clip.windup;this.setData('nockedArrow',nocked);this.setData('heldFrame',this.weapon.viewKey);
  if(bow&&action!=='dead'){
   const ends=this.weapon.bowEndpoints(this);
   if(ends){const pulling=meta.family==='bow'?[1,2,3].includes(meta.phase!):[17,18].includes(this.pose),pull=pulling?meta.palms.left:{x:(ends[0].x+ends[1].x)/2,y:(ends[0].y+ends[1].y)/2};this.bowString.lineStyle(.65,0xffeed3,.95).beginPath().moveTo(ends[0].x,ends[0].y).lineTo(pull.x,pull.y).lineTo(ends[1].x,ends[1].y).strokePath();if(nocked){const dir={x:Math.cos(facing*Math.PI/4),y:Math.sin(facing*Math.PI/4)*.55},tip={x:meta.palms.right.x+dir.x*11,y:meta.palms.right.y+dir.y*11};this.nockedArrow.lineStyle(.8,0xebdec1).lineBetween(pull.x,pull.y,tip.x,tip.y);this.nockedArrow.lineStyle(.8,0xb4c4c7).lineBetween(tip.x,tip.y,tip.x-dir.x*3+dir.y,tip.y-dir.y*3-dir.x);}}
  }
  if(depth.mainBehind){this.sendToBack(this.bowString);this.sendToBack(this.nockedArrow);}else{this.bringToTop(this.bowString);this.bringToTop(this.nockedArrow);if(meta.family){this.joints.get('armR')!.bringToTop(this.hands);this.joints.get('armL')!.bringToTop(this.offHands);}else this.bringToTop(this.hands);this.bringToTop(head);}
  const hurt=action==='hurt'||motion?.hurtAt!==undefined&&now-motion.hurtAt>=0&&now-motion.hurtAt<140;this.bodyImage.setTint(hurt?0xffc2b4:0xffffff);this.hands.setTint(hurt?0xffc2b4:0xffffff);this.offHands.setTint(hurt?0xffc2b4:0xffffff);
 }
}
