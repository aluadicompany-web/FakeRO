import test from 'node:test';
import assert from 'node:assert/strict';
import {HOLDING_ART,holdingBody,holdingPose,twoHandGrip,bowDraw} from '../shared/weapon-holding.js';
import {attackTiming} from '../shared/attack-animation.js';
test('all 96 bodies have eight registered holding poses with finite palm and neck anchors',()=>{
 assert.equal(HOLDING_ART.frames.length,768);
 for(let body=0;body<96;body++)for(let pose=16;pose<24;pose++){
  const f=holdingBody(body,pose);assert.equal(f.id,1536+body*8+pose-16);assert.equal(f.body,body);assert.equal(f.pose,pose);
  for(const p of [f.neck,f.palms.right,f.palms.left])assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));
 }
 for(const atlas of Object.values(HOLDING_ART.atlas)){assert.ok(atlas.width<=4096&&atlas.height<=4096);}
});
test('bows release their nocked arrow at server windup for slow and fast clips',()=>{
 for(const weapon of ['bow','longbow','shortbow'] as const)for(const interval of [300,700,1400]){
  const clip={...attackTiming(weapon,interval),step:0,index:0,sequence:1};
  assert.equal(bowDraw(holdingPose(weapon,'attack',clip,clip.windup-.001)!),2);
  assert.equal(holdingPose(weapon,'attack',clip,clip.windup),19);
  for(const action of ['walk','hurt','dead'])assert.equal(holdingPose(weapon,action,clip,0),undefined);
 }
});
test('two-hand hilt axis passes through both palms in every registered pose',()=>{
 for(const f of HOLDING_ART.frames.filter(f=>f.pose>=20)){
  const r=f.palms.right,l=f.palms.left,g=twoHandGrip(f.facing,r,l,f.pose>=22);
  assert.ok(Math.abs(g.gap-Math.hypot(r.x-l.x,r.y-l.y))<1e-8);
  const sign=g.lower?-1:1;
  assert.ok(Math.abs(r.x+sign*-Math.sin(g.angle)*g.gap-l.x)<1e-5);
  assert.ok(Math.abs(r.y+sign*Math.cos(g.angle)*g.gap-l.y)<1e-5);
 }
});
