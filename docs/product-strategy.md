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

### 🟠 P1 — Core Loop (Phase 2: 3–6 เดือน) | 71 SP

| # | Feature | SP | เหตุผล |
|---|---------|:--:|--------|
| 25 | 🗄️ **Transaction Ledger** (infra) ⏫ | 13 | Root dependency ของ #7/#8/#10/#24 — ตาราง `transactions` + field reconcile (ยังไม่มีในระบบ) ต้องมาก่อน #24 |
| 24 | 💬 **Chat-based Quick Advisor** ⏭️ NEXT | 8 | ⭐ Priority ถัดไป — พิมพ์ในแชท LINE "Starbucks 200" → ตอบบัตรที่ควรรูดทันที (channel ③, ยืม zero-friction ป้านวล). Dep: #3, #5, #25 |
| 7 | 📅 **Benefit & Threshold Tracker** | 8 | ปิด pain point Cashback Optimizer — "ใช้ไปเท่าไหร่แล้ว เหลืออีกเท่าไหรถึงครบ?" |
| 8 | 🎯 **Personalized Recommendation** (ML-based) | 13 | Upgrade rule → intelligence — "บัตร A ครบแล้ว switch ไป B ดีกว่า" |
| 9 | ✅ **User Verified Promo** | 8 | Trust layer — community ยืนยันว่าโปรยังใช้ได้ไหม |
| 10 | 💰 **Cashback & Spending Analytics** | 8 | Insight loop — "เดือนนี้ประหยัดได้ X บาท" สร้าง emotional reward |
| 23 | 📋 **Card Profile & Benefits Summary** | 13 | Content layer — user เข้าใจบัตรตัวเองก่อนจะเชื่อคำแนะนำ และเป็น data foundation สำหรับ Feature #8 |

### 🟡 P2 — Power Users (Phase 3: 6–9 เดือน) | 107 SP

| # | Feature | SP | เหตุผล |
|---|---------|:--:|--------|
| 11 | 🗺️ **MCC Mapping Full v2** | 21 | Upgrade manual tag → full MCC database ทุก merchant |
| 12 | ✈️ **Miles & Points Aggregator** | 13 | Serve Travel Hacker — track ไมล์ทุก program + แจ้งก่อน expire |
| 13 | 🧾 **Split Bill Optimizer** | 21 | Maximize cashback ด้วยการ split bill ให้ถูก card |
| 14 | 🌍 **Travel Card Advisor** | 5 | Input: ประเทศ → แนะนำบัตรที่ดีสุด + FX fee |
| 15 | 🧮 **Promo Stacking Simulator** | 21 | Killer feature สำหรับ Hardcore — ต้องรอ Promo DB ครบ + MCC แม่นก่อน |
| 16 | 🏥 **Health & Medical Card Tracker** | 5 | Underserved segment — ค่า รพ. 120k+ SP น้อย ทำได้ระหว่าง Phase 3 |
| 17 | ⭐ **Merchant Review** | 13 | Community moat — ต้องรอมี user base ก่อน |
| 26 | 🔁 **Recurring Bill → Best Card** | 8 | ยืมจากป้านวล — advisory บนบิลประจำ + auto feed ยอดเข้า #7 (ไม่ต้องกรอกซ้ำทุกเดือน) |

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

**23. Card Profile & Benefits Summary**
- แตะบัตรใน Wallet แล้วเห็น Card Profile — จุดเด่น + สิทธิ์ประโยชน์ทั้งหมดของบัตรใบนั้น
- ข้อมูลแบ่งชัดเป็น 2 ประเภท: (ก) rate-based benefit (เช่น "cashback 5% ซูเปอร์, 2% ทั่วไป") และ (ข) perks เชิงคุณภาพ (เช่น "Airport lounge 2 ครั้ง/ปี", "Travel insurance สูงสุด 10M")
- แสดงโปรที่ active อยู่ตอนนี้ที่เกี่ยวกับบัตรนี้ควบคู่กัน (ดึงจาก promotions table)
- Admin portal มีหน้า/form สำหรับกรอก/แก้ไข benefit และ perks ต่อบัตร

> ⚠️ **Schema decision needed:** `card_base_benefit` ปัจจุบันรองรับแค่ rate-based (multiple_rate + condition) — ต้องตัดสินใจว่าจะ (ก) extend table เพิ่ม field `perk_title` / `perk_description` สำหรับ perks เชิงคุณภาพ หรือ (ข) สร้าง table `card_perks` แยกต่างหาก

