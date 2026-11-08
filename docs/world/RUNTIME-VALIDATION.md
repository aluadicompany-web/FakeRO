# ผลตรวจ World runtime · 8 พฤศจิกายน 2026

- `npm run build`: ผ่าน TypeScript/Vite มี warning bundleหลัก~1.27MB (gzip355kB) และassetPNGโลก4แผ่นรวม~12MB ยังต้องทำcompression/streamingก่อนรองรับมือถือจริง
- `npm test`: ผ่าน **23รายการ** ไม่มีskipped รวม10socketพร้อมกัน,spawn/portal/arrival/NPCทุกแมพเข้าถึงได้,collision,warpที่ต้องเคยไปและอยู่ใกล้NPC,บันทึกเมืองเกิด,แยกsnapshot/การโจมตีข้ามแมพ,PvPเมืองแบบฝ่ายเดียว/พื้นที่ปลอดภัย,EXPสูงสุดรายคน,บอสไม่ให้EXP,checkpointบอส+ตัวละคร,รางวัลรอส่งเมื่อกระเป๋าเต็มและไม่รับซ้ำ,rootfirst-clear และซ่อนinventoryผู้เล่นอื่น
- `CHROMIUM_PATH=/usr/bin/chromium npm run test:maps`: ผ่านการrender **35แมพ** ในChromiumและถ่ายภาพทุกห้อง ไม่มีpage errorsหรือmissing texture warnings ครบเมือง7,ฉาก6ภูมิภาค,เขตบอส7(รวมRoot Warden),Red Zone2
- ในรอบtest:mapsตรวจผ่านUIเพิ่มเติม: เดินเข้าหอจากCentral,คลิกอาคารNPCวาร์ปในEirfjordแล้วไปCentralจริง,คลิกบอสNokkveilจนมีวงเตือนโจมตีจริง ไม่ใช่แค่ภาพบอส
- `BASE_URL=http://127.0.0.1:3200 CHROMIUM_PATH=/usr/bin/chromium npm run test:world`: ผ่าน สร้างตัวละคร เดินจากLjosgard→Field1 สู้มอนผ่านcanvasได้EXP/เงิน เดินผ่านทุ่งกลางเข้าCentral รีโหลดคงแมพและvisited ตรวจแผนที่35ช่องและหน้าจอ390×844ไม่ล้นแนวนอน ไม่มีpage errors
- หลังตรวจภาพแก้CSSที่ซ่อนภาพย่อเมือง/Red Zone แล้วทำtargeted browser checkว่ามีbackground imageทั้งสองประเภทและถ่ายภาพใหม่
- ตรวจแผนที่แต่ละห้องไม่วางpropsซ้ำรูปแบบเดียวกันทั้งหมด เพิ่มseedประจำห้อง/น้ำ/ซากอาคาร และให้ถนนใช้pathfindingเดียวกับกติกาเดิน ตรวจเส้นทางอีกครั้งผ่าน23testsและรอบ35แมพสุดท้าย

หลักฐาน: `artifacts/world/07-final-atlas.png`, `08-final-central.png`, `all-maps/*.png`, `all-maps/boss-live-telegraph.png`, `all-maps/root-entry-walk.png`, และภาพมือถือใน `artifacts/world/`

ขอบเขต: ยังไม่ได้load-testอินเทอร์เน็ตจริง,playtestโดยคน10คน,บาลานซ์บอสเต็มรูปแบบ,เกมถึงLv100,ระบบparty/trade/crafting/อุปกรณ์จริง หรือMain Questหลายชั้น รายละเอียดที่มี/ไม่มีอยู่ในRUNTIME.md ไม่มีการเผยแพร่สภาพแวดล้อมหรือdeployภายนอกในงานนี้

## World Boss + complete map texture pass (2026-11-08)

- `npm run build`: ผ่าน TypeScript และ production build; Vite ยังเตือน bundle ขนาดใหญ่เนื่องจาก Phaser
- `npm test`: 33/33 ผ่าน รวมตำแหน่งเกิด27แมพ รอบ6ชั่วโมง ข้ามรอบ การกู้สถานะหลัง offline ไม่ให้EXP และระยะAoE/ยกเลิกสกิลเมื่อบอสตาย
- `npm run test:worldboss`: บราวเซอร์เปิดบอสครบ6ชนิด ตรวจ texture ที่มีจริง คลิกโจมตี เห็นวงเตือน เปิด atlas และเปิด SQLite ใหม่หลังปิด server แล้วยังเป็นID/รอบเวลาเดิม; จอ390×844 ไม่มี horizontal overflow
- `npm run test:maps`: ตรวจ35แมพและทางเข้าMain Quest/วาร์ปNPC/วงเตือนบอสประจำแมพ ภาพบันทึกใน `artifacts/world/all-maps/`
- ภาพบอสและมือถือ: `artifacts/world/worldbosses/` ตรวจภาพด้วยตาจริงและแก้alphaของatlasบอสที่ทำให้textureบางช่องไม่เกิด รวมทั้งปรับกำแพงด้านลาดย้อนให้ต่อเนื่อง
- ไม่มี endpointเร่งเวลา/เรียกบอส/teleport สำหรับQA ในserverจริง ทดสอบเวลาและfixtureด้วยDBแยก

