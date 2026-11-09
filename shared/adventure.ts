import {CENTRAL_PLAZA,CENTRAL_GUIDE} from './central-layout.js';
export const MOVEMENT_SPEED=2.6;
export function monsterNameColor(playerLevel:number,monsterLevel:number){return playerLevel-monsterLevel>=10?'#ffffff':monsterLevel<playerLevel?'#9fe58b':monsterLevel===playerLevel?'#ffe08a':'#ff8c80';}
export function monsterExperience(playerLevel:number,monsterLevel:number,base:number){return playerLevel-monsterLevel>=10?0:base;}
export const CENTRAL_REST_ZONE={mapId:'central_city',x:CENTRAL_PLAZA.x,y:CENTRAL_PLAZA.y,radius:CENTRAL_PLAZA.radius,hpPerSecond:.06,mpPerSecond:.1};
export const GUIDE={id:'central-guide',name:'Eira · ผู้นำทาง',x:CENTRAL_GUIDE.x,y:CENTRAL_GUIDE.y,adultAge:28};
export function inRestZone(mapId:string,x:number,y:number){return mapId===CENTRAL_REST_ZONE.mapId&&Math.hypot(x-CENTRAL_REST_ZONE.x,y-CENTRAL_REST_ZONE.y)<=CENTRAL_REST_ZONE.radius;}
