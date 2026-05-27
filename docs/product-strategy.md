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

### 🔴 P0 — Foundation (Phase 1: 0–3 เดือน) | 63 SP

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

### 🟡 P2 — Power Users (Phase 3: 6–9 เดือน) | 93 SP

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

## 🗓️ Roadmap Summary

| Phase | Features | SP | Timeline |
|-------|---------|:--:|----------|
| Phase 1: Foundation | #1–6 | 63 | 0–3 เดือน |
| Phase 2: Core Loop | #7–10 | 37 | 3–6 เดือน |
| Phase 3: Power Users | #11–17 | 93 | 6–9 เดือน |
| Phase 4: AI Layer | #18–20 | 68 | 9–12 เดือน |
| Phase 5: Platform | #21–22 | 76 | 12+ เดือน |
| **รวม** | **22 features** | **337** | **~18 เดือน** |

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
