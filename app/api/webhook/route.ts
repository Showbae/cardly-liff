import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { prisma } from '@/lib/prisma'
import { reply } from '@/lib/line-api'
import { cardQuickReply, confirmFlex, detectCategory, withCancelQuickReply } from '@/lib/line-flex'

// ── Signature verification ───────────────────────────────────────────
function verifySignature(rawBody: string, signature: string): boolean {
  const secret = process.env.LINE_CHANNEL_SECRET
  if (!secret) return false
  const digest = createHmac('sha256', secret).update(rawBody).digest('base64')
  return digest === signature
}

// ── Main handler ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const sig = req.headers.get('x-line-signature') ?? ''

  if (!verifySignature(rawBody, sig)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = JSON.parse(rawBody) as { events?: LineEvent[] }

  await Promise.all((body.events ?? []).map(handleEvent))

  return NextResponse.json({ ok: true })
}

// ── Event router ─────────────────────────────────────────────────────
async function handleEvent(event: LineEvent) {
  const lineUserId = event.source?.userId
  if (!lineUserId) return

  if (event.type === 'message' && event.message?.type === 'text') {
    await handleText(lineUserId, event.message.text, event.replyToken)
  } else if (event.type === 'postback') {
    await handlePostback(lineUserId, event.postback?.data ?? '', event.replyToken)
  }
}

// ── Text message handler ─────────────────────────────────────────────
async function handleText(lineUserId: string, text: string, replyToken: string) {
  const trimmed = text.trim()
  const session = await prisma.bot_sessions.findUnique({ where: { line_user_id: lineUserId } })

  // Trigger keyword — start or restart the flow
  if (trimmed === 'จดรายจ่าย') {
    const user = await prisma.users.findUnique({
      where: { line_id: lineUserId },
      include: {
        users_card: {
          include: { credit_cards: { include: { banks: true } } },
          orderBy: [{ sort_order: 'asc' }, { created_date: 'asc' }],
        },
      },
    })

    if (!user || user.users_card.length === 0) {
      await reply(replyToken, [{
        type: 'text',
        text: 'ยังไม่มีบัตรในระบบครับ\nกรุณาเพิ่มบัตรในแอป Cardly ก่อนนะครับ 💳',
      }])
      return
    }

    await prisma.bot_sessions.upsert({
      where: { line_user_id: lineUserId },
      create: { line_user_id: lineUserId, step: 'awaiting_card', data: {} },
      update: { step: 'awaiting_card', data: {} },
    })

    await reply(replyToken, [cardQuickReply(user.users_card)])
    return
  }

  // No active session and not a trigger keyword — ignore
  if (!session) return

  // Cancel keyword — works from any step
  if (trimmed === 'ยกเลิก') {
    await prisma.bot_sessions.delete({ where: { line_user_id: lineUserId } })
    await reply(replyToken, [{ type: 'text', text: 'ยกเลิกแล้วครับ ✓' }])
    return
  }

  // Step: awaiting_card — handled via postback now, ignore free text
  if (session.step === 'awaiting_card') {
    await reply(replyToken, [{ type: 'text', text: 'กรุณาเลือกบัตรจากปุ่มด้านบนครับ 👆' }])
    return
  }

  // Step: awaiting_merchant
  if (session.step === 'awaiting_merchant') {
    const data = session.data as Record<string, string>
    await prisma.bot_sessions.update({
      where: { line_user_id: lineUserId },
      data: { step: 'awaiting_amount', data: { ...data, merchant: trimmed } },
    })
    await reply(replyToken, [withCancelQuickReply('จำนวนเงิน (บาท)?')])
    return
  }

  // Step: awaiting_amount
  if (session.step === 'awaiting_amount') {
    const amount = parseFloat(trimmed.replace(/[,฿\s]/g, ''))
    if (isNaN(amount) || amount <= 0) {
      await reply(replyToken, [{ type: 'text', text: 'กรุณาใส่จำนวนเงินเป็นตัวเลขครับ เช่น 250' }])
      return
    }

    const data = session.data as Record<string, string>
    const newData = { ...data, amount: String(amount) }
    await prisma.bot_sessions.update({
      where: { line_user_id: lineUserId },
      data: { step: 'awaiting_confirm', data: newData },
    })

    const usersCard = await prisma.users_card.findUnique({
      where: { id: data.usersCardId },
      include: { credit_cards: { include: { banks: true } } },
    })

    await reply(replyToken, [confirmFlex({ merchant: data.merchant, amount, usersCard })])
    return
  }

  // In awaiting_confirm step — ignore free text, wait for postback
  if (session.step === 'awaiting_confirm') {
    await reply(replyToken, [{ type: 'text', text: 'กดปุ่ม "ยืนยัน" หรือ "ยกเลิก" ด้านบนครับ 👆' }])
  }
}

// ── Postback handler ─────────────────────────────────────────────────
async function handlePostback(lineUserId: string, postbackData: string, replyToken: string) {
  const params = new URLSearchParams(postbackData)
  const action = params.get('action')
  const cardId = params.get('card')

  // Card selection from quick reply
  if (cardId) {
    const session = await prisma.bot_sessions.findUnique({ where: { line_user_id: lineUserId } })
    if (!session || session.step !== 'awaiting_card') return
    await prisma.bot_sessions.update({
      where: { line_user_id: lineUserId },
      data: { step: 'awaiting_merchant', data: { usersCardId: cardId } },
    })
    await reply(replyToken, [withCancelQuickReply('ชื่อร้านค้า?')])
    return
  }

  if (action === 'confirm') {
    const session = await prisma.bot_sessions.findUnique({ where: { line_user_id: lineUserId } })
    if (!session || session.step !== 'awaiting_confirm') return

    const data = session.data as Record<string, string>

    const merchant = await prisma.merchants.findFirst({
      where: {
        OR: [
          { name_th: { contains: data.merchant, mode: 'insensitive' } },
          { name_eng: { contains: data.merchant, mode: 'insensitive' } },
        ],
      },
    })

    await prisma.transactions.create({
      data: {
        users_card_id: data.usersCardId,
        merchant_id: merchant?.id ?? null,
        amount: parseFloat(data.amount),
        note: merchant ? null : data.merchant,
        spent_at: new Date(),
        source: 'chat',
        estimated_amount: parseFloat(data.amount),
      },
    })

    await prisma.bot_sessions.delete({ where: { line_user_id: lineUserId } })

    const { emoji } = detectCategory(data.merchant)
    const amountStr = parseFloat(data.amount).toLocaleString('th-TH')
    await reply(replyToken, [{
      type: 'text',
      text: `${emoji} บันทึกแล้วครับ!\n${data.merchant} ฿${amountStr}\n\nดูรายการได้ในแอป Cardly 📱`,
    }])

  } else if (action === 'cancel') {
    await prisma.bot_sessions.delete({ where: { line_user_id: lineUserId } }).catch(() => {})
    await reply(replyToken, [{ type: 'text', text: 'ยกเลิกแล้วครับ ✓' }])
  }
}

// ── Types ─────────────────────────────────────────────────────────────
interface LineEvent {
  type: string
  replyToken: string
  source?: { userId?: string }
  message?: { type: string; text: string }
  postback?: { data: string }
}
