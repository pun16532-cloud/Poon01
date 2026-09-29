# ⚡ FITFLOW - ระบบคำนวณค่า TDEE วิทยาศาสตร์การออกกำลังกาย และติดตามสุขภาพ

> เว็บแอปพลิเคชันเพื่อสุขภาพครบวงจร: คำนวณ TDEE/BMR, คลังท่าออกกำลังกาย, บันทึกแคลอรีอาหาร, กราฟติดตามน้ำหนัก เชื่อมต่อฐานข้อมูล Supabase และพร้อม Deploy บน Vercel

---

## 🌟 ฟีเจอร์หลัก (Key Features)

1. **เครื่องคำนวณ TDEE & BMR ขั้นสูง**:
   - สูตรมาตรฐานสากล **Mifflin-St Jeor** และ **Harris-Benedict**
   - คำนวณดัชนีมวลกาย (BMI) พร้อมเกณฑ์มาตรฐานเอเชีย (WHO Asian Standard)
   - ปรับเป้าหมายพลังงานอัตโนมัติ: ลดไขมัน (-18% ถึง -25%), รักษาน้ำหนัก, เพิ่มกล้ามเนื้อแบบลีน (+10%), เพิ่มกล้ามเนื้อเต็มพิกัด (+20%)
   - สรุปสัดส่วนสารอาหาร Macronutrients รายวัน (โปรตีน, คาร์โบไฮเดรต, ไขมัน) ทั้งหน่วยกรัมและเปอร์เซ็นต์

2. **แดชบอร์ดติดตามผู้ใช้งาน (Dashboard & Tracking)**:
   - **Calorie Budget & Balance**: บันทึกอาหารและคำนวณแคลอรีคงเหลือแบบเรียลไทม์ หักลบแคลอรีจากการออกกำลังกาย พร้อมแจ้งเตือนเมื่อเกินเกณฑ์
   - **Weight Trend Chart**: กราฟแนวโน้มน้ำหนักตัวด้วย Chart.js เปรียบเทียบกับเส้นเป้าหมาย Target Weight
   - **Food & Workout Log**: บันทึกรายการมื้ออาหารและกิจกรรมออกกำลังกาย พร้อมลบ/แก้ไขได้ง่าย
   - **Data Backup (JSON Export)**: สำรองข้อมูลสถิติสุขภาพออกมาเป็นไฟล์ JSON ได้ในคลิกเดียว

3. **หน้าเว็บหลักฟิตเนส (Fitness Portal)**:
   - รวบรวมคลังท่าออกกำลังกาย (Weight Training, HIIT & Cardio, Home Workout, Mobility) พร้อมคำแนะนำวิธีฝึกที่ถูกต้อง
   - สาระน่ารู้เรื่องโภชนาการ และคำถามที่พบบ่อย (FAQ)

4. **รองรับทุกอุปกรณ์ (Responsive All Devices)**:
   - ออกแบบด้วย Modern Glassmorphism & Sports Tech Dark Theme
   - รองรับทั้ง Desktop, Tablet และ Smartphone (พร้อมแถบเมนูด้านล่าง Mobile Bottom Nav)

5. **ระบบฐานข้อมูล Supabase & Offline Demo Mode**:
   - รองรับ Supabase Auth และ Database CRUD
   - หากยังไม่ได้ใส่ Supabase API Key ตัวเว็บมีระบบ **Local Storage Demo Mode** ให้ทดลองใช้งานและมีข้อมูลตัวอย่างให้ทันที 100%

---

## 🗂️ โครงสร้างไฟล์ (Project Structure)

```
c:\Users\Kitti\Downloads\FIT\
├── index.html               # หน้าหลัก Landing Page, Workout Library และ Quick Calculator
├── dashboard.html           # หน้าแดชบอร์ดหลักและระบบติดตามผู้ใช้งาน
├── vercel.json              # การตั้งค่าสำหรับ Vercel Deployment
├── README.md                # คู่มือการใช้งานและติดตั้ง
│
├── css/
│   ├── main.css             # Design System, ตัวแปรสี, Cards, Navigation, Responsive
│   ├── landing.css          # สไตล์เฉพาะหน้าหลัก, Hero, Workout Cards, FAQ
│   └── dashboard.css        # สไตล์หน้าแดชบอร์ด, การ์ดสถิติ, กราฟ, บันทึกอาหาร
│
├── js/
│   ├── config.js            # จัดการ Credentials, LocalStorage keys และ Demo user
│   ├── supabaseClient.js    # ตัวเชื่อมต่อ Supabase Client (Auth + CRUD)
│   ├── tdeeCalculator.js    # โมดูลสูตรคำนวณ BMR, TDEE, BMI, Macros
│   ├── app.js               # Logic หน้าแรก Landing Page
│   └── dashboard.js         # Logic หน้า Dashboard, Chart.js, Calorie Balance
│
└── supabase/
    └── schema.sql           # SQL Script สร้าง Tables, RLS Policies และ Triggers
```

---

## 🚀 วิธีการทดสอบใช้งานบนเครื่อง (Local Run)

คุณสามารถเปิดไฟล์ `index.html` บนเบราว์เซอร์ได้ทันที หรือรันผ่าน Local HTTP Server:

```bash
# ตัวอย่างการรันด้วย npx serve หรือ http-server
npx serve .
```
หรือเปิดไฟล์ `index.html` บน Chrome/Edge ได้โดยตรง

---

## 🗄️ ขั้นตอนการเชื่อมต่อ Supabase Database (Step-by-Step)

1. เข้าไปที่ [supabase.com](https://supabase.com) และสร้างโปรเจกต์ใหม่ (ฟรี)
2. ไปที่เมนู **SQL Editor** ในหน้า Supabase Dashboard
3. คัดลอกโค้ดทั้งหมดจากไฟล์ `supabase/schema.sql` ในโปรเจกต์นี้ ไปวางและกด **Run**
   - ระบบจะสร้างตาราง `profiles`, `tdee_history`, `weight_logs`, `food_logs`, `workout_logs` พร้อมตั้งค่าความปลอดภัย RLS ให้อัตโนมัติ
4. ไปที่ **Project Settings** ➔ **API**
   - คัดลอก **Project URL**
   - คัดลอก **anon public key**
5. เปิดหน้าเว็บ FITFLOW คลิกที่ปุ่ม **"Supabase Config"** หรือ **"ตั้งค่า Supabase API"** แล้ววาง URL และ Anon Key จากนั้นกดบันทึก ข้อมูลทั้งหมดจะถูกเชื่อมต่อและซิงก์ขึ้น Supabase ทันที!

---

## 🌐 วิธีการ Deploy ขึ้น Vercel (Step-by-Step)

### วิธีที่ 1: ผ่าน Vercel CLI
```bash
# ติดตั้ง Vercel CLI (หากยังไม่มี)
npm i -g vercel

# สั่ง Deploy
vercel
```

### วิธีที่ 2: ผ่าน GitHub & Vercel Dashboard (แนะนำ)
1. นำโฟลเดอร์โปรเจกต์นี้ขึ้น GitHub Repository ของคุณ
2. เข้าสู่ระบบ [vercel.com](https://vercel.com)
3. กด **"Add New..."** ➔ **"Project"**
4. เลือก Repository ของคุณ แล้วกด **"Deploy"** ได้ทันที (Vercel จะตรวจจับไฟล์ `index.html` และ `vercel.json` โดยไม่ต้องตั้งค่า build command ใดๆ เพิ่มเติม)
5. เว็บของคุณจะพร้อมใช้งานทั่วโลกผ่านโดเมน `.vercel.app` ภายในไม่กี่วินาที!
