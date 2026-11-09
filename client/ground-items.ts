import Phaser from 'phaser';
import type {Snapshot} from '../shared/rules';
import {supplyFor,quantity} from '../shared/supplies';
import {EQUIPMENT_BY_ID} from '../shared/items';
import {iso} from './map-renderer';
export function preloadGroundItems(scene:Phaser.Scene){scene.load.atlas('basic-items','/art/items/basic.webp','/art/items/basic.json');for(const rarity of ['white','blue'])scene.load.spritesheet('ground-'+rarity,'/art/weapons/'+rarity+'.webp',{frameWidth:128,frameHeight:160});}
export class GroundItems {
 views=new Map<string,Phaser.GameObjects.Container>();
 constructor(private scene:Phaser.Scene){}
 update(snapshot:Snapshot,now:number){const alive=new Set<string>();for(const d of snapshot.groundItems??[]){if(d.expires<=now)continue;alive.add(d.id);let c=this.views.get(d.id);if(!c){const p=iso(d.x,d.y),def=supplyFor(d.item),weapon=d.item.catalogId?EQUIPMENT_BY_ID.get(d.item.catalogId):undefined,color=def?.rarity==='gold'?0xf2c95f:weapon?.rarity==='blue'||def?.rarity==='blue'?0x7fc8ff:0xe3e8ce;c=this.scene.add.container(p.x,p.y).setDepth(p.y+5);const ring=this.scene.add.ellipse(0,0,32,15,0x203c30,.3).setStrokeStyle(1,color,.75);const image=weapon?this.scene.add.image(0,-12,'ground-'+weapon.rarity,weapon.frame).setDisplaySize(30,38):this.scene.add.image(0,-12,'basic-items',String(def?.icon??21)).setDisplaySize(34,34);const label=this.scene.add.text(0,-40,d.item.name+(quantity(d.item)>1?' ×'+quantity(d.item):''),{fontFamily:'sans-serif',fontSize:'10px',color:'#fff2ce',backgroundColor:'#203a32d9',padding:{x:4,y:3}}).setOrigin(.5).setVisible(false);c.add([ring,image,label]);image.setInteractive().on('pointerover',()=>label.setVisible(true)).on('pointerout',()=>label.setVisible(false));this.scene.tweens.add({targets:image,y:-17,duration:1000,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});this.views.set(d.id,c);}}
 for(const [id,c]of this.views)if(!alive.has(id)){c.destroy();this.views.delete(id);}document.body.dataset.groundItems=String(this.views.size);}
}
