# Cardly — Product Strategy & Backlog

> วิเคราะห์จาก LINE Group "ล่าโปรบัตรเครดิต" + Product Strategy Document
> อัปเดตล่าสุด: 26 พฤษภาคม 2026

---

## 🧭 Product Vision

> **"Google Maps สำหรับการใช้บัตรเครดิตให้คุ้มที่สุด"**

สิ่งที่ user ต้องการจริงๆ ไม่ใช่ "ข้อมูลโปรโมชั่น" แต่คือ:
> **"ช่วยคิดแทนว่าควรจ่ายยังไงให้คุ้มที่สุด"**

---

## 👥 Customer Segments (7 กลุ่ม)

| # | Segment | ลักษณะ | Pain Point หลัก |
|---|---------|--------|----------------|
| 1 | **Hardcore Gamer** | ถือบัตร 5-10+ ใบ, ตื่นตีหนึ่งกดโปร, stack หลายชั้น | official info ไม่พอ, ต้อง trial & error |
| 2 | **Cashback Optimizer** | optimize cashback ต่อ category, split bill, track threshold | จำ threshold ไม่ไหว, ใช้ผิด category |
| 3 | **Travel Hacker** | สะสม miles (JAL/AirAsia/T1), ใช้บัตรต่างประเทศ, lounge | point conversion ซับซ้อน, point หมดอายุ |
| 4 | **Saver Hunter** | โปรรายวัน, Lotus/Big C/น้ำมัน, เน้นคุ้มค่า | โปรหมดเร็ว, ลืมใช้สิทธิ์ |
| 5 | **Credit Lifestyle User** | AMEX Plat / UOB Premier, spa/dining/golf | privilege เยอะจนใช้ไม่ทัน |
| 6 | **Health & Medical Payer** | ค่า รพ.สูง, AEON Wellness, KBank BDMS | ไม่รู้บัตรไหนได้สิทธิ์ทางการแพทย์ |
| 7 | **Casual User / Newbie** | บัตร 1-2 ใบ, ใช้เพื่อความสะดวก | โปรเยอะเกิน อ่านไม่ไหว ไม่รู้ใช้ใบไหนดี |

---

## 📋 Master Product Backlog (22 Features)

### 🔴 P0 — Foundation (Phase 1: 0–3 เดือน) | 76 SP

| # | Feature | SP | เหตุผล |
|---|---------|:--:|--------|
| 1 | 🗃️ **My Cards Wallet** | 13 | Root dependency — ทุก feature ถาม "user มีบัตรอะไร?" ไม่มีนี้ = ไม่มี personalization |
| 2 | 🗄️ **Promo Database** | 21 | Content infrastructure — ทุก feature ดึงข้อมูลจากนี้ |
| 3 | 🗺️ **MCC Mapping v1** (Simplified ~500 ร้าน) | 13 | Hidden dependency — ระบบรู้ว่า Starbucks = กาแฟ = cashback บัตรไหน |
| 4 | 🔍 **Merchant Search & Discovery** | 8 | Quick win + validate ข้อมูล Promo DB และ MCC |
| 5 | 💳 **Best Card Recommendation** (Rule-based) | 13 | Core value prop — "ควรรูดบัตรอะไร?" |
| 6 | 🔔 **Promo Expiration Alert** | 8 | Retention hook — habit loop ให้ user เปิดแอพทุกวัน |

### 🟠 P1 — Core Loop (Phase 2: 3–6 เดือน) | 37 SP

| # | Feature | SP | เหตุผล |
|---|---------|:--:|--------|
| 7 | 📅 **Benefit & Threshold Tracker** | 8 | ปิด pain point Cashback Optimizer — "ใช้ไปเท่าไหร่แล้ว เหลืออีกเท่าไหรถึงครบ?" |
| 8 | 🎯 **Personalized Recommendation** (ML-based) | 13 | Upgrade rule → intelligence — "บัตร A ครบแล้ว switch ไป B ดีกว่า" |
| 9 | ✅ **User Verified Promo** | 8 | Trust layer — community ยืนยันว่าโปรยังใช้ได้ไหม |
| 10 | 💰 **Cashback & Spending Analytics** | 8 | Insight loop — "เดือนนี้ประหยัดได้ X บาท" สร้าง emotional reward |

