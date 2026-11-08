> อัปเดตภาพตัวละครรุ่น3: unit/integration54กรณีผ่าน ตรวจภาพ12ชุด ทรงผม10แบบ ผม6สี ตา5สี และผู้เล่นจริงครบ12ตัวละคร/24ภาพชุดหน้า–หลัง ดู [Art direction](ART-DIRECTION.md) สำหรับขอบเขตและคำสั่งทดสอบล่าสุด

# ผลตรวจต้นแบบ 0.1

ตรวจใน cloud environment วันที่ 8 พฤศจิกายน 2026 ด้วย Node 24.22.1 และ Chromium

- `npm ci --cache /tmp/fakero-npm-cache`: ผ่าน ติดตั้งจาก lockfile
- `npm run build`: ผ่าน TypeScript และ Vite; มีคำเตือน bundle >500kB (Phaser รวมกับ client ราว 1.23MB / gzip 340kB) ยังต้องแบ่งโหลด/วัดมือถือจริง
- `npm test`: ผ่าน 8 tests รวม HTTP/WebSocket 10 ตัวละครพร้อมกัน ไม่มี skipped
- `npm run balance`: แสดงค่าพื้นฐานทั้ง 6 เผ่า พบ DPS ของ STR/INT สูงกว่าสาย utility จึงยังไม่ผ่านเกณฑ์ประกาศบาลานซ์
- `CHROMIUM_PATH=/usr/bin/chromium npm run test:browser`: ผ่าน สร้างชื่อภาษาไทย เลือกเผ่า คลิก canvas ฆ่ามอนสเตอร์ได้จริง 1 ตัวและรับ EXP15 รีโหลดคงตัวละคร/จำนวน kill ใช้ recovery key เข้าได้ ตรวจทั้ง dev server และ production build ผ่าน ไม่มี page errors และไม่มี horizontal overflow ที่ 390×844
- `npm audit --audit-level=high`: พบ 0 vulnerabilities ตามข้อมูล registry ณ เวลาตรวจ ไม่ใช่การรับรองว่าไม่มีช่องโหว่ในแอป

พบและแก้ระหว่างทดสอบ: regex ชื่อไม่รับวรรณยุกต์ไทย และมอนสเตอร์จากสูตร modulo เกิดซ้อนกัน เพิ่ม regression tests ให้ทั้งสองกรณีแล้ว

ภาพ local อยู่ `artifacts/01-entry.png`, `02-grove.png`, `03-combat.png`, `04-mobile.png` ไม่ commit artifacts หรือฐานข้อมูลทดสอบ

ยังไม่ได้ทดสอบ latency/packet loss บนอินเทอร์เน็ต การเล่นพร้อมกันโดยมนุษย์จริง 10 คน ความรู้สึกยาก 8/10 บัญชีสาธารณะ และ packaging PC/mobile ภาพไอโซเมตริกใช้ geometry ชั่วคราว ไม่มี sprite animation 8 ทิศทางหรือ pathfinding

## รอบออกแบบตัวละครเริ่มต้น

- `npm run build`: ผ่าน หลังเพิ่ม shared appearance, ตัวอย่างชุด และ renderer เวกเตอร์ ยังมีคำเตือนขนาด bundle เดิม (~1.24MB / gzip 344kB)
- `npm test`: ผ่าน 11 tests รวม 300 รูปลักษณ์ที่ไม่กระทบ stat, การปฏิเสธค่าผิดรูปแบบ, ตัวเก่าไม่มี appearance ยังเก็บความคืบหน้า และ snapshot/SQLite เก็บรูปลักษณ์ที่เลือก
- `BASE_URL=http://127.0.0.1:3200 CHROMIUM_PATH=/usr/bin/chromium npm run test:appearance`: ผ่าน ตรวจชุด/ผม 60 ตัวอย่างบน UI, สีตา 5 สีต่อเพศ, HTTP ปฏิเสธค่าผิด 3 กรณี, สร้าง Jotunborn หญิง/เปียข้าง/ตาเขียว, รีโหลดและกู้คืนยังตรงตัวเลือกเดิม ไม่มี page errors และไม่ล้นจอแนวนอนที่ 390×844
- ตรวจภาพหน้าสร้างบน desktop/mobile และตัวละครในฉากจริง รูปลักษณ์ใน preview และโลกเกมใช้แหล่งเดียวกัน
- พบ selector ปุ่มยืนยันเก่าเลือกโดนปุ่มสีตาที่เพิ่มเข้ามา แก้เป็นปุ่ม `type=submit` ทั้งโค้ดและ browser tests

ภาพใหม่: `artifacts/05-character-creator.png`, `06-creator-mobile-preview.png`, `07-creator-mobile-controls.png`, `08-acolyte-world.png` และแผ่นแบบถาวรใน `docs/art/`

งานนี้ปรับ Jotunborn เป็นนักบวชในทิศทางบทบาทและชุด ยังไม่เพิ่มระบบ heal/buff/cleanse ไม่เปลี่ยนสูตร stat ของผู้เล่นเก่า ภาพคอนเซปต์และเวกเตอร์ยังไม่ใช่ directional animation sprites

## Art revision 2 · ตามภาพอ้างอิงผู้ใช้

- เปลี่ยนภาพออกแบบเป็น Classic SD anime / JRPG, ฉากในเกมโหลด terrain อนิเมะสีสดจาก `public/art/sunlit-grove.png` และเลิกใช้ต้นไม้สามเหลี่ยมกับพื้นตารางเดิม
- `npm run build`: ผ่าน หลังเพิ่มสีผมและเปลี่ยน renderer/ฉาก ยังมี warning bundle ขนาด ~1.24MB ไม่รวม texture ฉาก
- `npm test`: ผ่าน 11 tests ครอบคลุม **1,800** รูปลักษณ์ ไม่กระทบ combat stats และ migrate ตัวเก่าที่มีทรงผม/สีตาแต่ยังไม่มีสีผมโดยเก็บค่าเดิม
- `npm run test:appearance` บน server ทดสอบพอร์ต 3200: ผ่าน ตัวอย่างชุด/ผม 60 แบบ, สีผม 6 สีทั้งชาย/หญิง, สีตา 5 สี, ปฏิเสธ input ผิด 4 แบบ, คงสีผมเขียวบน Jotunborn หลัง reload/recovery, ไม่มี page errors หรือ horizontal overflow ที่ 390×844
- `npm run test:browser`: ผ่าน คลิก canvas ฆ่ามอนสเตอร์/ได้ EXP, reload และ recovery บนฉากใหม่
- ตรวจภาพจริงแล้วเพิ่ม contrast แผง quest และเส้นขอบมอนสเตอร์ให้แยกจากพื้นหญ้าสีสด

ภาพ art จริงที่ใช้และข้อจำกัดแยกไว้ใน `ART-DIRECTION.md` อย่าอ้างว่าสไปรต์ต้นแบบเชิงระบบมีคุณภาพเท่าภาพ concept หรือมี directional animation แล้ว ไฟล์ atlas study ยังไม่ลงทะเบียนใช้ในเกม
