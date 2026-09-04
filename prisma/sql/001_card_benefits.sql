-- ═══════════════════════════════════════════════════════════════════════
-- Phase 0 · Card Benefits + Admin Auth
-- Feature #23 — Card Profile & Benefits Summary
--
-- เหตุผลของทุกการตัดสินใจอยู่ที่ docs/admin-portal.md (ตารางบันทึกการตัดสินใจ)
-- ความหมายของแต่ละคอลัมน์อยู่ที่ docs/data-model.md
--
-- รันที่ Supabase SQL Editor แล้วตามด้วย:
--   npx prisma db pull && npx prisma generate
--
-- ⚠️ ไฟล์นี้อยู่ใน prisma/sql/ ไม่ใช่ prisma/migrations/
--    เพราะยังไม่ตัดสินว่าจะย้ายมาใช้ migration file หรือคง workflow db pull
-- ═══════════════════════════════════════════════════════════════════════

begin;

-- ───────────────────────────────────────────────────────────────────────
-- 0.1 · point_programs — ตัวแปลงหน่วยสะสมเป็นบาท
--
-- มีอยู่เพื่องานเดียว: แปลง "คะแนน" เป็น "บาท" ให้เทียบกับบัตรเงินคืนได้
-- ต้องแยกจาก banks เพราะธนาคารเดียวมีได้หลายโปรแกรม (KTC มีทั้งบัตรสะสม
-- แต้มและบัตรเงินคืนล้วน) และแยกจาก credit_cards เพราะธนาคารลดค่าแต้มที
-- ต้องแก้แถวเดียว ไม่ใช่ไล่แก้บัตรทีละใบ
-- ───────────────────────────────────────────────────────────────────────
create table public.point_programs (
  id                    uuid primary key default gen_random_uuid(),
  bank_id               varchar     not null references public.banks(id),
  name                  varchar     not null,

  -- 1 คะแนน = กี่บาท · NOT NULL เพราะแถวนี้จะมีอยู่ก็ต่อเมื่อเป็นโปรแกรม
  -- สะสมแต้มจริง ๆ เท่านั้น (บัตรเงินคืนใช้ credit_cards.point_program_id = NULL)
  -- ถ้ายอมให้ NULL จะกลับไปสู่ปัญหา "แยกไม่ออกว่าไม่มีแต้ม vs ยังไม่ได้กรอก"
  point_value_thb       numeric(10,4) not null check (point_value_thb > 0),

  -- ตีค่าจากช่องทางแลกไหน — 1,000 คะแนนแลกเงินคืนได้ ฿250 แต่แลกไมล์ได้
  -- มูลค่า ~฿400 ถ้าคนกรอกคนละมาตรฐาน บัตรสองใบจะเทียบกันไม่ได้
  valuation_basis       varchar     not null
                        check (valuation_basis in ('cashback','miles','voucher')),
  valuation_source_url  text,

  -- คอลัมน์เดียวที่ตอบได้ว่า "ตัวเลขนี้เก่าไปหรือยัง" — effective_rate_pct
  -- ของทุกบัตรในโปรแกรมนี้แขวนอยู่กับ point_value_thb ตัวเดียว
  valuation_checked_at  date        not null default current_date,

  -- display-only · จงใจไม่ให้เข้าสูตร effective_rate_pct
  point_expiry_months   int         check (point_expiry_months > 0),  -- NULL = ไม่หมดอายุ
  min_redemption        int         check (min_redemption > 0),

  created_date          timestamptz not null default now(),
  created_by            varchar,
  updated_date          timestamptz,
  updated_by            varchar,

  unique (bank_id, name)
);

create index idx_point_programs_bank on public.point_programs (bank_id);

comment on table  public.point_programs is
  'หน่วยสะสมของบัตรและอัตราแลกเป็นบาท · หนึ่งแถว = หนึ่งโปรแกรม (K Point, KTC FOREVER) · บัตรเงินคืนไม่มีแถวที่นี่';
comment on column public.point_programs.point_value_thb is
  'มูลค่าของ 1 คะแนน/ไมล์ เป็นบาท · ใช้คำนวณ card_base_benefit.effective_rate_pct';
comment on column public.point_programs.point_expiry_months is
  'NULL = คะแนนไม่มีวันหมดอายุ · display-only ไม่เข้าสูตรคำนวณ';


