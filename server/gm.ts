import {randomUUID} from 'node:crypto';
import {validUsername,validPassword} from './password.js';
import type {Store} from './store.js';
import type {World} from './world.js';
import {MAP_BY_ID} from '../shared/maps.js';
import {award,derived} from '../shared/rules.js';
export async function bootstrapGM(store:Store){const username=process.env.GM_USERNAME,password=process.env.GM_PASSWORD;if(!username&&!password)return;if(!validUsername(username)||!validPassword(password))throw Error('GM_USERNAME ต้องยาว3–24ตัว และ GM_PASSWORD อย่างน้อย10ตัว');const account=store.account(username);if(account){if(account.role!=='gm')throw Error('ชื่อบัญชี GM ถูกใช้โดยผู้เล่นแล้ว กรุณาใช้ชื่ออื่น');return;}await store.register(randomUUID(),username,password,'gm');}
export function gmAction(world:World,heroId:string,command:Record<string,unknown>){const actor=world.actors.get(heroId);if(!actor)throw Error('เข้าเกมก่อนใช้คำสั่ง GM');const h=actor.hero;
 if(command.action==='teleport'){if(typeof command.mapId!=='string'||!MAP_BY_ID.has(command.mapId))throw Error('ไม่พบแมพ');world.transfer(actor,command.mapId);}
 else if(command.action==='heal'){h.hp=derived(h).maxHp;actor.respawnAt=undefined;world.motions.delete(h.id);}
 else if(command.action==='level'){if(!Number.isInteger(command.level)||Number(command.level)<1||Number(command.level)>120)throw Error('เลเวลต้องเป็นจำนวนเต็ม1–120');const level=Number(command.level);h.level=1;h.xp=0;h.points=0;h.stats={str:5,agi:5,vit:5,int:5,dex:5,luk:5};while(h.level<level)award(h,Math.floor(45*Math.pow(h.level,1.65)));h.hp=derived(h).maxHp;h.attackReadyAt=0;actor.respawnAt=undefined;actor.target=undefined;actor.playerTarget=undefined;actor.path=[];}
 else throw Error('คำสั่ง GM ไม่ถูกต้อง');world.strikes=world.strikes.filter(s=>s.source!==h.id&&s.target!==h.id);actor.message='GM · ดำเนินการทดสอบแล้ว';return h;
}
