-- ═══════════════════════════════════════════════════════════════════════
-- 003 · transactions.source + recommended_card_id
--
-- วัดว่าระบบแนะนำบัตรได้ผลจริงไหม
--
-- ── ทำไมต้องเพิ่มตอนนี้ ────────────────────────────────────────────────
--
-- ทั้งสองคอลัมน์ต้องเก็บ **ตอนที่เหตุการณ์เกิด** — ย้อนหลังไม่ได้
-- ถ้ารอไปเพิ่มตอนมี transaction หลักพัน ข้อมูลช่วงแรกทั้งหมดจะวัดไม่ได้
-- ตลอดกาล และช่วงแรกคือช่วงที่อยากรู้ที่สุดว่า engine ทำงานไหม
--
-- ตอนนี้มี transaction แค่ 10 แถว = ต้นทุนต่ำสุดที่จะเพิ่ม
--
-- ── ตอบคำถามอะไรได้ ──────────────────────────────────────────────────
--
--   ระบบแนะนำไปกี่ครั้ง          recommended_card_id is not null
--   user รูดตามที่แนะนำกี่ครั้ง   recommended_card_id = users_card_id
--   รูดสวนคำแนะนำกี่ครั้ง        recommended_card_id <> users_card_id
--   รายการมาจากช่องทางไหน       group by source
--
-- รันที่ Supabase แล้วตามด้วย: npx prisma db pull && npx prisma generate
-- ═══════════════════════════════════════════════════════════════════════

begin;

alter table public.transactions
  -- ช่องทางที่รายการถูกบันทึกเข้ามา
  --   liff   = กรอกในแอป (ค่าเริ่มต้น — ทางเดียวที่มีตอนนี้)
  --   chat   = ยืนยันผ่าน LINE chat (#24 Chat-based Quick Advisor)
  --   ocr    = อ่านจาก statement (#21)
  --   import = นำเข้าเป็นชุด / seed
  add column source varchar not null default 'liff'
    check (source in ('liff','chat','ocr','import')),

  -- บัตรที่ระบบแนะนำ ณ ตอนที่ user กำลังจะรูด
  --   NULL = ตอนนั้นไม่ได้แสดงคำแนะนำ (บันทึกย้อนหลัง / ไม่ได้ผ่านหน้าแนะนำ)
  --   ไม่ใช่ NULL = แสดงคำแนะนำแล้ว → เทียบกับ users_card_id ได้ว่าทำตามไหม
  --
  -- ชี้ไป users_card ไม่ใช่ credit_cards เพราะคำแนะนำคือ "รูดบัตรใบนี้ของคุณ"
  -- และต้องเทียบกับ users_card_id ได้ตรง ๆ
  --
  -- on delete set null — ลบบัตรออกจากกระเป๋าแล้วไม่ควรทำให้ transaction หาย
  -- เสียแค่ข้อมูลว่าเคยแนะนำใบไหน ซึ่งยอมรับได้
  add column recommended_card_id uuid
    references public.users_card(id) on delete set null;

create index idx_transactions_source on public.transactions (source);
create index idx_transactions_recommended on public.transactions (recommended_card_id)
  where recommended_card_id is not null;

comment on column public.transactions.source is
  'ช่องทางที่บันทึกเข้ามา: liff | chat | ocr | import';
comment on column public.transactions.recommended_card_id is
  'บัตรที่ระบบแนะนำตอนนั้น · NULL = ไม่ได้แสดงคำแนะนำ · เท่ากับ users_card_id = user ทำตาม';

-- แถวเดิม 10 แถวได้ source='liff' จาก default และ recommended_card_id=NULL
-- ซึ่งตรงความจริง — ตอนนั้นยังไม่มีระบบวัดผล

commit;


-- ═══════════════════════════════════════════════════════════════════════
-- Query ที่ dashboard จะใช้
-- ═══════════════════════════════════════════════════════════════════════
-- select
--   count(*) filter (where recommended_card_id is not null)                        as แสดงคำแนะนำ,
--   count(*) filter (where recommended_card_id = users_card_id)                    as ทำตาม,
--   count(*) filter (where recommended_card_id is not null
--                      and recommended_card_id <> users_card_id)                   as รูดสวน
-- from public.transactions;
