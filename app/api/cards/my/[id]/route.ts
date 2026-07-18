import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.users_card.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/cards/my/[id]]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

const patchSchema = z.object({
  last_four: z.string().length(4).regex(/^\d{4}$/).nullable().optional(),
  credit_limit: z.number().positive().nullable().optional(),
  billing_cycle_day: z.number().int().min(1).max(28).nullable().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const data = patchSchema.parse(body)

    const updated = await prisma.users_card.update({
      where: { id },
      data,
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error('[PATCH /api/cards/my/[id]]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
