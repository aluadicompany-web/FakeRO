# ทดสอบบนเว็บโดยเริ่มจากโฮสต์ฟรี

## ตัวเลือกสำหรับเกมนี้

ตัวเลือกแรกคือ **Oracle Cloud Always Free VM** เพราะเกมปัจจุบันเป็นNode.js serverที่ต้องเปิดWebSocketและเก็บSQLiteบนดิสก์ถาวร รองรับVMทั้งARM64และAMD64ด้วยDockerfileเดียว เหมาะกับกลุ่มทดสอบไม่เกิน10คนโดยไม่ต้องแปลงbackend

บริการฟรีไม่ใช่การรับประกันว่าจะได้เครื่องเสมอ ต้องสมัครและยืนยันตัวตน/บัตรตามเงื่อนไขของOracle มีข้อจำกัดเครื่องว่างแต่ละregion และอาจเรียกคืนเครื่องที่ไม่ได้ใช้งาน ควรตรวจเงื่อนไขปัจจุบันและเลือกเฉพาะทรัพยากรที่มีป้ายAlwaysFreeจริงในบัญชี ไม่ได้ตั้งค่าบัญชีหรือเปิดทรัพยากรบนOracleจากrepositoryนี้

Renderฟรีเริ่มง่ายแต่พักเมื่อไม่มีtrafficและไฟล์instanceไม่ถาวร จึงยังใช้SQLiteชุดนี้เก็บความคืบหน้าระยะยาวโดยตรงไม่ได้ หากเลือกRenderต้องเพิ่มadapterฐานข้อมูลภายนอกเช่นPostgresก่อน ไม่แนะนำใช้GitHubPagesเพราะรันserver/WebSocketไม่ได้ การpushGitHubเป็นการส่งsourceไม่ใช่การdeploy

## ติดตั้งบนVM

หลังมีVMและDockerComposeแล้ว:

```sh
git clone https://github.com/aluadicompany-web/FakeRO.git
cd FakeRO
cp .env.example .env
```

แก้`.env`บนVMด้วยตัวแก้ไขข้อความ ตั้งGM_USERNAMEและGM_PASSWORDสำหรับเจ้าของ ใช้รหัสส่วนตัวที่สร้างไว้หรือรหัสใหม่ที่แข็งแรง ห้ามcommitไฟล์นี้ ค่าต่างๆส่งให้containerโดยCompose ส่วนการรันnpmตรงๆต้องตั้งenvironmentเอง

สำหรับทดสอบบนเครื่องเดียวให้ใช้PUBLIC_ORIGIN=http://localhost:3000 แล้วรัน:

```sh
docker compose up -d --build
docker compose logs --tail=50 game
```

ค่าพอร์ตเริ่มต้นbind127.0.0.1 ถ้าต้องการทดสอบLANชั่วคราวกำหนดBIND_ADDRESS=0.0.0.0และPUBLIC_ORIGINเป็นURLจริงที่ผู้เล่นเปิด เกมรับPOST/WebSocketเฉพาะOriginนั้น ไม่ควรล็อกอินรหัสจริงผ่านHTTPบนอินเทอร์เน็ตสาธารณะ

## HTTPSสำหรับผู้ทดสอบออนไลน์

ชี้domainที่คุณใช้ไปที่publicIPของVM แล้วตั้ง:

```dotenv
PUBLIC_HOST=game.your-domain.example
PUBLIC_ORIGIN=https://game.your-domain.example
BIND_ADDRESS=127.0.0.1
```

ชื่อdomainข้างบนเป็นตัวอย่าง ต้องเปลี่ยนเป็นของจริง เปิดTCP80/443ในกฎเครือข่ายของVMและfirewall แล้วรัน:

```sh
docker compose --profile https up -d --build
```

Caddyขอcertificateและส่งต่อWebSocketให้game:3000อัตโนมัติ พร้อมเก็บข้อมูลcertificateในvolume อย่าเปิด3000สู่สาธารณะหากใช้proxyนี้ เมื่อมีdomainที่เข้าถึงได้จริงจึงจะได้ลิงก์เล่นออนไลน์ ชุดนี้ยังไม่มีบัญชีโฮสต์/domainที่ผูกไว้

## ข้อมูลถาวรและการอัปเดต

Composeเก็บSQLiteในvolumeworld-data และเซิร์ฟเวอร์บันทึกข้อมูลก่อนปิดปกติ อัปเดตด้วยgitpullและdockercomposeup--buildไม่ลบvolume ห้ามใช้down-vหากต้องการเก็บโลกเดิม สำรองSQLiteด้วยSQLitebackupAPIหรือหยุดgameก่อนคัดลอกDB และเก็บสำรองไว้นอกVMด้วย

GMbootstrapเกิดเฉพาะครั้งแรก หากเปลี่ยนค่าGM_PASSWORDหลังบัญชีมีอยู่แล้วจะไม่เปลี่ยนรหัสให้ ใช้คำสั่งในcontainerเพื่อresetเมื่อจำเป็น:

```sh
docker compose exec game npm run gm:create -- --username worldkeeper --reset
```

คำสั่งนี้ใช้GM_PASSWORDจากenvironmentของcontainerและยกเลิกsessionGMเดิม บัญชีผู้เล่นทั่วไปไม่มีปุ่มหรือสิทธิ์เครื่องมือGM

## สิ่งที่ตรวจแล้ว

Dockerimagebuildและproductionruntimeผ่าน ตรวจ/api/health ล็อกอินGM สร้างตัวละครCentral และรักษาID/บัญชีหลังrestartด้วยvolume ชุดGitHubActionsรันtestและbuildบนpushmain แต่ยังไม่เชื่อมdeployprovider ไม่มีค่าใช้จ่ายโฮสต์หรือทรัพยากรภายนอกถูกเปิดขึ้นจากงานนี้
