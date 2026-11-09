import {SUPPLY_BY_ID,receive} from '../shared/supplies.js';
import {makeSupply} from './inventory.js';
import {randomUUID} from 'node:crypto';
import {validUsername,validPassword} from './password.js';
import type {Store} from './store.js';
import type {World} from './world.js';
import {MAP_BY_ID} from '../shared/maps.js';
import {validAppearance,appearanceOrDefault} from '../shared/appearance.js';
import {EQUIPMENT_BY_ID,validateEquipment} from '../shared/items.js';
import {award,derived,allocate,attributes,RACES,STAT_KEYS,type Hero} from '../shared/rules.js';
export async function bootstrapGM(store:Store){const username=process.env.GM_USERNAME,password=process.env.GM_PASSWORD;if(!username&&!password)return;if(!validUsername(username)||!validPassword(password))throw Error('GM_USERNAME ต้องยาว3–24ตัว และ GM_PASSWORD อย่างน้อย10ตัว');const account=store.account(username);if(account){if(account.role!=='gm')throw Error('ชื่อบัญชี GM ถูกใช้โดยผู้เล่นแล้ว กรุณาใช้ชื่ออื่น');return;}await store.register(randomUUID(),username,password,'gm');}
export function gmAction(world:World,heroId:string,command:Record<string,unknown>){const actor=world.actors.get(heroId);if(!actor)throw Error('เข้าเกมก่อนใช้คำสั่ง GM');const h=actor.hero;
 if(command.action==='teleport'){if(typeof command.mapId!=='string'||!MAP_BY_ID.has(command.mapId))throw Error('ไม่พบแมพ');world.transfer(actor,command.mapId);}
 else if(command.action==='heal'){h.hp=derived(h).maxHp;h.mp=derived(h).maxMp;actor.respawnAt=undefined;world.motions.delete(h.id);}
 else if(command.action==='level'){if(!Number.isInteger(command.level)||Number(command.level)<1||Number(command.level)>120)throw Error('เลเวลต้องเป็นจำนวนเต็ม1–120');const level=Number(command.level);h.level=1;h.xp=0;h.points=0;h.stats={str:5,agi:5,vit:5,int:5,dex:5,luk:5};while(h.level<level)award(h,Math.floor(45*Math.pow(h.level,1.65)));h.hp=derived(h).maxHp;h.mp=derived(h).maxMp;h.weapon='knife';h.equippedItem=undefined;h.equippedCatalogId=undefined;h.offhandItem=undefined;h.offhandCatalogId=undefined;h.attackReadyAt=0;actor.respawnAt=undefined;actor.target=undefined;actor.playerTarget=undefined;actor.path=[];}
 else if(command.action==='outfit'){if(command.tier!=='starter'&&command.tier!=='final')throw Error('ชุดทดสอบไม่ถูกต้อง');if(command.tier==='final')h.outfitTier='final';else delete h.outfitTier;}
 else if(command.action==='editor'){actor.ready=false;actor.path=[];actor.target=undefined;actor.playerTarget=undefined;actor.pending=undefined;}
 else if(command.action==='testBuild'){gmAction(world,heroId,{action:'level',level:100});for(const key of STAT_KEYS)while(h.stats[key]<45)allocate(h,key);h.hp=derived(h).maxHp;h.mp=derived(h).maxMp;}
 else if(command.action==='clearTestWeapons'){h.loot=h.loot.filter(item=>!item.testOnly);if(!h.loot.some(item=>item.id===h.offhandItem)){h.offhandItem=undefined;h.offhandCatalogId=undefined;if(h.weapon==='sword_shield')h.weapon='sword';if(h.weapon==='hammer_shield')h.weapon='hammer';}if(!h.loot.some(item=>item.id===h.equippedItem)){h.equippedItem=undefined;h.equippedCatalogId=undefined;h.weapon='knife';}}
 else if(command.action==='grantItem'){if(typeof command.catalogId!=='string'||!SUPPLY_BY_ID.has(command.catalogId))throw Error('ไม่พบไอเท็ม');const item=makeSupply(command.catalogId);item.testOnly=true;if(!receive(h,item))throw Error('กระเป๋าเต็มหรือน้ำหนักเกิน');}
 else if(command.action==='grantWeapon'){if(typeof command.catalogId!=='string'||!EQUIPMENT_BY_ID.has(command.catalogId))throw Error('ไม่พบอาวุธ');const item=EQUIPMENT_BY_ID.get(command.catalogId)!;if(!receive(h,{id:randomUUID(),catalogId:item.id,name:item.name,rarity:item.rarity,testOnly:true}))throw Error('กระเป๋าเต็มหรือน้ำหนักเกิน');}
 else throw Error('คำสั่ง GM ไม่ถูกต้อง');actor.attackChain=undefined;world.strikes=world.strikes.filter(s=>s.source!==h.id&&s.target!==h.id);actor.message='GM · ดำเนินการทดสอบแล้ว';return h;
}

export function editGMAppearance(h:Hero,command:Record<string,unknown>){if(!validAppearance(command.appearance)||!RACES.some(r=>r.id===command.race)||typeof command.name!=='string'||! /^[\p{L}\p{M}\p{N}_ -]{2,18}$/u.test(command.name))throw Error('รูปลักษณ์ เผ่า หรือชื่อไม่ถูกต้อง');h.appearance=appearanceOrDefault(command.appearance);h.race=command.race as Hero['race'];h.name=command.name;validateEquipment(h,attributes(h));h.hp=Math.min(h.hp,derived(h).maxHp);h.mp=Math.min(h.mp,derived(h).maxMp);return h;}
