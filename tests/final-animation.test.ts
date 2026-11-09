import {test} from 'node:test';
import assert from 'node:assert/strict';
import {FINAL_CHARACTER_ANIMATIONS as art,finalBodyFrame} from '../shared/final-animation.js';
import heads from '../shared/heads-hd.json';
import {RACES,newHero,derived} from '../shared/rules.js';
import {gmAction} from '../server/gm.js';
import {Store} from '../server/store.js';
import {World} from '../server/world.js';
import {existsSync} from 'node:fs';
test('twelve final outfits have all eight directions and 24 registered whole-body poses',()=>{
 assert.equal(art.bodyFrames,2304);assert.equal(art.frames.length,2304);assert.equal(art.poses.length,24);
 for(let body=0;body<96;body++)for(let pose=0;pose<24;pose++){
  const f=finalBodyFrame(body,pose);assert.equal(f.body,body);assert.equal(f.pose,pose);assert.equal(f.id,body*24+pose);
  for(const point of [f.neck,f.palms.right,f.palms.left])assert.ok(Number.isFinite(point.x)&&Number.isFinite(point.y));
  if(pose>=20)assert.ok(Math.hypot(f.palms.right.x-f.palms.left.x,f.palms.right.y-f.palms.left.y)<=10,'two hands stay adjacent on one hilt '+f.id);
  if(pose!==15&&!f.rightBehindBody)assert.equal(f.onArt.right,true,`${f.race} ${f.gender} facing ${f.facing} pose ${pose} exposed right grip touches painted art`);
 }
 for(const spec of Object.values(art.atlas))assert.ok(spec.width<=4096&&spec.height<=4096);
 for(const race of RACES)for(const gender of ['male','female'])for(let facing=0;facing<8;facing++)assert.ok(existsSync(`public/art/final-frames/${race.id}-${gender}-${facing}.webp`));
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
