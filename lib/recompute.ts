/**
 * คำนวณ `effective_rate_pct` ใหม่เมื่อค่าแต้มของโปรแกรมเปลี่ยน (งาน 4.2)
 *
 * ── ทำไมต้องมี ─────────────────────────────────────────────────────────
 *
 * `effective_rate_pct` เป็นค่า derived ที่เก็บซ้ำไว้ใน `card_base_benefit`
 * เพื่อให้ engine เทียบข้ามบัตรได้ใน query เดียว — แลกมาด้วยภาระว่าต้อง
 * sync เองเมื่อต้นทางเปลี่ยน
 *
 * ธนาคารลดค่าแต้มเป็นเรื่องปกติ (K Point จาก ฿0.10 → ฿0.08) ถ้าแก้แค่
 * `point_programs.point_value_thb` แล้วจบ อัตราของบัตรทุกใบในโปรแกรมนั้น
 * จะยังเป็นค่าเก่า → ระบบแนะนำบัตรผิดทั้งกระดานโดยไม่มีอะไรฟ้อง
 *
 * นี่คือเหตุผลครึ่งหนึ่งที่แยก `point_programs` ออกมาเป็นตารางต่างหาก
 * ตั้งแต่แรก — ประโยชน์จะหายไปทันทีถ้าไม่มีฟังก์ชันนี้
 */

import { prisma } from '@/lib/prisma'
import {
  capRewardThb,
  effectiveRatePct,
  type BenefitType,
  type CapBasis,
} from '@/lib/rewards'

/**
 * คำนวณอัตราใหม่ให้ทุกแถวของทุกบัตรในโปรแกรมนี้
 *
 * `max_reward_thb` แขวนอยู่กับ `point_value_thb` ตัวเดียวกัน จึงต้อง
 * คำนวณใหม่พร้อมกันในลูปเดิม — ทั้งสองแบบพึ่งค่าแต้มจริง:
 *   cap_basis='reward' → max_cap (คะแนน) × point_value_thb
 *   cap_basis='spend'  → max_cap (บาท)   × effective_rate_pct ที่เพิ่งเปลี่ยน
 *
 * @returns จำนวนแถวที่ค่าเปลี่ยนจริง (แถวที่คำนวณแล้วได้เท่าเดิมไม่นับ)
 */
export async function recomputeProgramRates(
  programId: string,
  updatedBy: string,
): Promise<number> {
  const program = await prisma.point_programs.findUnique({
    where: { id: programId },
    select: { point_value_thb: true },
  })
  if (!program) return 0

  const cards = await prisma.credit_cards.findMany({
    where: { point_program_id: programId },
    select: { id: true },
  })
  if (cards.length === 0) return 0

  const benefits = await prisma.card_base_benefit.findMany({
    where: { card_id: { in: cards.map(c => c.id) } },
  })

  const programInput = { point_value_thb: Number(program.point_value_thb) }
  let changed = 0

  for (const b of benefits) {
    // cashback/discount ไม่ได้พึ่งค่าแต้ม — ข้ามไป ไม่ต้องเขียนทับ
    if (b.benefit_type !== 'points' && b.benefit_type !== 'miles') continue

    const input = {
      benefit_type: b.benefit_type as BenefitType,
      benefit_value: Number(b.benefit_value),
      benefit_unit: b.benefit_unit,
      spend_per_unit: b.spend_per_unit == null ? null : Number(b.spend_per_unit),
    }

    const next = effectiveRatePct(input, programInput)
    const nextCap = capRewardThb(
      {
        ...input,
        max_cap: b.max_cap == null ? null : Number(b.max_cap),
        cap_basis: b.cap_basis as CapBasis | null,
      },
      programInput,
    )

    const prevCap = b.max_reward_thb == null ? null : Number(b.max_reward_thb)
    if (Number(b.effective_rate_pct) === next && prevCap === nextCap) continue

    await prisma.card_base_benefit.update({
      where: { id: b.id },
      data: {
        effective_rate_pct: next,
        max_reward_thb: nextCap,
        updated_date: new Date(),
        updated_by: updatedBy,
      },
    })
    changed++
  }

  return changed
}
