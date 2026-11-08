import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {WebSocket} from 'ws';
const wait=(ms:number)=>new Promise(r=>setTimeout(r,ms));
test('HTTP/WS: authentication, 10 players, duplicate protection, rate limit, persisted movement', {timeout:30000},async()=>{
 const dir=mkdtempSync(join(tmpdir(),'fakero-net-')),origin='http://127.0.0.1:3107';
 const child=spawn(process.execPath,['--import','tsx','server/index.ts'],{env:{...process.env,NODE_ENV:'production',PORT:'3107',DB_PATH:join(dir,'db.sqlite')},stdio:['ignore','pipe','pipe']});
 const sockets:WebSocket[]=[];
 try{
  await new Promise<void>((resolve,reject)=>{child.stdout.on('data',b=>{if(b.toString().includes('listening'))resolve();});child.on('exit',()=>reject(Error('server exited')));setTimeout(()=>reject(Error('startup timeout')),10000).unref();});
  const post=(path:string,b:unknown,cookie?:string,requestOrigin=origin)=>fetch(origin+'/api/'+path,{method:'POST',headers:{'Content-Type':'application/json',Origin:requestOrigin,...(cookie?{Cookie:cookie}:{})},body:JSON.stringify(b)});
  assert.equal((await post('create',{name:'Evil',race:'muspel'},undefined,'https://evil.example')).status,403);
  const users:{id:string;cookie:string}[]=[];
  for(let i=0;i<11;i++){const account=await post('register',{username:'network'+i,password:'Network-fixture-123'});assert.equal(account.status,201);const session=account.headers.get('set-cookie')!.split(';')[0];const r=await post('create',{name:i===0?'ผู้ทดสอบ':'Tester'+i,race:'muspel',appearance:{gender:'female',hair:4,eyes:3,hairColor:4}},session);assert.equal(r.status,201);const b=await r.json();assert.deepEqual(b.hero.appearance,{gender:'female',hair:4,eyes:3,hairColor:4});users.push({id:b.hero.id,cookie:session});}
  const login=await post('login',{username:'network0',password:'Network-fixture-123'});assert.equal(login.status,200);assert.equal((await login.json()).hero.id,users[0].id);
  const connect=(cookie?:string,requestOrigin=origin)=>new Promise<WebSocket>((resolve,reject)=>{const w=new WebSocket(origin.replace('http','ws')+'/socket',{headers:{Origin:requestOrigin,...(cookie?{Cookie:cookie}:{})}});w.once('open',()=>{sockets.push(w);resolve(w);});w.once('error',reject);});
  await assert.rejects(connect());await assert.rejects(connect(users[0].cookie,'https://evil.example'));
  for(let i=0;i<10;i++)await connect(users[i].cookie);
  await assert.rejects(connect(users[0].cookie));await assert.rejects(connect(users[10].cookie));
  const snapshot=()=>new Promise<any>(resolve=>sockets[0].once('message',b=>resolve(JSON.parse(b.toString()))));
  const before=await snapshot();assert.equal(before.online,10);const initial=before.players.find((h:any)=>h.id===users[0].id);
  sockets[0].send(JSON.stringify({type:'move',x:32.5,y:39.5,hp:99999,level:50}));sockets[0].send(JSON.stringify({type:'stat',key:'__proto__'}));
  await wait(700);const after=await snapshot();const h=after.players.find((h:any)=>h.id===users[0].id);assert.ok(Math.hypot(h.x-initial.x,h.y-initial.y)>0&&Math.hypot(h.x-initial.x,h.y-initial.y)<2.5);assert.equal(h.level,1);assert.equal(h.points,0);
  const closed=new Promise(resolve=>sockets[9].once('close',resolve));for(let i=0;i<30;i++)sockets[9].send('{}');await closed;
  await connect(users[10].cookie);
  const disconnected=new Promise(resolve=>sockets[0].once('close',resolve));sockets[0].close();await disconnected;await wait(150);
  const saved=await(await fetch(origin+'/api/me',{headers:{Cookie:users[0].cookie}})).json();assert.ok(saved.hero.x>8);assert.deepEqual(saved.hero.appearance,{gender:'female',hair:4,eyes:3,hairColor:4});
  const logout=await post('logout',{},users[0].cookie);assert.equal(logout.status,200);assert.equal((await(await fetch(origin+'/api/me',{headers:{Cookie:users[0].cookie}})).json()).hero,null);
 }finally{for(const w of sockets)w.close();child.kill('SIGTERM');await new Promise<void>(r=>{if(child.exitCode!==null)r();else child.once('exit',()=>r());});rmSync(dir,{recursive:true,force:true});}
});
