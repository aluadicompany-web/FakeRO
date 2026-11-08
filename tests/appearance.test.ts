import {test} from 'node:test';
import assert from 'node:assert/strict';
import {RACES,newHero,derived} from '../shared/rules.js';
import {validAppearance,avatarSVG,DEFAULT_APPEARANCE,HAIRSTYLES,EYE_COLORS,HAIR_COLORS} from '../shared/appearance.js';
import {Store} from '../server/store.js';
test('1800 valid combinations are distinct and do not affect combat stats',()=>{
 const images=new Set<string>();
 for(const race of RACES){const baseline=derived(newHero('id','Test',race.id));
  for(const gender of ['male','female'] as const)for(let hair=0;hair<5;hair++)for(let eyes=0;eyes<5;eyes++)for(let hairColor=0;hairColor<6;hairColor++){
   const appearance={gender,hair,eyes,hairColor};assert.ok(validAppearance(appearance));
   assert.deepEqual(derived(newHero('id','Test',race.id,appearance)),baseline);
   images.add(avatarSVG(race.id,appearance));
  }
 }
 assert.equal(images.size,1800);assert.equal(HAIRSTYLES.male.length,5);assert.equal(HAIRSTYLES.female.length,5);assert.equal(new Set(EYE_COLORS.map(e=>e.hex)).size,5);assert.equal(new Set(HAIR_COLORS.map(e=>e.hex)).size,6);
});
test('reject malformed appearance and out of range or fractional choices',()=>{
 for(const a of [null,[],{},'female',{gender:'female',hair:-1,eyes:0},{gender:'male',hair:5,eyes:0},{gender:'male',hair:1.5,eyes:0},{gender:'male',hair:0,eyes:5},{gender:'male',hair:'0',eyes:0},{gender:'<script>',hair:0,eyes:0},{gender:'male',hair:0,eyes:0,hairColor:6},{gender:'female',hair:0,eyes:0,hairColor:-1},{gender:'male',hair:0,eyes:0,hairColor:1.5}])assert.equal(validAppearance(a),false);
});
test('old character saves get appearance defaults without losing progression; recovery retains new choices',()=>{
 const store=new Store(':memory:');try{
 const old=newHero('old','Legacy','jotun');old.level=10;old.xp=42;old.points=18;
 const legacy={...old} as Partial<typeof old>;delete legacy.appearance;
 store.db.prepare('INSERT INTO heroes VALUES(?,?,?)').run('old','legacy-recovery',JSON.stringify(legacy));
 const legacyLook=newHero('legacy-look','Old Look','alf',{gender:'female',hair:3,eyes:4});const oldLook={...legacyLook,appearance:{gender:'female',hair:3,eyes:4}};store.db.prepare('INSERT INTO heroes VALUES(?,?,?)').run('legacy-look','old-look-recovery',JSON.stringify(oldLook));assert.deepEqual(store.get('legacy-look')!.appearance,{gender:'female',hair:3,eyes:4,hairColor:5});
 const loaded=store.get('old')!;assert.deepEqual(loaded.appearance,DEFAULT_APPEARANCE);assert.equal(loaded.level,10);assert.equal(loaded.xp,42);assert.equal(loaded.points,18);
 const appearance={gender:'female' as const,hair:4,eyes:3,hairColor:2};const h=newHero('new','Test','skug',appearance);store.create(h,'recovery');assert.deepEqual(store.get('new')!.appearance,appearance);assert.deepEqual(store.recover('recovery')!.appearance,appearance);
 }finally{store.db.close();}
});
