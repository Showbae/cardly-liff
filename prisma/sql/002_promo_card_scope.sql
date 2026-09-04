-- ═══════════════════════════════════════════════════════════════════════
-- 002 · promotions.card_scope
--
-- แยกโปรสองชนิดที่เจอจริงให้ชัด แทนการเดาจากจำนวนแถวใน promotion_cards
--
--   all_bank        โปรของธนาคาร ใช้ได้ทุกใบ  ("บัตร KTC ทุกประเภท")
--   specific_cards  โปรจำกัดบัตร              ("เฉพาะบัตร KTC Signature")
--
-- ปัญหาที่แก้: เดิม promotion_cards ว่าง มีสองความหมายที่แยกไม่ออก —
-- "ใช้ได้ทุกใบจริง ๆ" กับ "ยังไม่มีใครกรอก" ซึ่งเป็น error เงียบชนิดเดียว
-- กับที่เจอใน credit_cards.point_program_id
--
-- รันที่ Supabase แล้วตามด้วย: npx prisma db pull && npx prisma generate
-- ═══════════════════════════════════════════════════════════════════════

begin;

-- default 'all_bank' ทำให้โปรเดิมทั้งหมดได้พฤติกรรมเดิมเป๊ะ
-- และ recommend/route.ts ยังทำงานถูกโดยไม่ต้องแก้ (ดูหมายเหตุท้ายไฟล์)
alter table public.promotions
  add column card_scope varchar not null default 'all_bank'
    check (card_scope in ('all_bank','specific_cards'));

comment on column public.promotions.card_scope is
  'all_bank = ใช้ได้ทุกใบของธนาคาร (promotion_cards ต้องว่าง) · specific_cards = เฉพาะใบที่ระบุใน promotion_cards';


-- ───────────────────────────────────────────────────────────────────────
-- Constraint trigger · ทั้งสองชนิดต้องสอดคล้องกับ promotion_cards
--
-- ใช้ CONSTRAINT TRIGGER แบบ DEFERRABLE เพราะการกรอกโปรจริงจะ insert
-- แถว promotions ก่อนแล้วค่อย insert promotion_cards ตามใน transaction
-- เดียวกัน — ถ้าเช็กทันทีตอน insert จะพังทุกครั้งทั้งที่ข้อมูลถูก
-- การเช็กจึงเลื่อนไปตอน COMMIT
-- ───────────────────────────────────────────────────────────────────────
create or replace function public.check_promo_card_scope()
returns trigger
language plpgsql
as $$
declare
  v_promo_id uuid;
  v_scope    text;
  v_count    int;
begin
  -- หา promotion_id ให้ได้ไม่ว่าจะถูกเรียกจากตารางไหน / operation ไหน
  if tg_table_name = 'promotions' then
    v_promo_id := new.id;
  elsif tg_op = 'DELETE' then
    v_promo_id := old.promotion_id;
  else
    v_promo_id := new.promotion_id;
  end if;

  select card_scope into v_scope from public.promotions where id = v_promo_id;
  if v_scope is null then return null; end if;   -- โปรถูกลบไปแล้ว ไม่ต้องเช็ก

  select count(*) into v_count
    from public.promotion_cards where promotion_id = v_promo_id;

  if v_scope = 'specific_cards' and v_count = 0 then
    raise exception
      'promotion % ตั้ง card_scope=specific_cards แต่ไม่มีแถวใน promotion_cards — ต้องระบุว่าใช้ได้กับบัตรใบไหน',
      v_promo_id;
  end if;

  if v_scope = 'all_bank' and v_count > 0 then
    raise exception
      'promotion % ตั้ง card_scope=all_bank แต่มี % แถวใน promotion_cards — ถ้าจำกัดบัตรให้เปลี่ยนเป็น specific_cards',
      v_promo_id, v_count;
  end if;

  return null;
end;
$$;

create constraint trigger trg_promo_scope_on_promotion
  after insert or update of card_scope on public.promotions
  deferrable initially deferred
  for each row execute function public.check_promo_card_scope();

create constraint trigger trg_promo_scope_on_cards
  after insert or delete on public.promotion_cards
  deferrable initially deferred
  for each row execute function public.check_promo_card_scope();

commit;


-- ═══════════════════════════════════════════════════════════════════════
-- หมายเหตุ · ยังไม่ต้องแก้ recommend/route.ts
--
--   if (promo.promotion_cards.length > 0 &&
--       !promo.promotion_cards.some(pc => pc.card_id === cardId)) return null
--
-- logic เดิมยังถูกต้องหลัง migration นี้ เพราะ trigger รับประกันแล้วว่า
--   all_bank        → promotion_cards ว่างเสมอ  → เงื่อนไขแรกเป็น false → ผ่าน
--   specific_cards  → มีแถวเสมอ                → กรองตามบัตรถูกต้อง
--
-- สิ่งที่เปลี่ยนคือ "ว่าง" ไม่ได้แปลว่า "อาจจะยังไม่ได้กรอก" อีกต่อไป
-- ให้เปลี่ยนไปอ่าน card_scope ตรง ๆ ตอนทำงาน 6.2 เพื่อให้โค้ดอ่านเข้าใจง่ายขึ้น
-- ═══════════════════════════════════════════════════════════════════════
