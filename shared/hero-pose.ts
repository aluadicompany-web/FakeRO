/** Atlas arms are screen-left/right pieces, not anatomical names. Mirroring must not swap handedness. */
export function handJoints(facing:number){const rear=facing>=5,mirrored=[3,4,5].includes(facing);const right=(rear!==mirrored)?'armR':'armL';return{right,left:right==='armR'?'armL':'armR',rear,mirrored};}
export const WALK_STRIDE=1.28; // world tiles per complete left/right stride
export function walkCycle(distance:number){const phase=distance/WALK_STRIDE*Math.PI*2;return{phase,swing:Math.sin(phase),leftLift:Math.max(0,Math.cos(phase))*3.2,rightLift:Math.max(0,-Math.cos(phase))*3.2};}
