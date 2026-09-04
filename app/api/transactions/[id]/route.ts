import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ error: 'invalid uuid' }, { status: 400 })
    }
    await prisma.transactions.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/transactions/[id]]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

const patchSchema = z.object({
  amount:     z.number().positive().max(999_999.99).optional(),
  spentAt:    z.string().datetime().optional(),
  merchantId: z.string().regex(UUID_RE, 'invalid uuid').optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ error: 'invalid uuid' }, { status: 400 })
    }

    const body = await req.json()
    const data = patchSchema.parse(body)

    const updateData: {
      amount?: number
      spent_at?: Date
      merchant_id?: string
      note?: string | null
    } = {}

    if (data.amount !== undefined) updateData.amount = data.amount
    if (data.spentAt !== undefined) updateData.spent_at = new Date(data.spentAt)
    // Picking a merchant from the catalog links the real row and clears the
    // free-text note that was only a fallback for an unresolved merchant.
    if (data.merchantId !== undefined) {
      updateData.merchant_id = data.merchantId
      updateData.note = null
    }

    const updated = await prisma.transactions.update({
      where: { id },
      data: updateData,
      select: {
        id:       true,
        amount:   true,
        spent_at: true,
        note:     true,
        merchants: {
          select: {
            id:       true,
            name_th:  true,
            name_eng: true,
            categories: { select: { icon: true, name_th: true } },
          },
        },
      },
    })

    return NextResponse.json({ ...updated, amount: Number(updated.amount) })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error('[PATCH /api/transactions/[id]]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
