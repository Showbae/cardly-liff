# Tech Debt — Cardly

รายการหนี้ทางเทคนิคที่รู้ตัวแล้ว · ตรวจกับโค้ดจริงเมื่อ **2026-08-06** · **ตรวจซ้ำกับโค้ดและ DB จริง 2026-09-05**

หลายข้อเป็นการ **ตั้งใจ defer** ไม่ใช่ความพลาด — ช่องที่ "ทำไม" อธิบายว่าทำไมถึงยอมรับได้ตอนนี้ และเงื่อนไขไหนที่ทำให้ยอมไม่ได้อีกต่อไป

| ระดับ | ความหมาย |
|---|---|
| 🔴 | ต้องแก้ก่อนเปิดให้คนนอกใช้ |
| 🟠 | ทำให้ผลลัพธ์ของระบบผิด แต่ยังไม่กระทบความปลอดภัย |
| 🟡 | เอกสารกับโค้ดไม่ตรงกัน — คนใหม่/AI อ่านแล้วเข้าใจผิด |
| 🟢 | คุณภาพโค้ดและ performance |

---

## 🔴 ต้องแก้ก่อน production

### 1. `/api/auth/line` ไม่ verify LINE ID token

**สถานะ:** ตั้งใจเปิดไว้ให้เทสง่าย ยังไม่แก้ (ยืนยัน 2026-08-06)
**ที่ไหน:** `app/api/auth/line/route.ts`

```ts
const { userId, displayName, pictureUrl } = body
const user = await prisma.users.upsert({ where: { line_id: String(userId) }, ... })
```

**ทำไมต้องแก้** — รับ `userId` จาก request body ตรง ๆ แล้ว upsert + คืน user record โดยไม่ตรวจสอบอะไรเลย ใครรู้ LINE userId ของคนอื่นก็ยิง POST เอา record คนนั้นได้ และ `lib/cards.ts` ใช้ `userId` เป็นตัวระบุตัวตนต่อ

**แก้ยังไง** — client ส่ง `liff.getIDToken()` แทน profile → server verify กับ `https://api.line.me/oauth2/v2.1/verify` → ค่อย upsert

> **ต้องแก้คู่กับข้อ 2** — ถ้าจุดล็อกอินยังไม่ verify ตัวตน ต่อให้ session token แข็งแรงแค่ไหน มันก็แค่ออก token ที่แข็งแรงให้คนที่ปลอมตัวมา

### 2. API routes ไม่มี auth validation

**สถานะ:** ตั้งใจ defer — ยอมรับได้ตอนที่มีแค่ developer ใช้คนเดียว
**ที่ไหน:** `/api/cards/my` · `/api/transactions` และ route อื่นที่รับ `userId`

**ทำไมต้องแก้** — ใครรู้ `userId` UUID ก็เรียก API ได้ตรง ๆ · ตาราง `sessions` มีอยู่ใน schema แต่ **`prisma.sessions` ถูกเรียกใช้ 0 ครั้งทั้งโปรเจกต์**

**เงื่อนไขที่ยอมไม่ได้อีกต่อไป:** ก่อน onboard beta tester คนแรก

**แก้ยังไง**

1. `POST /api/auth/line` (หลัง verify ID token ตามข้อ 1) สร้าง session token ด้วย `crypto.randomBytes(32).toString('hex')` — **ไม่ใช่ UUID** (UUID v4 ออกแบบมาให้ไม่ซ้ำ ไม่ได้ออกแบบมาเป็นความลับ) บันทึกใน `sessions` พร้อม `expires_at`
2. คืน token ให้ client เก็บ
3. client แนบ `Authorization: Bearer <token>` ทุก request
4. `middleware.ts` validate token ก่อน route ทำงาน

> **⚠️ ไฟล์นี้ใช้ร่วมกับ Admin Portal งาน 2.3** — admin ตรวจจาก cookie ส่วน LIFF ตรวจจาก `Authorization: Bearer` คนละแบบกัน · ถ้า 2.3 ทำไปแล้วให้เติม `liffGuard` เข้าโครงที่มีอยู่ + ขยาย `matcher` อย่าเขียนทับ · ดูโครงใน `docs/admin-portal.md` หัวข้อ "งาน 2.3"

### 3. Hardcode dev user ID

**สถานะ:** อยู่ใน **5 ไฟล์** (เดิมจดไว้ 2 → 4 → 5 — เพิ่มขึ้นตามหน้าที่เขียนใหม่ · ยืนยัน 2026-09-05)