-- ───────────────────────────────────────────────────────────────────────
-- 0.2 · credit_cards — เพิ่ม 4 คอลัมน์
-- ───────────────────────────────────────────────────────────────────────
alter table public.credit_cards
  -- NULL = บัตรเงินคืน หน่วยเป็นบาทอยู่แล้ว ไม่ต้องแปลง
  -- ไม่ใช่ "ยังไม่ได้กรอก" (ดู trigger ท้ายไฟล์ที่บังคับเรื่องนี้)
  add column point_program_id     uuid references public.point_programs(id),

  -- AMEX/JCB ร้านไม่รับทุกที่ในไทย → เป็นข้อมูลที่ป้อนเข้า engine
  -- ค่าตรงกับ type Network ใน components/liff/AddCardWizard.tsx
  add column network              varchar
                                  check (network in ('visa','mastercard','jcb','amex','unionpay')),

  -- อยู่ที่นี่ไม่ใช่ card_perks เพราะบัตรทุกใบมีค่าธรรมเนียม (บางใบ = 0)
  -- ไม่ใช่สิทธิพิเศษที่บางใบมีบางใบไม่มี · เก็บเป็นตัวเลขเพื่อเรียง/เทียบข้ามบัตรได้
  add column annual_fee           numeric(10,2) check (annual_fee >= 0),
  add column fee_waiver_condition text;

create index idx_credit_cards_point_program on public.credit_cards (point_program_id);

comment on column public.credit_cards.point_program_id is
  'NULL = บัตรเงินคืน (หน่วยเป็นบาทอยู่แล้ว) ไม่ใช่ "ยังไม่ได้กรอก"';
comment on column public.credit_cards.network is
  'เครือข่ายบัตร · ระดับ product ไม่ใช่ users_card เพราะ engine ต้องใช้ตัดสินว่ารูดที่ร้านนั้นได้ไหม';


-- ───────────────────────────────────────────────────────────────────────
-- 0.3 · card_base_benefit — รื้อสร้างใหม่
--
-- ของเดิมมีแค่ benefit_type / multiple_rate / condition ซึ่งเก็บหน่วย เพดาน
-- ขั้นต่ำ และหมวดไม่ได้เลย · ไม่มีโค้ดไหนอ่านมันแม้แต่บรรทัดเดียว จึงรื้อได้ฟรี
-- ───────────────────────────────────────────────────────────────────────
drop table if exists public.card_base_benefit;

create table public.card_base_benefit (
  id                 uuid        primary key default gen_random_uuid(),
  card_id            uuid        not null references public.credit_cards(id) on delete cascade,

  -- NULL = อัตราพื้นฐานที่ใช้กับทุกหมวด (บรรทัด "ใช้จ่ายทั่วไป" บนหน้าจอ)
  category_id        uuid        references public.categories(id),

  -- ตั้งชื่อให้ตรงกับ promotions โดยตั้งใจ เพื่อให้ engine เขียนฟังก์ชัน
  -- คิดคะแนนตัวเดียวใช้ได้กับทั้ง promo และ base rate ไม่ต้องมีสองสูตร
  benefit_type       varchar     not null
                     check (benefit_type in ('cashback','points','miles','discount')),
  benefit_value      numeric     not null check (benefit_value >= 0),
  benefit_unit       varchar     not null,   -- '%' · 'คะแนน' · 'ไมล์' · 'บาท' · 'บาท/ลิตร'

  -- "1 คะแนน ต่อ 25 บาท" เป็นอัตราส่วน ไม่ใช่ตัวเลขเดียว
  -- NULL = ไม่ใช่อัตราส่วน (บัตรเงินคืนใช้ % ตรง ๆ)
  spend_per_unit     numeric     check (spend_per_unit > 0),

  min_spend          numeric     check (min_spend >= 0),
  max_cap            numeric     check (max_cap >= 0),

  -- promotions.max_cap ไม่มีคอลัมน์นี้ = บั๊กเงียบที่มีอยู่แล้ว
  -- ("฿1,000 ต่อรอบบิล" กับ "ต่อปี" ต่างกันมาก) — ที่นี่ไม่ทำซ้ำ
  cap_period         varchar     check (cap_period in ('per_bill','per_month','per_year')),

  condition          text,

  -- ค่า derived · ห้ามพิมพ์มือ · คำนวณผ่าน lib/rewards.ts → effectiveRatePct()
  --   cashback: = benefit_value
  --   points  : = benefit_value × point_value_thb ÷ spend_per_unit × 100
  effective_rate_pct numeric(8,4) not null check (effective_rate_pct >= 0),

  sort_order         int         not null default 0,

  created_date       timestamptz not null default now(),
  created_by         varchar,
  updated_date       timestamptz,
  updated_by         varchar,

  -- มีเพดานแล้วต้องบอกว่าเพดานต่ออะไร — กันไม่ให้เกิดบั๊กแบบ promotions.max_cap
  constraint cap_needs_period check (max_cap is null or cap_period is not null),

  -- หน่วยที่เป็นอัตราส่วนต้องมีตัวหาร ไม่งั้นสูตรหารด้วย NULL
  constraint ratio_needs_divisor
    check (benefit_type not in ('points','miles') or spend_per_unit is not null)
);

