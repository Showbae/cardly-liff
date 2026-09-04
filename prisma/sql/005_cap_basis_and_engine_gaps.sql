-- ═══════════════════════════════════════════════════════════════════════
-- 005 · ปิดช่องว่างที่ทำให้ engine คิดผิดเงียบ ๆ
--
-- ไฟล์นี้แก้ 8 เรื่องที่แยกกันไม่ได้ เพราะทั้งหมดเป็นคอลัมน์ของตารางที่
-- admin portal กำลังจะเปิดหน้ากรอก — ถ้าเปิดหน้ากรอกก่อนเติมคอลัมน์
-- เท่ากับเปิดสายพานผลิตข้อมูลที่ต้องมาไล่แก้ทีหลังทุกแถว
--
--   ชั้น 1 · ความกำกวมที่แก้ย้อนหลังไม่ได้
--     1. card_base_benefit.cap_basis      — เพดานของ "ผลตอบแทน" หรือ "ยอดที่นับ"
--     2. card_base_benefit.min_spend_basis — ขั้นต่ำ "ต่อเซลส์สลิป" หรือ "ต่อรอบ"
--     3. requires_registration             — ไม่ลงทะเบียน = ได้ 0 (เดิมซุกใน condition)
--     4. promotions.max_cap_campaign       — เพดานชั้นที่สอง (ตลอดแคมเปญ)
--
--   ชั้น 2 · คอลัมน์ที่ engine ต้องใช้แต่ไม่มีเลย
--     5. credit_cards.foreign_tx_fee_pct   — ค่าความเสี่ยงแปลงสกุลเงิน
--     6. promotions.cap_period             — บั๊กที่ docs/data-model.md ยอมรับแล้ว
--     7. promotions.effective_rate_pct     — scorePromo บวกข้ามหน่วยอยู่วันนี้
--     8. credit_cards.status               — บัตรที่เลิกออกแล้ว
--
-- ไม่มีตารางใหม่ → **ไม่ต้องแตะ RLS** (เปิดอยู่แล้วทุกตารางที่ไฟล์นี้แตะ)
-- ไม่มีข้อไหนกระทบสูตร effective_rate_pct ของ card_base_benefit
--
-- รันที่ Supabase แล้วตามด้วย: npx prisma db pull && npx prisma generate
-- ═══════════════════════════════════════════════════════════════════════

begin;

-- ───────────────────────────────────────────────────────────────────────
-- 1 · card_base_benefit.cap_basis + max_reward_thb
--
-- ปัญหา: "รับเงินคืน 5% สูงสุด 500 บาท/เดือน" กับ
--        "รับเงินคืน 5% สำหรับยอดใช้จ่ายไม่เกิน 10,000 บาท/เดือน"
-- เก็บลง max_cap ได้ทั้งคู่ แต่หมายถึงคนละอย่าง และเมื่ออัตราไม่ใช่ 5%
-- ผลลัพธ์ต่างกันทันที (3% → ได้ 500 vs 300)
--
-- max_reward_thb เป็นค่า derived แบบเดียวกับ effective_rate_pct
-- มีไว้ให้ engine เทียบข้ามบัตรใน query เดียวโดยไม่ต้อง join point_programs
-- **ห้ามพิมพ์มือ** — คำนวณผ่าน lib/rewards.ts → capRewardThb() เท่านั้น
--
-- หน่วยของ max_cap เดาได้ครบ ไม่ต้องมีคอลัมน์ cap_unit:
--   cap_basis='spend'                    → บาท (ยอดใช้จ่ายเป็นบาทโดยนิยาม)
--   cap_basis='reward' + cashback/discount → บาท
--   cap_basis='reward' + points/miles      → คะแนน/ไมล์
-- ───────────────────────────────────────────────────────────────────────
alter table public.card_base_benefit
  add column cap_basis      varchar,
  add column max_reward_thb numeric(12,2);

comment on column public.card_base_benefit.cap_basis is
  'reward = เพดานของผลตอบแทนที่ได้ · spend = เพดานของยอดใช้จ่ายที่นับเข้าอัตรานี้ · หน่วยของ max_cap เดาจาก cap_basis + benefit_type';