| ไฟล์ | บรรทัด |
|---|---|
| `app/(liff)/page.tsx` | 90 |
| `app/(liff)/wallet/page.tsx` | 32 |
| `app/(liff)/wallet/[cardId]/page.tsx` | 54 |
| `app/(liff)/me/cards/page.tsx` | 57 |
| `app/(liff)/promo/page.tsx` | 180 |

```ts
: { id: '9ee6ee16-d45a-4750-8bcb-ef59285bf2e4', display_name: 'Showbae🍀' }
```

**ทำไมต้องแก้** — fallback ตอน dev บน browser ปกติ (ไม่ได้เปิดผ่าน LINE) ถ้า ship ขึ้น production ทุกคนที่เปิดนอก LINE จะกลายเป็น user คนนี้

**แก้ยังไง** — ลบออก หรือ wrap ด้วย `process.env.NODE_ENV === 'development'`

> จำนวนไฟล์เพิ่มขึ้นเพราะแต่ละหน้า copy-paste auth เอง — แก้ข้อ 🟢 1 (LiffContext) แล้วเหลือจุดเดียว


### 4. Seed data ปลอมยังอยู่ใน DB

**สถานะ:** ยังไม่ล้าง — รายละเอียดและ SQL ที่ถูกต้องอยู่ที่ 🟠 ข้อ 4

> ⚠️ **บล็อก SQL เดิมตรงนี้อันตราย ลบทิ้งแล้ว** — มันมี `DELETE FROM merchants` กับ `DELETE FROM categories` ซึ่งจะลบข้อมูลจริง **188 ร้าน** และ **16 หมวด** ทิ้ง · `prisma/seed.ts` ไม่เคยรันกับ DB ตัวนี้ ตัวเลข "12 merchants · 6 categories" ในบล็อกเดิมเป็นตัวเลขจาก script ไม่ใช่จาก DB

---

### 5. `/admin` เข้าถึงได้จากภายนอกทุกครั้งที่รัน `dev:tunnel`

**สถานะ:** ยังไม่ได้ใส่ตัวกัน

`npm run dev:tunnel` เปิด ngrok ด้วย **domain ตายตัว** (`padded-celtic-retouch.ngrok-free.dev`) ซึ่งชี้มาที่ `next dev` ตัวเดียวกับที่มี `/admin` อยู่ — ทุกครั้งที่รัน tunnel เพื่อเทส LIFF หน้า admin ก็เปิดสู่อินเทอร์เน็ตไปด้วย และต่อกับ **Supabase ตัวจริง**

ตอนนี้พึ่งรหัสผ่าน + account lockout (ข้อ 6) เป็นด่านเดียว

**ทางแก้ที่คุยกันไว้** — ให้ middleware ตอบ 404 กับ `/admin*` เมื่อ Host ไม่ใช่ localhost และไม่ได้ตั้ง `ENABLE_ADMIN=true`

```ts
const host = req.headers.get('host') ?? ''
const isLocal = host.startsWith('localhost') || host.startsWith('127.0.0.1')
if (!isLocal && process.env.ENABLE_ADMIN !== 'true') return new NextResponse(null, { status: 404 })
```

> เป็น**ตัวกันพลาด ไม่ใช่กำแพง** — Host header เป็นสิ่งที่ client ส่งมาเอง ปลอมได้ · กำแพงจริงคือรหัสผ่านกับ lockout
> ใช้ flag ตัวเดียวกันคุมตอน deploy Vercel ได้ด้วย (production เปิด · preview ปิด)

> **หมายเหตุ:** `MIN_PASSWORD_LENGTH` ลดจาก 12 เหลือ **8** ตาม NIST SP 800-63B — ตัวเลข 12 เดิมตั้งขึ้นเองไม่ได้อ้างมาตรฐานไหน

### 6. ~~`/api/admin/login` ไม่มี rate limit~~ — ✅ แก้แล้ว 2026-08-14

ใช้ **account lockout เก็บใน Postgres** แทน rate limit ตาม IP (`prisma/sql/004_admin_lockout.sql`)
ผิดติดกัน 5 ครั้ง → ล็อก 15 นาที → ปลดเองเมื่อเลยเวลา

