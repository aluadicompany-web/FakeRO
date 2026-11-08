export const WEAPONS=[
 {id:'knife',name:'มีดฝึกหัด',style:'thrust',range:1.4,speed:.8,power:.8,windup:180,color:0xe5d6a1},
 {id:'sword',name:'ดาบมือเดียว',style:'slash',range:1.6,speed:1,power:1,windup:240,color:0xbce4ee},
 {id:'greatsword',name:'ดาบใหญ่สองมือ',style:'cleave',range:2,speed:1.4,power:1.45,windup:420,color:0xe7b76e},
 {id:'shield',name:'โล่กระแทก',style:'bash',range:1.3,speed:1.1,power:1.05,windup:270,color:0x8cb6db},
 {id:'staff',name:'ไม้เท้า',style:'pulse',range:5,speed:1.25,power:1.2,windup:380,color:0xb49aef},
 {id:'wand',name:'คทา',style:'bolt',range:6,speed:1,power:.95,windup:230,color:0x8ce6e4},
 {id:'dagger',name:'มีดสั้น',style:'thrust',range:1.3,speed:.65,power:.65,windup:130,color:0xe5caa5},
 {id:'bow',name:'ธนู',style:'arrow',range:7,speed:1.1,power:1.05,windup:300,color:0xe6d3a0},
 {id:'hammer',name:'ค้อนเล็ก',style:'smash',range:1.4,speed:1.1,power:1.1,windup:290,color:0xeac58b},
 {id:'sword_shield',name:'ดาบและโล่',style:'slash',range:1.6,speed:1.05,power:1.05,windup:250,color:0xbedce6},
 {id:'hammer_shield',name:'ค้อนและโล่',style:'smash',range:1.4,speed:1.15,power:1.15,windup:310,color:0xd9b18b},
 {id:'greathammer',name:'ค้อนใหญ่',style:'quake',range:1.9,speed:1.55,power:1.6,windup:480,color:0xe6af6f},
 {id:'axe',name:'ขวาน',style:'cleave',range:1.8,speed:1.3,power:1.35,windup:360,color:0xe6a583},
 {id:'longbow',name:'ธนูยาว',style:'arrow',range:8,speed:1.45,power:1.5,windup:470,color:0xf0c98e},
 {id:'shortbow',name:'ธนูสั้น',style:'arrow',range:5.5,speed:.8,power:.75,windup:190,color:0xb6da9e},
 {id:'katana',name:'คาตานะ',style:'draw',range:1.9,speed:1.15,power:1.15,windup:260,color:0xf2c2d9},
 {id:'dual_swords',name:'ดาบคู่',style:'double',range:1.5,speed:.9,power:.9,windup:210,color:0xc1dfee}
]as const;
export type WeaponId=typeof WEAPONS[number]['id'];
export const weaponById=(id:unknown)=>WEAPONS.find(w=>w.id===id)||WEAPONS[0];
export const isWeapon=(id:unknown):id is WeaponId=>WEAPONS.some(w=>w.id===id);
export const isRanged=(style:string)=>['arrow','bolt','pulse','spore'].includes(style);
