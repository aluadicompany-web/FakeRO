import {test} from 'node:test';
import assert from 'node:assert/strict';
import {COHERENT_ART as coherent,CLIP_FAMILIES,coherentFrame,coherentPhase} from '../shared/coherent-animation.js';
import {attackTiming} from '../shared/attack-animation.js';
import heads from '../shared/heads-hd.json';
import {RACES,newHero,derived} from '../shared/rules.js';
import {gmAction} from '../server/gm.js';
import {Store} from '../server/store.js';
import {World} from '../server/world.js';
import {existsSync} from 'node:fs';
test('twelve final outfits have coherent eight-phase tracks with literal glove evidence',()=>{
 assert.equal(coherent.frames.length,3072);
 for(let body=0;body<96;body++)for(const family of CLIP_FAMILIES)for(let phase=0;phase<8;phase++){
  const f=coherentFrame(body,family,phase),raw=coherent.frames[f.id];assert.equal(f.body,body);assert.equal(f.family,family);assert.equal(f.phase,phase);
  for(const p of [f.neck,f.palms.right,f.palms.left])assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));
  assert.ok(raw.evidence.collarDistance<=6);assert.ok(raw.evidence.rightColorPixels>0||raw.mainHidden);
  assert.ok(!raw.evidence.registration.includes('legacy'));assert.ok(Math.abs(f.headRotation!)<=.28);assert.equal(f.headScale,.86);
  if(family==='two'){
   const dx=f.palms.left.x-f.palms.right.x,dy=f.palms.left.y-f.palms.right.y,a=f.weaponAngle!;
   assert.ok(Math.abs(dx*Math.cos(a)+dy*Math.sin(a))<.001,'both fists lie on the same shaft '+f.id);
  }
  if(family!=='walk'&&phase===7){const first=coherentFrame(body,family,0);assert.deepEqual(f.palms,first.palms);assert.deepEqual(f.neck,first.neck);assert.equal(f.weaponAngle,first.weaponAngle);}
 }
 for(const spec of Object.values(coherent.atlas))assert.ok(spec.width<=4096&&spec.height<=4096);
});
test('forward and return cuts reach the same painted impact at the server hit time at every speed',()=>{
 for(const weapon of ['sword','greatsword','longbow','staff','knife'] as const)for(const interval of [300,500,740,1200])for(let step=0;step<4;step++){
  const clip={...attackTiming(weapon,interval),index:step,step,sequence:step};
  assert.equal(coherentPhase('attack',0,weapon,clip.windup,clip),4);
  assert.equal(coherentPhase('attack',0,weapon,clip.duration,clip),['staff','knife'].includes(weapon)?0:step%2===1&&weapon!=='longbow'?0:7);
  let previous=coherentPhase('attack',0,weapon,0,clip);
  for(let t=1;t<clip.duration;t++) {const phase=coherentPhase('attack',0,weapon,t,clip);assert.ok(Math.abs(phase-previous)<=1,'no disconnected pose jumps');previous=phase;}
 }
});
test('walking keeps a steady carry direction instead of following unrelated green speckles',()=>{
 for(let body=0;body<96;body++)for(let phase=0;phase<8;phase++){
  const a=coherentFrame(body,'walk',phase),b=coherentFrame(body,'walk',(phase+1)%8);
  const delta=Math.atan2(Math.sin(a.weaponAngle!-b.weaponAngle!),Math.cos(a.weaponAngle!-b.weaponAngle!));
  assert.ok(Math.abs(delta)<.2);assert.equal(a.projection,1);
 }
});
test('HD heads retain independent face, hair, iris and expression layers for all hairstyles and directions',()=>{
 assert.equal(heads.frameSize,384);assert.equal(heads.heads.length,80);
 for(const head of heads.heads){
  assert.ok(Number.isFinite(head.neck.x)&&Number.isFinite(head.neck.y));
  for(const layer of ['base','hair-front','hair-back','eyes','lids'])assert.ok(existsSync(`public/art/heads-hd/${layer}-${head.id}.webp`));
  assert.ok(existsSync(`public/art/heads-hd/lids-${head.id+80}.webp`));
  if(head.facing===6)assert.equal(head.hasEyes,false,'a full back head has no eye layer');
 }
 for(const spec of Object.values(heads.atlas))assert.ok(spec.width<=4096&&spec.height<=4096);
});
test('GM final costume is cosmetic, persists across saves and can return to starter without altering equipment or progression',()=>{
 const h=newHero('final-gm','Final Tester','muspel'),w=new World(),s=new Store(':memory:');w.add(h);const before={level:h.level,xp:h.xp,stats:{...h.stats},coins:h.coins,loot:[...h.loot],weapon:h.weapon,derived:derived(h)};
 try{gmAction(w,h.id,{action:'outfit',tier:'final'});assert.equal(h.outfitTier,'final');s.create(h,'fixture');assert.equal(s.get(h.id)!.outfitTier,'final');assert.deepEqual({level:h.level,xp:h.xp,stats:h.stats,coins:h.coins,loot:h.loot,weapon:h.weapon,derived:derived(h)},before);assert.throws(()=>gmAction(w,h.id,{action:'outfit',tier:'unknown'}));assert.equal(h.outfitTier,'final');gmAction(w,h.id,{action:'outfit',tier:'starter'});assert.equal(h.outfitTier,undefined);s.save(h);assert.equal(s.get(h.id)!.outfitTier,undefined);}finally{s.db.close();}
});
