import Phaser from 'phaser';import {GUIDE} from '../shared/adventure';
export function preloadGuide(scene:Phaser.Scene){scene.load.spritesheet('eira-idle','/art/npcs/eira.webp',{frameWidth:192,frameHeight:288});}
export class GuideView extends Phaser.GameObjects.Container{
 sprite:Phaser.GameObjects.Image;
 constructor(scene:Phaser.Scene){super(scene,(GUIDE.x-GUIDE.y)*48,(GUIDE.x+GUIDE.y)*24);scene.add.existing(this);this.setDepth(this.y+30).setData('guide',true);this.add(scene.add.ellipse(0,1,36,14,0x183c35,.24));this.sprite=scene.add.image(0,0,'eira-idle',0).setOrigin(.5,.975).setDisplaySize(72,108);this.add(this.sprite);this.add(scene.add.text(0,-122,'✦ '+GUIDE.name,{fontFamily:'sans-serif',fontSize:'12px',color:'#ffdf95',stroke:'#193b44',strokeThickness:3,backgroundColor:'#1a3845c9',padding:{x:6,y:3}}).setOrigin(.5));this.add(scene.add.text(0,11,'คลิกเพื่อพูดคุย',{fontFamily:'sans-serif',fontSize:'10px',color:'#d6ebdf',backgroundColor:'#214653bb',padding:{x:5,y:2}}).setOrigin(.5,0));}
 animate(now:number){const t=now%5000,frame=t<2200?0:t<2400?1:t<2530?2:t<4200?0:t<4700?3:1;this.sprite.setFrame(frame);this.sprite.setScale(.375*(1+Math.sin(now/900)*.003),.375);document.body.dataset.guideFrame=String(frame);}
}
export const GUIDE_LESSONS=[
 {title:'เริ่มต้นการเดินทาง',text:'ยินดีต้อนรับสู่ Central! ฉันชื่อ Eira ผู้ดูแลลานเริ่มต้น คลิกพื้นเพื่อเดิน คลิกมอนสเตอร์เพื่อโจมตีต่อเนื่อง กด M เปิดแผนที่โลก แล้วเดินไปประตูเพื่อสำรวจพื้นที่ใหม่'},
 {title:'พักฟื้นที่ลานเริ่มต้น',text:'พักภายในวงลานรอบหอนาฬิกาเพื่อฟื้น HP และ MP อัตโนมัติ HP ฟื้น 6% และ MP 10% ต่อวินาที เวทพื้นฐานใช้ MP ถ้าพลังหมดให้กลับมาพักกับฉัน เมือง Central เป็นพื้นที่ปลอดภัย'},
 {title:'สีชื่อและค่าประสบการณ์',text:'ชื่อเขียว: มอนสเตอร์ต่ำกว่าเรา 1–9 เลเวล ชื่อเหลือง: เลเวลเท่ากัน ชื่อแดง: สูงกว่าเรา ชื่อขาว: ต่ำกว่าเราตั้งแต่ 10 เลเวลขึ้นไป ซึ่งไม่ให้ EXP ผู้ทำดาเมจสะสมรายบุคคลมากที่สุดได้รับ EXP ของมอนสเตอร์ธรรมดา'},
 {title:'อาวุธและหอผนึก',text:'อาวุธไม่จำกัดเผ่า แต่ต้องมีเลเวลและสเตตัสถึงเงื่อนไข กด B เปิดกระเป๋าเพื่อสวมใส่ของที่ได้รับ อาวุธขาวดรอปจากมอนสเตอร์ อาวุธฟ้ามีไว้สำหรับงานคราฟ ระบบคราฟผู้เล่นยังอยู่ระหว่างพัฒนา ประตูต้นไม้อิกดราซิลทางเหนือเชื่อมสู่บททดสอบแรกของเซิร์ฟเวอร์ คุยกับยามผนึกหน้าประตูและกดยืนยันก่อนเข้า เตรียมตัวให้พร้อมก่อนเข้าไปนะ'},
];
