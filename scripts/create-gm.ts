import {randomUUID,randomBytes} from 'node:crypto';
import {mkdirSync,writeFileSync} from 'node:fs';
import {Store} from '../server/store.js';
import {validUsername,validPassword} from '../server/password.js';
const args=process.argv.slice(2),username=args.includes('--username')?args[args.indexOf('--username')+1]:'worldkeeper';
if(args.length&&!args.includes('--username')&&!args.includes('--reset'))throw Error('ใช้ --username worldkeeper หรือ --reset');
const password=process.env.GM_PASSWORD||randomBytes(18).toString('base64url');if(!validUsername(username)||!validPassword(password))throw Error('ชื่อบัญชีหรือรหัสผ่านไม่ถูกต้อง');
const store=new Store(process.env.DB_PATH||'.data/world.sqlite');try{const exists=store.account(username);if(exists){if(!args.includes('--reset'))throw Error('ชื่อบัญชีมีอยู่แล้ว ใช้ --reset เฉพาะเมื่อต้องการเปลี่ยนรหัส GM');await store.resetGM(username,password);}else await store.register(randomUUID(),username,password,'gm');mkdirSync('.data',{recursive:true});writeFileSync('.data/gm-credentials.txt',`FakeRO GM — private; do not commit\nUsername: ${username}\nPassword: ${password}\n\nใช้ช่องล็อกอินเดียวกับผู้เล่น แล้วสร้างตัวละครเพื่อเปิดเมนู GM\n`,{mode:0o600});console.log('สร้างบัญชี GM แล้ว เก็บรหัสไว้ที่ .data/gm-credentials.txt (ไม่รวมใน Git)');}finally{store.db.close();}