เลือกวิธีนี้เพราะ limiter ใน memory ใช้ไม่ได้บน serverless (แต่ละ instance นับแยกกัน) และ Postgres ที่มีอยู่แล้วก็เป็น store กลางอยู่แล้ว — ไม่ต้องเพิ่ม Redis · และตรงกับภัยจริงกว่าเพราะคนจะเจาะบัญชีที่รู้ว่ามีอยู่ ไม่ใช่ยิงสุ่ม IP

> **ยังไม่มี:** log ว่า admin คนไหนล็อกอิน/ดูข้อมูลใครเมื่อไหร่ — จะสำคัญขึ้นเมื่อมี admin หลายคนและมีหน้าดูข้อมูล user (ตามที่คุยกันว่าจะทำ)

---

## 🟠 ความถูกต้องของข้อมูล

### 1. `scorePromo` บวก `benefit_value` ข้ามหน่วย

**ที่ไหน:** `app/api/recommend/route.ts`

```ts
return (isMerchant ? 1000 : 0)
  + (promo.promo_type === 'cashback' ? 200 : promo.promo_type === 'discount' ? 100 : 0)
  + Number(promo.benefit_value ?? 0)
```

**ปัญหา** — "ลด 30%" ได้ 30 แต้ม · "รับ 50 บาท" ได้ 50 แต้ม ทั้งที่ 30% ของ ฿3,000 = ฿900 ชนะขาด เป็น ranking heuristic ไม่ใช่ net reward · `seed.ts` มีหน่วยปนกันจริง (`%` · `บาท` · `บาท/ลิตร` · `% ดอกเบี้ย`)

**แก้ยังไง** — เพิ่ม `effective_rate_pct` เข้า `promotions` แล้วให้ `scorePromo` ใช้ค่านั้น (ดู `docs/data-model.md` เรื่องสูตร และ `docs/admin-portal.md` งาน 6.2)

### 2. ~~`promotions.max_cap` ไม่รู้ว่าต่ออะไร~~ — ✅ แก้แล้ว 2026-08-26

`005` เพิ่ม `cap_period` (`per_bill`/`per_month`/`per_year`) · `cap_basis` (`reward`/`spend`) · `max_cap_campaign` (เพดานชั้นสอง) ครบแล้ว

**เหลือ constraint ตัวเดียวที่ยังเป็น `NOT VALID`** — ยืนยันกับ DB 2026-09-05

```
⚠️  NOT VALID  promo_cap_needs_period
```

ตั้งใจ — แถว `promotions` เดิมไม่มีทางรู้ว่า `max_cap` หมายถึงอะไร การเดาให้มันเพื่อให้ migration ผ่านคือการสร้างข้อมูลปลอมที่ดูน่าเชื่อถือ · `NOT VALID` บังคับกับแถวใหม่ทุกแถว แต่ยกเว้นแถวเก่า · พอกรอกครบแล้วรัน:

```sql
ALTER TABLE public.promotions VALIDATE CONSTRAINT promo_cap_needs_period;
```

### 3. ~~`promotion_cards` กำกวม~~ — ✅ แก้แล้ว 2026-08-07

เพิ่ม `promotions.card_scope` (`prisma/sql/002_promo_card_scope.sql`) ให้บอกเจตนาตรง ๆ แทนการเดาจากจำนวนแถว พร้อม constraint trigger บังคับความสอดคล้อง

`recommend/route.ts` ยังใช้ logic เดิมได้ถูกต้อง ไม่ต้องแก้ — เปลี่ยนไปอ่าน `card_scope` ตรง ๆ ตอนทำงาน 6.2 เพื่อให้อ่านโค้ดเข้าใจง่ายขึ้น

### 4. Seed data ปลอมยังอยู่ใน DB

**ยืนยันกับ DB จริง 2026-09-05** — นับแถวจริงแล้ว ไม่ใช่ตัวเลขจาก script

| ตาราง | seed สร้าง | ของจริง |
|---|---|---|
| `point_programs` | 4 (`seed-cards`) | 0 |
| `card_base_benefit` | 19 (`seed-cards`) | 0 |
| `card_perks` | 12 (`seed-cards`) | 0 |
| `promotions` | 8 (`seed-promos`) | 0 |
| `credit_cards` | 4 สร้างใหม่ + **4 ทับของเดิม** | 18 |

#### ⚠️ `credit_cards` 4 ใบที่ถูก **update ทับ** — ห้าม DELETE

