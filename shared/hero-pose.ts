/** Atlas arms are screen-left/right pieces, not anatomical names. Mirroring must not swap handedness. */
export function handJoints(facing:number){const rear=facing>=5,mirrored=[3,4,5].includes(facing);const right=(rear!==mirrored)?'armR':'armL';return{right,left:right==='armR'?'armL':'armR',rear,mirrored};}
export const WALK_STRIDE=1.28; // world tiles per complete left/right stride
export function walkCycle(distance:number){const phase=distance/WALK_STRIDE*Math.PI*2;return{phase,swing:Math.sin(phase),leftLift:Math.max(0,Math.cos(phase))*3.2,rightLift:Math.max(0,-Math.cos(phase))*3.2};}
/** Front costume art faces toward the atlas' right. A short blade rests forward across the waist, not behind the elbow. */
export function oneHandRestAngle(facing:number,weapon:string){if(facing>=5||weapon==='shield'){const h=handJoints(facing);return(h.rear?1:-1)*(h.mirrored?-1:1)*.42;}return weapon==='knife'?1.48:weapon==='dagger'?1.25:weapon==='hammer'||weapon==='hammer_shield'?1.05:weapon==='wand'?.7:.92;}
/** Existing atlas anchors mark the bottom of the closed glove. The grip belongs inside its palm. */
export function palmAnchor(point:{x:number;y:number}){return{x:point.x,y:point.y-1};}