**25. Transaction Ledger (infra)** *(⏫ ต้องมาก่อน #24)*
- ✅ มีตาราง `transactions` เก็บรายการใช้จ่ายต่อ user/บัตร (`users_card_id`, `merchant_id`, `amount`, `spent_at`, `note`)
- ✅ มี field reconcile เบื้องต้น: `is_reconciled` · `reconciled_at` · `external_ref` (apply เข้า DB จริงแล้ว)
- ✅ มี write path จาก LIFF (`POST /api/transactions`) และ LINE chat (webhook)
- ⬜ คำนวณยอดสะสมต่อบัตร/หมวด/รอบบิล เพื่อป้อน #7/#8/#10
- ⬜ Supabase RLS: user เห็นเฉพาะ transaction ของตัวเอง

> ℹ️ engine matching / grace window / supersede logic **ยังไม่ทำในเฟสนี้** — เลื่อนไปคู่กับ #21 (P4) ตาม Transaction Capture Strategy
> ⚠️ **schema ปัจจุบันยังไม่รองรับกลไกเต็มรูปแบบ** — ดูหัวข้อ 6 ของ Transaction Capture Strategy ว่าขาดอะไรและต้องเพิ่มตอนไหน

**24. Chat-based Quick Advisor** *(⏭️ NEXT UP)*
- user พิมพ์ข้อความในแชท LINE (เช่น "Starbucks 200" หรือ "จะรูดโลตัส") แล้วระบบตอบบัตรที่ควรรูด + เหตุผล (net reward) ได้ถูกต้อง โดยเรียกใช้ logic เดียวกับ #5 (ไม่เขียน logic แนะนำใหม่)
- parse ข้อความเป็น (merchant/category + จำนวนเงิน ถ้ามี) ได้แม่นยำพอใช้งานจริง และถาม fallback เมื่อ resolve ร้านไม่ได้
- หลังตอบ ให้ user กดยืนยัน "รูดด้วยบัตรนี้" เพื่อบันทึกเป็น transaction (`source = chat`, `status = estimated`) → ป้อน Job B ตาม Transaction Capture Strategy
- ทำงานผ่าน LINE Messaging API webhook + deep link เข้า LIFF ได้เมื่อ user ต้องการรายละเอียดเพิ่ม

> ⚠️ **Dependency:** ต้อง #3 (MCC Mapping) + #5 (Best Card Recommendation) พร้อมก่อน — ถ้ายังไม่เสร็จ chat จะไม่มี logic ให้เรียก

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

**26. Recurring Bill → Best Card**
- user ตั้งบิล/subscription ประจำได้ (ชื่อ, ยอด, รอบ, หมวด) เช่น Netflix, ค่าไฟ, ประกัน
- ระบบแนะนำบัตรที่คุ้มสุดสำหรับบิลนั้น (เรียก logic #5) + เตือนก่อนถึงรอบ
- ทุกครั้งที่ถึงรอบ auto สร้าง transaction (`source = recurring`, `status = estimated`) → ป้อนยอดสะสมเข้า #7 โดยไม่ต้องกรอกซ้ำทุกเดือน
- user แก้ไข/ยกเลิก recurring ได้

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
| Phase 2: Core Loop | #25, #24, #7–10, #23 | 71 | 3–6 เดือน |
| Phase 3: Power Users | #11–17, #26 | 107 | 6–9 เดือน |
| Phase 4: AI Layer | #18–20 | 68 | 9–12 เดือน |
| Phase 5: Platform | #21–22 | 76 | 12+ เดือน |
| **รวม** | **26 features** | **398** | **~18 เดือน** |

> Velocity แนะนำ: 2-week sprint, 20–25 SP/sprint

---

## 💰 Monetization — Free vs Premium

> 📈 **Market validation:** ป้านวล (Pro / Pro Max) + เหมียวจด (subscription) พิสูจน์แล้วว่า **คนไทยยอมจ่าย subscription ให้ finance tool** — เราไม่ต้องพิสูจน์ demand ใหม่
> 🎯 **หลักการ gate ของ Cardly:** gate ที่ **"advisory moat" ไม่ใช่ "bookkeeping"** — ตรงข้ามคู่แข่งที่ gate เรื่องจด/รายงาน/OCR เพราะสิ่งที่คู่แข่งลอกเราไม่ได้คือ **"การคิดแทน"**

### Model
- **รายเดือน + รายปี** (ไม่มี one-time)
- **Launch timing**: หลัง Phase 3+ เมื่อ AI feature พร้อม (value prop แข็งพอ)
- **Early access**: อาจเปิด beta subscription ตั้งแต่ Phase 2 ในราคาถูก/ฟรี เพื่อ validate willingness to pay

### Feature Gating

| Feature | Free | Premium |
|---------|------|---------|
| My Cards Wallet | **จำกัด 3 ใบ** | ไม่จำกัด |
| Card Nickname | ชื่อย่ออัตโนมัติ | ตั้งเองได้ |
| Promo Database | ✅ เต็ม | ✅ เต็ม |
| Merchant Search | ✅ | ✅ |
| Best Card Rec (Rule-based) | ✅ อันดับ 1 | full ranking + เหตุผล |
| **Chat Quick Advisor (#24)** | ✅ พื้นฐาน | full ranking + เหตุผลในแชท |
| **Threshold Tracker** | ❌ | ✅ |
| Personalized Rec (ML/AI) | ❌ | ✅ |
| Spending Analytics | รายเดือนรวม | breakdown + history + export |
| User Verified Promo | ✅ | ✅ |
| Merchant Review | ✅ | ✅ |
| Card Profile & Benefits | ✅ | ✅ |
| Promo Expiration Alert | basic | advanced + threshold alert |
| **Recurring Bill → Best Card (#26)** | ❌ | ✅ |
| Split Bill Optimizer | ❌ | ✅ |
| Promo Stacking Simulator | ❌ | ✅ |
| Miles & Points Aggregator | ❌ | ✅ |
| Travel Card Advisor | 1 ประเทศ | ไม่จำกัด |
| AI Ask Assistant | ❌ | ✅ |
| Screenshot Promo Analyzer | ❌ | ✅ |
| Statement OCR | ❌ | ✅ |
| AI Recommendation Feed | ❌ | ✅ |
| Export CSV | ❌ | ✅ |
| Early access features | ❌ | ✅ |

### Conversion Hooks (เรียงตามพลัง)

1. **Card limit 3 ใบ** — Hardcore Gamer ชนทันที ไม่ต้องโน้มน้าว
2. **Threshold Tracker** — free user เห็นว่าตัวเองพลาด cashback เพราะไม่รู้ยอด → FOMO สูง
3. **Split Bill + Stacking Simulator** — จ่ายเพื่อ save เงินจริง ROI ชัดเจน

### ⚠️ ข้อตัดสินใจค้าง: 2-tier หรือ 3-tier?

ตาราง gating ด้านบนเป็น **2-tier (Free / Premium)** — แต่คู่แข่งที่ validate ตลาดแล้ว (ป้านวล) ใช้ **3-tier** ซึ่งเปิดช่องเก็บเงินกลุ่ม power user ได้สูงกว่า

| | 2-tier (ปัจจุบัน) | 3-tier (ทางเลือก) |
|---|---|---|
| โครงสร้าง | Free / Premium | Free / **Pro** / **Pro Max** |
| Pro จะได้ | — | บัตรไม่จำกัด · #8 Personalized · #7/#12 tracker · analytics + export |
| Pro Max จะได้ | — | #15 Stacking · #13 Split Bill · #18/#20 AI · multi-wallet/family |
| ข้อดี | เข้าใจง่าย ตัดสินใจเร็ว ลด decision fatigue | เก็บ ARPU จาก Hardcore/Travel Hacker ได้สูงกว่า |
| ข้อเสีย | ทิ้งเงินบนโต๊ะจากกลุ่มที่ยอมจ่ายแพง | ซับซ้อน อธิบายยาก เสี่ยง user เลือกไม่ถูก |

> 📌 **ยังไม่ล็อก** — รอ (ก) validate ราคาป้านวลจริง (ปัจจุบันเว็บบล็อก bot ดึง pricing ไม่ได้) และ (ข) สำรวจ willingness-to-pay จาก beta cohort ก่อนตัดสิน
> **ตัวเลขราคา** ทุก tier ยังไม่กำหนดเช่นกัน

### Nickname เมื่อ Subscription หมด
- ข้อมูล nickname ไม่ถูกลบ
- ยังแสดงชื่อ nickname ใน LINE chat ตามปกติ
- แต่ **lock การแก้ไข** จนกว่าจะต่ออายุ

---

## 📊 Threshold Tracker — คืออะไร

บัตรเครดิตมี condition ซ่อนอยู่ใน benefit เช่น:
> "cashback 5% ซูเปอร์ สูงสุด ฿300/เดือน" — พอใช้ไป ฿6,000 แล้วรูดต่อ = ได้ ฿0 เพิ่ม

**ปัญหา:** user ไม่รู้ว่าชน cap แล้ว หรือใกล้ถึง threshold ที่จะ unlock double points

**Tracker แสดง:**
```
KBank Sig — cashback ซูเปอร์
████████░░  ฿240 / ฿300 (cap)  → ควร switch ไป SCB หลังใช้อีก ฿60
```

**ทำไมสำคัญ:** นี่คือ data ที่ทำให้ AI recommendation ฉลาดขึ้น — รู้ว่าบัตรไหน "เต็ม" แล้ว ณ ขณะนั้น ไม่ใช่แค่ rule ตายตัวว่าบัตรไหนให้ % สูงสุด

---

## 🧠 Prioritization Principles

1. **Dependency First** — Infrastructure ก่อน feature เสมอ แม้ user มองไม่เห็น
2. **Core Loop Before Power Features** — Casual user ต้องใช้ได้ก่อน แล้วค่อย serve power user
3. **Data Begets AI** — ทำ AI ตอน Phase 1 = waste SP เพราะ data ยังน้อย

---

## 🥊 Competitive Analysis — เหมียวจด vs MAKE vs ป้านวล vs Cardly

> อัปเดต: 9 สิงหาคม 2026 — เพิ่ม **MAKE by KBank** เข้าการวิเคราะห์ (เดิม 24 ก.ค. 2026 มี 2 เจ้า)

### คู่แข่งคือใคร

| | **เหมียวจด (MeowJot)** | **MAKE by KBank** | **ป้านวล (Parnuan)** | **Cardly (เรา)** |
|---|---|---|---|---|
| **เจ้าของ** | KBTG (กสิกร) | **KBTG (กสิกร)** | Startup อิสระ | — |
| **แพลตฟอร์ม** | Native app (iOS/Android) | Native app (iOS/Android) | LINE chatbot (ไม่ต้องโหลดแอป) | LINE LIFF (ไม่ต้องโหลดแอป) |
| **Core job** | จดรายจ่าย **อัตโนมัติจากสลิป/บิล** | **จัดระเบียบเงินในบัญชี** (แบ่งกระเป๋า + สรุปให้อัตโนมัติ) | จดรายจ่าย **ด้วยการพิมพ์ในแชท** | **แนะนำบัตรที่คุ้มสุดก่อนรูด** |
| **ทิศเวลา** | 🔙 Backward — "จ่ายอะไรไปแล้ว" | 🔄 Present — "ตอนนี้เงินอยู่ไหน / เหลือเท่าไหร่" | 🔙 Backward — "จ่ายอะไรไปแล้ว" | 🔜 Forward — "ควรจ่ายด้วยบัตรไหน" |
| **Input** | อัปโหลด/แชร์สลิป (16 แอปธนาคาร), PDF บิลบัตร (7 ผู้ให้บริการ) | **อัตโนมัติ 100%** — ตัวมันเองเป็นบัญชีเงินฝาก | พิมพ์ข้อความ เช่น "กาแฟ 50" | เลือกร้าน/หมวด → ระบบคิด net reward |
| **บัตรเครดิต** | เก็บ**ยอด/ค่างวด/ดอกเบี้ย** จากบิล (bookkeeping) | ❌ ไม่มี (เป็นบัญชีออมทรัพย์ล้วน) | ไม่มี | **catalog + สิทธิ์ + คำนวณคุ้มสุด** (advisory) |
| **โปรโมชัน** | ❌ ไม่มี | ❌ ไม่มี | ❌ ไม่มี | ✅ Core (Promo DB, alert, stacking) |
| **Business model** | Freemium + Subscription | ฟรี (รายได้จาก float — ให้ดอกเบี้ย 1.5% ดึงเงินฝาก) | ฟรี | TBD |
| **Scale** | KBTG backing, distribution แข็ง | **2 ล้าน users ใน 2 ปี** (เป้า 5 ล้าน) | ผู้ใช้ 300k+, 10M+ รายการ | Pre-launch |

### 🎯 Positioning — Cardly อยู่ตรงไหน

สองแกนที่แยกตลาด:

```
                  ADVISORY (คิดแทน / ตัดสินใจ)
                          ▲
                          │
                    ● Cardly
                          │
                          │            ● MAKE (จัดระเบียบ + ตั้งเป้า)
   MANUAL ────────────────┼──────────────── AUTOMATED
   (พิมพ์เอง)              │              (อ่านสลิป/บิลเอง)
                          │
        ● ป้านวล          │          ● เหมียวจด
                          │
                          ▼
                  BOOKKEEPING (บันทึกย้อนหลัง)
```

> **MAKE อยู่สูงกว่าอีก 2 เจ้าเล็กน้อย** เพราะ Cloud Pocket มีมิติ "ตั้งเป้า/วางแผน" (forward) ไม่ใช่แค่จดย้อนหลัง — แต่ยังไม่ถึงควอดรันต์ Advisory เพราะ **ไม่ได้ตัดสินใจแทน user** ว่าควรจ่ายด้วยอะไร ช่องที่ Cardly ยึดยังว่างอยู่

- คู่แข่งทั้งคู่แข่งกันในควอดรันต์ **Bookkeeping** (จดว่าจ่ายอะไรไปแล้ว) — ต่างกันแค่ manual (ป้านวล) vs automated (เหมียวจด)
- **Cardly เล่นคนละเกม:** ควอดรันต์ **Advisory** — ช่วย "ตัดสินใจก่อนจ่าย" ไม่ใช่ "บันทึกหลังจ่าย" ตรงกับ Vision "Google Maps สำหรับการใช้บัตร" (line 10)

### 🕳️ ช่องว่างตลาด (White Space) ที่ Cardly ยึดได้

1. **ไม่มีใครทำ "บัตรไหนคุ้มสุด"** — ทั้ง 2 เจ้าเป็น expense tracker ล้วน ไม่มี net-reward optimization → นี่คือ Core value ของ Cardly (Feature #5, #8, #13, #15) และเป็น moat ที่ลอกยาก
2. **ไม่มีใครทำ Promo intelligence** — ทั้ง 2 เจ้าไม่แตะโปรโมชันเลย → ตรงกับ pain point ของ community "ล่าโปรบัตรเครดิต" ที่เป็นต้นทางของโปรเจกต์ (line 3)
3. **ป้านวลพิสูจน์แล้วว่า LINE-native ตลาดรับ** (300k+ users ไม่ต้องโหลดแอป) → validate การเดิมพันเลือก LIFF ของเรา ลด adoption friction เทียบเหมียวจดที่ต้องโหลด app
4. **Health/Medical + Travel/Miles ยังว่าง** — ไม่มีเจ้าไหน serve segment 3 (Travel Hacker) หรือ 6 (Health Payer) → Cardly Feature #12, #14, #16 ยึดพื้นที่นี้ได้

### ⚠️ ภัยคุกคาม (ต้องระวัง)

- 🔴 **KBTG ถือไพ่ 2 ใบในสนามนี้ (เหมียวจด + MAKE)** — เดิมประเมินว่าคู่แข่งที่มีธนาคารหนุนมีเจ้าเดียว แต่ MAKE (2M users) + เหมียวจด อยู่บ้านเดียวกัน ถ้า KBTG **รวมสองตัวเข้าด้วยกันแล้วเติม card advisory** จะได้ครบชุดทันที: distribution + transaction data จริง + ความน่าเชื่อถือ → นี่คือภัยคุกคามอันดับ 1 ของ Cardly ตอนนี้
  - **บรรเทาได้ตรงไหน:** MAKE เป็น **บัญชีเงินฝาก** ไม่ใช่บัตรเครดิต และ KBank มี conflict of interest ชัด — ยากที่จะแนะนำ "บัตร UOB คุ้มกว่าบัตร KBank" ได้อย่างเป็นกลาง → **ความเป็นกลางข้ามธนาคาร (bank-agnostic) คือ moat ที่ธนาคารลอกไม่ได้** ควรทำให้เป็นจุดยืนหลักของแบรนด์
- **เหมียวจดมี KBTG หนุนหลัง** — distribution + ความน่าเชื่อถือด้านการเงินสูงกว่ามาก ถ้าเขา "ขยับขึ้น Advisory" (เพิ่มแนะนำบัตร) จะกินตลาดเราตรงๆ → เราต้องวิ่งให้ถึง Advisory moat ก่อน และลึกกว่า (stacking, community-verified)
- **ป้านวลมี habit loop ที่แข็ง** — user จดทุกวันผ่านแชท → ถ้าเราอยากได้ transaction data (จำเป็นสำหรับ #7, #8, #10) ต้องสร้าง input ที่ "ง่ายเท่าพิมพ์ในแชท" ไม่งั้นแพ้เรื่อง data capture
- **MAKE ตั้งมาตรฐาน UX ไว้สูง** — user ไทย 2 ล้านคนชินกับ "เงินเป็นกระเป๋าที่มองเห็นได้" และ "ประวัติเป็นแชท" แล้ว ถ้า Cardly แสดง threshold เป็นตารางตัวเลขเปล่าๆ จะรู้สึกล้าสมัยทันที

---

## 💡 Feature Inspiration จากคู่แข่ง → แมปเข้า Roadmap

> หลักการ: **ลอก mechanic ที่ดี แต่เอามารับใช้ Advisory job ของเรา** ไม่ใช่กลายเป็น expense tracker อีกตัว

| # | แรงบันดาลใจจาก | Mechanic | แมปเข้า Feature | Phase | หมายเหตุ / ปรับใช้ |
|---|---|---|---|:--:|---|
| A | 🐱 เหมียวจด | อ่านสลิปโอน → transaction อัตโนมัติ | **#21 Statement OCR** (มีอยู่แล้ว) | **P4** | ตรงกับที่วางไว้ — แต่ใช้เพื่อ feed #7/#10 (data สำหรับ threshold + analytics) ไม่ใช่แค่ bookkeeping |
| B | 🐱 เหมียวจด | อัปโหลด PDF บิลบัตร → ดึงยอด/ค่างวด | **#7 Benefit & Threshold Tracker** (มีอยู่แล้ว) | **P1** | บิลบัตรคือ input ที่แม่นสุดสำหรับ "ใช้ไปเท่าไหร่ เทียบ threshold" — พิจารณาดึง PDF-import เข้ามาเสริม #7 ให้ auto |
| C | 🐱 เหมียวจด | ถ่าย/อัปโหลดรูป → parse ข้อมูล | **#19 Screenshot Promo Analyzer** (มีอยู่แล้ว) | **P3** | เหมียวจด parse สลิป, เรา parse **รูปโปร** → เป็น input engine ของ Promo DB |
| D | 💬 ป้านวล | พิมพ์ในแชท LINE → บันทึกทันที (zero-friction) | **#24 Chat-based Quick Advisor** ✅ รับเข้าแล้ว | **P1** | ⏭️ Priority ถัดไป — advisory ผ่านแชท (ไม่ใช่แค่ log) เก็บ intent เป็น channel ③ (ดูรายละเอียดด้านล่าง) |
| E | 💬 ป้านวล | ตั้งงบต่อหมวด + เตือน real-time | **#10 Cashback & Spending Analytics** (มีอยู่แล้ว) | **P2** | เสริมมุม "งบ/เตือน" เข้า analytics ที่วางไว้ |
| F | 🐱 เหมียวจด | Freemium + Subscription | **Business model** (ยังไม่ระบุใน backlog) | — | ยืนยันว่าตลาดยอมจ่าย subscription สำหรับ finance tool → เก็บไว้พิจารณา monetization |
| G | 💚 MAKE | **Cloud Pocket** — 1 บัญชีแบ่งเป็นหลายกระเป๋า แต่ละกระเป๋ามีเป้าหมาย + progress | **#7 Benefit & Threshold Tracker** | **P1** | 💎 **คุ้มที่สุดที่ควรหยิบ** — ยืม *metaphor* ไม่ใช่กลไก: 1 pocket = 1 threshold/cap ของบัตร (เช่น "Yolo · ใช้ครบ 100k/ปี → ฟรีค่าธรรมเนียม ▓▓▓▓░░ 62%") เปลี่ยนตัวเลขนามธรรมให้เป็นภาชนะที่เห็นได้ ⚠️ เราไม่มีบัญชีเงินฝาก — **ห้ามลอกกลไกย้ายเงินจริง** ลอกได้แค่การมองเห็น |
| H | 💚 MAKE | **Chat Banking** — แสดงประวัติธุรกรรมเป็น thread แชท ไม่ใช่ตาราง | **#24 Chat-based Quick Advisor** (ขยาย scope) | **P1** | เดิม #24 วางแชทไว้เป็น *input* อย่างเดียว — MAKE พิสูจน์ว่าแชทใช้เป็น *output/history* ก็ดี → thread เดียวเป็นทั้งคำแนะนำและ ledger และรองรับ **"Single Evolving Row"** ได้สวยมาก (แถวเดิมอัปเดตตัวเองในแชทเมื่อ statement เข้า) เราอยู่บน LINE อยู่แล้ว = native กว่า MAKE ด้วยซ้ำ |
| I | 💚 MAKE | **Expense Summary** — สรุปอัตโนมัติเหลือแค่ **6 หมวด** | **#10 Analytics** + **#3 MCC Mapping** | **P1–P2** | บทเรียนคือ **"หมวดต้องน้อย"** — MCC v1 map ~500 ร้านได้ตามแผน แต่ตอน *แสดงผล* ต้องยุบเหลือ 6–8 หมวด ไม่งั้น user อ่านไม่ไหว (แยก resolution layer ออกจาก display layer) |
| J | 💚 MAKE | **Shared Cloud Pocket** — ชวนเพื่อนมาร่วมกระเป๋าเดียวกัน | **#13 Split Bill Optimizer** | **P2** | ได้ 2 เด้ง: แก้ pain "หารบิล" + เป็น **growth loop** (ชวนเพื่อนเข้าระบบ) — บน LINE ทำง่ายกว่า native app เพราะแชร์เข้ากลุ่มได้เลย |
| K | 💚 MAKE | **Pop Pay** — ใช้ context ที่เครื่องรู้อยู่แล้ว (BLE) แทนการให้ user กรอก | **#5 Best Card Recommendation** | **P1** | ❌ BLE ทำใน LIFF ไม่ได้ — แต่ยืม *หลักการ* ได้: LIFF ขอ **geolocation** ได้ → "อยู่ใกล้ Big C — รูด X คุ้มสุด" ลด input จาก 2 ขั้น (พิมพ์ร้าน + ยอด) เหลือ 1 |
| L | 💚 MAKE | ดอกเบี้ย 1.5% เป็น hook ดึงเงินเข้าแอป | **#10 Analytics** (มุม emotional reward) | **P2** | เราไม่มี balance sheet ให้ปันดอกเบี้ย → hook ของเราต้องเป็น **ตัวเลขที่ประหยัดได้** ("เดือนนี้ประหยัด 1,240 บ.") ทำหน้าที่แทนดอกเบี้ยในเชิงจิตวิทยา ต้องเด่นระดับ hero ของหน้า ไม่ใช่ซ่อนใน analytics |

### 🎯 3 อย่างที่ควรหยิบจาก MAKE จริงๆ (เรียงตาม ROI)

1. **Pocket metaphor → หน้า Threshold Tracker (#7)** — impact สูงสุด ต้นทุนต่ำสุด เป็นแค่ **presentation layer** บน data ที่ #7 ต้องมีอยู่แล้ว ไม่ต้องแก้ schema ไม่ต้องเพิ่ม dependency แค่เปลี่ยนจาก "ตารางตัวเลข" เป็น "การ์ดกระเป๋ามี progress" ทั้ง segment 2 (Cashback Optimizer) และ 5 (Credit Lifestyle) ได้ประโยชน์ตรงๆ
2. **Chat เป็น history ไม่ใช่แค่ input (#24)** — ปรับ scope ตอนนี้ยังฟรี เพราะ #24 ยังไม่เริ่ม ถ้าปล่อยให้ build เป็น input-only ไปก่อนแล้วค่อยมาเติม history ทีหลังจะแพงกว่า
3. **จำกัดหมวดที่แสดงผลเหลือ 6–8 (#3/#10)** — เป็น **ข้อจำกัดที่ต้องตัดสินใจตอนออกแบบ #3** ไม่ใช่ตอนทำ #10 ถ้า MCC mapping ไม่ได้ออกแบบให้ roll-up เป็นหมวดใหญ่ตั้งแต่แรก จะย้อนมาทำทีหลังลำบาก

> **สิ่งที่ไม่ควรลอก:** Cloud Pocket แบบย้ายเงินจริง (เราไม่ใช่ธนาคาร ไม่มีบัญชี), Pop Pay/BLE (LIFF ทำไม่ได้), และ **ที่สำคัญที่สุด — อย่าเผลอกลายเป็น money manager** MAKE ชนะเพราะทำเรื่องเดียวคือ "จัดระเบียบเงิน" ให้ลึก บทเรียนคือ *ความคมของ job เดียว* ไม่ใช่รายการฟีเจอร์ของมัน

### 💬 Feature #24 — Chat-based Quick Advisor ✅ รับเข้า Backlog แล้ว (⏭️ NEXT UP)

**Feature #24: Chat-based Quick Advisor** — *P1 (Phase 2), 8 SP*
> "ก่อนจ่ายพิมพ์ถามป้า(บัตร)ได้เลย" — user พิมพ์ในแชท LINE เช่น *"Starbucks 200"* หรือ *"จะรูดโลตัส"* → ระบบตอบ **บัตรที่ควรรูด + เหตุผล (net reward)** ทันที

- **Dependency:** ต้องมี #5 (Best Card Recommendation) + #3 (MCC Mapping) เป็น logic แกนก่อน — chat เป็น input layer ใหม่ที่ครอบ logic เดิม (ไม่ได้เขียน logic แนะนำใหม่)
- **ทำไมสำคัญ:** ชนป้านวลตรงจุดแข็งที่สุด (zero-friction chat) แต่ให้ **คำแนะนำ (advisory)** แทนการจด (bookkeeping) → differentiator ชัด + เก็บ intent data (Job B / channel ③) มาปรับ #8
- **ได้เปรียบเชิงเทคนิค:** อยู่บน LINE ecosystem อยู่แล้ว — LINE Messaging API + rich menu → deep link เข้า LIFF ได้ทันที ไม่ต้องสร้างช่องทางใหม่
- **สถานะ:** ✅ PO รับเข้า backlog แล้ว จัดเป็น **priority ถัดไป** — เป็น first pickup ของ Phase 2 หลัง P0 foundation (#3, #5) พร้อม

### 📌 สรุปเชิงกลยุทธ์ (Takeaways)

1. **อย่าไล่ตามเป็น expense tracker** — สนามนั้นมีเจ้าตลาดหนุนหลังธนาคารแล้ว เราชนะด้วย **Advisory ("คิดแทน")** ไม่ใช่ **Bookkeeping ("จดให้")**
2. **เร่ง Advisory moat ให้ลึก** — #5 → #13/#15 (stacking) คือสิ่งที่คู่แข่งลอกยากสุด ทำก่อนเหมียวจดขยับ
3. **ยืม zero-friction chat ของป้านวล มาเป็น input ให้ Advisory** (Feature #24) — ได้ทั้ง adoption และ data
4. **OCR/สลิป (เหมียวจดถนัด) จัดไว้ท้าย roadmap ถูกแล้ว** — เป็น convenience layer ไม่ใช่ core value เรา ไม่ต้องรีบชน
5. **ชู "ความเป็นกลางข้ามธนาคาร" เป็นจุดยืนแบรนด์** — KBTG มี 2 ผลิตภัณฑ์ในสนามนี้แล้ว แต่แอปของธนาคารแนะนำบัตรคู่แข่งไม่ได้ · Cardly แนะนำได้ทุกธนาคารอย่างเป็นกลาง = จุดที่เจ้าใหญ่ลอกไม่ได้เชิงโครงสร้าง ไม่ใช่แค่ยังไม่ทำ
6. **ยืม UX ของ MAKE (pocket + chat history) แต่ไม่ยืม job ของมัน** — เอา *ภาษาภาพ* ที่ user ไทย 2 ล้านคนคุ้นอยู่แล้วมาห่อ advisory ของเรา ลดต้นทุนการสอน user ใหม่

---

## 🔌 Transaction Capture & Reconciliation Strategy

> สรุปการตัดสินใจ (24 ก.ค. 2026): Cardly ได้ข้อมูลรายจ่ายบัตรเครดิตเข้าระบบยังไง และจัดการยังไงเมื่อข้อมูลจากหลายแหล่งชนกัน
> **บริบทสำคัญ:** การรูดบัตรเครดิต **ไม่เหลือ gallery slip** ให้อ่านแบบเหมียวจด (ต่างจากการโอน PromptPay) และ Cardly เป็น **LIFF (web)** จึงอ่าน push notification / SMS / email ของแอปอื่นไม่ได้ → ต้องออกแบบ capture เอง

### 1. สอง data jobs (คนละความต้องการ ห้ามยำรวมกัน)

| | **Job A — ครบ + แม่น** | **Job B — ทันเวลา** |
|---|---|---|
| Feature | สะสมไมล์ (#12), waive ค่าธรรมเนียมรายปี, ยอดที่ต้องจ่ายจริง | แนะนำบัตรตอนจะรูด (#5/#24), "อีก X ถึงครบโปร" (#7) |
| Horizon | ทั้งปี / ทั้งรอบบิล | ณ วินาทีที่จะจ่าย |
| ต้องการ | ครบถ้วน + แม่นยำ (ช้าได้) | เรียลไทม์ (ยอดคลาดนิดหน่อยรับได้) |
| Primary source | **Statement (บิลรายเดือน)** | **intent-capture ณ จังหวะ advisory + manual** |

> หลัก: **ไม่มี channel เดียวที่ทั้งครบและทันเวลา** → กำหนด primary channel **ต่อ job** ไม่ใช่หา pipeline เดียวรวบทุก feature

### 2. ช่องทาง capture (5 ทาง) + รับใช้ job ไหน

| ช่องทาง | รับใช้ | หมายเหตุ |
|---|:--:|---|
| ① กรอกผ่าน chat (LINE) | B | zero-friction แบบป้านวล |
| ② เมนู form ใน LIFF | B | กรอกแบบมีโครงสร้าง |
| ③ search ร้าน → แนะนำบัตร → กรอกเลย | B | 💎 **ตัวเด็ด** — capture ณ จังหวะ advisory ไม่มี friction เพิ่ม |
| ④ อ่าน Statement รายเดือน | A | 🏆 authoritative source ของ Job A (granularity รายเดือน = พอสำหรับเป้าทั้งปี) |
| ⑤ ถ่ายรูปสลิป/ใบเสร็จกระดาษ | A | friction สูง เสริมระหว่างรอ statement |

> ❌ ตัดทิ้งสำหรับ LIFF: อ่าน push / SMS / email receipt ของแอปอื่น — web ทำไม่ได้ (ต้อง native + OS permission)

### 3. Dedup = "Single Evolving Row"

ปัญหา: user กรอก manual บางรายการ (เช่น 2–3) แล้ว upload statement (20) → เกิดรายการซ้ำ
วิธีแก้: **ไม่สร้าง 2 แถวแล้วค่อยลบซ้ำ — ให้ manual entry "เลื่อนสถานะ" กลายเป็น statement เลย** → โครงสร้าง double-count ไม่ได้เพราะมีแค่แถวเดียว

- manual entry เกิดเป็น `status = estimated`
- ตอน import statement: วนเทียบ **เฉพาะ** รายการ `estimated` (ไม่กี่รายการ) กับ statement line ด้วย key → **บัตรเดียวกัน + ยอดตรง + txn date ห่าง ≤3 วัน** (tie-break: merchant fuzzy)
  - **match** → เลื่อนแถวเป็น `confirmed`, ทับ amount/date ด้วยยอดจริงจาก bank, **เก็บ enrichment เดิม** (merchant / category / โปรที่ตั้งใจใช้)
  - **ไม่ match** → insert แถวใหม่ `confirmed` (รายการที่เหลือ) แล้ว auto-enrich ผ่าน MCC
- upload statement เดิมซ้ำ → กันด้วย `dedup_hash` (card + posting_date + amount + descriptor) unique → ข้ามรายการที่มีอยู่แล้ว

### 4. Statement ชนะเสมอ + supersede (ขีดฆ่า ไม่ลบ)

เมื่อ statement import ครบรอบ = **ground truth ของรอบนั้น**
รายการ manual ที่ไม่ match ใครเลย → ตั้ง `status = superseded` (ไม่ `DELETE`)

- **ทำไมไม่ลบ:** เก็บ audit trail + user กู้คืนได้ถ้า reconcile ผิด + ไม่ทำลาย reference โปร
- **การนับยอด:** query `WHERE status != 'superseded'` → แถวที่ขีดฆ่าเหมือนไม่มีตัวตนในการคำนวณ แต่ยังอยู่ใน DB
- **fuzzy amount** (±5% หรือ ±20 บาท) ใช้ **เฉพาะช่วยหา candidate** เท่านั้น — ถ้า ambiguous ค่อยถาม user

### 5. เคส pending ข้ามรอบ (grace window)

รอบบิลตัดตาม **posting date** ไม่ใช่ txn date → รายการรูด 30 ม.ค. อาจ post 2 ก.พ. → ไปโผล่ statement เดือน **ก.พ.** → กฎดิบ "statement ม.ค. ครบ → manual ที่ไม่ match = supersede" จะ **ขีดฆ่ารายการที่ถูกต้องทิ้ง**

แก้ 3 ชั้น:
1. **match ด้วย txn date ข้ามรอบได้** — statement ไทยแสดง txn date ด้วย → statement ก.พ. จะ claim manual entry 30 ม.ค. เอง (อย่าล็อค matching ไว้ในรอบเดียว)
2. **settlement grace window** — รายการที่ txn date อยู่โซนขอบรอบ (≈5 วันก่อนตัด + 3 วันหลัง) → mark `pending_carryover`, **ห้าม supersede**, ยกไปรอ match กับ statement รอบถัดไป
3. **supersede จริงต่อเมื่อ** — (ก) อยู่ลึกในรอบที่ import ครบ + ไม่ match (= mis-entry/refund จริง) หรือ (ข) ขอบรอบแต่รอครบอีก 1 รอบถัดไปแล้วยังไม่ match

> user ไม่เคยอัป statement รอบถัดไปเลย → รายการค้างเป็น `estimated` ตลอด = ยอมรับได้ (เป็นแค่ยอดประมาณการ ไม่ทำใครพัง)

### 6. Scoping — schema ปัจจุบัน vs ที่กลไกเต็มรูปแบบต้องใช้

**สถานะจริงตอนนี้ (อยู่ใน DB แล้ว):**
```
transactions: users_card_id, merchant_id, amount, spent_at, note,
              is_reconciled, reconciled_at, external_ref
```
พอสำหรับเฟสนี้ — บันทึกรายการจาก chat/LIFF และ mark ว่ากระทบยอดกับ statement แล้วหรือยัง

**สิ่งที่ต้องเพิ่มตอนทำ engine (P4 คู่กับ #21):**

| ต้องการ | field ที่ยังไม่มี | ทำไมจำเป็น |
|---|---|---|
| แยกช่องทางที่ข้อมูลเข้ามา (channel ①–⑤) | `source` | รู้ว่ารายการมาจาก chat / form / statement / recurring — ใช้แยก Job A vs Job B |
| **supersede** (ขีดฆ่า ไม่ลบ) | `status` 3 สถานะ | `is_reconciled` เป็น boolean → บอกได้แค่ "กระทบยอดแล้ว/ยัง" แต่บอก "ยกเลิกเพราะ statement ไม่มีรายการนี้" ไม่ได้ |
| เก็บยอดเดิมที่ user กรอก | `estimated_amount` | ตอน statement ทับ `amount` ยอดที่ user กรอกจะหาย |
| กัน import statement ซ้ำ | `dedup_hash` (unique) | `external_ref` ไม่ unique จึงกันซ้ำระดับ DB ไม่ได้ |
| grace window (pending ข้ามรอบ) | `posted_at`, `pending_carryover` | ต้องแยก posting date จาก txn date และ mark รายการขอบรอบไม่ให้ถูก supersede |

> 📌 **การตัดสินใจ (29 ก.ค. 2026):** เลือกลง 3 field แบบเรียบก่อน (`is_reconciled` / `reconciled_at` / `external_ref`) แทนที่จะใส่ field ครบชุดตั้งแต่แรก
> **ผลที่ตามมา:** กลไก supersede + grace window ที่ออกแบบไว้ในหัวข้อ 3–5 **ยังใช้งานไม่ได้จนกว่าจะเพิ่ม field ข้างบน** — ต้อง migrate เพิ่มอีกรอบตอนทำ #21 (ยอมรับ trade-off นี้แล้ว เพราะตอนนั้น table ยังข้อมูลไม่เยอะ)

> ✅ **codebase ยืนยัน:** `users_card` มี `billing_cycle_day` / `payment_due_day` / `last_four` พร้อมใช้กำหนดขอบรอบบิลแล้ว

---

## 🔮 Parking Lot (พิจารณาภายหลัง — ยังไม่ commit SP)

Candidate จาก competitive analysis ที่ยังไม่รับเข้า backlog:

- 📄 **แยก #21** — Manual Statement Upload (ก่อน, Job A) ↔ OCR อัตโนมัติ (ท้าย) → ดึง manual upload ขึ้น P2 ได้ถ้าไมล์/ค่าธรรมเนียมรายปีเป็น priority
- 📤 **Export CSV/Excel** — enhancement ของ #10 (อยู่ในตาราง gating เป็น Premium แล้ว แต่ยังไม่มี SP ใน backlog)
- 👛 **Multi-wallet / Family advisory** — segment ใหม่ (คู่รัก/ครอบครัวที่แชร์บัตร) เป็น big bet ไว้ phase หลัง
- 🔴 **Savings Goals** — **ข้าม**: เป็น bookkeeping/PFM ล้วน หลุด core advisory ของเรา

---

## 💡 Key Insights จาก Community Data

- User ตื่นตีหนึ่งเพื่อกดโปร → **urgency สูงมาก, Notification timing สำคัญ**
- Stack โปรหลายชั้น → **Stacking Simulator คือ true differentiator**
- Community เป็น source of truth มากกว่า official → **User Verified Promo = trust engine**
- Health/Medical spending สูง (120k+ บาท) → **underserved segment จริง**
- ปัญหาหลักไม่ใช่ขาดข้อมูล แต่คือ **ข้อมูลเยอะเกินจนตัดสินใจไม่ได้**