`seed-cards.ts` หาใบเดิมก่อน ถ้าเจอจะ `update` ไม่ใช่ `create` ([seed-cards.ts:222](../prisma/seed-cards.ts#L222)) → แถวพวกนี้ **`created_by` ยังเป็น NULL** แต่ `updated_by = 'seed-cards'`

| ถูกทับ (ต้อง restore ค่า ไม่ใช่ลบ) | สร้างใหม่ (ลบได้) |
|---|---|
| KBank Cashback · KBank Platinum | KTC Cash Back Platinum · KTC FOREVER Platinum |
| UOB Absolute Cashback · UOB PRVI Miles | AEON Cashback · AEON Royal Orchid Plus |

```sql
-- ลบเฉพาะที่ seed สร้างเอง
DELETE FROM promotions        WHERE created_by = 'seed-promos';  -- cascade promotion_cards/_merchants
DELETE FROM card_perks        WHERE created_by = 'seed-cards';
DELETE FROM card_base_benefit WHERE created_by = 'seed-cards';
DELETE FROM point_programs    WHERE created_by = 'seed-cards';
DELETE FROM credit_cards      WHERE created_by = 'seed-cards';

-- 4 ใบที่ถูกทับ — ดูก่อนว่าค่าไหนเพี้ยน แล้วแก้ทีละใบ
SELECT card_name, bank_id, updated_by FROM credit_cards
 WHERE created_by IS NULL AND updated_by = 'seed-cards';
```

> **ห้ามแตะ `merchants` (188) และ `categories` (16)** — เป็นข้อมูลจริง `prisma/seed.ts` ไม่เคยรันกับ DB ตัวนี้ · อย่าเผลอรัน `seed.ts` ทับ
---

## 🟡 เอกสารไม่ตรงกับโค้ด

`CLAUDE.md` อธิบายสิ่งที่ยังไม่มีอยู่จริง — คนใหม่หรือ AI อ่านแล้วจะเข้าใจผิดและเขียนโค้ดบนสมมติฐานที่ผิด

ตรวจกับโค้ดจริงอีกครั้ง **2026-08-16** — Phase 2/3/4 ทำให้หลายข้อหมดไปเอง เหลือที่ยังไม่ตรงตามนี้

| CLAUDE.md บอกว่ามี | ของจริง |
|---|---|
| `lib/supabase/client.ts` · `server.ts` | ❌ โฟลเดอร์ `lib/supabase/` ยังว่างเปล่า |
| TanStack Query | ❌ ยังไม่ได้ติดตั้ง — server state ใช้ `useState` + `useEffect` ตรง ๆ |
| `app/(admin)/` | ⚠️ ของจริงคือ **`app/admin/`** (ไม่ใช่ route group) เพราะ route group ไม่ติดใน URL — ถ้าใช้ `(admin)` หน้าจะกลายเป็น `/cards` แล้ว `matcher: ['/admin/:path*']` จะไม่จับ · route group ที่ใช้จริงคือ `app/admin/(protected)/` ซึ่งแยกหน้าหลัง guard ออกจาก `/admin/login` |
| `npx prisma migrate dev` / `migrate deploy` | ❌ ยังไม่มี `prisma/migrations/` — คำสั่งนี้จะสร้าง baseline มั่ว · ของจริงคือ `prisma/sql/*.sql` แล้ว `db pull` |

**ที่หมดไปแล้ว** — `middleware.ts` มีจริงแล้ว (adminGuard) · shadcn/ui ลงแล้ว (`components/ui/` มี button · input · label · select · table)

**หมายเหตุ:** `@supabase/supabase-js` ติดตั้งอยู่แต่ **ถูกเรียกใช้ 0 ครั้ง** ทั้งโปรเจกต์ — data access ทั้งหมดผ่าน Prisma + `pg.Pool` ตาม `lib/prisma.ts` · Supabase ทำหน้าที่เป็นแค่ที่ตั้งของ Postgres

**ยังไม่ตัดสินใจ** — จะแก้เอกสารให้ตรงโค้ด หรือแก้โค้ดให้ตรงเอกสาร ต้องเลือกทีละข้อ โดยเฉพาะ migration workflow (`prisma/migrations/` vs `db pull`)

---

## 🟢 คุณภาพโค้ดและ performance

### 1. LIFF auth ซ้ำทุกหน้า — ควรย้ายไป Context

**สถานะ:** ยังไม่ทำ · ปัญหาโตขึ้นเรื่อย ๆ (**6 หน้า** แล้ว — ยืนยัน 2026-09-05)

ทุกหน้าเรียก `initLiff()` + `signInWithLine()` แยกกันเอง → LIFF init ถูกเรียกซ้ำ · auth logic ซ้ำซ้อน · เพิ่มหน้าใหม่ต้อง copy-paste ทุกครั้ง (ซึ่งเป็นสาเหตุที่ hardcode dev user id ลามจาก 2 เป็น 5 ไฟล์)

**แก้ยังไง** — สร้าง `contexts/LiffContext.tsx` → ย้าย init + auth ไป `app/(liff)/layout.tsx` → ทุกหน้าใช้ `useLiff()`

### 2. Merchant search cold start ~300–400ms

**สถานะ:** รับได้ตอนนี้ — defer
**ที่ไหน:** `app/api/merchants/search/route.ts`

Fuse.js โหลด merchants ทั้งหมดเข้า memory ทุกครั้งที่ Vercel instance cold start (idle ~5 นาที) · ครั้งต่อไปใน instance เดิมเร็วเพราะ cache อยู่ใน module scope

**แก้ยังไง (ถ้าต้องการ latency คงที่)** — ใช้ `pg_trgm` ค้นใน Postgres ตรง ๆ หรือ cache รายชื่อไว้ข้าม instance

### 3. Transaction history — virtualization (v2)

**สถานะ:** v1 เสร็จแล้ว (2026-07-31) — window 6 เดือน + ปุ่มดูเพิ่ม + hard cap `take: 500`

**เหลือทำเมื่อ volume โตจริง (หลัง Statement OCR #21)**
- เพิ่ม `react-window` ถ้าเดือนเดียวมีหลายร้อยแถว
- ย้ายไป TanStack Query แทน `useState` + `useEffect` ตรง ๆ
- ถ้า 6 เดือนเกิน 500 แถว (ชน cap) subtotal เดือนขอบจะไม่ครบ

**Design decision ที่ตกลงไว้แล้ว** — หน้านี้คือ *browse บางส่วน* ไม่ใช่ที่ไว้นับแต้มทีละแถว · ยอดสะสมให้ทำเป็น server aggregate (`SUM`) แยกต่างหาก · window ต้องตัดที่**ขอบเดือน**เสมอ ห้ามตัดตามจำนวนแถว ไม่งั้น subtotal เดือนขอบเพี้ยน

### 4. `credit_cards` ขาดฟิลด์ — ✅ ปิดไปแล้วครึ่งหนึ่ง

`network` · `annual_fee` **มีคอลัมน์แล้ว** (`005`) · เหลือ `interest_rate` ที่ยังไม่มี

**แต่ที่ยังพังคือฝั่ง UI** — `AddCardWizard` มี NetworkPicker ให้ user เลือกเครือข่าย แล้ว**โยนทิ้ง** เพราะ `POST /api/cards/my` ไม่รับฟิลด์นี้ ([route.ts:39](../app/api/cards/my/route.ts#L39) รับแค่ `cardId` · `last_four` · `credit_limit` · รอบบิล)

ตามการตัดสินใจข้อ 14 `network` เป็นของ `credit_cards` ที่ทีมงาน curate ไม่ใช่ของ `users_card` → ทางแก้คือทำ picker เป็น **read-only** เมื่อเลือกบัตรจากแคตตาล็อก ไม่ใช่เปิดให้ API รับค่าจาก user

---

## ✅ แก้แล้ว

| | เรื่อง | หมายเหตุ |
|---|---|---|
| 2026-07 | `lib/prisma.ts` ใช้ `DIRECT_URL` (port 5432) | เปลี่ยนเป็น `DATABASE_URL` pooler (6543) แล้ว · เดิมทำให้ทุก API route คืน 500 · unit test จับไม่ได้เพราะไม่ได้ต่อ DB จริง |
| 2026-07-31 | Transaction history ดึงทั้งหมดไม่มี pagination | v1 เสร็จ — ดู 🟢 3 |
| 2026-08-16 | `CLAUDE.md` บอกว่า Vercel function timeout = 10s บน Hobby | **ล้าสมัย** — ปัจจุบัน 300s ทั้ง Hobby และ Pro (Pro ตั้งได้ถึง 800s) · แก้ CLAUDE.md แล้ว 2 จุด · ตัวเลขผิดนี้ทำให้เลี่ยงงานที่ใช้เวลานานใน API route โดยไม่จำเป็นมาตลอด |
