/** Design-only study. Does not import or mutate live character saves/rules. */
import assert from 'node:assert/strict';
import {writeFileSync,mkdirSync} from 'node:fs';
const levels=[10,20,40,50,60,70,80,90,100];
const bonus=(level:number,model:'linear'|'bounded')=>model==='linear'?level:3+Math.floor((level-1)/5);
const requirement=(level:number)=>Math.ceil(8+.6*level);
const rows=levels.flatMap(level=>['linear','bounded'].map(model=>{
 const b=bonus(level,model as 'linear'|'bounded'),req=requirement(level);
 const nativeCost=Math.max(0,req-5-b),crossCost=Math.max(0,req-5),points=3*(level-1);
 assert.ok(nativeCost<=crossCost&&crossCost<=points);
 return {level,model,baseStat:5,raceBonus:b,weaponRequirement:req,earnedPoints:points,nativeCost,crossCost,savedPoints:crossCost-nativeCost,remainingNative:points-nativeCost,remainingCross:points-crossCost};
}));
const xpTo=(rank:number)=>60*rank+6*rank*rank;
const mastery=[10,20,40,50,70,100].map(rank=>({rank,xp:xpTo(rank),activeHours:xpTo(rank)/3600,wallHoursAt60PercentCombat:xpTo(rank)/3600/.6}));
// One eligible second grants at most one point to an offensive weapon regardless of hit rate.
function train(events:{second:number;weapon:string;effective:boolean}[]){const state=new Map<string,number>();const credited=new Set<number>();for(const e of events){if(!e.effective||credited.has(e.second))continue;credited.add(e.second);state.set(e.weapon,(state.get(e.weapon)||0)+1);}return Object.fromEntries(state);}
const slow=Array.from({length:600},(_,second)=>({second,weapon:'sword',effective:true}));
const fast=slow.flatMap(e=>Array.from({length:8},()=>e));
assert.deepEqual(train(slow),train(fast));
const switched=train([...slow,...Array.from({length:300},(_,i)=>({second:600+i,weapon:'bow',effective:true})),...Array.from({length:100},(_,i)=>({second:900+i,weapon:'sword',effective:true}))]);
assert.deepEqual(switched,{sword:700,bow:300});
assert.deepEqual(train(slow.map(e=>({...e,effective:false}))),{});
assert.equal(train([{second:1,weapon:'sword',effective:true},{second:1,weapon:'bow',effective:true}]).sword,1);
assert.equal(Object.values(train([{second:1,weapon:'sword',effective:true},{second:1,weapon:'bow',effective:true}])).reduce((a,b)=>a+b,0),1);
mkdirSync('docs/systems',{recursive:true});
writeFileSync('docs/systems/progression-study.json',JSON.stringify({status:'design-model-not-live',assumptions:{baseStat:5,pointsPerLevel:3,proposedAllocatedStatCap:120,requirement:'ceil(8 + .6 * level)',boundedRaceBonus:'3 + floor((level-1)/5)',masteryCumulativeXP:'60*rank + 6*rank^2',xpPerEligibleSecond:1,masteryRankCap:100},rows,mastery,modelChecks:{equalTrainingCreditAcrossHitRates:true,priorWeaponProgressRetained:true,ineffectiveActionsGiveZero:true,oneOffensiveCreditPerSecond:true}},null,2)+'\n');
console.table(rows.filter(r=>[20,50,100].includes(r.level)));
console.table(mastery.map(r=>({...r,activeHours:r.activeHours.toFixed(2),wallHoursAt60PercentCombat:r.wallHoursAt60PercentCombat.toFixed(2)})));
console.log('4 model invariants passed. Not a live combat, economy, anti-bot or database integration test.');
