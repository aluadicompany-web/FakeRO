import {migrateCentralPosition} from '../shared/central-layout.js';
import {DatabaseSync} from 'node:sqlite';
import {createHash,randomBytes} from 'node:crypto';
import {mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
import {MAP_BY_ID,homeMap,nearestWalkable} from '../shared/maps.js';
import {appearanceOrDefault} from '../shared/appearance.js';
import {passwordHash,passwordMatches} from './password.js';
import {derived} from '../shared/rules.js';
import type {Hero} from '../shared/rules.js';
export const hash=(s:string)=>createHash('sha256').update(s).digest('hex');
export const token=()=>randomBytes(32).toString('base64url');
function decode(data:string):Hero {const h=JSON.parse(data) as Hero;h.appearance=appearanceOrDefault(h.appearance);const fallback=homeMap(h.race);const map=MAP_BY_ID.get(h.mapId)||MAP_BY_ID.get(fallback)!;if(!h.mapId||!MAP_BY_ID.has(h.mapId)){h.mapId=map.id;h.x=map.spawn.x;h.y=map.spawn.y;}migrateCentralPosition(h,map.spawn);const p=nearestWalkable(map,h);h.x=p.x;h.y=p.y;h.visited=Array.isArray(h.visited)?h.visited.filter(id=>MAP_BY_ID.has(id)):[map.id];if(!h.visited.includes(map.id))h.visited.push(map.id);h.bindMap=MAP_BY_ID.get(h.bindMap)?.kind.includes('city')?h.bindMap:fallback;h.coins=Number.isFinite(h.coins)?h.coins:0;h.loot=Array.isArray(h.loot)?h.loot:[];h.deliveries=Array.isArray(h.deliveries)?h.deliveries:[];h.mp=Number.isFinite(h.mp)?Math.max(0,Math.min(h.mp,derived(h).maxMp)):derived(h).maxMp;return h;}
export interface Account{id:string;username:string;role:'player'|'gm';heroId:string|null}
export class Store {
 db:DatabaseSync;
 constructor(path:string){if(path!==':memory:')mkdirSync(dirname(path),{recursive:true});this.db=new DatabaseSync(path);this.db.exec('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS heroes(id TEXT PRIMARY KEY,recovery TEXT UNIQUE NOT NULL,data TEXT NOT NULL); CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,hero TEXT NOT NULL,expires INTEGER NOT NULL); CREATE TABLE IF NOT EXISTS world_state(id INTEGER PRIMARY KEY CHECK(id=1),data TEXT NOT NULL);');this.db.exec(`CREATE TABLE IF NOT EXISTS accounts(id TEXT PRIMARY KEY,username TEXT NOT NULL COLLATE NOCASE UNIQUE,password_hash TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'player' CHECK(role IN ('player','gm')),hero_id TEXT UNIQUE REFERENCES heroes(id));
CREATE TABLE IF NOT EXISTS account_sessions(token TEXT PRIMARY KEY,account TEXT NOT NULL REFERENCES accounts(id),expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS gm_audit(id INTEGER PRIMARY KEY AUTOINCREMENT,account TEXT NOT NULL,action TEXT NOT NULL,detail TEXT NOT NULL,created_at INTEGER NOT NULL);`);this.db.prepare('DELETE FROM sessions WHERE expires < ?').run(Date.now());this.db.prepare('DELETE FROM account_sessions WHERE expires < ?').run(Date.now());}
 create(h:Hero,recovery:string){this.db.prepare('INSERT INTO heroes VALUES(?,?,?)').run(h.id,hash(recovery),JSON.stringify(h));}
 save(h:Hero){this.db.prepare('UPDATE heroes SET data=? WHERE id=?').run(JSON.stringify(h),h.id);}
 get(id:string):Hero|undefined {const r=this.db.prepare('SELECT data FROM heroes WHERE id=?').get(id);return r?decode(r.data as string):undefined;}
 recover(key:string):Hero|undefined {const r=this.db.prepare('SELECT data FROM heroes WHERE recovery=?').get(hash(key));return r?decode(r.data as string):undefined;}
 session(id:string){const s=token();this.db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(hash(s),id,Date.now()+30*86400000);return s;}
 legacyResolve(s:string):string|undefined {return this.db.prepare('SELECT hero FROM sessions WHERE token=? AND expires>?').get(hash(s),Date.now())?.hero as string|undefined;}
 checkpoint(heroes:Hero[],state:unknown){this.db.exec('BEGIN IMMEDIATE');try{for(const h of heroes)this.save(h);this.db.prepare('INSERT INTO world_state VALUES(1,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data').run(JSON.stringify(state));this.db.exec('COMMIT');}catch(e){this.db.exec('ROLLBACK');throw e;}}
 loadWorld():unknown {const row=this.db.prepare('SELECT data FROM world_state WHERE id=1').get();return row?JSON.parse(row.data as string):undefined;}
 account(username:string):Account|undefined{const row=this.db.prepare('SELECT id,username,role,hero_id AS heroId FROM accounts WHERE username=? COLLATE NOCASE').get(username);return row as unknown as Account|undefined;}
 async register(id:string,username:string,password:string,role:'player'|'gm'='player'){const encoded=await passwordHash(password);this.db.prepare('INSERT INTO accounts(id,username,password_hash,role) VALUES(?,?,?,?)').run(id,username,encoded,role);return this.account(username)!;}
 async authenticate(username:string,password:string):Promise<Account|undefined>{const row=this.db.prepare('SELECT password_hash FROM accounts WHERE username=? COLLATE NOCASE').get(username);return await passwordMatches(password,row?.password_hash as string|undefined)?this.account(username):undefined;}
 accountSession(id:string){const s=token();this.db.prepare('INSERT INTO account_sessions VALUES(?,?,?)').run(hash(s),id,Date.now()+30*86400000);return s;}
 resolveAccount(s:string):Account|undefined{return this.db.prepare('SELECT a.id,a.username,a.role,a.hero_id AS heroId FROM accounts a JOIN account_sessions s ON s.account=a.id WHERE s.token=? AND s.expires>?').get(hash(s),Date.now())as unknown as Account|undefined;}
 resolve(s:string):string|undefined{return this.resolveAccount(s)?.heroId||this.legacyResolve(s);}
 createCharacter(accountId:string,h:Hero,recovery:string){this.db.exec('BEGIN IMMEDIATE');try{const account=this.db.prepare('SELECT hero_id FROM accounts WHERE id=?').get(accountId);if(!account||account.hero_id)throw Error('หนึ่งบัญชีสร้างได้หนึ่งตัวละคร');this.create(h,recovery);this.db.prepare('UPDATE accounts SET hero_id=? WHERE id=?').run(h.id,accountId);this.db.exec('COMMIT');}catch(e){this.db.exec('ROLLBACK');throw e;}}
 importCharacter(accountId:string,recovery:string){const hero=this.recover(recovery);if(!hero)return undefined;this.db.exec('BEGIN IMMEDIATE');try{const account=this.db.prepare('SELECT hero_id FROM accounts WHERE id=?').get(accountId);if(!account||account.hero_id)throw Error('บัญชีมีตัวละครแล้ว');if(this.db.prepare('SELECT id FROM accounts WHERE hero_id=?').get(hero.id))throw Error('ตัวละครนี้ผูกบัญชีแล้ว');this.db.prepare('UPDATE accounts SET hero_id=? WHERE id=?').run(hero.id,accountId);this.db.prepare('DELETE FROM sessions WHERE hero=?').run(hero.id);this.db.exec('COMMIT');return hero;}catch(e){this.db.exec('ROLLBACK');throw e;}}
 audit(account:string,action:string,detail:unknown){this.db.prepare('INSERT INTO gm_audit(account,action,detail,created_at) VALUES(?,?,?,?)').run(account,action,JSON.stringify(detail),Date.now());}
 async resetGM(username:string,password:string){const account=this.account(username);if(!account||account.role!=='gm')throw Error('ไม่พบบัญชี GM');const encoded=await passwordHash(password);this.db.exec('BEGIN IMMEDIATE');try{this.db.prepare('UPDATE accounts SET password_hash=? WHERE id=?').run(encoded,account.id);this.db.prepare('DELETE FROM account_sessions WHERE account=?').run(account.id);this.db.exec('COMMIT');}catch(e){this.db.exec('ROLLBACK');throw e;}}
 logout(s:string){this.db.prepare('DELETE FROM sessions WHERE token=?').run(hash(s));this.db.prepare('DELETE FROM account_sessions WHERE token=?').run(hash(s));}

}
