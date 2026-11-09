import art from './final-animation.json';
export const FINAL_CHARACTER_ANIMATIONS=art;
export function finalBodyFrame(body:number,pose:number){return art.frames[body*24+Math.max(0,Math.min(23,Math.floor(pose)))];}
export function finalBodyTexture(race:string,gender:string){return 'final-body-'+race+'-'+gender;}
export function finalPortraitAsset(race:string,gender:string,facing:number){return `/art/final-frames/${race}-${gender}-${((Math.round(facing)%8)+8)%8}.webp`;}
