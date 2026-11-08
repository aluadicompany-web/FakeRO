import Phaser from 'phaser';
import {HAIR_COLORS,EYE_COLORS} from '../shared/appearance';
import {CHARACTER_PARTS,CHARACTER_FRAME,CHARACTER_RACES,characterFrames,CHARACTER_ART_VERSION} from '../shared/character-art';
import type {Hero,Motion} from '../shared/rules';
import {drawWeapon} from './weapon-art';import {weaponById} from '../shared/weapons';
const JOINTS=['back','legL','legR','armL','body','armR','head']as const;
export function preloadHeroArt(scene:Phaser.Scene){for(const name of [...CHARACTER_PARTS,'heads-base','heads-hair','heads-eyes'])scene.load.spritesheet('hero-v3-'+name,`/art/characters/rig-${name}.webp`,{frameWidth:128,frameHeight:192});}
export class HeroRig extends Phaser.GameObjects.Container{
 joints=new Map<string,Phaser.GameObjects.Container>();parts=new Map<string,Phaser.GameObjects.Image>();rest=new Map<string,{x:number;y:number}>();naturalTint=new Map<Phaser.GameObjects.Image,number>();weapon:Phaser.GameObjects.Graphics;secondary:Phaser.GameObjects.Graphics;facing=-1;lookKey='';currentWeapon='';ready=true;hero:Hero;
 constructor(scene:Phaser.Scene,h:Hero){super(scene,0,0);this.hero=h;scene.add.existing(this);this.setData('characterArt',CHARACTER_ART_VERSION);this.add(scene.add.ellipse(0,0,29,12,0x173e3a,.25));const race=Math.max(0,CHARACTER_RACES.indexOf(h.race)),legY=[291,301,342,322,311,307][race]/4-96;
 for(const name of JOINTS){const pivot=name==='armL'?{x:-10.5,y:-50}:name==='armR'?{x:10,y:-50}:name==='legL'?{x:-6,y:legY}:name==='legR'?{x:6,y:legY}:name==='head'||name==='back'?{x:0,y:-54}:{x:0,y:0};this.rest.set(name,pivot);const joint=scene.add.container(pivot.x,pivot.y);this.add(joint);this.joints.set(name,joint);
  for(const key of name==='head'||name==='back'?['base','hair','eyes']:['body']){const part=scene.add.image(-pivot.x,-pivot.y,'__WHITE').setOrigin(.5,1).setDisplaySize(64,96).setVisible(false);joint.add(part);this.parts.set(name+'-'+key,part);this.naturalTint.set(part,0xffffff);}
 }
 this.weapon=scene.add.graphics().setPosition(4,19);this.secondary=scene.add.graphics().setPosition(-4,19);this.joints.get('armR')!.add(this.weapon);this.joints.get('armL')!.add(this.secondary);this.setFacing(2);}
 setFacing(facing:number){const h=this.hero,a=h.appearance,key=[h.race,a.gender,a.hair,a.eyes,a.hairColor,facing].join('-');if(this.lookKey===key)return;this.lookKey=key;this.facing=facing;const frames=characterFrames(h.race,a.gender,a.hair,facing);
 for(const name of JOINTS){if(name==='head'||name==='back'){for(const layer of ['base','hair','eyes']){const part=this.parts.get(name+'-'+layer)!,tint=layer==='hair'?parseInt(HAIR_COLORS[a.hairColor].hex.slice(1),16):layer==='eyes'?parseInt(EYE_COLORS[a.eyes].hex.slice(1),16):0xffffff;part.setTexture('hero-v3-heads-'+layer,frames.head).setDisplaySize(64,96).setTint(tint).setVisible(name==='head'||frames.longHair);part.setCrop();if(frames.longHair){const cut=CHARACTER_FRAME.frontHairCut/2;if(name==='head')part.setCrop(0,0,128,cut);else part.setCrop(0,cut,128,192-cut);}this.naturalTint.set(part,tint);}}
  else this.parts.get(name+'-body')!.setTexture('hero-v3-'+name,frames.body).setDisplaySize(64,96).setVisible(true);
 }
 }
 updatePose(h:Hero,motion:Motion|undefined,now:number){this.hero=h;const action=motion&&motion.until>now?motion.action:h.hp<=0?'dead':'idle',facing=motion?.facing??this.facing;this.setFacing(facing);const mirror=[3,4,5].includes(facing)?-1:1,side=facing===0||facing===4?.86:1;this.setScale(mirror*side,1);const phase=now/110,walk=action==='walk'?Math.sin(phase):0;
 for(const [name,joint]of this.joints){const rest=this.rest.get(name)!;joint.setPosition(rest.x,rest.y);joint.rotation=0;if(name==='legL')joint.rotation=walk*.18;if(name==='legR')joint.rotation=-walk*.18;if(name==='armL')joint.rotation=-walk*.13;if(name==='armR')joint.rotation=walk*.13;if(name==='head'||name==='back')joint.y=rest.y+(action==='walk'?Math.abs(walk)*1.1:Math.sin(now/550)*.35);}
 const id=(action==='attack'?motion?.weapon:h.weapon)||'knife';if(this.currentWeapon!==id){this.currentWeapon=id;drawWeapon(this.weapon,id);this.secondary.clear();if(id.endsWith('_shield'))drawWeapon(this.secondary,id,true);if(id==='dual_swords')drawWeapon(this.secondary,'sword');}
 if(action==='attack'&&motion){const w=weaponById(id),p=Phaser.Math.Clamp((now-motion.since)/Math.max(1,motion.until-motion.since),0,1),swing=Math.sin(p*Math.PI),arm=this.joints.get('armR')!,left=this.joints.get('armL')!;if(['slash','cleave','draw','double'].includes(w.style)){arm.rotation=-1.2+p*2.4;if(w.style==='double')left.rotation=1-p*2;}else if(['smash','quake','bash'].includes(w.style)){arm.rotation=-1.6+swing*2;}else if(w.style==='thrust'){arm.rotation=-.85;arm.x+=swing*7;}else if(w.style==='arrow'){arm.rotation=-1.1;left.rotation=.8;}else{arm.rotation=-.6-swing*.75;left.rotation=.4+swing*.3;}}
 this.setAlpha(action==='dead'?Math.max(0,1-(now-(motion?.since||now))/1400):1);this.rotation=action==='dead'?(now-(motion?.since||now))/1500*.9:action==='hurt'?Math.sin((now-(motion?.since||now))/180*Math.PI)*-.1:0;
 for(const [part,tint]of this.naturalTint){if(action==='hurt'){const c=Phaser.Display.Color.IntegerToRGB(tint);part.setTint(Phaser.Display.Color.GetColor(Math.min(255,c.r+35),Math.floor(c.g*.8),Math.floor(c.b*.75)));}else part.setTint(tint);}
 }
}