-- ไม่ใส่ unique (card_id, category_id) โดยตั้งใจ — บัตรใบเดียวมีหลายอัตรา
-- ในหมวดเดียวกันได้ เช่น "8% เสาร์-อาทิตย์" กับ "3% วันธรรมดา"
create index idx_cbb_card     on public.card_base_benefit (card_id);
create index idx_cbb_category on public.card_base_benefit (category_id);
create index idx_cbb_rate     on public.card_base_benefit (effective_rate_pct desc);

comment on table  public.card_base_benefit is
  'อัตราตอบแทนพื้นฐานที่ได้ตลอด (ต่างจาก promotions ที่มีวันหมด) · แถวนี้ให้เครื่องอ่านไปคิด net reward';
comment on column public.card_base_benefit.category_id is
  'NULL = ใช้กับทุกหมวด (อัตราพื้นฐาน)';
comment on column public.card_base_benefit.effective_rate_pct is
  'ค่า derived ห้ามพิมพ์มือ · คำนวณผ่าน lib/rewards.ts เท่านั้น เพื่อให้สูตรมีที่เดียวในระบบ';


-- ───────────────────────────────────────────────────────────────────────
-- 0.4 · card_perks — สิทธิพิเศษที่คิดเป็นอัตราไม่ได้
--
-- แยกจาก card_base_benefit เพราะคนละหน้าที่: rate ให้เครื่องอ่าน
-- perk ให้คนอ่าน · ตารางนี้ไม่มีคอลัมน์ตัวเลขเลยสักช่อง
-- ───────────────────────────────────────────────────────────────────────
create table public.card_perks (
  id           uuid        primary key default gen_random_uuid(),
  card_id      uuid        not null references public.credit_cards(id) on delete cascade,

  -- ไม่มี 'fee_waiver' โดยตั้งใจ — ค่าธรรมเนียมรายปีอยู่ที่
  -- credit_cards.annual_fee + fee_waiver_condition เพราะบัตรทุกใบมี
  perk_type    varchar     not null
               check (perk_type in ('lounge','insurance','parking','dining',
                                    'golf','health','travel','shopping','other')),

  title        varchar     not null,        -- 'ห้องรับรองสนามบิน'
  value_text   varchar,                     -- '2 ครั้ง/ปี' · 'สูงสุด ฿8,000,000'
  description  text,
  condition    text,
  sort_order   int         not null default 0,

  created_date timestamptz not null default now(),
  created_by   varchar,
  updated_date timestamptz,
  updated_by   varchar
);

create index idx_card_perks_card on public.card_perks (card_id);

comment on table public.card_perks is
  'สิทธิพิเศษเชิงคุณภาพ · แสดงผลอย่างเดียว ไม่เข้าสูตรคำนวณ · ค่าธรรมเนียมรายปีไม่อยู่ที่นี่';


-- ───────────────────────────────────────────────────────────────────────
-- 0.5 · admin_users + admin_sessions
--
-- ตาราง sessions เดิม FK ผูกกับ users (LINE user) ใช้ร่วมไม่ได้
-- ───────────────────────────────────────────────────────────────────────
create table public.admin_users (
  id            uuid        primary key default gen_random_uuid(),
  email         varchar     not null unique,

  -- argon2 เท่านั้น · อย่า hash เอง
  password_hash text        not null,

  display_name  varchar,
  is_active     boolean     not null default true,
  last_login    timestamptz,

  created_date  timestamptz not null default now(),
  created_by    varchar,
  updated_date  timestamptz,
  updated_by    varchar
);