comment on column public.card_base_benefit.max_reward_thb is
  'derived · ห้ามพิมพ์มือ — คำนวณผ่าน lib/rewards.ts capRewardThb() · มูลค่าเพดานเป็นบาท ใช้เทียบข้ามบัตร';

-- backfill: แถวที่มีอยู่ทั้งหมดเป็นเพดานผลตอบแทน (ตรวจ prisma/seed-cards.ts แล้ว)
update public.card_base_benefit
   set cap_basis = 'reward'
 where max_cap is not null;

-- backfill max_reward_thb ตามสูตรเดียวกับ capRewardThb()
--   cashback/discount → max_cap เป็นบาทอยู่แล้ว
--   points/miles      → max_cap เป็นคะแนน ต้องคูณค่าแต้ม
update public.card_base_benefit b
   set max_reward_thb = case
         when b.benefit_type in ('cashback','discount') then round(b.max_cap, 2)
         else round(b.max_cap * p.point_value_thb, 2)
       end
  from public.credit_cards c
       left join public.point_programs p on p.id = c.point_program_id
 where b.card_id = c.id
   and b.max_cap is not null;

alter table public.card_base_benefit
  add constraint cbb_cap_basis_valid
    check (cap_basis is null or cap_basis in ('reward','spend')),
  -- ต่อยอดจาก cap_needs_period เดิม — เพดานต้องบอกครบว่า "ต่ออะไร" และ "ของอะไร"
  add constraint cbb_cap_needs_basis
    check (max_cap is null or (cap_period is not null and cap_basis is not null)),
  -- ผูก derived ให้หายไปพร้อมกัน กันสถานะ "มีเพดานแต่ไม่มีมูลค่า"
  add constraint cbb_cap_reward_paired
    check ((max_cap is null) = (max_reward_thb is null));


-- ───────────────────────────────────────────────────────────────────────
-- 2 · card_base_benefit.min_spend_basis
--
-- "ทุก ๆ 1,000 บาท/เซลส์สลิป"  ≠  "ยอดใช้จ่ายสะสมครบ 10,000/เดือน"
-- เดิม min_spend เป็นตัวเลขลอย เป็นบั๊กชนิดเดียวกับ promotions.max_cap
--
-- ⚠️ backfill เป็น per_slip คือ **การเดา** — แถวที่มีอยู่เป็นข้อมูล seed
--    ตัวอย่าง ไม่ใช่ข้อมูลจริง · query ท้ายไฟล์ลิสต์แถวที่ต้องกลับมาตรวจ
-- ───────────────────────────────────────────────────────────────────────
alter table public.card_base_benefit
  add column min_spend_basis varchar;

comment on column public.card_base_benefit.min_spend_basis is
  'per_slip = ขั้นต่ำต่อเซลส์สลิป · per_period = ยอดสะสมครบตามรอบใน cap_period';

update public.card_base_benefit
   set min_spend_basis = 'per_slip'
 where min_spend is not null;

alter table public.card_base_benefit
  add constraint cbb_min_spend_basis_valid
    check (min_spend_basis is null or min_spend_basis in ('per_slip','per_period')),
  add constraint cbb_min_spend_needs_basis
    check (min_spend is null or min_spend_basis is not null);


-- ───────────────────────────────────────────────────────────────────────
-- 3 · requires_registration — ทั้งสองตาราง
--
-- โปรจริงจำนวนมากต้องส่ง SMS / กดปุ่มลงทะเบียนก่อนใช้สิทธิ์
-- ไม่ลงทะเบียน = ได้ 0 ไม่ใช่ได้น้อยลง
--
-- เดิมเป็น free text — prisma/seed-cards.ts:127 เก็บไว้ใน
-- cond: 'ต้องลงทะเบียนก่อนใช้สิทธิ์' ซึ่งเครื่องอ่านไม่ออก
--
-- default false ปลอดภัยกว่า true: เดาต่ำไว้ = แนะนำน้อยไป
-- ดีกว่าโฆษณาอัตราที่ user ไม่ได้จริง
-- ───────────────────────────────────────────────────────────────────────
alter table public.card_base_benefit
  add column requires_registration boolean not null default false;

alter table public.promotions
  add column requires_registration boolean not null default false;

