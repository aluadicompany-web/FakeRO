/** Art is registered per direction. R/L are anatomical and never change when turning. */
export function handJoints(facing:number){return{right:'armR',left:'armL',rear:facing>=5,mirrored:false};}
export const WALK_STRIDE=1.28; // world tiles per complete left/right stride
export function walkCycle(distance:number){const phase=distance/WALK_STRIDE*Math.PI*2;return{phase,swing:Math.sin(phase),leftLift:Math.max(0,Math.cos(phase))*3.2,rightLift:Math.max(0,-Math.cos(phase))*3.2};}
/** Front costume art faces toward the atlas' right. A short blade rests forward across the waist, not behind the elbow. */
export function oneHandRestAngle(facing:number,weapon:string){if(facing>=5||weapon==='shield'){const h=handJoints(facing);return(h.rear?1:-1)*(Math.cos(facing*Math.PI/4)<-.1?-1:1)*.42;}const sign=Math.cos(facing*Math.PI/4)<-.1?-1:1;return sign*(weapon==='knife'?1.48:weapon==='dagger'?1.25:weapon==='hammer'||weapon==='hammer_shield'?1.05:weapon==='wand'?.7:.92);}
