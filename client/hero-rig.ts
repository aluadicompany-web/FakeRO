import Phaser from 'phaser';
import {handJoints,walkCycle} from '../shared/hero-pose';
import handAnchors from '../shared/hand-anchors.json';
import {HAIR_COLORS,EYE_COLORS} from '../shared/appearance';
import {CHARACTER_PARTS,CHARACTER_FRAME,CHARACTER_RACES,characterFrames,CHARACTER_ART_VERSION} from '../shared/character-art';
import type {Hero,Motion} from '../shared/rules';
import {HeldWeapon,weaponGripKind,preloadEquipmentArt} from './weapon-art';import {weaponById} from '../shared/weapons';
const JOINTS=['back','legL','legR','armL','body','armR','head']as const;
export function preloadHeroArt(scene:Phaser.Scene){preloadEquipmentArt(scene);for(const name of [...CHARACTER_PARTS,'heads-base','heads-hair','heads-eyes'])scene.load.spritesheet('hero-v3-'+name,`/art/characters/rig-${name}.webp`,{frameWidth:128,frameHeight:192});}
export class HeroRig extends Phaser.GameObjects.Container{
 joints=new Map<string,Phaser.GameObjects.Container>();parts=new Map<string,Phaser.GameObjects.Image>();rest=new Map<string,{x:number;y:number}>();naturalTint=new Map<Phaser.GameObjects.Image,number>();weapon:HeldWeapon;secondary:HeldWeapon;bowString:Phaser.GameObjects.Graphics;facing=-1;lookKey='';currentWeapon='';ready=true;hero:Hero;travel=0;lastGround?:{x:number;y:number;map:string};wasWalking=false;
 constructor(scene:Phaser.Scene,h:Hero){super(scene,0,0);this.hero=h;scene.add.existing(this);this.setData('characterArt',CHARACTER_ART_VERSION);this.add(scene.add.ellipse(0,0,29,12,0x173e3a,.25));const race=Math.max(0,CHARACTER_RACES.indexOf(h.race)),legY=[291,301,342,322,311,307][race]/4-96;
 for(const name of JOINTS){const pivot=name==='armL'?{x:-10.5,y:-50}:name==='armR'?{x:10,y:-50}:name==='legL'?{x:-6,y:legY}:name==='legR'?{x:6,y:legY}:name==='head'||name==='back'?{x:0,y:-54}:{x:0,y:0};this.rest.set(name,pivot);const joint=scene.add.container(pivot.x,pivot.y);this.add(joint);this.joints.set(name,joint);
  for(const key of name==='head'||name==='back'?['base','hair','eyes']:['body']){const part=scene.add.image(-pivot.x,-pivot.y,'__WHITE').setOrigin(.5,1).setDisplaySize(64,96).setVisible(false);joint.add(part);this.parts.set(name+'-'+key,part);this.naturalTint.set(part,0xffffff);}
 }
 this.weapon=new HeldWeapon(scene).setPosition(4,15);this.secondary=new HeldWeapon(scene).setPosition(-1,15);this.joints.get('armR')!.addAt(this.weapon,0);this.joints.get('armL')!.addAt(this.secondary,0);this.bowString=scene.add.graphics();this.add(this.bowString);this.setFacing(2);}
 setFacing(facing:number){const h=this.hero,a=h.appearance,key=[h.race,a.gender,a.hair,a.eyes,a.hairColor,facing].join('-');if(this.lookKey===key)return;this.lookKey=key;this.facing=facing;const legY=[291,301,342,322,311,307][Math.max(0,CHARACTER_RACES.indexOf(h.race))]/4-96;for(const leg of ['legL','legR'])this.rest.get(leg)!.y=legY;const frames=characterFrames(h.race,a.gender,a.hair,facing);
 for(const name of JOINTS){if(name==='head'||name==='back'){for(const layer of ['base','hair','eyes']){const part=this.parts.get(name+'-'+layer)!,tint=layer==='hair'?parseInt(HAIR_COLORS[a.hairColor].hex.slice(1),16):layer==='eyes'?parseInt(EYE_COLORS[a.eyes].hex.slice(1),16):0xffffff;part.setTexture('hero-v3-heads-'+layer,frames.head).setDisplaySize(64,96).setTint(tint).setVisible(name==='head'||frames.longHair);part.setCrop();if(frames.longHair){const cut=CHARACTER_FRAME.frontHairCut/2;if(name==='head')part.setCrop(0,0,128,cut);else part.setCrop(0,cut,128,192-cut);}this.naturalTint.set(part,tint);}}
  else this.parts.get(name+'-body')!.setTexture('hero-v3-'+name,frames.body).setDisplaySize(64,96).setVisible(true);
 }
 }
 updatePose(h:Hero,motion:Motion|undefined,now:number){
 this.hero=h;const action=motion&&motion.until>now?motion.action:h.hp<=0?'dead':'idle',facing=motion?.facing??this.facing;this.setFacing(facing);
 const hands=handJoints(facing),mirror=hands.mirrored?-1:1,side=facing===0||facing===4?.86:1;this.setScale(mirror*side,1);
 // Integrate the interpolated ground position, so footfalls follow actual visible movement, never wall time.
 const parent=this.parentContainer,ground={x:parent?.x??h.x,y:parent?.y??h.y,map:h.mapId};
 if(action==='walk'&&this.lastGround?.map===h.mapId){const dx=(ground.x-this.lastGround.x)/48,dy=(ground.y-this.lastGround.y)/24,step=Math.hypot((dx+dy)/2,(dy-dx)/2);if(step<1)this.travel+=step;}
 if(action!=='walk'&&!this.wasWalking)this.travel=0;this.lastGround=ground;this.wasWalking=action==='walk';
 const gait=walkCycle(this.travel),walk=action==='walk'?gait.swing:0;
 for(const [name,joint]of this.joints){const rest=this.rest.get(name)!;joint.setPosition(rest.x,rest.y).setScale(1);joint.rotation=0;
  if(name==='legL'||name==='legR'){const sign=name==='legL'?1:-1;joint.rotation=walk*.14*sign;if(action==='walk'){joint.x+=walk*.7*sign;joint.y-=name==='legL'?gait.leftLift:gait.rightLift;}}
  if(name==='armL')joint.rotation=-walk*.12;if(name==='armR')joint.rotation=walk*.12;
  if(name==='head'||name==='back')joint.y=rest.y+(action==='walk'?-Math.abs(walk)*.45:Math.sin(now/550)*.22);
 }
 const id=(action==='attack'?motion?.weapon:h.weapon)||'knife',heldCatalog=action==='attack'?motion?.catalogId:h.equippedCatalogId,heldOffhand=action==='attack'?motion?.offhandCatalogId:h.offhandCatalogId,kind=weaponGripKind(id),weaponKey=id+'-'+(heldCatalog||'')+'-'+(heldOffhand||'');
 const frame=characterFrames(h.race,h.appearance.gender,h.appearance.hair,facing).body;
 const localHand=(name:'armL'|'armR')=>{const point=handAnchors[name][frame],rest=this.rest.get(name)!;return{x:point.x-rest.x,y:point.y-rest.y};};
 const main=this.joints.get(hands.right)!,off=this.joints.get(hands.left)!,mainPoint=localHand(hands.right as 'armL'|'armR'),offPoint=localHand(hands.left as 'armL'|'armR');
 if(this.weapon.parentContainer!==main){this.weapon.parentContainer?.remove(this.weapon);main.addAt(this.weapon,0);}if(this.secondary.parentContainer!==off){this.secondary.parentContainer?.remove(this.secondary);off.addAt(this.secondary,0);}
 this.weapon.setPosition(mainPoint.x,mainPoint.y);this.secondary.setPosition(offPoint.x,offPoint.y);
 if(this.currentWeapon!==weaponKey){this.currentWeapon=weaponKey;this.weapon.setWeapon(id,heldCatalog);this.secondary.setVisible(false);if(heldOffhand||id.endsWith('_shield'))this.secondary.setWeapon('shield',heldOffhand,true).setVisible(true);else if(id==='dual_swords')this.secondary.setWeapon('sword').setVisible(true);}
 // Both hands render above the tunic in front views; back views keep the far arm behind the torso.
 if(hands.rear){this.moveBelow(off,this.joints.get('body')!);this.moveAbove(main,this.joints.get('body')!);}else{this.moveAbove(main,this.joints.get('body')!);this.moveAbove(off,this.joints.get('body')!);}
 this.setData('mainHand',hands.right);this.setData('handedness','right');
 const p=action==='attack'&&motion?Phaser.Math.Clamp((now-motion.since)/Math.max(1,motion.until-motion.since),0,1):0,swing=action==='attack'?Math.sin(p*Math.PI):0;
 // Direction in unmirrored atlas space; weapon tips point outwards, away from the face.
 const outward=(hands.rear?1:-1)*mirror;
 this.weapon.setScale(1);this.secondary.setScale(1);this.secondary.rotation=-outward*.18;this.bowString.clear();
 const reach=(joint:Phaser.GameObjects.Container,hand:{x:number;y:number},target:{x:number;y:number})=>{const rest=this.rest.get(joint===main?hands.right:hands.left)!,dx=target.x-rest.x,dy=target.y-rest.y;const scale=Phaser.Math.Clamp(Math.hypot(dx,dy)/Math.hypot(hand.x,hand.y),.75,1.35);joint.setPosition(rest.x,rest.y).setScale(scale);joint.rotation=Math.atan2(dy,dx)-Math.atan2(hand.y,hand.x);};
 if(kind==='two'){
  const angle=outward*(action==='attack'?-.65+p*1.7:.5),grip={x:outward*(12+swing*3),y:-29-swing*7};
  reach(main,mainPoint,grip);reach(off,offPoint,{x:grip.x-Math.sin(angle)*5,y:grip.y+Math.cos(angle)*5});this.weapon.setScale(1/main.scaleX);this.weapon.rotation=angle-main.rotation;
 }else if(kind==='bow'){
  // Right hand holds the bow itself; left hand draws the string (left-handed archery stance).
  const grip={x:outward*(17+swing*4),y:-35},draw={x:grip.x-outward*(5+swing*11),y:grip.y+2};reach(main,mainPoint,grip);reach(off,offPoint,draw);this.weapon.setScale(1/main.scaleX);this.weapon.rotation=-main.rotation;
  if(action==='attack'){const size=id==='longbow'?33:id==='shortbow'?21:27;this.bowString.lineStyle(.7,0xffeed3,.9);this.bowString.beginPath();this.bowString.moveTo(grip.x,grip.y-size);this.bowString.lineTo(draw.x,draw.y);this.bowString.lineTo(grip.x,grip.y+size);this.bowString.strokePath();}
 }else{
  this.weapon.rotation=outward*.42;
  if(action==='attack'){const style=weaponById(id).style;if(['slash','cleave','draw','double'].includes(style))main.rotation=outward*(-.75+p*1.6);else if(['smash','quake','bash'].includes(style))main.rotation=outward*(-.9+swing*1.5);else if(style==='thrust'){main.rotation=outward*.35;main.x+=outward*swing*6;}else main.rotation=outward*(.2+swing*.5);if(style==='double')off.rotation=-main.rotation;}
  else{main.rotation=outward*.08+walk*.08;if(this.secondary.visible)off.rotation=-outward*.1;}
 }
 this.setAlpha(action==='dead'?Math.max(0,1-(now-(motion?.since||now))/1400):1);this.rotation=action==='dead'?(now-(motion?.since||now))/1500*.9:action==='hurt'?Math.sin((now-(motion?.since||now))/180*Math.PI)*-.1:0;
 for(const [part,tint]of this.naturalTint){if(action==='hurt'){const c=Phaser.Display.Color.IntegerToRGB(tint);part.setTint(Phaser.Display.Color.GetColor(Math.min(255,c.r+35),Math.floor(c.g*.8),Math.floor(c.b*.75)));}else part.setTint(tint);}
 }
}