### 🟡 P2 — Power Users (Phase 3: 6–9 เดือน) | 99 SP

| # | Feature | SP | เหตุผล |
|---|---------|:--:|--------|
| 11 | 🗺️ **MCC Mapping Full v2** | 21 | Upgrade manual tag → full MCC database ทุก merchant |
| 12 | ✈️ **Miles & Points Aggregator** | 13 | Serve Travel Hacker — track ไมล์ทุก program + แจ้งก่อน expire |
| 13 | 🧾 **Split Bill Optimizer** | 21 | Maximize cashback ด้วยการ split bill ให้ถูก card |
| 14 | 🌍 **Travel Card Advisor** | 5 | Input: ประเทศ → แนะนำบัตรที่ดีสุด + FX fee |
| 15 | 🧮 **Promo Stacking Simulator** | 21 | Killer feature สำหรับ Hardcore — ต้องรอ Promo DB ครบ + MCC แม่นก่อน |
| 16 | 🏥 **Health & Medical Card Tracker** | 5 | Underserved segment — ค่า รพ. 120k+ SP น้อย ทำได้ระหว่าง Phase 3 |
| 17 | ⭐ **Merchant Review** | 13 | Community moat — ต้องรอมี user base ก่อน |

### 🔵 P3 — AI Layer (Phase 4: 9–12 เดือน) | 68 SP

| # | Feature | SP | เหตุผล |
|---|---------|:--:|--------|
| 18 | 🤖 **AI Ask Assistant** | 13 | Multiplier ของทุก feature — ต้องรอ data สะสมจาก P0-P2 ก่อน AI ถึงจะดี |
| 19 | 📸 **Screenshot Promo Analyzer** | 34 | ถ่ายรูปโปร → ระบบ parse เองอัตโนมัติ |
| 20 | 🧠 **AI Recommendation Feed** | 21 | Proactive — ระบบ push โปรที่เหมาะกับ spending pattern มาเอง |

### 🟣 P4 — Platform (Phase 5: 12+ เดือน) | 76 SP

| # | Feature | SP | เหตุผล |
|---|---------|:--:|--------|
| 21 | 📄 **Statement OCR** | 21 | Automate data entry — ไม่ต้อง input transaction เอง |
| 22 | 🏦 **Bank Sync Integration** | 55 | Game changer แต่ regulatory complexity ในไทยสูง รอทำสุดท้าย |

---

## ✅ Acceptance Criteria (ต่อ Feature)

> Issue tracking: feature #N ในตารางด้านบน = GitHub issue #(N+1) — เช่น feature 1 (My Cards Wallet) = [issue #2](https://github.com/Showbae/cardly-liff/issues/2)

### P0 — Foundation

**1. My Cards Wallet**
- ผู้ใช้เพิ่ม/แก้ไข/ลบบัตรของตัวเองได้ พร้อมเลือกธนาคาร+ประเภทบัตรจาก catalog
- ระบบเก็บแค่เลข 4 ตัวท้าย ไม่เก็บเลขบัตรเต็ม (PCI-lite)
- หน้า Wallet แสดงรายการบัตรทั้งหมดของ user แบบ real-time หลัง add/delete

