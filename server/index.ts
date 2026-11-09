import http from 'node:http';
import {randomUUID} from 'node:crypto';
import {WebSocketServer,WebSocket} from 'ws';
import {RACES,newHero} from '../shared/rules.js';
import {validAppearance} from '../shared/appearance.js';
import {World} from './world.js';
import {Store,token} from './store.js';
import {validUsername,validPassword} from './password.js';
import {bootstrapGM,gmAction,editGMAppearance} from './gm.js';
const port=Number(process.env.PORT||3000),host=process.env.HOST||'127.0.0.1';
const store=new Store(process.env.DB_PATH||'.data/world.sqlite');
await bootstrapGM(store);
const world=new World();world.restoreState(store.loadWorld());
const checkpoint=()=>store.checkpoint([...world.actors.values()].map(a=>a.hero),world.exportState());
const clients=new Map<string,WebSocket>();
const alive=new WeakMap<WebSocket,boolean>();
const buckets=new Map<string,{count:number;until:number}>();
function limited(key:string,max:number,period:number){const now=Date.now();let b=buckets.get(key);if(!b||now>b.until){b={count:0,until:now+period};buckets.set(key,b);}return ++b.count>max;}
const cookie=(req:http.IncomingMessage)=>(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('fakero='))?.slice(7)||'';
function originOK(req:http.IncomingMessage){const origin=req.headers.origin;return !!origin&&origin===(process.env.PUBLIC_ORIGIN||`http://${req.headers.host}`);}
function setCookie(res:http.ServerResponse,value:string,maxAge=2592000){res.setHeader('Set-Cookie',`fakero=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${process.env.PUBLIC_ORIGIN?.startsWith('https:')?'; Secure':''}`);}
function reply(res:http.ServerResponse,status:number,data:unknown){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));}
async function body(req:http.IncomingMessage){let raw='';for await(const c of req){raw+=c;if(raw.length>2048)throw new Error('body too large');}return JSON.parse(raw||'{}');}
const vite=process.env.NODE_ENV==='production'?undefined:await (await import('vite')).createServer({server:{middlewareMode:true},appType:'spa'});
const serve=process.env.NODE_ENV==='production'?(await import('node:fs/promises')):undefined;
const server=http.createServer(async(req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');
 try {
 if(req.url?.startsWith('/api/')){
  const ip=req.socket.remoteAddress||'unknown';
  if(limited(`api:${ip}`,150,60000))return reply(res,429,{error:'คำขอมากเกินไป กรุณารอสักครู่'});
  const session=cookie(req),account=store.resolveAccount(session),id=store.resolve(session);
  const currentHero=()=>id?(world.actors.get(id)?.hero||store.get(id)):null;
  if(req.method==='GET'&&req.url==='/api/me')return reply(res,200,{account:account||null,hero:currentHero()});
  if(req.method==='GET'&&req.url==='/api/health')return reply(res,200,{ok:true});
  if(req.method!=='POST'||!originOK(req))return reply(res,403,{error:'Origin หรือ method ไม่ถูกต้อง'});
  if(req.url==='/api/logout'){if(id){if(world.actors.has(id))checkpoint();clients.get(id)?.close(1000,'Signed out');}store.logout(session);setCookie(res,'',0);return reply(res,200,{ok:true});}
  if(req.url==='/api/gm'){
   if(!account||account.role!=='gm')return reply(res,403,{error:'เฉพาะบัญชี GM เท่านั้น'});
   if(limited(`gm:${account.id}`,30,60000))return reply(res,429,{error:'คำสั่ง GM มากเกินไป'});
   const command=await body(req);if(!command||typeof command!=='object'||Array.isArray(command))return reply(res,400,{error:'คำสั่งไม่ถูกต้อง'});
   if(!id)return reply(res,409,{error:'สร้างตัวละครและเข้าเกมก่อน'});
   try{if(command.action==='appearance'){if(clients.has(id))return reply(res,409,{error:'กลับสู่หน้าแต่งตัว GM ก่อน'});const saved=store.get(id);if(!saved)throw Error('ไม่พบตัวละคร');const hero=editGMAppearance(saved,command);store.save(hero);store.audit(account.id,'appearance',{hero:id,race:hero.race,appearance:hero.appearance});return reply(res,200,{hero,account});}const hero=gmAction(world,id,command);store.audit(account.id,String(command.action),{hero:id,mapId:hero.mapId,level:hero.level});checkpoint();if(command.action==='editor')clients.get(id)?.close(1000,'GM editor');return reply(res,200,{ok:true,hero});}catch(e){return reply(res,400,{error:(e as Error).message});}
  }
  if(limited(`auth:${ip}:${req.url}`,12,60000))return reply(res,429,{error:'ลองใหม่ในอีก 1 นาที'});
  const b=await body(req);if(!b||typeof b!=='object'||Array.isArray(b))return reply(res,400,{error:'ข้อมูลไม่ถูกต้อง'});
  if(req.url==='/api/register'){
   if(account)return reply(res,409,{error:'ออกจากบัญชีปัจจุบันก่อนสมัครบัญชีใหม่'});
   if(!validUsername(b.username)||!validPassword(b.password))return reply(res,400,{error:'ชื่อบัญชี3–24ตัว ใช้ a–z,0–9,_.- และรหัสผ่าน10–128ตัว'});
   if(process.env.GM_USERNAME?.toLowerCase()===b.username.toLowerCase())return reply(res,409,{error:'ชื่อบัญชีนี้ไม่พร้อมใช้งาน'});
   try{const created=await store.register(randomUUID(),b.username,b.password);setCookie(res,store.accountSession(created.id));return reply(res,201,{account:created,hero:null});}catch(e){if(String(e).includes('UNIQUE'))return reply(res,409,{error:'ชื่อบัญชีนี้ถูกใช้แล้ว'});throw e;}
  }
  if(req.url==='/api/create'){
   if(!account)return reply(res,401,{error:'เข้าสู่บัญชีก่อนสร้างตัวละคร'});
   if(account.heroId)return reply(res,409,{error:'หนึ่งบัญชีสร้างได้หนึ่งตัวละครในช่วงทดสอบ'});
   if(typeof b.name!=='string'||! /^[\p{L}\p{M}\p{N}_ -]{2,18}$/u.test(b.name)||!RACES.some(r=>r.id===b.race))return reply(res,400,{error:'ชื่อ2–18ตัวอักษร และต้องเลือกเผ่า'});
   if(b.appearance!==undefined&&!validAppearance(b.appearance))return reply(res,400,{error:'ตัวเลือกรูปลักษณ์ไม่ถูกต้อง'});
   const h=newHero(randomUUID(),b.name,b.race,b.appearance);try{store.createCharacter(account.id,h,token());}catch{return reply(res,409,{error:'บัญชีนี้มีตัวละครแล้ว'});}return reply(res,201,{hero:h,account:store.account(account.username)});
  }
  if(req.url==='/api/import'){
   if(!account)return reply(res,401,{error:'เข้าสู่บัญชีก่อน'});
   if(account.heroId)return reply(res,409,{error:'บัญชีนี้มีตัวละครแล้ว'});
   if(typeof b.recovery!=='string'||b.recovery.length>100)return reply(res,400,{error:'รหัสไม่ถูกต้อง'});
   try{const hero=store.importCharacter(account.id,b.recovery.trim());if(!hero)return reply(res,401,{error:'ไม่พบรหัสตัวละครเดิม'});clients.get(hero.id)?.close(1000,'Account migration');return reply(res,200,{hero,account:store.account(account.username)});}catch(e){return reply(res,409,{error:(e as Error).message});}
  }
  if(req.url==='/api/login'){
   if(typeof b.recovery==='string'){
    if(b.recovery.length>100)return reply(res,400,{error:'รหัสไม่ถูกต้อง'});const h=store.recover(b.recovery.trim());
    if(!h||store.db.prepare('SELECT id FROM accounts WHERE hero_id=?').get(h.id))return reply(res,401,{error:'ไม่พบตัวละครเดิม หรือผูกบัญชีแล้ว กรุณาเข้าสู่ระบบด้วยชื่อบัญชี'});
    setCookie(res,store.session(h.id));return reply(res,200,{hero:h,account:null});
   }
   if(!validUsername(b.username)||!validPassword(b.password))return reply(res,401,{error:'ชื่อบัญชีหรือรหัสผ่านไม่ถูกต้อง'});
   if(limited(`login-user:${b.username.toLowerCase()}`,8,60000))return reply(res,429,{error:'ลองใหม่ในอีก 1 นาที'});
   const found=await store.authenticate(b.username,b.password);if(!found)return reply(res,401,{error:'ชื่อบัญชีหรือรหัสผ่านไม่ถูกต้อง'});
   store.logout(session);setCookie(res,store.accountSession(found.id));return reply(res,200,{account:found,hero:found.heroId?(world.actors.get(found.heroId)?.hero||store.get(found.heroId)):null});
  }
  return reply(res,404,{error:'Not found'});
 }
 if(vite)return vite.middlewares(req,res);
 const path=await import('node:path');const root=path.resolve('dist');const requested=path.resolve(root,'.'+decodeURIComponent((req.url||'/').split('?')[0]));
 if(!requested.startsWith(root+path.sep)&&requested!==root){res.writeHead(403);return res.end();}
 const ext=path.extname(requested);const file=ext?requested:path.join(root,'index.html');
 try{const data=await serve!.readFile(file);res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'} as Record<string,string>)[path.extname(file)]||'application/octet-stream');res.end(data);}catch{res.writeHead(404);res.end('Not found');}
 } catch{reply(res,400,{error:'คำขอไม่ถูกต้อง'});}
});
const wss=new WebSocketServer({noServer:true,maxPayload:1024});
server.on('upgrade',(req,socket,head)=>{
 const id=store.resolve(cookie(req));const h=id?store.get(id):undefined;
 if(req.url!=='/socket'||!originOK(req)||!id||!h){socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');socket.destroy();return;}
 if(clients.has(id)||clients.size>=10){socket.write('HTTP/1.1 409 Conflict\r\n\r\n');socket.destroy();return;}
 wss.handleUpgrade(req,socket,head,ws=>{
  clients.set(id,ws);alive.set(ws,true);ws.on('pong',()=>alive.set(ws,true));world.add(h,store.resolveAccount(cookie(req))?.role==='gm');world.actors.get(id)!.ready=false;let messages=0,windowStart=Date.now();
  ws.on('message',raw=>{if(Date.now()-windowStart>1000){windowStart=Date.now();messages=0;}if(++messages>25){ws.close(1008,'Rate limit');return;}try{const m=JSON.parse(raw.toString());if(!m||typeof m!=='object'||Array.isArray(m))return;world.command(id,m);if(['stat','warp','use','enterTower','claimDelivery','weapon','equip','useItem','dropItem','pickupItem','buyItem','sellItem','unequip','starterKit','cancelItem'].includes(m.type))checkpoint();}catch{/* malformed commands have no effect */}});
  ws.on('error',()=>ws.close());
  ws.on('close',()=>{const a=world.actors.get(id);if(a)checkpoint();world.actors.delete(id);clients.delete(id);});
 });
});
let ticks=0;const timer=setInterval(()=>{
 const revision=world.worldBoss.revision;world.tick(.1,Date.now());ticks++;if(ticks%10===0||world.worldBoss.revision!==revision)checkpoint();
 if(ticks%300===0)for(const ws of clients.values()){if(!alive.get(ws)){ws.terminate();continue;}alive.set(ws,false);ws.ping();}
 for(const [id,ws] of clients){const a=world.actors.get(id)!;if(ws.readyState===WebSocket.OPEN){if(ws.bufferedAmount>262144){ws.close(1008,'Slow connection');continue;}ws.send(JSON.stringify(world.snapshot(id)));}}
 if(ticks%600===0)for(const [key,b]of buckets)if(b.until<Date.now())buckets.delete(key);
},100);
function shutdown(){clearInterval(timer);checkpoint();for(const ws of clients.values())ws.close();server.close();void vite?.close();setTimeout(()=>process.exit(0),300).unref();}
process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
server.listen(port,host,()=>console.log(`FakeRO listening on ${host}:${port}`));
