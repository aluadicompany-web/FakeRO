import {equippedCatalog,offhandCatalog,meetsRequirements} from './items.js';
import {MOVEMENT_SPEED} from './adventure.js';
import {weaponById,type WeaponId} from './weapons.js';
import {MAP_BY_ID} from './maps.js';
import {appearanceOrDefault,type Appearance,type AppearanceInput} from './appearance.js';
export const STAT_KEYS = ['str','agi','vit','int','dex','luk'] as const;
export type Stat = typeof STAT_KEYS[number];
export type Attributes = Record<Stat,number>;
export const RACES = [
 {id:'muspel',name:'Muspelborn',thai:'ทายาทเปลวเพลิง',color:0xdc6655,hex:'#dc6655',role:'นักดาบ · STR',bonus:'str',lore:'สายเลือดแห่งมุสเปลไฮม์ ผู้มีเปลวไฟเป็นหัวใจ'},
 {id:'alf',name:'Ljosalfar',thai:'เอลฟ์แห่งรุ่งอรุณ',color:0x91bc78,hex:'#91bc78',role:'นักธนู · DEX',bonus:'dex',lore:'ทายาทแห่งอัลฟ์ไฮม์ ผู้มองเห็นเส้นทางในหมอก'},
 {id:'jotun',name:'Jotunborn',thai:'ทายาทยักษ์น้ำแข็ง',color:0x80b9cb,hex:'#80b9cb',role:'นักบวช · VIT',bonus:'vit',lore:'ผู้รับพรธารน้ำแข็ง เยียวยาชีวิตและคุ้มครองสหาย'},
 {id:'vanir',name:'Vanirkin',thai:'ผู้สืบสายวานีร์',color:0xc3a1df,hex:'#c3a1df',role:'นักเวท · INT',bonus:'int',lore:'ผู้รับพรแห่งวานาไฮม์ ถักทอเวทจากรากไม้โลก'},
 {id:'nid',name:'Nidavellir',thai:'ผู้สืบสายช่างรูน',color:0xd7b765,hex:'#d7b765',role:'พ่อค้า · LUK',bonus:'luk',lore:'ทายาทช่างรูน ผู้พบโอกาสในทุกเศษศิลา'},
 {id:'skug',name:'Skuggar',thai:'ผู้เดินในเงา',color:0x292c32,hex:'#292c32',role:'โจร · AGI',bonus:'agi',lore:'ผู้เดินใต้เงาอิกดราซิล รวดเร็วดั่งลมหายใจ'}
] as const;
export type Race = typeof RACES[number]['id'];
export interface LootItem{id:string;name:string;rarity:string;catalogId?:string;testOnly?:boolean}
export interface Hero { id:string; name:string; race:Race; appearance:Appearance; weapon?:WeaponId; equippedItem?:string; equippedCatalogId?:string;offhandItem?:string;offhandCatalogId?:string; attackReadyAt?:number; level:number; xp:number; points:number; stats:Attributes; hp:number; mp:number; x:number; y:number; kills:number; mapId:string; visited:string[]; bindMap:string; coins:number; loot:LootItem[];deliveries:LootItem[] }
export function attributes(h:Hero):Attributes {
 const a={...h.stats}; const r=RACES.find(r=>r.id===h.race)!;
 a[r.bonus]+=3+Math.floor((h.level-1)/5); return a;
}
export function derived(h:Hero) {
 const a=attributes(h),item=equippedCatalog(h),gear=item&&meetsRequirements(item,h.level,a)?item:undefined,shieldItem=offhandCatalog(h),shield=shieldItem&&meetsRequirements(shieldItem,h.level,a)?shieldItem:undefined;
 return {maxHp:90+h.level*12+a.vit*8,maxMp:40+h.level*5+a.int*5,attack:8+h.level*2+a.str*2+a.dex*.4+(gear?.powerType==='ATK'?gear.power:0),magic:8+h.level*2+a.int*2+a.dex*.4+(gear?.powerType==='MATK'?gear.power:0),defense:a.vit*.7+h.level*.5+(gear?.type==='shield'?gear.power*.3:0)+(shield?shield.power*.3:0),interval:Math.max(450,1100-a.agi*12),crit:Math.min(.3,.02+a.luk*.003),speed:MOVEMENT_SPEED};
}
export const xpNeeded=(level:number)=>Math.floor(45*Math.pow(level,1.65));
export function award(h:Hero,xp:number) {
 h.xp+=xp; while(h.level<120 && h.xp>=xpNeeded(h.level)){h.xp-=xpNeeded(h.level);h.level++;h.points+=3;h.hp=derived(h).maxHp;h.mp=derived(h).maxMp;}
 if(h.level===120)h.xp=Math.min(h.xp,xpNeeded(120));
}
export function allocate(h:Hero,key:unknown):boolean {
 if(!STAT_KEYS.includes(key as Stat)||h.points<1||h.stats[key as Stat]>=99)return false;
 h.stats[key as Stat]++;h.points--;h.hp=Math.min(h.hp,derived(h).maxHp);return true;
}
export function newHero(id:string,name:string,race:Race,appearance?:AppearanceInput):Hero {
 const h:Hero={id,name,race,appearance:appearanceOrDefault(appearance),level:1,xp:0,points:0,stats:{str:5,agi:5,vit:5,int:5,dex:5,luk:5},hp:1,mp:1,x:14.5,y:22.5,kills:0,mapId:'central_city',visited:['central_city'],bindMap:'central_city',coins:0,loot:[],deliveries:[]};const spawn=MAP_BY_ID.get('central_city')!.spawn;h.x=spawn.x;h.y=spawn.y;h.hp=derived(h).maxHp;h.mp=derived(h).maxMp;return h;
}
export const WORLD_SIZE=28;
export interface Motion {action:'idle'|'walk'|'attack'|'hurt'|'dead';facing:number;since:number;until:number;weapon?:WeaponId;catalogId?:string;offhandCatalogId?:string}
export interface CombatEffect {id:number;sourceId:string;targetId?:string;mapId:string;style:string;from:{x:number;y:number};to:{x:number;y:number};start:number;impact:number;end:number;color:number;critical?:boolean}
export interface Mob {species?:string;id:string;name:string;x:number;y:number;hp:number;maxHp:number;level:number;deadUntil:number;mapId:string;boss?:boolean;archetype?:number;worldBoss?:import('./norse.js').WorldBossType}
export interface Snapshot {motions?:Record<string,Motion>;effects?:CombatEffect[];serverTime?:number;mapId:string;self:string;players:Hero[];mobs:Mob[];online:number;events:{id:number;x:number;y:number;text:string;color:string}[];telegraph?:{x:number;y:number;radius:number;until:number}[];message?:string;rootTrialCleared?:boolean;worldBoss?:{nextSpawnAt:number;serverTime:number;active?:{id:string;name:string;mapId:string;hp:number;maxHp:number}}}