> ⚠️ **Note (schema ↔ design mismatch):** design handoff ระบุให้เก็บ `last4` (4 ตัวท้าย) และไม่เก็บ PAN
> แต่ schema ปัจจุบัน ตาราง `users_card` มีแค่ `user_id` + `card_id` (link ไป catalog กลาง) — **ยังไม่มี field `last4`**
> จึงยังทำ AC ข้อ "เก็บ 4 ตัวท้าย" และการแสดงผล `•••• 4521` ตาม design ไม่ได้
> **ต้องตัดสินใจก่อน:** (ก) เพิ่ม field `last4` (+ อาจรวม nameOnCard/network/color) ใน `users_card` เพื่อรองรับบัตรรุ่นเดียวกันหลายใบ
> หรือ (ข) ยอมรับว่า 1 user ถือบัตรได้รุ่นละ 1 ใบ แล้วตัด AC ข้อนี้ออก

**2. Promo Database**
- มี schema รองรับ promo (title, type, benefit, min_spend, cap, validity, source) — ✅ มีแล้ว
- **Read API** ให้ LIFF frontend ดึงโปรตาม bank/category ได้
- **Write path** (admin portal หรือ import/seed script) สำหรับทีม content ใส่/แก้โปร — user ไม่ได้เป็นคนสร้างโปรเอง
- มีข้อมูลโปรจริงเข้าระบบพอ validate schema ใช้งานได้จริง (จำนวนขั้นต่ำ: TBD — PO กำหนด)

> ℹ️ **Note:** ยังไม่มี seed/import infrastructure ในโค้ด (ไม่มี seed script, ไม่มี `prisma.seed` config, ไม่มี admin/promo API) — ต้องสร้างใหม่ทั้งหมด

**3. MCC Mapping v1**
- มี mapping merchant → category ครอบคลุมร้านชื่อดังอย่างน้อย ~500 ร้าน
- ระบบ resolve ชื่อร้านที่ user พิมพ์ (fuzzy match) ไปเป็น category ได้ถูกต้อง ≥80% ของ query ทดสอบ
- มี fallback category "อื่นๆ" เมื่อ resolve ไม่ได้

**4. Merchant Search & Discovery**
- ค้นหาร้าน/หมวดจาก search bar แล้วได้ผลลัพธ์จริงจาก merchants table (ไม่ใช่ mock)
- แตะ category tile แล้ว trigger การค้นหาตาม category นั้น
- แสดง recent searches จริงจาก user history ไม่ใช่ hardcoded

**5. Best Card Recommendation (Rule-based)**
- ให้ merchant/category หนึ่งค่า ระบบคำนวณและจัดอันดับบัตรของ user ตาม net reward ได้
- ผลลัพธ์แสดงบัตรที่คุ้มสุด 1 ใบ พร้อม runner-up อย่างน้อย 2 ใบ พร้อมส่วนต่าง (บาท)
- Logic คำนึงถึง cap ที่ใช้ไปแล้วของบัตรนั้น (ไม่แนะนำบัตรที่ชนเพดานแล้ว)

**6. Promo Expiration Alert**
- ระบบสร้าง alert อัตโนมัติเมื่อโปรที่ user เกี่ยวข้องใกล้หมดอายุ (เช่น ≤3 วัน)
- แสดงบน Home ในโซน "ต้องรีบ" จากข้อมูลจริง ไม่ใช่ hardcoded
- Alert type ครอบคลุมอย่างน้อย 3 แบบ: expiring promo, cap reached, threshold to reward

### P1 — Core Loop

**7. Benefit & Threshold Tracker**
- แสดงยอดใช้จ่ายสะสมต่อบัตรเทียบกับ threshold ของ promo/สิทธิ์
- แจ้งเตือนเมื่อใกล้ถึงขั้นต่ำหรือใกล้ชนเพดาน
- ข้อมูล reset ตามรอบบิล/รอบเดือนที่ถูกต้อง

**8. Personalized Recommendation (ML-based)**
- ระบบแนะนำบัตรโดยพิจารณาพฤติกรรมใช้จ่ายจริงของ user ไม่ใช่ rule ตายตัว
- มี mechanism เก็บ feedback ว่า user กดใช้คำแนะนำหรือไม่ เพื่อปรับปรุงโมเดล
- Fallback กลับไปใช้ rule-based ได้เมื่อข้อมูล user ยังน้อยเกินไป

