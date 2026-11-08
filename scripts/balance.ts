import {RACES,newHero,derived,attributes} from '../shared/rules.js';
// Analytical baseline: stationary enemy defense=2, no random sampling.
// This exposes differences; it does not establish encounter or PvP balance.
console.log('Level 1 / base stats / defense 2 / strongest attack mode');
console.table(RACES.map(r=>{const h=newHero(r.id,r.name,r.id),d=derived(h),a=attributes(h);const damage=Math.floor(Math.max(d.attack,d.magic)-2);return {race:r.name,HP:d.maxHp,DPS:Number((damage*(1+d.crit*.5)/(d.interval/1000)).toFixed(2)),secondsToKill75:((Math.ceil(75/damage)-1)*d.interval/1000).toFixed(2),primary:a[r.bonus]};}));
console.log('Equal stat budgets do NOT mean equal power. Add skills, encounter roles and measurements before claiming race balance.');
