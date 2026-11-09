import Phaser from 'phaser';
import {TOWER_GUARDS} from '../shared/tower';
export function preloadTowerGuards(scene:Phaser.Scene){scene.load.spritesheet('tower-guards','/art/npcs/tower-guards.webp',{frameWidth:192,frameHeight:288});}
export class TowerGuardView extends Phaser.GameObjects.Container{
 sprite:Phaser.GameObjects.Image;
 constructor(scene:Phaser.Scene,public guard:typeof TOWER_GUARDS[number]){super(scene,(guard.x-guard.y)*48,(guard.x+guard.y)*24);scene.add.existing(this);this.setDepth(this.y+32);this.setData('towerGuard',guard.id);this.add(scene.add.ellipse(0,1,31,12,0x183c35,.25));this.sprite=scene.add.image(0,0,'tower-guards',guard.row*4).setOrigin(.5,280/288).setDisplaySize(80,120);this.add(this.sprite);this.add(scene.add.text(0,-114,'ยามผนึก',{fontFamily:'sans-serif',fontSize:'10px',color:'#f6d4b1',stroke:'#253641',strokeThickness:3}).setOrigin(.5));this.add(scene.add.text(0,9,'คลิกเพื่อคุย',{fontFamily:'sans-serif',fontSize:'9px',color:'#eadfca',backgroundColor:'#253e4aca',padding:{x:3,y:2}}).setOrigin(.5,0));}
 animate(now:number){const phase=(now+this.guard.row*270)%4200,frame=phase<1600?0:phase<2400?1:phase<2550?2:phase<3400?3:0;this.sprite.setFrame(this.guard.row*4+frame);}
}
