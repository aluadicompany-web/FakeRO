import Phaser from 'phaser';import {weaponById,type WeaponId} from '../shared/weapons';
export function drawWeapon(g:Phaser.GameObjects.Graphics,id:WeaponId,offhand=false){g.clear();const w=weaponById(id),blade=0xe6edf0,edge=0x6b8395,wood=0x82604a;g.lineStyle(1.3,0x343443);const grip=()=>{g.fillStyle(wood);g.fillRoundedRect(-2,-8,4,18,1);g.strokeRoundedRect(-2,-8,4,18,1);};
 if(offhand||id==='shield'){g.fillStyle(0x6889a8);g.fillPoints([{x:-12,y:-18},{x:12,y:-18},{x:14,y:1},{x:0,y:15},{x:-14,y:1}],true);g.strokePoints([{x:-12,y:-18},{x:12,y:-18},{x:14,y:1},{x:0,y:15},{x:-14,y:1}],true);g.lineStyle(2,0xe4c276);g.lineBetween(0,-14,0,9);g.lineBetween(-9,-6,9,-6);return;}
 grip();if(['bow','shortbow','longbow'].includes(id)){const size=id==='longbow'?38:id==='shortbow'?24:30;g.lineStyle(3,wood);g.beginPath();g.arc(0,-4,size,-Math.PI/2,Math.PI/2,false);g.strokePath();g.lineStyle(1,0xf1e5bd);g.lineBetween(0,-4-size,0,-4+size);g.lineStyle(2,0xe9d6a1);g.lineBetween(-10,-4,32,-4);return;}
 if(id==='staff'||id==='wand'){const size=id==='staff'?42:25;g.fillStyle(wood);g.fillRect(-2,-size,4,size+15);g.fillStyle(w.color);g.fillCircle(0,-size-4,id==='staff'?8:5);g.lineStyle(2,0xe9cc8a);g.strokeCircle(0,-size-4,id==='staff'?9:6);return;}
 if(id.includes('hammer')){const size=id==='greathammer'?40:27;g.fillStyle(wood);g.fillRect(-2,-size,4,size+5);g.fillStyle(0x9ca7b0);g.fillRoundedRect(-13,-size-8,26,14,3);g.strokeRoundedRect(-13,-size-8,26,14,3);return;}
 if(id==='axe'){g.fillStyle(wood);g.fillRect(-2,-35,4,44);g.fillStyle(blade);g.fillPoints([{x:0,y:-36},{x:19,y:-42},{x:23,y:-24},{x:0,y:-20}],true);g.strokePoints([{x:0,y:-36},{x:19,y:-42},{x:23,y:-24},{x:0,y:-20}],true);return;}
 const size=id==='greatsword'?48:id==='katana'?44:id==='knife'||id==='dagger'?20:34;g.fillStyle(blade);g.fillPoints([{x:-3,y:-8},{x:-3,y:-size},{x:0,y:-size-8},{x:4,y:-size},{x:3,y:-8}],true);g.strokePoints([{x:-3,y:-8},{x:-3,y:-size},{x:0,y:-size-8},{x:4,y:-size},{x:3,y:-8}],true);g.lineStyle(1,edge);g.lineBetween(0,-12,0,-size);g.fillStyle(0xd0af68);g.fillRect(-8,-8,16,3);
}

// Held-view variants retain the catalogue skin and a fixed true grip, independent of icon bounds.
import art from '../shared/held-weapon-art.json';
import {EQUIPMENT_BY_ID} from '../shared/items';
import {weaponView,bowDraw} from '../shared/weapon-holding';
export function preloadEquipmentArt(scene:Phaser.Scene){scene.load.atlas('held-weapons','/art/held-weapons/poses.webp','/art/held-weapons/poses.json');}
export function weaponGripKind(id:WeaponId){return ['bow','shortbow','longbow'].includes(id)?'bow':['greatsword','greathammer','axe'].includes(id)?'two':'single';}
export class HeldWeapon extends Phaser.GameObjects.Container{
 image:Phaser.GameObjects.Image;fallback:Phaser.GameObjects.Graphics;bowEnds?:{x:number;y:number}[];tipAnchor={x:100,y:100};base='white-5';profile:WeaponId='knife';gripOffset=0;supportGap=0;height=25;viewKey='';
 constructor(scene:Phaser.Scene){super(scene,0,0);scene.add.existing(this);this.image=scene.add.image(0,0,'__WHITE').setVisible(false);this.fallback=scene.add.graphics().setVisible(false);this.add([this.image,this.fallback]);}
 localPoint(point:{x:number;y:number},relative?:Phaser.GameObjects.Container){const world=this.image.getWorldTransformMatrix().transformPoint(point.x-this.image.displayOriginX,point.y-this.image.displayOriginY,new Phaser.Math.Vector2());return relative?relative.getWorldTransformMatrix().applyInverse(world.x,world.y,new Phaser.Math.Vector2()):world;}
 bowEndpoints(relative:Phaser.GameObjects.Container){return this.bowEnds?.map(p=>this.localPoint(p,relative));}
 tipWorld(){return this.localPoint(this.tipAnchor);}
 primaryContactWorld(){return this.localPoint({x:100,y:100+this.gripOffset/this.image.scaleY});}
 supportContactWorld(){return this.localPoint({x:100,y:100+(this.gripOffset?0:this.supportGap/this.image.scaleY)});}
 setGripLower(lower:boolean,gap:number){this.supportGap=gap;this.gripOffset=lower?gap:0;this.image.setPosition(0,-this.gripOffset);return this;}
 selectPose(facing:number,pose:number,step=0){const bow=['bow','shortbow','longbow'].includes(this.profile),key=this.base+(bow?':b'+facing+'d'+bowDraw(pose):':v'+weaponView(this.profile,facing,pose,step));if(key===this.viewKey)return this;this.viewKey=key;const frame=art.frames[key as keyof typeof art.frames];if(!frame)throw Error('Missing held weapon pose '+key);this.image.setTexture('held-weapons',key).setOrigin(.5,.5).setScale(this.height/art.nativeHeight).setVisible(true);this.bowEnds=frame.ends||undefined;this.tipAnchor=frame.tip;this.setData('heldFrame',key);return this;}
 setWeapon(id:WeaponId,catalogId?:string,offhand=false){const item=catalogId?EQUIPMENT_BY_ID.get(catalogId):undefined;this.profile=offhand?'shield':id;const columns:Record<string,number>={knife:5,sword:0,greatsword:1,shield:2,staff:3,wand:4,dagger:5,bow:6,hammer:7,sword_shield:0,hammer_shield:7};const special:Record<string,string>={axe:'axe',katana:'katana',greathammer:'greathammer',longbow:'longbow',shortbow:'shortbow',dual_swords:'dual_sword'};this.base=item?(item.rarity+'-'+item.frame):special[this.profile]?'special-'+special[this.profile]:'white-'+(columns[this.profile]??0);this.height=offhand?33:({knife:25,sword:49,greatsword:72,shield:35,staff:69,wand:35,dagger:31,bow:65,hammer:41,sword_shield:49,hammer_shield:41,greathammer:66,longbow:82,shortbow:51,katana:63,dual_swords:43,axe:67}as Record<string,number>)[id]||48;this.viewKey='';this.selectPose(1,0);return this;}
}
