# Admin Portal — แผนงานและปัญหาที่ต้องแก้

เอกสารนี้บันทึกงานที่ต้องทำสำหรับ Admin Portal (ส่วน **B** ของ Feature #23) และปัญหาเชิงเทคนิคที่เจอระหว่างสำรวจโค้ด

- ความหมายของแต่ละตาราง → `docs/data-model.md`
- ขอบเขต feature และ roadmap → `docs/product-strategy.md`

**สถานะ:** ออกแบบเสร็จ ยังไม่เริ่มลงมือ · บันทึก 2026-08-06

---

## ทำไมต้องมี Admin Portal

Feature #23 (Card Profile & Benefits Summary) มีสองส่วนที่ขาดกันไม่ได้:

| | คืออะไร | อยู่ที่ไหน |
|---|---|---|
| **A** | หน้าจอให้ user ดูสิทธิประโยชน์ของบัตรที่ถือ | LIFF `/wallet/[cardId]` แท็บ "สิทธิประโยชน์" |
| **B** | ที่ให้ทีมงานกรอกข้อมูล benefit/perks ต่อรุ่นบัตร | Admin Portal |

benefit เป็นข้อมูล **ระดับผลิตภัณฑ์** (ผูกกับ `credit_cards` ไม่ใช่ `users_card`) — ถ้าไม่มีทางกรอก หน้าจอ A จะว่างเปล่าตลอดกาล

---

## บันทึกการตัดสินใจ

| # | เรื่อง | ตัดสินใจ | เหตุผล |
|---|---|---|---|
| 1 | ที่วางหน้า Card Profile | แท็บใน `/wallet/[cardId]` (hero บัตร + `สิทธิประโยชน์ / รายการ`) | ตรงกับ #23 · ไม่เพิ่ม tap · ประวัติรายการอยู่ที่เดิม · รองรับแท็บที่สาม (#10 Analytics) ในอนาคต |
| 2 | รูปแบบแท็บสิทธิประโยชน์ | **แบบ ค** — โปรที่มีวันหมดขึ้นบน · สิทธิ์ถาวรพับเป็น accordion | ของที่มีวันหมดคือส่วนเดียวที่ทำให้ user กลับมาเปิดซ้ำ · accordion ทำให้บัตรที่ benefit น้อย/เยอะ ยาวพอกัน |
| 3 | โครงตาราง benefit | **แยกสองตาราง** `card_base_benefit` + `card_perks` | rate ต้องให้**เครื่อง**อ่านไปคิด net reward · perk มีไว้ให้**คน**อ่านอย่างเดียว · รวมกันแล้วทุกคอลัมน์ต้อง nullable ตั้ง constraint ไม่ได้ |
| 4 | เทียบอัตราข้ามหน่วย | เก็บสองชั้น — `benefit_value` + `benefit_unit` ไว้แสดง · `effective_rate_pct` ไว้คำนวณ | UI แสดง "x3 คะแนน" ตามภาษาธนาคาร · engine อ่าน `1.44` เทียบกับบัตรเงินคืนได้ทันที |
| 5 | ตัวแปลงค่าแต้ม | ตารางแยก `point_programs` | ธนาคารเดียวมีหลายโปรแกรมได้ (KTC มีทั้งบัตรสะสมแต้มและเงินคืน) · ธนาคารลดค่าแต้ม → แก้แถวเดียวแล้ว recompute |
| 6 | ที่มาของค่าแต้ม | แตกคอลัมน์ `valuation_basis` · `valuation_source_url` · `valuation_checked_at` | ต้องตอบได้ว่า "ตัวเลขนี้เก่าไปหรือยัง" เพราะ `effective_rate_pct` ทุกแถวแขวนอยู่กับมัน |
| 7 | อายุคะแนน / แลกขั้นต่ำ | เก็บคอลัมน์ไว้ **แต่ไม่ให้เข้าสูตร** | จะคิดว่าลดค่าแต้มเท่าไหร่ต้องรู้พฤติกรรม user ซึ่งไม่รู้ · แสดงบนจอให้ user ตัดสินเองดีกว่าแอบเดาแทน |
| 8 | บัตรที่ไม่มีแต้ม | `point_program_id = NULL` (ไม่ใช้แถว sentinel) | sentinel ทำให้แยกไม่ออกระหว่าง "บัตรเงินคืนจริง" กับ "ยังไม่มีใครกรอก" |
| 9 | ทางกรอกข้อมูล | **Admin Portal** (ไม่ใช่ Supabase Studio / seed script) | ต้องให้คนอื่นในทีมกรอกได้ · Studio ทำให้คนคูณเลข `effective_rate_pct` เอง = magic number |
| 10 | Auth ของ admin | **แบบ C** — `admin_users` + `admin_sessions` ใน Prisma | ทุกอย่างอยู่ใน Prisma ตามสถาปัตยกรรมเดิม · ไม่เพิ่ม service |
| 11 | UI library | ลง **shadcn/ui เฉพาะ admin** แล้ว map token กลับมาที่ของ Cardly | admin คือฟอร์ม CRUD ซ้ำ ๆ · LIFF เป็นดีไซน์เฉพาะตัว เขียนมือถูกแล้ว |
| 12 | แยก repo ไหม | **ไม่แยก** — route group `app/(admin)/` | `lib/rewards.ts` ต้องใช้ร่วมกัน แยก repo แล้วสูตรจะ drift · `admin_sessions` อยู่ใน `schema.prisma` เดียวกัน |
| 13 | ค่าธรรมเนียมรายปี | `credit_cards.annual_fee` + `fee_waiver_condition` — **ไม่ใช่แถวใน `card_perks`** | บัตรทุกใบมีค่าธรรมเนียม (บางใบ = 0) ไม่ใช่สิทธิพิเศษที่บางใบมีบางใบไม่มี · เก็บเป็น perk แล้วเรียงลำดับ/เทียบข้ามบัตรไม่ได้เพราะค่าเป็น text |
| 14 | `network` (VISA/Master/JCB/AMEX) | `credit_cards.network` — **ไม่ใช่ `users_card`** | AMEX/JCB ร้านไม่รับทุกที่ในไทย → เป็นข้อมูลที่ป้อนเข้า engine ไม่ใช่ของประดับ · ข้อมูลที่ป้อน engine ต้องให้ทีมงาน curate (เหตุผลเดียวกับที่ตัดตัวเลือก "ให้ user กรอก benefit เอง" ทิ้งตั้งแต่แรก) |
| 15 | ขอบเขตบัตรของโปรโมชัน | เพิ่ม `promotions.card_scope` = `all_bank` \| `specific_cards` + constraint trigger | ตลาดจริงมีสองแบบ ("บัตร KTC ทุกประเภท" vs "เฉพาะ KTC Signature") · เดิมต้องเดาจากจำนวนแถวใน `promotion_cards` ซึ่งแยกไม่ออกจาก "ยังไม่ได้กรอก" · ไม่ใช้ระบบลำดับ tier เพราะแต่ละธนาคารเรียกชั้นบัตรคนละแบบ |

---

## ข้อ 12 ต่อ · ผลต่อการ deploy และค่าใช้จ่าย

> บันทึกเพิ่ม **2026-08-16** — ตอนตัดสินข้อ 12 คุยกันแค่ "แยก repo ไหม" ยังไม่ได้เขียนว่ามีผลกับการ deploy และบิลอย่างไร

**สรุป: repo เดียว → Vercel project เดียว → ยังไม่แยก**

### ทำไมยังไม่แยก project

การแยกเป็นสอง Vercel project **ทำได้โดยไม่ต้องแยก repo** (ชี้สอง project มาที่ repo เดิม แล้วตั้ง Ignore Build Step ให้ต่างกัน) — แต่สิ่งที่การแยกช่วยได้ ไม่ใช่ปัญหาที่มีอยู่จริง

| การแยกช่วยเรื่อง | สถานะจริงของเรา |
|---|---|
| ไม่ให้คนนอกเจอ admin | แก้ไปแล้วด้วย `ENABLE_ADMIN` flag + account lockout — ไม่ต้องใช้การแยก deploy มาช่วย |
| build ฝั่งหนึ่งพังไม่ให้บล็อกอีกฝั่ง | ยังไม่เคยเกิด และ build ปัจจุบันเบา |
| domain แยก (`admin.cardly.app`) | ผูก domain เพิ่มใน project เดิมแล้ว rewrite ที่ `middleware.ts` ได้ ไม่ต้องแยก project |

ส่วนราคาที่จ่ายทุกวันถ้าแยก

| | ผลกระทบ |
|---|---|
| **Build** | ทุก push build สองรอบ (ตั้ง Ignore Build Step ช่วยได้ แต่ต้องดูแลเอง) |
| **โควตา deploy/วัน** | นับสองครั้งต่อ push — บน Hobby (100/วัน) เหลือ effective 50 |
| **Instance reuse** | Fluid Compute ใช้ instance อุ่นซ้ำข้าม request · traffic ต่อ project ลดลง → cold start บ่อยขึ้นทั้งคู่ (กระทบ 🟢 Fuse.js cold start โดยตรง) |
| **Supabase connection** | serverless instance สองกลุ่มถือ connection แยกกัน · `lib/prisma.ts` singleton กันได้แค่ภายใน instance เดียว |
| **Env var** | สองชุดที่ต้องซิงก์เอง (`DATABASE_URL` · LINE secrets) — จุดที่ drift เงียบได้จริง |

**จำนวน project ไม่ใช่หน่วยที่ Vercel คิดเงิน** (Hobby ให้ 200 · Pro ไม่จำกัด) ค่าใช้จ่ายมาจาก build · invocation · CPU ไม่ใช่ค่าธรรมเนียมต่อ project

**ตัวกระตุ้นที่ทำให้ต้องกลับมาคิดใหม่** — ต้องแยก compliance boundary จริง ๆ · หรือ build ของ admin หนักจนถ่วงการ deploy LIFF

### Hobby vs Pro — เส้นตายคือ "เริ่มเก็บเงิน" ไม่ใช่โควตา

ตัวเลขจาก Vercel docs (`/docs/plans/hobby` · `/docs/plans/pro-plan` ดึงเมื่อ 2026-08-16)

| | Hobby (ฟรี) | Pro ($20/เดือน) |
|---|---|---|
| **ใช้เชิงพาณิชย์** | **ห้าม** — non-commercial เท่านั้น | ได้ |
| ราคา | ฟรี | $20/เดือน = platform fee + 1 deploying seat + เครดิต $20 · seat เพิ่ม $20/คน · Viewer ฟรี |
| **เกินโควตาแล้ว** | **ฟีเจอร์หยุดทำงาน รอครบ 30 วัน** | สลับไป on-demand billing |
| Spend Management | ไม่มี | ตั้งเพดาน + แจ้งเตือนได้ |
| Active CPU · Memory · Invocations | 4 CPU-hrs · 360 GB-hrs · 1M | คิดจากเครดิต แล้วต่อ on-demand |
| Edge Requests | 1M | 10M (+ Fast Data Transfer 1 TB) |
| Deployments/วัน | 100 | 6,000 |
| Runtime Logs | **1 ชั่วโมง** | 1 วัน |
| WAF custom rules · IP blocking | 3 · 3 | 40 · 100 |
| Projects | 200 | ไม่จำกัด |
| Function duration | 300s | 300s ตั้งได้ถึง 800s |

**สามข้อที่ตัดสินจริง**

1. **Hobby ห้ามใช้เชิงพาณิชย์** — วันที่เปิด subscription หรือรับ referral commission คือวันที่ต้องอยู่ Pro ไม่ใช่เรื่องโควตาไม่พอ
2. **พฤติกรรมตอนเกินโควตาต่างกันคนละเรื่อง** — Hobby หยุดให้บริการยาว 30 วัน ส่วน Pro แค่เริ่มคิดเงินตามจริงและตั้งเพดานกันบิลบานได้
3. **Runtime Logs 1 ชั่วโมงบน Hobby** — LINE webhook เข้ามาตอนไหนก็ได้ มีคนแจ้งว่าบอทพังเมื่อเช้า พอเปิดดูตอนบ่าย log หายแล้ว

---

## แผนงาน

**ความคืบหน้า** (อัปเดต 2026-09-05 · สถานะ schema ยืนยันกับ DB จริงแล้ว ไม่ใช่จากไฟล์ SQL)

| Phase | สถานะ |
|---|---|
| 0 · Schema | ✅ เสร็จ — `prisma/sql/001_card_benefits.sql` + `002_promo_card_scope.sql` apply แล้ว · RLS เปิด · `db pull` แล้ว |
| 1 · Logic กลาง | ✅ เสร็จ — `lib/rewards.ts` (20 tests) · `lib/validations/card.ts` (29 tests) |
| — · Seed ตัวอย่าง | ✅ นอกแผน — `prisma/seed-cards.ts` (8 บัตร) · `prisma/seed-promos.ts` (8 โปร) |
| 2 · Auth | ✅ เสร็จ — `@node-rs/argon2` · `lib/admin-auth.ts` (19 tests) · `lib/admin-guard.ts` · `middleware.ts` · `/api/admin/login`+`logout` · `/admin/login` · `scripts/create-admin.ts` |
| 3 · Admin UI | ✅ 7/7 — shadcn · map token · `(protected)/layout.tsx` + nav · หน้าโปรแกรมสะสม · หน้ารายการบัตร · ฟอร์มบัตร · คำนวณอัตราสด |
| 4 · Admin API | ✅ 3/3 — `/api/admin/programs[/id]` · `/api/admin/cards[/id]` · `lib/recompute.ts` (4.2) · `updated_by` ทุก mutation (4.3) |

| 5 · LIFF หน้าจอ | ✅ 4/4 (2026-08-07) — `/api/cards/my/[id]/profile` · `lib/card-profile.ts` · แยก `TransactionList` · `BenefitsTab` แบบ ค · empty state · **ยังไม่มี route test** |
| 6 · Engine | ⬜ |
| 7 · ปิดช่องว่างข้อมูล | ✅ เสร็จ — `005` รันแล้ว · `schema.prisma` ตรงกับ DB (`db pull --print` ไม่มี drift) · เหลือ constraint ตัวเดียวที่ยัง `NOT VALID` — ดูหัวข้อข้างล่าง |

---

## 7 · ปิดช่องว่างข้อมูล (2026-08-26)

ตรวจ admin portal เทียบกับเว็บบัตรจริง แล้วพบ 13 ช่องว่าง — แก้ครบทั้งหมดแล้ว

> ✅ **`prisma/sql/005_cap_basis_and_engine_gaps.sql` รันที่ Supabase แล้ว** — ยืนยันกับ DB จริง 2026-09-05: คอลัมน์ครบทั้ง 13 ตัว และ `npx prisma db pull --print` ไม่มี drift เทียบกับ `schema.prisma`
>
> **เหลืองานเดียว** — `promo_cap_needs_period` ยังเป็น `NOT VALID` (ตั้งใจ · แถวเดิมของ `promotions` ไม่มีทางรู้ว่า `max_cap` หมายถึงอะไร) · พอกรอกข้อมูลจริงครบแล้วรัน `ALTER TABLE public.promotions VALIDATE CONSTRAINT promo_cap_needs_period;`
>
> อีก 2 แถวใน `card_base_benefit` ที่ backfill `min_spend_basis='per_slip'` ด้วยการเดา — เป็นแถว `seed-cards` ที่จะโดนลบอยู่แล้ว ไม่ต้องตามแก้

### ความกำกวมที่แก้ย้อนหลังไม่ได้ (ทำก่อนเปิดให้กรอกข้อมูลจริง)

| เรื่อง | เดิม | ตอนนี้ |
|---|---|---|
| **`max_cap` ไม่รู้ว่าเพดานของอะไร** | `'3% สูงสุด ฿500'` กับ `'3% ของยอดไม่เกิน ฿500'` เก็บเหมือนกันทั้งที่ได้จริงต่างกัน ฿485 | `cap_basis` = `reward` \| `spend` + `max_reward_thb` (derived) |
| **`min_spend` ไม่รู้ว่าต่ออะไร** | `'ทุก ๆ ฿1,000/เซลส์สลิป'` กับ `'ยอดสะสมครบ ฿10,000/เดือน'` เก็บเหมือนกัน | `min_spend_basis` = `per_slip` \| `per_period` |
| **ต้องลงทะเบียนก่อน** | ซุกใน `condition` เป็น free text ([seed-cards.ts:127](../prisma/seed-cards.ts#L127)) เครื่องอ่านไม่ออก | `requires_registration` boolean ทั้ง `card_base_benefit` และ `promotions` |
| **เพดานสองชั้น** | เก็บได้ชั้นเดียว | `promotions.max_cap_campaign` |

### การตัดสินใจเพิ่ม (ต่อจากตารางข้อ 1–15)

| # | เรื่อง | ตัดสินใจ | เหตุผล |
|---|---|---|---|
| 16 | เพดานเข้าสูตรจัดอันดับไหม | **ไม่** — เก็บ `max_reward_thb` ไว้เทียบข้ามบัตร แต่ไม่ให้เข้า `scorePromo` | หลักการเดียวกับข้อ 7 · เพดานมีความหมายก็ต่อเมื่อรู้ยอดที่รูดไปแล้วในรอบนั้น ซึ่งต้องพึ่ง `transactions` ที่ user บันทึกไม่ครบ — cap-aware ที่คิดจากข้อมูลไม่ครบจะตอบ**ผิดอย่างมั่นใจ** แย่กว่าไม่คิด · ขั้นถัดไปที่ทำได้คือติดป้าย "ใช้เพดานไป 80% แล้ว" ไม่ใช่เอาไปจัดอันดับ |
| 17 | หน่วยของ `max_cap` | **ไม่มีคอลัมน์ `cap_unit`** — เดาจาก `cap_basis` + `benefit_type` | ครบทุกเคสโดยไม่มีความกำกวมเหลือ · `spend` เป็นบาทโดยนิยาม · `reward` ตามชนิด |
| 18 | เพดานสองชั้น | **เพิ่มคอลัมน์** ไม่ใช่แยกตาราง `promotion_caps` | ตลาดมีแค่ 2 ชั้น และ base benefit ไม่มีชั้นที่สองเลย · แยกตารางแล้วต้อง join ทุก query ของ engine เพื่อรองรับเคสที่ยังไม่มี · **ตัวกระตุ้น = เจอโปรเพดานสามชั้น** |
| 19 | `promotions.effective_rate_pct` | **NULLABLE** ต่างจาก `card_base_benefit` ที่ NOT NULL | โปรมีหน่วยที่แปลงไม่ได้จริง (`บาท/ลิตร` · `% ดอกเบี้ย` · คะแนน `เท่า`) · NULL = "ยังเทียบไม่ได้" ไม่ใช่ "ยังไม่กรอก" |
| 20 | บัตรที่เลิกออก | `credit_cards.status` — **ไม่ลบแถว** | `users_card` ชี้อยู่ ลบแล้วประวัติ user หาย · คนที่ถืออยู่ยังต้องเห็น benefit แต่บัตรต้องไม่ไปโผล่ที่เลือกบัตรใหม่ |
| 21 | ร้านค้ากับหมวด | **หน้าเดียวสองแท็บ** (`/admin/catalog`) | หมวดมี 7–10 แถวและแทบไม่เปลี่ยน · แยกหน้าให้มันจะได้เมนูที่คนกดปีละครั้ง |

### ที่ยังไม่ได้ทำต่อ

- **`scorePromo` ยังไม่ได้ใช้ `effective_rate_pct` ตัวใหม่** — คอลัมน์มีแล้วและ admin เขียนค่าให้แล้ว แต่ [recommend/route.ts](../app/api/recommend/route.ts) ยังบวก `benefit_value` ข้ามหน่วยเหมือนเดิม (งาน 6.2)
- **`foreign_tx_fee_pct` ยังไม่มีใครอ่าน** — กรอกได้แล้วแต่ engine ยังไม่หักตอนเทียบบัตรหมวดต่างประเทศ (งาน 6.1)
- **route test ครบทุก endpoint ของ admin แล้ว** (56 เคส) — `POST`/`PUT /promotions` · `PUT /cards/[id]` · `DELETE /merchants[/id]` · `DELETE /categories/[id]` · ทุกไฟล์เริ่มด้วยเคส 401 ที่ยืนยันว่า **ไม่แตะ DB เลย** เมื่อไม่ได้ล็อกอิน
- **ยังไม่มี integration test ที่ชน DB จริง** — constraint กับ trigger ใน `005` พิสูจน์ได้เฉพาะตอนรัน SQL จริง · route test สะท้อนกฎเดียวกันไว้ที่ชั้น Zod เท่านั้น ถ้าสองชั้นนี้ drift จะไม่มีอะไรฟ้อง

> **หมายเหตุ 4.1** — แผนเดิมวางไว้เป็น `/api/admin/benefits` กับ `/perks` แยกกัน แต่ตอนทำจริงรวมเป็น `PUT /api/admin/cards/[id]` ที่บันทึกทั้งใบในทรานแซกชันเดียว เพราะการแก้บัตรหนึ่งใบคือการแก้ตารางอัตราทั้งชุดพร้อมกัน — แยก endpoint แล้วถ้าพลาดกลางทางข้อมูลจะค้างครึ่ง ๆ กลาง ๆ

### 0 · Schema — แก้ที่ Supabase แล้ว `db pull` ✅

| # | งาน | หมายเหตุ |
|---|---|---|
| 0.1 | สร้าง `point_programs` | `bank_id` · `name` · `point_value_thb` · `valuation_basis` · `valuation_source_url` · `valuation_checked_at` · `point_expiry_months` · `min_redemption` |
| 0.2 | `credit_cards` เพิ่ม `point_program_id` · `network` · `annual_fee` · `fee_waiver_condition` | `point_program_id` NULL = บัตรเงินคืน · `network` ปิดบั๊กที่ AddCardWizard เก็บแล้วโยนทิ้ง (ต้องแก้ picker เป็น read-only เมื่อเลือกจากแคตตาล็อก) · `interest_rate` เว้นไว้ก่อน |
| 0.3 | **รื้อ `card_base_benefit` สร้างใหม่** | ยังไม่มีโค้ดไหนอ่าน → รื้อได้ฟรี **โอกาสนี้มีครั้งเดียว** |
| 0.4 | สร้าง `card_perks` | |
| 0.5 | สร้าง `admin_users` + `admin_sessions` | `sessions` เดิม FK ผูก `users` (LINE user) ใช้ร่วมไม่ได้ |
| 0.6 | เปิด RLS ตารางใหม่ทุกตัว | ตารางอื่นเปิดหมดแล้ว อย่าให้ตารางใหม่เป็นรูโหว่ |
| 0.7 | `prisma db pull` + `prisma generate` | |

### 1 · Logic กลาง — บล็อกทุกอย่างข้างล่าง

| # | งาน |
|---|---|
| 1.1 | `lib/rewards.ts` → `effectiveRatePct(benefit, program)` — **สูตรเดียวของทั้งระบบ** |
| 1.2 | Vitest ครอบ 1.1 — cashback · points · `program = null` · `spend_per_unit = 0` |
| 1.3 | `lib/validations/card.ts` — Zod schema ใช้ร่วมทั้ง form และ API |

### 2 · Auth (แบบ C)

| # | งาน | หมายเหตุ |
|---|---|---|
| 2.1 | `npm i argon2` | อย่า hash เอง |
| 2.2 | `lib/admin-auth.ts` | `hashPassword` · `verifyPassword` · `createSession` · `getSession` |
| 2.3 | `middleware.ts` | matcher `['/admin/:path*', '/api/admin/:path*']` · **ต้องวางโครงรองรับ LIFF guard ด้วย — ดูข้างล่าง** |
| 2.4 | `POST /api/admin/login` + `/logout` | cookie `httpOnly` · `secure` · `sameSite: lax` |
| 2.5 | `app/(admin)/login/page.tsx` | |
| 2.6 | script สร้าง admin คนแรก | ไม่มีหน้าสมัคร ต้องมีทางเข้าครั้งแรก |

**กฎที่ห้ามพลาด**

- session token ต้องเป็น `crypto.randomBytes(32).toString('hex')` — **ไม่ใช่ UUID** (UUID เดาได้และไม่ได้ออกแบบมาเป็น secret)
- `matcher` ต้องครอบ `/api/admin/*` ด้วย — guard ใน `layout.tsx` **ไม่กัน API route** ใครยิง `curl` ตรงเข้า `/api/admin/benefits` ก็แก้ข้อมูลได้โดยไม่ผ่านหน้าจอ
- `matcher` ต้อง **ไม่** ครอบ `(liff)` และ `/api/cards/*` ไม่งั้น user LINE เข้าแอปไม่ได้ทั้งหมด
- middleware **ห้าม query DB** — รันทุก request ที่ตรง matcher · ให้เช็กแค่ "ล็อกอินอยู่ไหม" ส่วนสิทธิ์ละเอียดไปเช็กใน route handler

#### ⚠️ งาน 2.3 — มีสองงานคนละ phase แย่งไฟล์เดียวกัน

`middleware.ts` เป็นไฟล์เดียวที่ root ครอบทั้งแอป แต่มีสองงานที่ต้องการมัน และ **ตรวจสอบคนละแบบ**

| งาน | ต้องการอะไร | ตรวจจาก | matcher |
|---|---|---|---|
| **2.3** (แผนนี้) | กัน admin portal | **cookie** | `/admin/*` · `/api/admin/*` |
| **🔴 2** (`docs/tech-debt.md` · session auth) | validate token ของ LIFF | **`Authorization: Bearer`** | `/api/cards/*` · `/api/transactions/*` |

**ใครทำก่อนต้องวางโครงให้รองรับทั้งสองแบบตั้งแต่แรก** ไม่งั้นคนที่ทำทีหลังต้องรื้อ

```ts
export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname
  if (path.startsWith('/admin') || path.startsWith('/api/admin')) return adminGuard(req)
  return liffGuard(req)   // ← เติมทีหลังตอนทำ tech-debt 🔴 2
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],   // ← ขยายทีหลัง
}
```

แยกเป็นสองฟังก์ชันตั้งแต่แรก แล้วตอนทำ 🔴 2 ค่อยเติม `liffGuard` กับขยาย `matcher` — ไม่ต้องแตะโครง

### 3 · Admin UI

| # | งาน |
|---|---|
| 3.1 | `npx shadcn@latest init` — **รีวิว diff ก่อน accept** มันแก้ `globals.css` + `tailwind.config.ts` |
| 3.2 | map token ของ shadcn กลับมาที่ Cardly (`--primary: var(--brand-500)` ฯลฯ) |
| 3.3 | `app/(admin)/layout.tsx` — guard + nav |
| 3.4 | `programs/` — CRUD `point_programs` |
| 3.5 | `cards/` — ลิสต์บัตร + ค้นหา |
| 3.6 | `cards/[id]/` — ฟอร์มรวม: ข้อมูลบัตร + แถว benefit + แถว perk |
| 3.7 | ฟอร์มโชว์ `effective_rate_pct` **ที่คำนวณสดตอนพิมพ์** ไม่ให้กรอกมือ |

### 4 · Admin API

| # | งาน |
|---|---|
| 4.1 | `/api/admin/programs` · `/cards/[id]` · `/benefits` · `/perks` |
| 4.2 | **recompute** — แก้ `point_value_thb` ต้องคำนวณ `effective_rate_pct` ใหม่ทุกแถวของทุกบัตรในโปรแกรมนั้น |
| 4.3 | เขียน `updated_by` = email admin ทุก mutation (คอลัมน์มีอยู่ทุกตารางแต่ว่างเปล่ามาตลอด) |

### 5 · LIFF — หน้าจอ (ส่วน A)

| # | งาน |
|---|---|
| 5.1 | `GET /api/cards/[id]/profile` — รวม benefit + perks + โปรที่ active |
| 5.2 | refactor `/wallet/[cardId]` เป็นแท็บ — แยก list รายการ (339 บรรทัด) ออกเป็น component |
| 5.3 | แท็บสิทธิประโยชน์ แบบ ค — promo hero · countdown · accordion 2 กลุ่ม |
| 5.4 | empty state ตอนไม่มีโปร + accordion ตัวแรกกางเสมอ |

### 6 · Engine

| # | งาน |
|---|---|
| 6.1 | ให้ `/api/recommend` ใช้ `effective_rate_pct` ของ base benefit ด้วย — วันนี้คิดจากโปรอย่างเดียว |
| 6.2 | เพิ่ม `effective_rate_pct` + `cap_period` เข้า `promotions` แล้วแก้ `scorePromo` |

### เส้นทางวิกฤต

```
0.1–0.4 ──→ 1.1 ──┬──→ 2.x ──→ 3.x ──→ 4.x ──→ กรอกข้อมูลได้
                  └──────────────────────────→ 5.x (ทำคู่ขนานได้)
```

**5.x ไม่ต้องรอ admin portal** — seed ข้อมูลตัวอย่าง 2–3 ใบด้วยมือไปก่อนได้ ไม่งั้นจะไม่เห็นหน้าจอเลยจนกว่างานทั้ง 4 กลุ่มจะเสร็จ

---

## ปัญหาเชิงเทคนิคที่เกี่ยวข้อง

รายละเอียดทั้งหมดอยู่ที่ **`docs/tech-debt.md`** — ที่นี่ลิสต์เฉพาะข้อที่กระทบแผนนี้โดยตรง

| ระดับ | เรื่อง | กระทบงานข้อไหน |
|---|---|---|
| 🟠 | `scorePromo` บวก `benefit_value` ข้ามหน่วย | 6.2 |
| ✅ | ~~`promotions.max_cap` ไม่มี `cap_period`~~ — `005` เพิ่ม `cap_period` · `cap_basis` · `max_cap_campaign` แล้ว | 6.2 เหลือแค่แก้ `scorePromo` |
| ✅ | ~~`promotion_cards` ว่างทั้งตาราง~~ — มี 4 แถวแล้ว (จาก `seed-promos`) และ `card_scope` บอกเจตนาตรง ๆ | **5.3** ไม่ถูกบล็อกแล้ว |
| 🟡 | CLAUDE.md อ้างถึง `middleware.ts` · `lib/supabase/*` · shadcn · TanStack Query · `app/(admin)/` · `prisma migrate dev` ที่ไม่มีอยู่จริง | 0.7 · 2.3 · 3.1 |
| 🟢 | LIFF auth ซ้ำทุกหน้า (**6 หน้า** แล้ว) ควรย้ายไป Context | 5.2 — refactor หน้าเดียวกันอยู่แล้ว ทำพร้อมกันได้ |
| 🟢 | ~~`credit_cards` ขาด `network` · `annual_fee`~~ — คอลัมน์มีแล้ว · **แต่ AddCardWizard ยังโยน `network` ทิ้งอยู่** เพราะ `POST /api/cards/my` ไม่รับ | 0.2 เสร็จ · เหลือทำ picker เป็น read-only |

🔴 ข้อความปลอดภัย (LINE ID token · session auth · hardcode dev user id) **ไม่บล็อกแผนนี้** แต่ต้องเสร็จก่อนเปิดให้คนนอกใช้ — ดู `docs/tech-debt.md`

---

## ที่ยังไม่ได้ตัดสินใจ

| # | เรื่อง | ทางเลือก |
|---|---|---|
| ~~1~~ | ~~`promotion_cards`~~ | **ตัดสินแล้ว** → เพิ่ม `promotions.card_scope` (การตัดสินใจข้อ 15) · ไม่ backfill ของเดิมเพราะโปรทั้งหมดเป็นข้อมูลปลอมที่ต้องลบอยู่แล้ว · ฟอร์มกรอกโปรใน Phase 3/4 ต้องมีช่องเลือก scope ตั้งแต่แรก |
| 2 | ส่วนลดต่อหน่วย (`บาท/ลิตร`) | แปลงเป็น `effective_rate_pct` ต้องสมมติราคาน้ำมัน — จะเก็บสมมติฐานไว้ไหน หรือปล่อยให้หมวดน้ำมันเป็น display-only |
| 3 | Migration workflow | ย้ายมา `prisma/migrations/` หรือคง `db pull` จาก Supabase (ต้องแก้ CLAUDE.md ตามที่เลือก) |
