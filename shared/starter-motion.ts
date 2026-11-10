import data from './starter-motion.json';
import {twoHandGrip} from './weapon-holding';
import type {PaintedFrame} from './painted-frame';
export const STARTER_HEAD_SCALE=data.headScale;
export const STARTER_HEAD_OVERLAP=data.headOverlap;
export function starterHeadRotation(id:number){return data.frames[id]?.headRotation??0;}
/** One painted pose has one shaft direction; crossing the server hit time cannot flip it. */
export function starterTwoHandGrip(facing:number,pose:number,palms:PaintedFrame['palms']){
 return twoHandGrip(facing,palms.right,palms.left,pose===22||pose===23);
}
