import bodies from './holding-bodies.json';
import type {WeaponId} from './weapons';import type {AttackClip} from './attack-animation';
export const HOLDING_ART=bodies;
export function holdingStyle(weapon:WeaponId){return ['bow','longbow','shortbow'].includes(weapon)?'bow':['greatsword','greathammer','axe'].includes(weapon)?'two':'one';}
export function holdingBody(body:number,pose:number){return bodies.frames[body*8+pose-16];}
export function holdingPose(weapon:WeaponId,action:string,clip:AttackClip|undefined,elapsed:number){
 const style=holdingStyle(weapon);if(style==='one'||['walk','hurt','dead'].includes(action))return;
 if(action!=='attack'||!clip)return style==='bow'?16:20;
 if(style==='bow'){if(elapsed<clip.windup*.38)return 17;if(elapsed<clip.windup)return 18;if(elapsed<Math.min(clip.duration,clip.windup+clip.interval*.16))return 19;return clip.length>=3?17:16;}
 const step=clip.step%4;if(elapsed<clip.windup*.28)return 20;if(elapsed<clip.windup)return [21,23,21,20][step];if(elapsed<Math.min(clip.duration,clip.windup+clip.interval*.15))return [22,22,23,22][step];return [23,21,20,23][step];
}
export function weaponView(weapon:WeaponId,facing:number,pose:number,step=0){let view=[2,1,0,1,2,3,4,3][facing];if(weapon==='shield')return view;if(holdingStyle(weapon)==='two'&&[22,23].includes(pose))return facing>=5?5:6;const contact=[7,9,10,22,23].includes(pose);if(contact&&facing===2)view=6;else if(contact&&facing===6)view=5;else if(contact&&step%2)view=facing>=5?3:2;return view;}
export function bowDraw(pose:number){return pose===18?2:pose===17?1:0;}
export function holdingLayers(facing:number,pose:number,occluded=false){return{mainBehind:occluded||[3,4,5].includes(facing)&&pose<=5||facing>=5&&pose>=16&&pose<=19,offBehind:[0,1,7].includes(facing)};}

export function twoHandGrip(facing:number,right:{x:number;y:number},left:{x:number;y:number},contact:boolean){const dx=right.x-left.x,dy=right.y-left.y,gap=Math.hypot(dx,dy);let angle=Math.atan2(dy,dx)+Math.PI/2;const desired=contact?{x:Math.cos(facing*Math.PI/4),y:Math.sin(facing*Math.PI/4)*.55+.65}:{x:-Math.cos(facing*Math.PI/4)*.2,y:-1};const lower=Math.sin(angle)*desired.x-Math.cos(angle)*desired.y<0;if(lower)angle+=Math.PI;return{angle,lower,gap};}
