import {spriteSVG} from './sprite.js';
import type {Race} from './rules.js';
export const GENDERS = ['male','female'] as const;
export type Appearance = {gender:typeof GENDERS[number];hair:number;eyes:number;hairColor:number};
export type AppearanceInput=Omit<Appearance,'hairColor'>&{hairColor?:number};
export const HAIR_COLORS=[{name:'แดง',hex:'#ce5260'},{name:'เขียว',hex:'#54a27b'},{name:'ฟ้า',hex:'#6faed6'},{name:'ม่วง',hex:'#9677c6'},{name:'ทอง',hex:'#d9b45c'},{name:'ดำ',hex:'#42414f'}] as const;
export const DEFAULT_APPEARANCE:Appearance={gender:'male',hair:0,eyes:0,hairColor:5};
export const HAIRSTYLES = {
 male:['สั้นปัดข้าง','ยาวประบ่า','หางม้าสูง','สั้นหยักศก','ตั้งปลายแหลม'],
 female:['บ๊อบสั้น','ยาวตรง','เปียข้าง','มวยสูง','ยาวลอน']
} as const;
export const EYE_COLORS = [
 {name:'น้ำตาล',hex:'#875636'}, {name:'ฟ้า',hex:'#5d9bc4'},
 {name:'เขียว',hex:'#619b70'}, {name:'อำพัน',hex:'#d1a14c'}, {name:'ม่วง',hex:'#9470ba'}
] as const;
export function validAppearance(a:unknown):a is AppearanceInput {
 if(!a||typeof a!=='object'||Array.isArray(a))return false;
 const v=a as AppearanceInput;
 return GENDERS.includes(v.gender)&&Number.isInteger(v.hair)&&v.hair>=0&&v.hair<5&&Number.isInteger(v.eyes)&&v.eyes>=0&&v.eyes<5&&(v.hairColor===undefined||(Number.isInteger(v.hairColor)&&v.hairColor>=0&&v.hairColor<6));
}
export function appearanceOrDefault(a:unknown):Appearance {return validAppearance(a)?{gender:a.gender,hair:a.hair,eyes:a.eyes,hairColor:a.hairColor??5}:{...DEFAULT_APPEARANCE};}
export const STARTER_OUTFITS:Record<Race,{name:string;description:string;main:string;dark:string;trim:string;className:string}>= {
 muspel:{name:'Ember Wayfarer',description:'เสื้อคลุมนักดาบแดง เข็มขัดหนัง และแผ่นไหล่เหล็กเล็ก',main:'#b94940',dark:'#773930',trim:'#d8b279',className:'Swordsman'},
 alf:{name:'Grove Scout',description:'ผ้าคลุมสั้นเขียว เข็มกลัดใบไม้ และปลอกแขนเดินป่า',main:'#638a4c',dark:'#365d3d',trim:'#c6d49a',className:'Archer'},
 jotun:{name:'Frost Benediction',description:'อาภรณ์นักบวชฟ้า–ขาว ผ้าพาดพิธี และรูนแห่งชีวิต',main:'#8dc4d8',dark:'#527f9a',trim:'#f3eedc',className:'Acolyte'},
 vanir:{name:'Rune Apprentice',description:'เสื้อฝึกเวทม่วง ขอบรูนเรียบ และกระเป๋าม้วนคัมภีร์',main:'#9270b2',dark:'#574368',trim:'#d6bddf',className:'Magician / Mage'},
 nid:{name:'Golden Provisioner',description:'เสื้อกั๊กทองทับเชิ้ต ผ้ากันเปื้อน และกระเป๋าเครื่องมือ',main:'#bb9548',dark:'#785a32',trim:'#eddeb1',className:'Merchant'},
 skug:{name:'Nightstep Initiate',description:'เสื้อดำชายแยก ผ้าคลุมสั้น และตะเข็บเทาที่อ่านง่าย',main:'#292c32',dark:'#15191e',trim:'#858e98',className:'Thief'}
};
// Original SD pixel-style art; shared by preview and the game renderer.
export function avatarSVG(race:Race,input:AppearanceInput):string {
 const a=appearanceOrDefault(input);
 return spriteSVG(race,a,STARTER_OUTFITS[race],HAIR_COLORS[a.hairColor].hex,EYE_COLORS[a.eyes].hex);
}
