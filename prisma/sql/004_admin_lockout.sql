-- ═══════════════════════════════════════════════════════════════════════
-- 004 · ล็อกบัญชี admin เมื่อกรอกรหัสผิดหลายครั้ง
--
-- ── ทำไมเลือกวิธีนี้แทน rate limit ตาม IP ────────────────────────────
--
-- limiter ที่เก็บนับใน memory ใช้ไม่ได้บน serverless เพราะแต่ละ instance
-- นับแยกกัน — ให้ความรู้สึกปลอดภัยปลอม ๆ · จะทำให้ได้ผลจริงต้องมี store
-- กลาง (Redis) ซึ่งเป็นบริการเพิ่มอีกตัว
--
-- แต่ Postgres ที่เรามีอยู่แล้วก็เป็น store กลาง — นับใส่ตาราง admin_users
-- ตรง ๆ ได้เลย ทำงานข้าม instance สมบูรณ์ ไม่ต้องเพิ่มอะไร
--
-- และตรงกับภัยจริงกว่าด้วย: คนจะเจาะบัญชีที่รู้ว่ามีอยู่ ไม่ใช่ยิงสุ่ม IP
--
-- รันที่ Supabase แล้วตามด้วย: npx prisma db pull && npx prisma generate
-- ═══════════════════════════════════════════════════════════════════════

begin;

alter table public.admin_users
  -- นับครั้งที่กรอกรหัสผิดติดกัน · ล็อกอินสำเร็จเมื่อไหร่ reset เป็น 0
  add column failed_attempts int not null default 0
    check (failed_attempts >= 0),

  -- ล็อกถึงเมื่อไหร่ · NULL = ไม่ได้ถูกล็อก
  -- เลยเวลานี้แล้วให้ลองใหม่ได้เลย ไม่ต้องมีใครไปปลดให้
  add column locked_until timestamptz;

comment on column public.admin_users.failed_attempts is
  'จำนวนครั้งที่กรอกรหัสผิดติดกัน · reset เป็น 0 เมื่อล็อกอินสำเร็จ';
comment on column public.admin_users.locked_until is
  'ล็อกบัญชีถึงเวลานี้ · NULL = ไม่ได้ถูกล็อก · ปลดเองเมื่อเลยเวลา';

commit;
