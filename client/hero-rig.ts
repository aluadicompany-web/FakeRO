import {ArticulatedArm} from './articulated-arm';
import {sampleAttackPose,restAttackPose,blendAttackPose,attackTiming,type AttackPose} from '../shared/attack-animation';
import Phaser from 'phaser';
import {handJoints,walkCycle,oneHandRestAngle,palmAnchor} from '../shared/hero-pose';
import handAnchors from '../shared/hand-anchors.json';
import {HAIR_COLORS,EYE_COLORS} from '../shared/appearance';
import {CHARACTER_PARTS,CHARACTER_FRAME,CHARACTER_RACES,characterFrames,CHARACTER_ART_VERSION} from '../shared/character-art';
import type {Hero,Motion} from '../shared/rules';
import {HeldWeapon,weaponGripKind,preloadEquipmentArt} from './weapon-art';
const JOINTS=['back','legL','legR','armL','body','armR','head']as const;
export function preloadHeroArt(scene:Phaser.Scene){preloadEquipmentArt(scene);for(const name of [...CHARACTER_PARTS,'heads-base','heads-hair','heads-eyes'])scene.load.spritesheet('hero-v3-'+name,`/art/characters/rig-${name}.webp`,{frameWidth:128,frameHeight:192});}
export class HeroRig extends Phaser.GameObjects.Container{
 joints=new Map<string,Phaser.GameObjects.Container>();parts=new Map<string,Phaser.GameObjects.Image>();rest=new Map<string,{x:number;y:number}>();naturalTint=new Map<Phaser.GameObjects.Image,number>();weapon:HeldWeapon;secondary:HeldWeapon;bowString:Phaser.GameObjects.Graphics;facing=-1;lookKey='';currentWeapon='';arms=new Map<string,ArticulatedArm>();legEdges=new Map<string,Phaser.GameObjects.Image>();lastAttackPose?:AttackPose;lastRenderedPose?:AttackPose;attackBlendFrom?:AttackPose;attackSequence=-1;poseAt=0;ready=true;hero:Hero;travel=0;lastGround?:{x:number;y:number;map:string};wasWalking=false;
 constructor(scene:Phaser.Scene,h:Hero){super(scene,0,0);this.hero=h;scene.add.existing(this);this.setData('characterArt',CHARACTER_ART_VERSION);this.add(scene.add.ellipse(0,0,29,12,0x173e3a,.25));const race=Math.max(0,CHARACTER_RACES.indexOf(h.race)),legY=[291,301,342,322,311,307][race]/4-96;
 for(const name of JOINTS){const pivot=name==='armL'?{x:-10.5,y:-50}:name==='armR'?{x:10,y:-50}:name==='legL'?{x:-6,y:legY}:name==='legR'?{x:6,y:legY}:name==='head'||name==='back'?{x:0,y:-54}:{x:0,y:0};this.rest.set(name,pivot);const joint=scene.add.container(pivot.x,pivot.y);this.add(joint);this.joints.set(name,joint);
  for(const key of name==='head'||name==='back'?['base','hair','eyes']:['body']){const part=scene.add.image(-pivot.x,-pivot.y,'__WHITE').setOrigin(.5,1).setDisplaySize(64,96).setVisible(false);joint.add(part);this.parts.set(name+'-'+key,part);this.naturalTint.set(part,0xffffff);}
 }
 for(const name of ['legL','legR']){const rest=this.rest.get(name)!,edge=scene.add.image(-rest.x,-rest.y,'__WHITE').setOrigin(.5,1).setDisplaySize(64,96);this.joints.get(name)!.addAt(edge,0);this.legEdges.set(name,edge);this.naturalTint.set(edge,0xffffff);}
 for(const name of ['armL','armR']){const arm=new ArticulatedArm(scene,this.joints.get(name)!,this.parts.get(name+'-body')!);this.arms.set(name,arm);this.naturalTint.set(arm.lower,0xffffff);}
 this.weapon=new HeldWeapon(scene).setPosition(4,15);this.secondary=new HeldWeapon(scene).setPosition(-1,15);this.joints.get('armR')!.addAt(this.weapon,0);this.joints.get('armL')!.addAt(this.secondary,0);this.bowString=scene.add.graphics();this.add(this.bowString);this.setFacing(2);}
 setFacing(facing:number){const h=this.hero,a=h.appearance,key=[h.race,a.gender,a.hair,a.eyes,a.hairColor,facing].join('-');if(this.lookKey===key)return;this.lookKey=key;this.facing=facing;const legY=[291,301,342,322,311,307][Math.max(0,CHARACTER_RACES.indexOf(h.race))]/4-96;for(const leg of ['legL','legR'])this.rest.get(leg)!.y=legY;const frames=characterFrames(h.race,a.gender,a.hair,facing);
 for(const name of JOINTS){if(name==='head'||name==='back'){for(const layer of ['base','hair','eyes']){const part=this.parts.get(name+'-'+layer)!,tint=layer==='hair'?parseInt(HAIR_COLORS[a.hairColor].hex.slice(1),16):layer==='eyes'?parseInt(EYE_COLORS[a.eyes].hex.slice(1),16):0xffffff;part.setTexture('hero-v3-heads-'+layer,frames.head).setDisplaySize(64,96).setTint(tint).setVisible(name==='head'||frames.longHair);part.setCrop();if(frames.longHair){const cut=CHARACTER_FRAME.frontHairCut/2;if(name==='head')part.setCrop(0,0,128,cut);else part.setCrop(0,cut,128,192-cut);}this.naturalTint.set(part,tint);}}
  else{const image=this.parts.get(name+'-body')!;image.setTexture('hero-v3-'+name,frames.body).setDisplaySize(64,96).setVisible(true);if(name==='body'){const cut=Math.round((legY+96)*2);image.setCrop(0,0,128,cut);for(const [leg,edge]of this.legEdges){const rest=this.rest.get(leg)!;edge.setTexture('hero-v3-body',frames.body).setPosition(-rest.x,-rest.y).setDisplaySize(64,96).setCrop(leg==='legL'?0:65,cut,leg==='legL'?65:63,192-cut);}}}
 }
 }
 updatePose(h:Hero,motion:Motion|undefined,now:number){
 this.hero=h;const action=motion&&motion.until>now?motion.action:h.hp<=0?'dead':'idle',facing=motion?.facing??this.facing;if(facing!==this.facing){this.lastRenderedPose=undefined;this.attackBlendFrom=undefined;this.attackSequence=-1;}this.setFacing(facing);
 const hands=handJoints(facing),mirror=hands.mirrored?-1:1,side=facing===0||facing===4?.86:1;this.setScale(mirror*side,1);
 // Integrate the interpolated ground position, so footfalls follow actual visible movement, never wall time.
 const parent=this.parentContainer,ground={x:parent?.x??h.x,y:parent?.y??h.y,map:h.mapId};
 if(action==='walk'&&this.lastGround?.map===h.mapId){const dx=(ground.x-this.lastGround.x)/48,dy=(ground.y-this.lastGround.y)/24,step=Math.hypot((dx+dy)/2,(dy-dx)/2);if(step<1)this.travel+=step;}
 if(action!=='walk'&&!this.wasWalking)this.travel=0;this.lastGround=ground;this.wasWalking=action==='walk';
 for(const arm of this.arms.values())arm.reset();
 const gait=walkCycle(this.travel),walk=action==='walk'?gait.swing:0;
 for(const [name,joint]of this.joints){const rest=this.rest.get(name)!;joint.setPosition(rest.x,rest.y).setScale(1);joint.rotation=0;
  if(name==='legL'||name==='legR'){const sign=name==='legL'?1:-1;joint.rotation=walk*.14*sign;if(action==='walk'){joint.x+=walk*.7*sign;joint.y-=name==='legL'?gait.leftLift:gait.rightLift;}}
  if(name==='armL')joint.rotation=-walk*.12;if(name==='armR')joint.rotation=walk*.12;
  if(name==='head'||name==='back')joint.y=rest.y+(action==='walk'?-Math.abs(walk)*.45:Math.sin(now/550)*.22);
 }
 const id=(action==='attack'?motion?.weapon:h.weapon)||'knife',heldCatalog=action==='attack'?motion?.catalogId:h.equippedCatalogId,heldOffhand=action==='attack'?motion?.offhandCatalogId:h.offhandCatalogId,kind=weaponGripKind(id),weaponKey=id+'-'+(heldCatalog||'')+'-'+(heldOffhand||'');
 const frame=characterFrames(h.race,h.appearance.gender,h.appearance.hair,facing).body;
 const localHand=(name:'armL'|'armR')=>{const point=palmAnchor(handAnchors[name][frame]),rest=this.rest.get(name)!;return{x:point.x-rest.x,y:point.y-rest.y};};
 const main=this.joints.get(hands.right)!,off=this.joints.get(hands.left)!,mainPoint=localHand(hands.right as 'armL'|'armR'),offPoint=localHand(hands.left as 'armL'|'armR');
 if(this.weapon.parentContainer!==main){this.weapon.parentContainer?.remove(this.weapon);main.addAt(this.weapon,0);}if(this.secondary.parentContainer!==off){this.secondary.parentContainer?.remove(this.secondary);off.addAt(this.secondary,0);}
 this.weapon.setPosition(mainPoint.x,mainPoint.y);this.secondary.setPosition(offPoint.x,offPoint.y);
 if(this.currentWeapon!==weaponKey){this.currentWeapon=weaponKey;this.weapon.setWeapon(id,heldCatalog);this.secondary.setVisible(false);if(heldOffhand||id.endsWith('_shield'))this.secondary.setWeapon('shield',heldOffhand,true).setVisible(true);else if(id==='dual_swords')this.secondary.setWeapon('sword').setVisible(true);}
 // Both hands render above the tunic in front views; back views keep the far arm behind the torso.
 if(hands.rear){this.moveBelow(off,this.joints.get('body')!);this.moveAbove(main,this.joints.get('body')!);}else{this.moveAbove(main,this.joints.get('body')!);this.moveAbove(off,this.joints.get('body')!);}
 this.setData('mainHand',hands.right);this.setData('handedness','right');
 // Direction in unmirrored atlas space; weapon tips point outwards, away from the face.
 const outward=(hands.rear?1:-1)*mirror;
 this.weapon.setScale(1);this.secondary.setScale(1);this.secondary.rotation=-outward*.18;this.bowString.clear();
 const liveAttack=action==='attack'&&motion;
 const neutral=restAttackPose(id,facing,palmAnchor(handAnchors[hands.right as 'armL'|'armR'][frame]),palmAnchor(handAnchors[hands.left as 'armL'|'armR'][frame]));
 let pose:AttackPose|undefined;
 if(liveAttack){const clip=motion.attack||{...attackTiming(id,Math.max(400,motion.until-motion.since)),index:0,step:0,sequence:0};if(this.attackSequence!==clip.sequence){this.attackSequence=clip.sequence;this.attackBlendFrom=this.lastRenderedPose||neutral;}pose=sampleAttackPose(id,facing,clip,now-motion.since,palmAnchor(handAnchors[hands.right as 'armL'|'armR'][frame]),palmAnchor(handAnchors[hands.left as 'armL'|'armR'][frame]));if(this.attackBlendFrom)pose=blendAttackPose(this.attackBlendFrom,pose,Math.min(1,Math.max(0,(now-motion.since)/Math.min(60,clip.windup*.3))));this.lastAttackPose=pose;this.poseAt=now;this.setData('comboStep',clip.step);this.setData('comboLength',clip.length);}
 else if(this.lastAttackPose&&now-this.poseAt<150&&action!=='dead'){pose=blendAttackPose(this.lastAttackPose,neutral,Math.min(1,(now-this.poseAt)/150));}
 else this.lastAttackPose=undefined;
 if(!pose&&kind==='two'&&action!=='dead')pose=neutral;
 if(pose){
  const rotate=(point:{x:number;y:number})=>({x:point.x*Math.cos(pose!.twist)-point.y*Math.sin(pose!.twist)+pose!.shift.x,y:point.x*Math.sin(pose!.twist)+point.y*Math.cos(pose!.twist)+pose!.shift.y});
  const solve=(name:string,target:{x:number;y:number},weapon:HeldWeapon|undefined)=>{const rest=this.rest.get(name)!,palm=palmAnchor(handAnchors[name as 'armL'|'armR'][frame]),shoulder=rotate(rest);return this.arms.get(name)!.solve(rest,shoulder,palm,{x:target.x+pose!.shift.x,y:target.y+pose!.shift.y},name==='armL'?1:-1,weapon);};
  const right=solve(hands.right,pose.main,this.weapon);const support=(kind==='two'||kind==='bow')?{x:pose.off.x+right.hand.x-pose.main.x-pose.shift.x,y:pose.off.y+right.hand.y-pose.main.y-pose.shift.y}:pose.off;const left=solve(hands.left,support,this.secondary.visible?this.secondary:undefined);this.weapon.setRotation(pose.main.angle-right.rotation).setScale(kind==='bow'?.55:1,pose.depth);if(this.secondary.visible)this.secondary.setRotation(pose.off.angle-left.rotation).setScale(1,pose.depth);
  const torso=this.joints.get('body')!;torso.setPosition(pose.shift.x,pose.shift.y).setRotation(pose.twist);for(const name of ['head','back']){const point=rotate(this.rest.get(name)!);this.joints.get(name)!.setPosition(point.x,point.y).setRotation(pose.twist*.35);}
  for(const [i,name]of ['legL','legR'].entries()){const leg=this.joints.get(name)!;leg.rotation+=(i?1:-1)*pose.weight*.012;leg.x+=pose.shift.x*(i?.25:.45);}
 }else{
  this.weapon.setScale(kind==='bow'?.55:1,1);this.weapon.rotation=kind==='bow'?-outward*.12:oneHandRestAngle(facing,id);main.rotation=outward*.08+walk*.08;if(this.secondary.visible)off.rotation=-outward*.1;
 }
 if(kind==='bow'){this.bowString.clear();const ends=this.weapon.bowEndpoints(this);if(ends){this.bowString.lineStyle(.7,0xffeed3,.9).beginPath().moveTo(ends[0].x,ends[0].y);if(pose){const offJoint=this.arms.get(hands.left)!.elbow,rest=this.rest.get(hands.left)!,palm=palmAnchor(handAnchors[hands.left as 'armL'|'armR'][frame]),elbow={x:(rest.x+palm.x)/2,y:-41},matrix=offJoint.getWorldTransformMatrix(),world=matrix.transformPoint(palm.x-elbow.x,palm.y-elbow.y,new Phaser.Math.Vector2()),hand=this.getWorldTransformMatrix().applyInverse(world.x,world.y,new Phaser.Math.Vector2());this.bowString.lineTo(hand.x,hand.y);}this.bowString.lineTo(ends[1].x,ends[1].y).strokePath();}}
 this.lastRenderedPose=pose||neutral;
 this.setAlpha(action==='dead'?Math.max(0,1-(now-(motion?.since||now))/1400):1);this.rotation=action==='dead'?(now-(motion?.since||now))/1500*.9:action==='hurt'?Math.sin((now-(motion?.since||now))/180*Math.PI)*-.1:0;
 for(const [part,tint]of this.naturalTint){if(action==='hurt'||motion?.hurtAt&&now-motion.hurtAt<140){const c=Phaser.Display.Color.IntegerToRGB(tint);part.setTint(Phaser.Display.Color.GetColor(Math.min(255,c.r+35),Math.floor(c.g*.8),Math.floor(c.b*.75)));}else part.setTint(tint);}
 }
}