**9. User Verified Promo**
- User กดยืนยัน/แจ้งว่าโปรใช้ได้จริงหรือหมดแล้วได้
- แสดง trust indicator (เช่น "ยืนยันล่าสุดเมื่อ X วันก่อน โดย Y คน") บน promo card
- โปรที่ถูก report ว่าหมดอายุหลายครั้งถูกซ่อน/ตั้ง flag อัตโนมัติ

**10. Cashback & Spending Analytics**
- สรุปยอดประหยัด/cashback รายเดือนต่อ user แบบ dashboard
- Breakdown ตาม category และตามบัตร
- ข้อมูลอัปเดตตาม transaction ที่ user log ผ่านแอป (ไม่ต้องพึ่ง bank sync)

### P2 — Power Users

**11. MCC Mapping Full v2**
- ขยาย mapping จาก ~500 ร้าน เป็นครอบคลุม MCC มาตรฐานเต็มรูปแบบ
- รองรับร้านที่ไม่อยู่ใน whitelist เดิมด้วย MCC code lookup จริง
- Backward compatible กับ v1 (ไม่ breaking merchant ที่ map ไว้แล้ว)

**12. Miles & Points Aggregator**
- Track ไมล์/พอยต์สะสมของ user ข้ามหลาย program (เช่น JAL, AirAsia, T1)
- แจ้งเตือนก่อนไมล์/พอยต์หมดอายุ
- แสดง conversion rate ระหว่าง program ให้ user เทียบมูลค่าได้

**13. Split Bill Optimizer**
- Input ยอดบิลรวม → ระบบแนะนำวิธี split ให้ได้ cashback สูงสุดจากบัตรที่ user มี
- คำนึงถึง minimum spend ต่อรายการของแต่ละบัตร/โปร (ถ้ามี)
- แสดงผลต่างระหว่าง split ตามคำแนะนำ vs รูดใบเดียว

**14. Travel Card Advisor**
- Input ประเทศปลายทาง → แนะนำบัตรที่เหมาะสุด (FX fee ต่ำสุด/ไมล์คุ้มสุด)
- แสดงค่าธรรมเนียม FX ของแต่ละบัตรเทียบกัน
- ครอบคลุมอย่างน้อย 10 ประเทศยอดนิยมของกลุ่ม Travel Hacker

**15. Promo Stacking Simulator**
- จำลองการ stack โปรหลายชั้น (bank promo + merchant promo + point multiplier) แล้วคำนวณผลรวมได้
- แจ้งเงื่อนไขที่ stack ไม่ได้ (mutually exclusive) ให้ user รู้ก่อนใช้จริง
- ผลลัพธ์ accuracy ตรวจสอบกับเคสจริงอย่างน้อย 5 เคสจาก community data

**16. Health & Medical Card Tracker**
- List สิทธิ์บัตรที่เกี่ยวกับค่ารักษาพยาบาล/โรงพยาบาลที่ user มี
- แจ้งเตือนเมื่อใกล้ครบ/ใกล้หมดสิทธิ์ทางการแพทย์ (เช่น ผ่อน 0% รพ.)
- ครอบคลุมอย่างน้อยธนาคารที่มีสิทธิ์ทางการแพทย์เด่นชัด (AEON Wellness, KBank BDMS)

**17. Merchant Review**
- User เขียน/ให้คะแนนรีวิวร้านที่เกี่ยวกับการใช้บัตรได้
- แสดง average rating + จำนวนรีวิวบน merchant detail
- มีระบบป้องกัน spam/fake review เบื้องต้น (เช่น 1 user 1 review ต่อร้าน)

### P3 — AI Layer

