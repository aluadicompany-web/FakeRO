import art from './character-animation.json';
import {weaponById,type WeaponId} from './weapons';
import {WALK_STRIDE,oneHandRestAngle} from './hero-pose';
import type {AttackClip} from './attack-animation';
export const FRAME_ART_ROOT='/art/characters-v5/';
export const CHARACTER_ANIMATIONS=art;
export function bodyPoseFrame(body:number,pose:number){return art.frames[body*16+Math.max(0,Math.min(15,Math.floor(pose)))];}
export function attackSpritePose(weapon:WeaponId,clip:AttackClip,elapsed:number){
 const style=weaponById(weapon).style,step=clip.step%4;
 const contact=style==='arrow'?13:style==='pulse'||style==='bolt'?13:style==='thrust'?[10,7,9,10][step]:style==='smash'||style==='quake'||style==='cleave'?[12,8,12,8][step]:[7,9,7,10][step];
 const wind=style==='arrow'||style==='pulse'||style==='bolt'?12:style==='smash'||style==='quake'||style==='cleave'?11:[6,8,11,6][step];
 if(elapsed<0)return 0;if(elapsed<clip.windup*.28)return 0;if(elapsed<clip.windup)return wind;
 if(elapsed<Math.min(clip.duration,clip.windup+clip.interval*.13))return contact;
 if(elapsed<clip.duration*.91)return style==='arrow'||style==='pulse'||style==='bolt'?12:8;
 return clip.length>=3?wind:0;
}
export function spritePose(action:string,now:number,since:number,travel:number,weapon:WeaponId,clip?:AttackClip){
 if(action==='walk')return [2,3,4,5][Math.floor(((travel/WALK_STRIDE)%1+1)%1*4)];
 if(action==='dead')return now-since<150?14:15;
 if(action==='hurt')return 14;
 if(action==='attack'&&clip)return attackSpritePose(weapon,clip,now-since);
 return Math.floor(now/500)%2===0?0:1;
}
/** Frame-local item orientation, not an interpolated bone or inverse-kinematics solver. */
export function frameWeaponAngle(weapon:WeaponId,facing:number,pose:number,palms:{right:{x:number;y:number};left:{x:number;y:number}}){
 const aim=Math.atan2(Math.sin(facing*Math.PI/4)*.55,Math.cos(facing*Math.PI/4)),two=['greatsword','greathammer'].includes(weapon),bow=['bow','longbow','shortbow'].includes(weapon);
 if(weapon==='staff'&&(pose<=5||pose===12||pose>=14))return (palms.right.x<0?-1:1)*.28;
 if(two&&[11,12,8].includes(pose))return Math.atan2(palms.right.y-palms.left.y,palms.right.x-palms.left.x)+Math.PI/2;
 if(bow)return aim;
 if(pose<=5||pose>=14)return oneHandRestAngle(facing,weapon);
 return aim+Math.PI/2+({6:-1.5,7:0,8:1.1,9:-.8,10:0,11:-1.9,12:-1.2,13:0}[pose]??0);
}
