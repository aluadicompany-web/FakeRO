import {ArticulatedArm} from './articulated-arm';
import {sampleAttackPose,restAttackPose,blendAttackPose,attackTiming,type AttackPose} from '../shared/attack-animation';
import Phaser from 'phaser';
import {handJoints,walkCycle,oneHandRestAngle} from '../shared/hero-pose';
import {HAIR_COLORS,EYE_COLORS} from '../shared/appearance';
import {characterFrames,CHARACTER_ART_VERSION,CHARACTER_ASSET_ROOT,CHARACTER_MANIFEST,characterHeadOffset,characterExpression} from '../shared/character-art';
import type {Hero,Motion} from '../shared/rules';
import {HeldWeapon,weaponGripKind,preloadEquipmentArt} from './weapon-art';
const JOINTS=['cloth','back','legL','legR','armL','body','armR','head']as const;
export function preloadHeroArt(scene:Phaser.Scene){preloadEquipmentArt(scene);scene.load.atlas('character-body-v4',CHARACTER_ASSET_ROOT+'body-atlas.webp',CHARACTER_ASSET_ROOT+'body-atlas.json');scene.load.atlas('character-head-v4',CHARACTER_ASSET_ROOT+'head-atlas.webp',CHARACTER_ASSET_ROOT+'head-atlas.json');}
export class HeroRig extends Phaser.GameObjects.Container{
 joints=new Map<string,Phaser.GameObjects.Container>();parts=new Map<string,Phaser.GameObjects.Image>();rest=new Map<string,{x:number;y:number}>();naturalTint=new Map<Phaser.GameObjects.Image,number>();weapon:HeldWeapon;secondary:HeldWeapon;bowString:Phaser.GameObjects.Graphics;facing=-1;lookKey='';currentWeapon='';arms=new Map<string,ArticulatedArm>();legEdges=new Map<string,Phaser.GameObjects.Image>();gloves=new Map<string,Phaser.GameObjects.Image>();expressionKey='';expressionOverride?:'open'|'closed'|'hurt';lastAttackPose?:AttackPose;lastRenderedPose?:AttackPose;attackBlendFrom?:AttackPose;attackSequence=-1;poseAt=0;ready=true;hero:Hero;travel=0;lastGround?:{x:number;y:number;map:string};wasWalking=false;
 constructor(scene:Phaser.Scene,h:Hero){super(scene,0,0);this.hero=h;scene.add.existing(this);this.setData('characterArt',CHARACTER_ART_VERSION);this.add(scene.add.ellipse(0,0,29,12,0x173e3a,.25).setName('ground-shadow'));
 for(const name of JOINTS){const pivot={x:0,y:0};this.rest.set(name,pivot);const joint=scene.add.container();this.add(joint);this.joints.set(name,joint);const keys=name==='head'?['base','hair','eyes','lids']:name==='back'?['hair']:['body'];for(const key of keys){const image=scene.add.image(0,0,'__WHITE').setOrigin(.5,1).setDisplaySize(64,96).setVisible(false);joint.add(image);this.parts.set(name+'-'+key,image);this.naturalTint.set(image,0xffffff);}}
 for(const name of ['legL','legR']){const edge=scene.add.image(0,0,'__WHITE').setOrigin(.5,1).setDisplaySize(64,96);this.joints.get(name)!.addAt(edge,0);this.legEdges.set(name,edge);this.naturalTint.set(edge,0xffffff);}
 for(const name of ['armL','armR']){const glove=scene.add.image(0,0,'__WHITE').setOrigin(.5,1).setDisplaySize(64,96);this.gloves.set(name,glove);this.joints.get(name)!.add(glove);this.naturalTint.set(glove,0xffffff);const arm=new ArticulatedArm(scene,this.joints.get(name)!,this.parts.get(name+'-body')!,glove);this.arms.set(name,arm);this.naturalTint.set(arm.lower,0xffffff);this.naturalTint.set(arm.lowerGlove,0xffffff);}
 this.weapon=new HeldWeapon(scene);this.secondary=new HeldWeapon(scene);this.joints.get('armR')!.addAt(this.weapon,1);this.joints.get('armL')!.addAt(this.secondary,1);this.bowString=scene.add.graphics();this.add(this.bowString);this.setFacing(1);
 }
 setFacing(facing:number){const h=this.hero,a=h.appearance,key=[h.race,a.gender,a.hair,a.eyes,a.hairColor,facing].join('-');if(this.lookKey===key)return;this.lookKey=key;this.facing=facing;this.expressionKey='';const frame=characterFrames(h.race,a.gender,a.hair,facing),m=frame.bodyMeta,offset=characterHeadOffset(frame.body,frame.head);
 for(const name of JOINTS){const pivot=name==='head'||name==='back'||name==='cloth'?m.neck:name==='armL'||name==='armR'?m.arms[name].shoulder:name==='legL'||name==='legR'?m.hips[name]:{x:0,y:0};this.rest.set(name,{...pivot});const joint=this.joints.get(name)!;joint.setPosition(pivot.x,pivot.y);
 if(name==='head'||name==='back'){for(const layer of name==='head'?['base','hair','eyes','lids']:['hair']){const image=this.parts.get(name+'-'+layer)!,part=name==='back'?'hair-back':layer==='hair'?'hair-front':layer,tint=layer==='hair'?parseInt(HAIR_COLORS[a.hairColor].hex.slice(1),16):layer==='eyes'?parseInt(EYE_COLORS[a.eyes].hex.slice(1),16):0xffffff;image.setTexture('character-head-v4',part+'-'+frame.head).setPosition(-pivot.x+offset.x,-pivot.y+offset.y).setDisplaySize(64,96).setTint(tint).setVisible(layer!=='lids');this.naturalTint.set(image,tint);}}
 else this.parts.get(name+'-body')!.setTexture('character-body-v4',name+'-'+frame.body).setPosition(-pivot.x,-pivot.y).setDisplaySize(64,96).setVisible(true);
 }
 for(const name of ['armL','armR']as const){const pivot=m.arms[name].shoulder;this.gloves.get(name)!.setTexture('character-body-v4','glove'+name.slice(-1)+'-'+frame.body).setPosition(-pivot.x,-pivot.y).setDisplaySize(64,96);this.arms.get(name)!.configure(name,frame.body,m.arms[name].elbow);}
 for(const name of ['legL','legR']as const){const pivot=m.hips[name];this.legEdges.get(name)!.setTexture('character-body-v4','boot'+name.slice(-1)+'-'+frame.body).setPosition(-pivot.x,-pivot.y).setDisplaySize(64,96);}
 const far=m.nearArm==='armR'?'armL':'armR',layers=frame.headMeta.hairOverBody?['cloth','legL','legR',far,'body','back',m.nearArm,'head']:['cloth','back','legL','legR',far,'body',m.nearArm,'head'];if(m.bothArmsVisible){const i=layers.indexOf(far);layers.splice(i,1);layers.splice(layers.indexOf('body')+1,0,far);}for(const name of layers)this.bringToTop(this.joints.get(name)!);this.bringToTop(this.bowString);
 }
 setExpression(action:string,now:number,hurtAt?:number){const frame=characterFrames(this.hero.race,this.hero.appearance.gender,this.hero.appearance.hair,this.facing),state=this.expressionOverride||characterExpression(action,now,this.hero.id,hurtAt),key=frame.head+'-'+state;if(key===this.expressionKey)return;this.expressionKey=key;this.parts.get('head-eyes')!.setVisible(state==='open'&&frame.headMeta.hasEyes);this.parts.get('head-lids')!.setTexture('character-head-v4','lids-'+(frame.head+(state==='hurt'?CHARACTER_MANIFEST.headFrames:0))).setDisplaySize(64,96).setVisible(state!=='open'&&frame.headMeta.hasEyes);this.setData('expression',state);}
 updatePose(h:Hero,motion:Motion|undefined,now:number){
 this.hero=h;const action=motion&&motion.until>now?motion.action:h.hp<=0?'dead':'idle',facing=motion?.facing??this.facing;if(facing!==this.facing){this.lastRenderedPose=undefined;this.attackBlendFrom=undefined;this.attackSequence=-1;}this.setFacing(facing);
 const hands=handJoints(facing);this.setScale(1,1);const info=characterFrames(h.race,h.appearance.gender,h.appearance.hair,facing).bodyMeta;
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
 const localHand=(name:'armL'|'armR')=>{const point=info.arms[name].palm,rest=this.rest.get(name)!;return{x:point.x-rest.x,y:point.y-rest.y};};
 const main=this.joints.get(hands.right)!,off=this.joints.get(hands.left)!,mainPoint=localHand(hands.right as 'armL'|'armR'),offPoint=localHand(hands.left as 'armL'|'armR');
 if(this.weapon.parentContainer!==main){this.weapon.parentContainer?.remove(this.weapon);main.addAt(this.weapon,1);}if(this.secondary.parentContainer!==off){this.secondary.parentContainer?.remove(this.secondary);off.addAt(this.secondary,1);}
 this.weapon.setPosition(mainPoint.x,mainPoint.y);this.secondary.setPosition(offPoint.x,offPoint.y);
 if(this.currentWeapon!==weaponKey){this.currentWeapon=weaponKey;this.weapon.setWeapon(id,heldCatalog);this.secondary.setVisible(false);if(heldOffhand||id.endsWith('_shield'))this.secondary.setWeapon('shield',heldOffhand,true).setVisible(true);else if(id==='dual_swords')this.secondary.setWeapon('sword').setVisible(true);}
 // Layer order is registered with each viewing direction; far arms can pass behind the torso.
 this.setData('mainHand',hands.right);this.setData('handedness','right');
 // Direction in unmirrored atlas space; weapon tips point outwards, away from the face.
 const outward=(hands.rear?1:-1)*(Math.cos(facing*Math.PI/4)<-.1?-1:1);
 this.weapon.setScale(1);this.secondary.setScale(1);this.secondary.rotation=-outward*.18;this.bowString.clear();
 const liveAttack=action==='attack'&&motion;
 const neutral=restAttackPose(id,facing,info.arms.armR.palm,info.arms.armL.palm);
 let pose:AttackPose|undefined;
 if(liveAttack){const clip=motion.attack||{...attackTiming(id,Math.max(400,motion.until-motion.since)),index:0,step:0,sequence:0};if(this.attackSequence!==clip.sequence){this.attackSequence=clip.sequence;this.attackBlendFrom=this.lastRenderedPose||neutral;}pose=sampleAttackPose(id,facing,clip,now-motion.since,info.arms.armR.palm,info.arms.armL.palm);if(this.attackBlendFrom)pose=blendAttackPose(this.attackBlendFrom,pose,Math.min(1,Math.max(0,(now-motion.since)/Math.min(60,clip.windup*.3))));this.lastAttackPose=pose;this.poseAt=now;this.setData('comboStep',clip.step);this.setData('comboLength',clip.length);}
 else if(this.lastAttackPose&&now-this.poseAt<150&&action!=='dead'){pose=blendAttackPose(this.lastAttackPose,neutral,Math.min(1,(now-this.poseAt)/150));}
 else this.lastAttackPose=undefined;
 if(!pose&&kind==='two'&&action!=='dead')pose=neutral;
 if(pose){
  const rotate=(point:{x:number;y:number})=>({x:point.x*Math.cos(pose!.twist)-point.y*Math.sin(pose!.twist)+pose!.shift.x,y:point.x*Math.sin(pose!.twist)+point.y*Math.cos(pose!.twist)+pose!.shift.y});
  const solve=(name:string,target:{x:number;y:number},weapon:HeldWeapon|undefined)=>{const rest=this.rest.get(name)!,palm=info.arms[name as 'armL'|'armR'].palm,shoulder=rotate(rest);return this.arms.get(name)!.solve(rest,shoulder,palm,{x:target.x+pose!.shift.x,y:target.y+pose!.shift.y},name==='armL'?1:-1,weapon);};
  const right=solve(hands.right,pose.main,this.weapon);const support=(kind==='two'||kind==='bow')?{x:pose.off.x+right.hand.x-pose.main.x-pose.shift.x,y:pose.off.y+right.hand.y-pose.main.y-pose.shift.y}:pose.off;const left=solve(hands.left,support,this.secondary.visible?this.secondary:undefined);this.weapon.setRotation(pose.main.angle-right.rotation).setScale(kind==='bow'?.55:1,pose.depth);if(this.secondary.visible)this.secondary.setRotation(pose.off.angle-left.rotation).setScale(1,pose.depth);
  const torso=this.joints.get('body')!;torso.setPosition(pose.shift.x,pose.shift.y).setRotation(pose.twist);for(const name of ['head','back','cloth']){const point=rotate(this.rest.get(name)!);this.joints.get(name)!.setPosition(point.x,point.y).setRotation(pose.twist*.35);}
  for(const [i,name]of ['legL','legR'].entries()){const leg=this.joints.get(name)!;leg.rotation+=(i?1:-1)*pose.weight*.012;leg.x+=pose.shift.x*(i?.25:.45);}
 }else{
  this.weapon.setScale(kind==='bow'?.55:1,1);this.weapon.rotation=kind==='bow'?-outward*.12:oneHandRestAngle(facing,id);main.rotation=outward*.08+walk*.08;if(this.secondary.visible)off.rotation=-outward*.1;
 }
 if(kind==='bow'){this.bowString.clear();const ends=this.weapon.bowEndpoints(this);if(ends){this.bowString.lineStyle(.7,0xffeed3,.9).beginPath().moveTo(ends[0].x,ends[0].y);if(pose){const offJoint=this.arms.get(hands.left)!.elbow,rest=this.rest.get(hands.left)!,palm=info.arms.armL.palm,elbow=info.arms.armL.elbow,matrix=offJoint.getWorldTransformMatrix(),world=matrix.transformPoint(palm.x-elbow.x,palm.y-elbow.y,new Phaser.Math.Vector2()),hand=this.getWorldTransformMatrix().applyInverse(world.x,world.y,new Phaser.Math.Vector2());this.bowString.lineTo(hand.x,hand.y);}this.bowString.lineTo(ends[1].x,ends[1].y).strokePath();}}
 const fabric=this.joints.get('cloth')!;fabric.rotation+=(action==='walk'?walk*.018:Math.sin(now/850)*.004);const hair=this.joints.get('back')!;hair.rotation+=(action==='walk'?walk*.012:Math.sin(now/970)*.003);this.setExpression(action,now,motion?.hurtAt);
 this.lastRenderedPose=pose||neutral;
 this.setAlpha(action==='dead'?Math.max(0,1-(now-(motion?.since||now))/1400):1);this.rotation=action==='dead'?(now-(motion?.since||now))/1500*.9:action==='hurt'?Math.sin((now-(motion?.since||now))/180*Math.PI)*-.1:0;
 for(const [part,tint]of this.naturalTint){if(action==='hurt'||motion?.hurtAt&&now-motion.hurtAt<140){const c=Phaser.Display.Color.IntegerToRGB(tint);part.setTint(Phaser.Display.Color.GetColor(Math.min(255,c.r+35),Math.floor(c.g*.8),Math.floor(c.b*.75)));}else part.setTint(tint);}
 }
}
