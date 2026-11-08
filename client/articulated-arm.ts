import Phaser from 'phaser';
import {solveArm,type V2} from '../shared/attack-animation';
/** Reuse the painted sleeve and glove, split at the elbow only while posing. No stretched arm or detached weapon. */
export class ArticulatedArm{
 elbow:Phaser.GameObjects.Container;lower:Phaser.GameObjects.Image;
 constructor(scene:Phaser.Scene,public joint:Phaser.GameObjects.Container,public upper:Phaser.GameObjects.Image){this.elbow=scene.add.container().setVisible(false);this.lower=scene.add.image(0,0,'__WHITE').setOrigin(.5,1);this.elbow.add(this.lower);joint.add(this.elbow);}
 reset(){this.upper.setCrop();this.elbow.setVisible(false);}
 solve(sourceShoulder:V2,shoulder:V2,palm:V2,target:V2,bend:number,weapon?:Phaser.GameObjects.Container){const nativeElbow={x:(sourceShoulder.x+palm.x)/2,y:-41},upperVector={x:nativeElbow.x-sourceShoulder.x,y:nativeElbow.y-sourceShoulder.y},lowerVector={x:palm.x-nativeElbow.x,y:palm.y-nativeElbow.y},upperLength=Math.hypot(upperVector.x,upperVector.y),lowerLength=Math.hypot(lowerVector.x,lowerVector.y),solution=solveArm(shoulder,target,upperLength,lowerLength,bend),upperRotation=solution.upperAngle-Math.atan2(upperVector.y,upperVector.x),lowerRotation=solution.lowerAngle-Math.atan2(lowerVector.y,lowerVector.x)-upperRotation;
 this.joint.setPosition(shoulder.x,shoulder.y).setScale(1).setRotation(upperRotation);this.upper.setCrop(0,0,128,112);this.elbow.setPosition(upperVector.x,upperVector.y).setRotation(lowerRotation).setScale(1).setVisible(true);this.lower.setTexture(this.upper.texture.key,this.upper.frame.name).setPosition(-nativeElbow.x,-nativeElbow.y).setDisplaySize(64,96).setTint(this.upper.tintTopLeft).setCrop(0,109,128,83);
 if(weapon){if(weapon.parentContainer!==this.elbow){weapon.parentContainer?.remove(weapon);this.elbow.addAt(weapon,0);}weapon.setPosition(lowerVector.x,lowerVector.y);}
 return{rotation:upperRotation+lowerRotation,hand:solution.hand};
 }
}