**18. AI Ask Assistant**
- User พิมพ์ถามคำถามอิสระ (เช่น "จะไปเที่ยวญี่ปุ่นควรใช้บัตรไหน") แล้วได้คำตอบที่อ้างอิงข้อมูลจริงในระบบ
- คำตอบอ้างอิง source ได้ ไม่ hallucinate ข้อมูลโปรที่ไม่มีจริง
- Latency คำตอบอยู่ในระดับใช้งานได้จริงบน mobile (ไม่เกิน ~5 วินาที)

**19. Screenshot Promo Analyzer**
- User อัปโหลด/ถ่ายภาพโปรโมชั่น → ระบบ extract ข้อมูล (ธนาคาร, ส่วนลด, เงื่อนไข, วันหมดอายุ) อัตโนมัติ
- มี review step ให้ user ยืนยันก่อนบันทึกเข้า Promo DB จริง (กัน parse ผิด)
- Accuracy การ parse ข้อมูลหลักถูกต้อง ≥85% จากชุดทดสอบภาพโปรจริง

**20. AI Recommendation Feed**
- ระบบ push โปร/คำแนะนำที่ตรงกับ spending pattern ของ user โดยไม่ต้อง user ค้นหาเอง
- มี mechanism ให้ user กด "ไม่สนใจ" เพื่อลด noise ของ feed ถัดไป
- Feed อัปเดตความถี่ที่เหมาะสม ไม่ spam แจ้งเตือนถี่เกินไป

### P4 — Platform

**21. Statement OCR**
- User อัปโหลด statement (PDF/รูป) → ระบบ extract รายการ transaction อัตโนมัติ
- Map transaction แต่ละรายการเข้า category/merchant ที่ระบบรู้จักได้
- รองรับ statement format จากธนาคารหลักอย่างน้อย 3–5 แห่ง

**22. Bank Sync Integration**
- เชื่อมต่อกับธนาคารผ่าน API ที่ได้รับอนุญาต (Open Banking / consent-based) เพื่อดึง transaction อัตโนมัติ
- ผ่าน security/compliance review ตามข้อกำหนดธนาคารแห่งประเทศไทย
- User เพิกถอนสิทธิ์การเชื่อมต่อได้ตลอดเวลา (revoke consent)

---

## 🗓️ Roadmap Summary

| Phase | Features | SP | Timeline |
|-------|---------|:--:|----------|
| Phase 1: Foundation | #1–6 | 76 | 0–3 เดือน |
| Phase 2: Core Loop | #7–10 | 37 | 3–6 เดือน |
| Phase 3: Power Users | #11–17 | 99 | 6–9 เดือน |
| Phase 4: AI Layer | #18–20 | 68 | 9–12 เดือน |
| Phase 5: Platform | #21–22 | 76 | 12+ เดือน |
| **รวม** | **22 features** | **356** | **~18 เดือน** |

> Velocity แนะนำ: 2-week sprint, 20–25 SP/sprint

---

## 🧠 Prioritization Principles

1. **Dependency First** — Infrastructure ก่อน feature เสมอ แม้ user มองไม่เห็น
2. **Core Loop Before Power Features** — Casual user ต้องใช้ได้ก่อน แล้วค่อย serve power user
3. **Data Begets AI** — ทำ AI ตอน Phase 1 = waste SP เพราะ data ยังน้อย

---

## 💡 Key Insights จาก Community Data

- User ตื่นตีหนึ่งเพื่อกดโปร → **urgency สูงมาก, Notification timing สำคัญ**
- Stack โปรหลายชั้น → **Stacking Simulator คือ true differentiator**
- Community เป็น source of truth มากกว่า official → **User Verified Promo = trust engine**
- Health/Medical spending สูง (120k+ บาท) → **underserved segment จริง**
- ปัญหาหลักไม่ใช่ขาดข้อมูล แต่คือ **ข้อมูลเยอะเกินจนตัดสินใจไม่ได้**
