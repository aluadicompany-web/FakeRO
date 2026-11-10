import test from 'node:test';import assert from 'node:assert/strict';
import data from '../shared/starter-motion.json';import {starterTwoHandGrip,STARTER_HEAD_SCALE} from '../shared/starter-motion.js';import {HOLDING_ART,holdingPose} from '../shared/weapon-holding.js';import {attackSpritePose} from '../shared/character-animation.js';import {attackTiming} from '../shared/attack-animation.js';import {WEAPONS} from '../shared/weapons.js';
test('starter heads use one proportion and registered torso roll for every existing body pose',()=>{
 assert.equal(STARTER_HEAD_SCALE,.9);assert.equal(data.frames.length,2304);assert.equal(data.frames.filter(f=>f.collarVerified).length,2208);
 for(const [id,f] of data.frames.entries()){assert.equal(f.id,id);assert.ok(Number.isFinite(f.headRotation)&&Math.abs(f.headRotation)<=.22);if(!f.collarVerified)assert.equal(f.headRotation,0);}
});
test('both starter fists lie on the same stable two-hand hilt for all heavy-weapon poses',()=>{
 for(const f of HOLDING_ART.frames.filter(f=>f.pose>=20)){
  const g=starterTwoHandGrip(f.facing,f.pose,f.palms),dx=f.palms.left.x-f.palms.right.x,dy=f.palms.left.y-f.palms.right.y;
  assert.ok(Math.abs(dx*Math.cos(g.angle)+dy*Math.sin(g.angle))<.001);
  const supportSign=g.lower?-1:1;assert.ok(Math.abs(dx-supportSign*g.gap*-Math.sin(g.angle))<.001);assert.ok(Math.abs(dy-supportSign*g.gap*Math.cos(g.angle))<.001);
 }
});
test('starter attacks finish in their guard at every combo speed instead of jumping into another windup',()=>{
 for(const w of WEAPONS)for(const interval of [300,740,1200])for(let step=0;step<4;step++){
  const clip={...attackTiming(w.id,interval),index:step,step,sequence:step+1};
  assert.equal(holdingPose(w.id,'attack',clip,clip.duration)??attackSpritePose(w.id,clip,clip.duration),holdingPose(w.id,'idle',undefined,0)??0);
 }
});
