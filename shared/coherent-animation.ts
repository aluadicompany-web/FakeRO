import data from './coherent-animation.json';
import type {ClipFamily,PaintedFrame} from './painted-frame';
import type {AttackClip} from './attack-animation';
import {WALK_STRIDE} from './hero-pose';
import {holdingStyle} from './weapon-holding';
import {weaponById,type WeaponId} from './weapons';
export const COHERENT_ART=data;
export const CLIP_FAMILIES=['one','two','bow','walk'] as const;
export function coherentFrame(body:number,family:ClipFamily,phase:number):PaintedFrame{return data.frames[(body*4+CLIP_FAMILIES.indexOf(family))*8+Math.max(0,Math.min(7,Math.floor(phase)))] as PaintedFrame;}
export function coherentFamily(weapon:WeaponId):ClipFamily{return holdingStyle(weapon);}
/** The contact pose is always source phase 4. Reverse strokes traverse the SAME right arm backward. */
export function coherentPhase(action:string,travel:number,weapon:WeaponId,elapsed:number,clip?:AttackClip){
 if(action==='walk')return Math.floor(((travel/WALK_STRIDE)%1+1)%1*8)%8;
 if(action!=='attack'||!clip)return 0;
 const style=weaponById(weapon).style,back=(clip.step%2===1)&&!['arrow','pulse','bolt','thrust','bash'].includes(style),route=back?[7,6,5,4,3,2,1,0]:['pulse','bolt','thrust','bash'].includes(style)?[0,1,2,3,4,3,2,1,0]:[0,1,2,3,4,5,6,7],contact=back?3:4;
 if(elapsed<0)return route[0];
 if(elapsed<clip.windup)return route[Math.min(contact-1,Math.floor(elapsed/Math.max(1,clip.windup)*contact))];
 const hold=Math.min(clip.interval*.09,(clip.duration-clip.windup)*.25);
 if(elapsed<clip.windup+hold)return 4;
 const recovery=Math.max(1,clip.duration-clip.windup-hold);return route[Math.min(route.length-1,contact+1+Math.floor((elapsed-clip.windup-hold)/recovery*(route.length-1-contact)))];
}
export function coherentLogicalPose(family:ClipFamily,phase:number){return(family==='walk'?[2,2,3,3,4,4,5,5]:family==='two'?[20,20,21,21,22,23,23,20]:family==='bow'?[16,17,17,18,19,19,16,16]:[0,6,6,6,7,8,8,0])[phase];}
export function manualCoherentFrame(body:number,weapon:WeaponId,pose:number){
 const family:ClipFamily=pose>=16&&pose<=19?'bow':pose>=20?'two':pose>=2&&pose<=5?'walk':coherentFamily(weapon);
 const phase=pose>=20?[0,2,4,6][pose-20]:pose>=16?[0,2,3,4][pose-16]:pose>=2&&pose<=5?(pose-2)*2:({6:2,7:4,8:5,9:3,10:4,11:2,12:2,13:4} as Record<number,number>)[pose]??0;
 return coherentFrame(body,family,phase);
}
/** Fit the ENTIRE authored track, not the current sword tip, so playback never zooms per frame. */
export function coherentPreviewBounds(body:number,family:ClipFamily,weaponHeight:number,includeWeapon=true,guardOnly=false){
 let extent=25,height=90;
 for(let phase=0;phase<(guardOnly?1:8);phase++){
  const f=coherentFrame(body,family,phase);extent=Math.max(extent,Math.abs(f.neck.x)+20);height=Math.max(height,-f.neck.y+31);
  if(includeWeapon){const length=weaponHeight*.85*(f.projection??1),a=f.weaponAngle??0;const x=f.palms.right.x+Math.sin(a)*length,y=f.palms.right.y-Math.cos(a)*length;extent=Math.max(extent,Math.abs(x)+6,Math.abs(f.palms.left.x)+18);height=Math.max(height,-y+8);if(family==='bow'){extent=Math.max(extent,Math.abs(f.palms.right.x)+weaponHeight*.4);height=Math.max(height,-f.palms.right.y+weaponHeight*.55);}}
 }
 return{extent,height};
}