comment on column public.card_base_benefit.requires_registration is
  'true = ต้องลงทะเบียนก่อนถึงได้อัตรานี้ · ไม่ลงทะเบียน = ได้ 0 ไม่ใช่ได้น้อยลง';

-- แถว seed ที่เขียนไว้ใน condition อยู่แล้ว — ย้ายขึ้นมาเป็น flag
update public.card_base_benefit
   set requires_registration = true
 where condition ilike '%ลงทะเบียน%'
   and condition not ilike '%ไม่ต้องลงทะเบียน%';


-- ───────────────────────────────────────────────────────────────────────
-- 4 · 6 · 7 · promotions — เพดานสองชั้น + period + อัตราเทียบเท่า
--
-- ตลาดจริงมีเพดานซ้อนกันสองชั้นพร้อมกัน เช่น
--   "เงินคืนสูงสุด 2,500 บาท/เดือน และสูงสุด 7,500 บาทตลอดรายการ"
-- ชั้นที่สองเป็น **ตัวเลขที่สอง** ไม่ใช่ cap_period ค่าใหม่
--
-- ไม่แยกเป็นตาราง promotion_caps เพราะตลาดมีแค่ 2 ชั้น และ base benefit
-- ไม่มีชั้นที่สองเลย (ไม่มีวันจบ) — แยกตารางแล้วต้อง join ทุก query
-- ของ engine ตลอดอายุโปรเจกต์เพื่อรองรับเคสที่ยังไม่มี
-- ตัวกระตุ้นให้กลับมาแยกตาราง = วันที่เจอโปรที่มีเพดานสามชั้น
--
-- effective_rate_pct ที่นี่ **nullable** ต่างจาก card_base_benefit ที่ NOT NULL
-- เพราะโปรมีหน่วยที่แปลงไม่ได้จริง (บาท/ลิตร · % ดอกเบี้ย)
-- NULL = "ยังเทียบไม่ได้" → scorePromo ถอยไปใช้ heuristic เฉพาะแถวนั้น
-- ───────────────────────────────────────────────────────────────────────
alter table public.promotions
  add column cap_period       varchar,
  add column cap_basis        varchar,
  add column max_cap_campaign numeric,
  add column effective_rate_pct numeric(8,4);

comment on column public.promotions.max_cap_campaign is
  'เพดานชั้นที่สอง = ตลอดแคมเปญ · ใช้คู่กับ max_cap + cap_period ที่เป็นเพดานต่อรอบ';

comment on column public.promotions.effective_rate_pct is
  'derived · nullable ต่างจาก card_base_benefit — NULL = หน่วยนี้ยังแปลงเป็น % ไม่ได้ (บาท/ลิตร) ไม่ใช่ "ยังไม่ได้กรอก"';

alter table public.promotions
  add constraint promo_cap_period_valid
    check (cap_period is null or cap_period in ('per_bill','per_month','per_year')),
  add constraint promo_cap_basis_valid
    check (cap_basis is null or cap_basis in ('reward','spend')),
  -- เพดานตลอดแคมเปญต้องไม่น้อยกว่าเพดานต่อรอบ ไม่งั้นชั้นแรกไม่มีความหมาย
  add constraint promo_campaign_cap_gte_period_cap
    check (max_cap_campaign is null or max_cap is null or max_cap_campaign >= max_cap);

-- ───────────────────────────────────────────────────────────────────────
-- เพดานต่อรอบต้องบอกครบว่าต่ออะไรและของอะไร (กฎเดียวกับ card_base_benefit)
--
-- ⚠️ ต้องเป็น NOT VALID — ต่างจาก `cbb_cap_needs_basis` ที่ validate ได้ทันที
--
-- `card_base_benefit` backfill `cap_basis='reward'` ได้ เพราะตรวจ seed แล้วว่า
-- เป็นเพดานผลตอบแทนทุกแถวจริง · แต่ `promotions` **ไม่มีทางรู้** ว่าแถวเดิม
-- หมายถึงอะไร — นี่คือบั๊กเงียบที่ docs/data-model.md บันทึกไว้ตั้งแต่แรกว่า
-- "max_cap เป็นตัวเลขลอย ๆ ไม่มี cap_period"
--
-- การเดาให้มันเพื่อให้ migration ผ่าน = สร้างข้อมูลปลอมที่ดูน่าเชื่อถือ
-- ซึ่งแย่กว่าปล่อยให้ว่างไว้ เพราะไม่มีใครรู้อีกต่อไปว่าตัวเลขไหนคนกรอกจริง
--
-- NOT VALID บังคับกับ INSERT/UPDATE ทุกแถวตั้งแต่วินาทีนี้ · แถวเก่าได้รับ
-- การยกเว้นจนกว่าจะมีคนแก้มัน (พอแก้แล้ว UPDATE จะโดนบังคับทันที)
--
-- เมื่อกรอกครบแล้วให้รัน:
--   alter table public.promotions validate constraint promo_cap_needs_period;
-- ───────────────────────────────────────────────────────────────────────
alter table public.promotions
  add constraint promo_cap_needs_period
    check (max_cap is null or (cap_period is not null and cap_basis is not null))
    not valid;


