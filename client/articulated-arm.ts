import Phaser from 'phaser';
import {solveArm,type V2} from '../shared/attack-animation';
/** Anatomical arm layers share registration; held items render between sleeve and fingers. */
export class ArticulatedArm{
 elbow:Phaser.GameObjects.Container;lower:Phaser.GameObjects.Image;lowerGlove:Phaser.GameObjects.Image;frame=0;side='R';nativeElbow:V2={x:0,y:-41};
 constructor(scene:Phaser.Scene,public joint:Phaser.GameObjects.Container,public upper:Phaser.GameObjects.Image,public glove:Phaser.GameObjects.Image){this.elbow=scene.add.container().setVisible(false);this.lower=scene.add.image(0,0,'__WHITE').setOrigin(.5,1);this.lowerGlove=scene.add.image(0,0,'__WHITE').setOrigin(.5,1);this.elbow.add([this.lower,this.lowerGlove]);joint.add(this.elbow);}
 configure(name:string,frame:number,elbow:V2){this.side=name.slice(-1);this.frame=frame;this.nativeElbow=elbow;}
 reset(){this.upper.setTexture('character-body-v4',`arm${this.side}-${this.frame}`).setDisplaySize(64,96);this.glove.setVisible(true);this.elbow.setVisible(false);}
 solve(sourceShoulder:V2,shoulder:V2,palm:V2,target:V2,bend:number,weapon?:Phaser.GameObjects.Container){const nativeElbow=this.nativeElbow,upperVector={x:nativeElbow.x-sourceShoulder.x,y:nativeElbow.y-sourceShoulder.y},lowerVector={x:palm.x-nativeElbow.x,y:palm.y-nativeElbow.y},solution=solveArm(shoulder,target,Math.hypot(upperVector.x,upperVector.y),Math.hypot(lowerVector.x,lowerVector.y),bend),upperRotation=solution.upperAngle-Math.atan2(upperVector.y,upperVector.x),lowerRotation=solution.lowerAngle-Math.atan2(lowerVector.y,lowerVector.x)-upperRotation;
 this.joint.setPosition(shoulder.x,shoulder.y).setScale(1).setRotation(upperRotation);this.upper.setTexture('character-body-v4',`upperArm${this.side}-${this.frame}`).setDisplaySize(64,96);this.glove.setVisible(false);this.elbow.setPosition(upperVector.x,upperVector.y).setRotation(lowerRotation).setScale(1).setVisible(true);this.lower.setTexture('character-body-v4',`forearm${this.side}-${this.frame}`).setPosition(-nativeElbow.x,-nativeElbow.y).setDisplaySize(64,96);this.lowerGlove.setTexture('character-body-v4',`glove${this.side}-${this.frame}`).setPosition(-nativeElbow.x,-nativeElbow.y).setDisplaySize(64,96);
 if(weapon){if(weapon.parentContainer!==this.elbow){weapon.parentContainer?.remove(weapon);this.elbow.addAt(weapon,1);}weapon.setPosition(lowerVector.x,lowerVector.y);}
 return{rotation:upperRotation+lowerRotation,hand:solution.hand};
 }
}
