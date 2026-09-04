import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'
import { cardDetailSchema } from '@/lib/validations/card-detail'
import {
  capRewardThb,
  effectiveRatePct,
  RewardCalculationError,
  type BenefitType,
} from '@/lib/rewards'

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req)
  if (auth instanceof NextResponse) return auth

  try {
    const { id } = await ctx.params
    const card = await prisma.credit_cards.findUnique({
      where: { id },
      include: {
        card_base_benefit: { orderBy: { sort_order: 'asc' } },
        card_perks: { orderBy: { sort_order: 'asc' } },
      },
    })
    if (!card) return NextResponse.json({ error: 'ไม่พบบัตร' }, { status: 404 })
    return NextResponse.json(card)
  } catch (err) {
    console.error('[GET /api/admin/cards/[id]]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

/**
 * บันทึกทั้งใบในทรานแซกชันเดียว — ข้อมูลบัตร + อัตราทุกแถว + สิทธิพิเศษทุกแถว
 *
 * วิธี sync แถว: แถวที่มี `id` = แก้ของเดิม (คง created_by ไว้) · ไม่มี `id`
 * = แถวใหม่ · แถวเดิมที่ไม่ถูกส่งมา = ถูกลบ
 *
 * ไม่ใช้วิธีลบทิ้งทั้งหมดแล้วสร้างใหม่ เพราะจะเสียประวัติว่าใครสร้างแถวนั้น
 * ตอนไหน ซึ่งเป็นข้อมูลที่ `created_by` มีไว้เพื่อสิ่งนี้โดยเฉพาะ
 */
export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req)
  if (auth instanceof NextResponse) return auth

  try {
    const { id } = await ctx.params
    const { card, benefits, perks } = cardDetailSchema.parse(await req.json())

    const exists = await prisma.credit_cards.findUnique({ where: { id } })
    if (!exists) return NextResponse.json({ error: 'ไม่พบบัตร' }, { status: 404 })

    // ต้องรู้ค่าแต้มก่อนถึงจะคำนวณ effective_rate_pct ได้
    const program = card.point_program_id
      ? await prisma.point_programs.findUnique({
          where: { id: card.point_program_id },
          select: { point_value_thb: true },
        })
      : null

    if (card.point_program_id && !program) {
      return NextResponse.json({ error: 'ไม่พบโปรแกรมสะสมที่เลือก' }, { status: 400 })
    }
    const programInput = program ? { point_value_thb: Number(program.point_value_thb) } : null

    // คำนวณอัตราและมูลค่าเพดานทุกแถวก่อนเข้า transaction — ถ้าแถวไหนคำนวณไม่ได้
    // ให้ตอบกลับพร้อมบอกว่าแถวที่เท่าไหร่ ไม่ใช่ล้มทั้งก้อนแบบไม่รู้สาเหตุ
    const rates: number[] = []
    const caps: (number | null)[] = []
    for (const [i, b] of benefits.entries()) {
      const input = {
        benefit_type: b.benefit_type as BenefitType,
        benefit_value: b.benefit_value,
        benefit_unit: b.benefit_unit,
        spend_per_unit: b.spend_per_unit ?? null,
      }
      try {
        rates.push(effectiveRatePct(input, programInput))
        caps.push(
          capRewardThb(
            { ...input, max_cap: b.max_cap ?? null, cap_basis: b.cap_basis ?? null },
            programInput,
          ),
        )
      } catch (e) {
        if (e instanceof RewardCalculationError) {
          return NextResponse.json(
            { error: `อัตราแถวที่ ${i + 1}: ${e.message}` },
            { status: 400 },
          )
        }
        throw e
      }
    }

    await prisma.$transaction(async tx => {
      await tx.credit_cards.update({
        where: { id },
        data: { ...card, updated_date: new Date(), updated_by: auth.email },
      })

      // ── benefits ──────────────────────────────────────────────────
      const keepBenefitIds = benefits.map(b => b.id).filter(Boolean) as string[]
      await tx.card_base_benefit.deleteMany({
        where: { card_id: id, ...(keepBenefitIds.length ? { id: { notIn: keepBenefitIds } } : {}) },
      })

      for (const [i, b] of benefits.entries()) {
        const data = {
          card_id: id,
          category_id: b.category_id ?? null,
          benefit_type: b.benefit_type,
          benefit_value: b.benefit_value,
          benefit_unit: b.benefit_unit,
          spend_per_unit: b.spend_per_unit ?? null,
          min_spend: b.min_spend ?? null,
          min_spend_basis: b.min_spend_basis ?? null,
          max_cap: b.max_cap ?? null,
          cap_period: b.cap_period ?? null,
          cap_basis: b.cap_basis ?? null,
          requires_registration: b.requires_registration,
          condition: b.condition ?? null,
          effective_rate_pct: rates[i],
          max_reward_thb: caps[i],
          sort_order: i,
        }
        if (b.id) {
          await tx.card_base_benefit.update({
            where: { id: b.id },
            data: { ...data, updated_date: new Date(), updated_by: auth.email },
          })
        } else {
          await tx.card_base_benefit.create({ data: { ...data, created_by: auth.email } })
        }
      }

      // ── perks ─────────────────────────────────────────────────────
      const keepPerkIds = perks.map(p => p.id).filter(Boolean) as string[]
      await tx.card_perks.deleteMany({
        where: { card_id: id, ...(keepPerkIds.length ? { id: { notIn: keepPerkIds } } : {}) },
      })

      for (const [i, p] of perks.entries()) {
        const data = {
          card_id: id,
          perk_type: p.perk_type,
          title: p.title,
          value_text: p.value_text ?? null,
          description: p.description ?? null,
          condition: p.condition ?? null,
          sort_order: i,
        }
        if (p.id) {
          await tx.card_perks.update({
            where: { id: p.id },
            data: { ...data, updated_date: new Date(), updated_by: auth.email },
          })
        } else {
          await tx.card_perks.create({ data: { ...data, created_by: auth.email } })
        }
      }
    })

    return NextResponse.json({ ok: true, benefits: benefits.length, perks: perks.length })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(' · ') },
        { status: 400 },
      )
    }
    console.error('[PUT /api/admin/cards/[id]]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