-- ───────────────────────────────────────────────────────────────────────
-- 5 · credit_cards.foreign_tx_fee_pct
--
-- บัตรมัก x2–x3 ที่หมวดต่างประเทศ แต่โดนค่าความเสี่ยงแปลงสกุลเงิน
-- (ปกติ 2.0–2.5%) กินคืนหมด — เป็นตัวเลขที่ใหญ่กว่าและแน่นอนกว่า
-- เรื่อง "AMEX/JCB ร้านไม่รับ" ที่เป็นเหตุผลให้มีคอลัมน์ network ด้วยซ้ำ
--
-- ⚠️ NULL = "ยังไม่รู้" **ไม่ใช่ 0** — ต้องเขียนลง docs/data-model.md
--    ตารางสรุปกฎ NULL ไม่งั้นซ้ำรอย credit_cards.point_program_id
-- ───────────────────────────────────────────────────────────────────────
alter table public.credit_cards
  add column foreign_tx_fee_pct numeric(5,2);

comment on column public.credit_cards.foreign_tx_fee_pct is
  'ค่าความเสี่ยงแปลงสกุลเงิน เป็น % · NULL = ยังไม่ได้กรอก ไม่ใช่ 0 · 0 = บัตรไม่คิดค่าธรรมเนียมนี้จริง';

alter table public.credit_cards
  add constraint cc_fx_fee_range
    check (foreign_tx_fee_pct is null or (foreign_tx_fee_pct >= 0 and foreign_tx_fee_pct <= 10));


-- ───────────────────────────────────────────────────────────────────────
-- 8 · credit_cards.status
--
-- ธนาคารเลิกออกบัตรบางรุ่นแต่คนที่ถืออยู่ยังใช้ได้ (KTC ติดป้าย
-- "สงวนสิทธิ์การรับสมัครใหม่" บนหน้าเว็บจริง) — บัตรแบบนี้ต้องยังแสดง
-- benefit ให้คนที่ถืออยู่ แต่ต้องไม่ไปโผล่ในที่ที่ให้เลือกบัตรใหม่
--
-- ไม่ใช้การลบแถว เพราะ users_card ชี้อยู่ ลบแล้วประวัติของ user หาย
-- ───────────────────────────────────────────────────────────────────────
alter table public.credit_cards
  add column status varchar not null default 'active';

comment on column public.credit_cards.status is
  'active = ยังเปิดรับสมัคร · discontinued = เลิกออกแล้ว แต่คนที่ถืออยู่ยังต้องเห็น benefit';

alter table public.credit_cards
  add constraint cc_status_valid
    check (status in ('active','discontinued'));

create index if not exists idx_credit_cards_status
  on public.credit_cards (status)
  where status = 'active';

commit;


-- ═══════════════════════════════════════════════════════════════════════
-- ตรวจหลังรัน · แถวที่ backfill ด้วยการเดา ต้องกลับมายืนยันกับเว็บธนาคาร
-- ═══════════════════════════════════════════════════════════════════════
-- select c.card_name, b.benefit_type, b.min_spend, b.min_spend_basis,
--        b.max_cap, b.cap_basis, b.max_reward_thb, b.requires_registration
--   from public.card_base_benefit b
--   join public.credit_cards c on c.id = b.card_id
--  where b.min_spend is not null or b.max_cap is not null
--  order by c.card_name, b.sort_order;
