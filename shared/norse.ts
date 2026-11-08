/** Game encounter tiers are adaptations, not a claim of canonical mythological power ranking. */
export const WORLD_BOSSES=[
 {id:'fafnir',name:'Fafnir · ฟาฟเนียร์',lore:'มังกรผู้เฝ้าทรัพย์จากตำนานวีรบุรุษนอร์ส',level:45,hp:18000,damage:76,radius:2.4,windup:2100,pattern:'venom-fan',title:'ลมหายใจพิษ'},
 {id:'garmr',name:'Garmr · การ์ม',lore:'สุนัขเฝ้าแดนคนตาย ไม่ใช่เฟนรีร์',level:42,hp:15000,damage:68,radius:1.6,windup:1800,pattern:'cross',title:'เขี้ยวสี่ทิศ'},
 {id:'hraesvelgr',name:'Hraesvelgr · เฮรสเวลก์',lore:'ยักษ์รูปร่างอินทรี ผู้เกี่ยวข้องกับสายลม',level:44,hp:16000,damage:65,radius:1.7,windup:2200,pattern:'ring',title:'วงแหวนพายุ'},
 {id:'hrungnir',name:'Hrungnir · ฮรุงเนียร์',lore:'ยักษ์หัวใจหินในตำนานการต่อสู้กับธอร์',level:46,hp:20000,damage:82,radius:2.1,windup:2400,pattern:'stones',title:'ศิลาถล่ม'},
 {id:'draugr_king',name:'Draugr King · ราชันดรอว์เกอร์',lore:'ราชันผู้คืนจากสุสาน ดัดแปลงจากคติความเชื่อดรอว์เกอร์ ไม่ใช่นามเทพองค์หนึ่ง',level:43,hp:17000,damage:64,radius:3.8,windup:2100,pattern:'drain',title:'พิธีดูดชีวิต'},
 {id:'lyngbakr',name:'Lyngbakr · ลิงบักร์',lore:'อสูรวาฬคล้ายเกาะจากตำนานซากา รูปร่างลอยเหนือพื้นเป็นการดัดแปลงสำหรับเกม',level:47,hp:22000,damage:80,radius:2,windup:2300,pattern:'wave',title:'คลื่นเกาะมีชีวิต'}
] as const;
export type WorldBossType=typeof WORLD_BOSSES[number]['id'];
export const RESERVED_MAIN_QUEST=[
 {name:'Odin',role:'มหาเทพ / ความรู้และชะตา'}, {name:'Thor',role:'เทพสายฟ้า / การทดสอบพลัง'},
 {name:'Loki',role:'เทพเล่ห์กล / ภาพลวงและการต่อรอง'}, {name:'Tyr',role:'คำสัตย์และสงคราม'},
 {name:'Heimdall',role:'ผู้เฝ้าประตู'}, {name:'Freyr',role:'ความอุดมสมบูรณ์และชีวิต'},
 {name:'Fenrir',role:'ภัยระดับมหากาพย์'}, {name:'Jormungandr',role:'งูโลก'},
 {name:'Surtr',role:'ไฟแห่งการสิ้นยุค'}, {name:'Nidhoggr',role:'ภัยใต้รากไม้โลก'}
] as const;
export const WORLD_BOSS_INTERVAL=6*60*60*1000;