ภาพนิ่งและการทดสอบอัตโนมัติยังไม่แทนการทดสอบบาลานซ์ร่วมกับผู้เล่นจริง10คน ระบบอาวุธ ปาร์ตี้ ร้านค้า และMain Questเต็มยังเป็นงานถัดไปตามRUNTIME.md

`test:world` ผ่านการสร้างตัวละคร คลิกต่อสู้ เดินข้ามแมพ เข้าCentral รีโหลดพร้อมvisitedและจอมือถือ เพิ่มการบันทึกยอดดาเมจผู้ร่วมต่อสู้บอสเพื่อรักษาสิทธิ์หลังรีสตาร์ต มีunit testครอบคลุมด้วย

## Natural landscape pass (2026-11-08)

`npm run build` และ `npm test` ผ่าน34รายการ เพิ่มการตรวจว่าหลังปลูกป่าแล้วมอนสเตอร์ทุกตัวและบอสทุกแมพยังเดินถึงจากจุดเกิดได้ ป่าหลัก4แมพมี100ต้น ทุ่งกลางยังเปิดโล่ง ตรวจbrowserทุก35แมพพร้อมassertว่าnature atlasทั้ง12ช่องพร้อมใช้งาน และตรวจเดินต่อสู้/วาร์ป/รีโหลด/มือถือด้วยDBแยก รายละเอียด [LANDSCAPE.md](LANDSCAPE.md)

## Central capital dressing (2026-11-08)

- Production build ผ่าน; unit/integration35รายการผ่าน รวมสั่งเดินจริงไปครบ12อาคารโดยไม่ก้าวเข้าสิ่งกีดขวางใหม่
- `test:central` ผ่าน15ตำแหน่ง ตรวจcapital atlasครบ12ช่อง ไม่มีpage error ตรวจทั้งภาพรวมเมืองและจอ390×844
- `test:maps` เฉพาะCentralและEirfjordผ่าน: เดินเข้าหอผนึกและใช้NPCวาร์ปมาCentralได้
- ตรวจภาพรวมเมืองและภาพแยกย่านจากbrowser ภาพใหม่ `artifacts/world/central-tour/full-city.png` และไฟล์ตามชื่ออาคาร
- สำรองSQLiteก่อนรีสตาร์ตlocal preview คงรอบWorld Bossและข้อมูลตัวละครเดิม ไม่เผยแพร่ภายนอก

## Expanded Central (2026-11-08 Asia/Bangkok)

Production build ผ่าน และunit/integration37รายการผ่าน รวมเดินไปทุกบริการกับแผง24จุด ตรวจทางเข้าบ้านประกอบฉาก35หลัง ขอบเขตแมพ64×64 การบันทึกตำแหน่งนอกขอบเขตเดิม และHPที่จุดเกิดใหม่ Browser tour21ตำแหน่งเพิ่มตลาด3มุมและย่านบ้าน3มุม มีภาพรวมผ่านการย่อกล้องและมือถือ แยกDBทดสอบจากข้อมูลจริง

ตรวจCentral/ทุ่งกลาง/Eirfjordผ่านUI รวมเดินเข้าหอผนึกและวาร์ปข้ามเมือง ตรวจทัวร์สร้างตัวละคร/สู้มอน/เข้าCentral/รีโหลด/มือถือด้วยtest:world การเช่าและขายของในแผงยังเป็นระบบถัดไป พื้นที่และIDแผงเตรียมครบ24จุดแล้ว

## Central community and market street (2026-11-08 Asia/Bangkok)

Buildผ่านและunit/integration38รายการผ่าน ตรวจบ้านติดกัน51หลัง ทางเข้า36บริการรวม24แผง ถนนตลาดสองฝั่ง12ร้านต่อฝั่ง ความหลากหลายของผ้าใบ/สินค้า และของหน้าร้าน48ชุดที่อยู่ภายในfootprintแผง ตรวจทุกทางเข้าด้วยsimulationเดิม

Browser tour21ตำแหน่งผ่าน ตรวจatlas citylife12ช่องใหม่ ภาพกำแพงเชิงเทิน ป้อม6จุดและย่านบ้านติดกัน มีการตรวจภาพและปรับตัวสุ่มภาพเพื่อไม่ให้ร้านแต่ละฝั่งซ้ำแบบเดียวกันเกือบทั้งหมด ตรวจคลิกแผง10เดินเข้าหาจุดapproachด้านข้างแล้วเปิดหน้าต่างข้อมูลสำเร็จ ภาพmarket-service.png

ทดสอบCentral/ทุ่งกลาง/Eirfjordผ่านUI รวมทางเข้าMain QuestและNPCวาร์ป ใช้DBแยกจากข้อมูลผู้เล่น สำรองSQLiteก่อนรีสตาร์ตlocal preview คงความคืบหน้าและตารางWorld Bossเดิม ไม่เผยแพร่ภายนอก
