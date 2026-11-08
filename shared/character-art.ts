/** Shared art indices: creator, portrait and Phaser all use this same painted asset set. */
export const CHARACTER_ART_VERSION='painted-sd-v3';
export const CHARACTER_RACES=['muspel','alf','jotun','vanir','nid','skug']as const;
export const CHARACTER_FRAME={width:256,height:384,runtimeWidth:128,runtimeHeight:192,footY:376,frontHairCut:163};
export const CHARACTER_PARTS=['body','armL','armR','legL','legR']as const;
export function characterFrames(race:string,gender:'male'|'female',hair:number,facing=2){const rear=facing>=5;return{body:Math.max(0,CHARACTER_RACES.indexOf(race as typeof CHARACTER_RACES[number]))+(gender==='female'?6:0)+(rear?12:0),head:hair+(gender==='female'?5:0)+(rear?10:0),longHair:!rear&&(gender==='male'?[1,2].includes(hair):[1,4].includes(hair))};}
