import type {GameMap} from './maps.js';
export function landscape(map:GameMap){const forest=['ljos_field_2','ljos_field_3','ember_field_2','skug_field_2'].includes(map.id);const city=map.kind.includes('city');return{forest,city,trees:city||map.id==='root_trial'?0:forest?100:map.boss?(map.biome==='ore'?6:24):map.biome==='ore'?14:map.id==='central_commons'?28:48,details:city?65:forest?190:150};}
export function landscapeRandom(id:string){let seed=[...id].reduce((n,c)=>(Math.imul(n,31)+c.charCodeAt(0))>>>0,7919);return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