create table public.admin_sessions (
  id            uuid        primary key default gen_random_uuid(),
  admin_user_id uuid        not null references public.admin_users(id) on delete cascade,

  -- crypto.randomBytes(32).toString('hex') → 64 ตัวอักษร
  -- ห้ามใช้ UUID · UUID v4 ออกแบบมาให้ไม่ซ้ำ ไม่ได้ออกแบบมาเป็นความลับ
  token         varchar     not null unique check (length(token) >= 64),

  expires_at    timestamptz not null,
  last_used_at  timestamptz not null default now(),
  created_date  timestamptz not null default now()
);

create index idx_admin_sessions_token   on public.admin_sessions (token);
create index idx_admin_sessions_expires on public.admin_sessions (expires_at);
create index idx_admin_sessions_user    on public.admin_sessions (admin_user_id);

comment on column public.admin_sessions.token is
  'crypto.randomBytes(32).toString(''hex'') — ห้ามใช้ UUID';


-- ───────────────────────────────────────────────────────────────────────
-- Trigger · บัตรที่ให้คะแนนต้องผูกกับโปรแกรมสะสม
--
-- CHECK constraint ธรรมดาทำไม่ได้เพราะต้องอ่านข้ามตาราง
-- ถ้าไม่มีตัวนี้ บัตรสะสมแต้มที่ลืมผูกโปรแกรมจะได้ effective_rate_pct = 0
-- แล้วไม่เคยถูกแนะนำเลยตลอดกาลโดยไม่มีใครสังเกต
-- ───────────────────────────────────────────────────────────────────────
create or replace function public.check_benefit_needs_program()
returns trigger
language plpgsql
as $$
begin
  if new.benefit_type in ('points','miles')
     and not exists (
       select 1 from public.credit_cards c
       where c.id = new.card_id and c.point_program_id is not null
     )
  then
    raise exception
      'benefit_type=% ต้องการให้บัตร % ผูกกับ point_programs ก่อน (credit_cards.point_program_id ยังเป็น NULL)',
      new.benefit_type, new.card_id;
  end if;
  return new;
end;
$$;

create trigger trg_benefit_needs_program
  before insert or update on public.card_base_benefit
  for each row execute function public.check_benefit_needs_program();


-- ───────────────────────────────────────────────────────────────────────
-- 0.6 · RLS
--
-- เปิด RLS แบบ "ไม่มี policy เลย" = ปิด Supabase REST API (PostgREST)
-- สำหรับตารางเหล่านี้อย่างสมบูรณ์ ซึ่งเป็นสิ่งที่ต้องการ เพราะ
-- @supabase/supabase-js ถูกเรียกใช้ 0 ครั้งทั้งโปรเจกต์ — data access
-- ทั้งหมดผ่าน Prisma + pg.Pool
--
-- ⚠️ ตรวจสอบก่อน: ถ้า DATABASE_URL ต่อด้วย role `postgres` (ค่า default
--    ของ Supabase) จะ bypass RLS ทำให้ Prisma ทำงานได้ตามปกติ
--    ถ้าเปลี่ยนไปใช้ role อื่นในอนาคต ต้องเพิ่ม policy หรือ grant ให้ชัด
-- ───────────────────────────────────────────────────────────────────────
alter table public.point_programs    enable row level security;
alter table public.card_base_benefit enable row level security;
alter table public.card_perks        enable row level security;
alter table public.admin_users       enable row level security;
alter table public.admin_sessions    enable row level security;

commit;


-- ═══════════════════════════════════════════════════════════════════════
-- ตรวจผล
-- ═══════════════════════════════════════════════════════════════════════
-- select table_name, row_security
--   from information_schema.tables t
--   join pg_class c on c.relname = t.table_name
--  where table_schema = 'public'
--    and table_name in ('point_programs','card_base_benefit','card_perks',
--                       'admin_users','admin_sessions');
--
-- select column_name, data_type, is_nullable
--   from information_schema.columns
--  where table_name = 'credit_cards'
--    and column_name in ('point_program_id','network','annual_fee','fee_waiver_condition');
