/** Art is registered per direction. R/L are anatomical and never change when turning. */
export function handJoints(facing:number){return{right:'armR',left:'armL',rear:facing>=5,mirrored:false};}
export const WALK_STRIDE=1.28; // world tiles per complete left/right stride
export function walkCycle(distance:number){const phase=distance/WALK_STRIDE*Math.PI*2;return{phase,swing:Math.sin(phase),leftLift:Math.max(0,Math.cos(phase))*3.2,rightLift:Math.max(0,-Math.cos(phase))*3.2};}
/** Front costume art faces toward the atlas' right. A short blade rests forward across the waist, not behind the elbow. */
export function oneHandRestAngle(facing:number,weapon:string){
 if(weapon==='shield')return(facing>=5?1:-1)*(Math.cos(facing*Math.PI/4)<-.1?-1:1)*.42;
 // A rear-view relaxed hand carries the blade downward beside the leg, not up across the back.
 if(facing>=5)return Math.PI-(facing===6?.18:.28);
 const sign=Math.cos(facing*Math.PI/4)<-.1?-1:1;return sign*(weapon==='knife'?1.48:weapon==='dagger'?1.25:weapon==='hammer'||weapon==='hammer_shield'?1.05:weapon==='wand'?.7:.92);
}
export function offhandRestAngle(facing:number){return facing>=5?Math.PI+.2:Math.cos(facing*Math.PI/4)<0?-.25:.25;}
/** Flare a relaxed blade outward only as much as its true tip needs to clear the ground. */
export function groundSafeCarryAngle(angle:number,palmY:number,tip:{x:number;y:number},side:1|-1){
 const tipY=(a:number)=>palmY+Math.sin(a)*tip.x+Math.cos(a)*tip.y;
 if(tipY(angle)<=-3)return angle;
 let spread=Math.min(Math.PI/2,Math.abs(Math.atan2(Math.sin(angle-Math.PI),Math.cos(angle-Math.PI))));
 while(spread<Math.PI/2){spread=Math.min(Math.PI/2,spread+.025);const candidate=Math.PI-side*spread;if(tipY(candidate)<=-3)return candidate;}
 return Math.PI-side*Math.PI/2;
}
