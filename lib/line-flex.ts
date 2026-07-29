import type { users_card, credit_cards, banks } from '@prisma/client'

type CardWithRelations = users_card & {
  credit_cards: (credit_cards & { banks: banks | null }) | null
}

// ── Category keyword detection ───────────────────────────────────────
const CATEGORY_MAP = [
  { re: /starbucks|coffee|cafe|คาเฟ่|กาแฟ|amazon.cafe|ท่รัก|bluecup/i, emoji: '☕', label: 'คาเฟ่' },
  { re: /7-11|seven|เซเว่น|โลตัส|lotus|big.?c|makro|tops|villa.market/i, emoji: '🛒', label: 'ซูเปอร์มาร์เก็ต' },
  { re: /sushi|pizza|อาหาร|ข้าว|ก๋วยเตี๋ยว|บุฟเฟ่|shabu|mcd|kfc|burger|mcdonald|subway/i, emoji: '🍽', label: 'อาหาร' },
  { re: /ptt|shell|esso|บางจาก|caltex|น้ำมัน|ปั๊ม/i, emoji: '⛽', label: 'น้ำมัน' },
  { re: /shopee|lazada|grab|lineman|foodpanda|delivery/i, emoji: '🛍', label: 'ช้อปปิ้ง' },
  { re: /hospital|หมอ|clinic|pharmacy|ร้านยา|โรงพยาบาล/i, emoji: '🏥', label: 'สุขภาพ' },
  { re: /netflix|spotify|steam|game|cinema|major|sfx|สยาม|พารากอน/i, emoji: '🎬', label: 'บันเทิง' },
  { re: /airline|airasia|nok.?air|lion.?air|hotel|โรงแรม|booking/i, emoji: '✈️', label: 'เดินทาง' },
]

export function detectCategory(merchant: string): { emoji: string; label: string } {
  for (const cat of CATEGORY_MAP) {
    if (cat.re.test(merchant)) return { emoji: cat.emoji, label: cat.label }
  }
  return { emoji: '📝', label: 'อื่นๆ' }
}

// ── Thai date formatter ───────────────────────────────────────────────
const THAI_MONTHS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']

function thaiDate(d: Date): string {
  const day = d.getDate()
  const mon = THAI_MONTHS[d.getMonth()]
  const h = d.getHours().toString().padStart(2, '0')
  const m = d.getMinutes().toString().padStart(2, '0')
  return `${day} ${mon}  ${h}:${m} น.`
}

// ── Cancel quick reply ──────────────────────────────────────────────────
const cancelQuickReplyItem = {
  type: 'action',
  action: { type: 'postback', label: '✕ ยกเลิก', data: 'action=cancel', displayText: 'ยกเลิก' },
}

// Attach a "ยกเลิก" button to a plain text prompt so the flow can be
// cancelled from any step, not just the final confirmation.
export function withCancelQuickReply(text: string) {
  return {
    type: 'text',
    text,
    quickReply: { items: [cancelQuickReplyItem] },
  }
}

// ── Card quick reply ──────────────────────────────────────────────────
export function cardQuickReply(cards: CardWithRelations[]) {
  const items = cards.map(uc => {
    const name = uc.credit_cards?.card_name ?? 'บัตรของฉัน'
    const last4 = uc.last_four ? ` ••${uc.last_four}` : ''
    const displayText = `${name}${last4}`.slice(0, 20)
    return {
      type: 'action',
      action: {
        type: 'postback',
        label: displayText,
        data: `card=${uc.id}`,
        displayText,
      },
    }
  })

  return {
    type: 'text',
    text: 'เลือกบัตรที่ใช้ครับ 💳',
    quickReply: { items: [...items, cancelQuickReplyItem] },
  }
}

// ── Confirmation Flex Message ─────────────────────────────────────────
export function confirmFlex({
  merchant,
  amount,
  usersCard,
}: {
  merchant: string
  amount: number
  usersCard: CardWithRelations | null
}) {
  const { emoji, label } = detectCategory(merchant)
  const cardName = usersCard?.credit_cards?.card_name ?? 'บัตรของฉัน'
  const last4 = usersCard?.last_four ? ` ••${usersCard.last_four}` : ''
  const dateStr = thaiDate(new Date())
  const amountStr = amount.toLocaleString('th-TH', { minimumFractionDigits: 0 })

  return {
    type: 'flex',
    altText: `ยืนยันรายการ ${merchant} ฿ ${amountStr}`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      styles: {
        header: { backgroundColor: '#9a4020' },
        body:   { backgroundColor: '#ffffff' },
        footer: { backgroundColor: '#fbfaf6' },
      },
      header: {
        type: 'box',
        layout: 'horizontal',
        paddingAll: '14px',
        background: {
          type: 'linearGradient',
          angle: '135deg',
          startColor: '#9a4020',
          endColor: '#c97850',
        },
        contents: [
          {
            type: 'text',
            text: 'ยืนยันรายการ',
            color: '#ffffff',
            weight: 'bold',
            size: 'sm',
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        paddingAll: '16px',
        contents: [
          {
            type: 'text',
            text: `${emoji} ${merchant}`,
            weight: 'bold',
            size: 'lg',
            color: '#0f1f18',
            wrap: true,
          },
          {
            type: 'text',
            text: `฿ ${amountStr}`,
            weight: 'bold',
            size: 'xxl',
            color: '#c97850',
            margin: 'sm',
          },
          { type: 'separator', margin: 'md' },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'md',
            spacing: 'xs',
            contents: [
              {
                type: 'text',
                text: `💳 ${cardName}${last4}`,
                size: 'sm',
                color: '#5e6e64',
              },
              {
                type: 'text',
                text: `${emoji} ${label}`,
                size: 'sm',
                color: '#98a39b',
              },
              {
                type: 'text',
                text: `📅 ${dateStr}`,
                size: 'sm',
                color: '#98a39b',
              },
            ],
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'horizontal',
        spacing: 'sm',
        paddingAll: '10px',
        contents: [
          {
            type: 'button',
            action: { type: 'postback', label: 'ยกเลิก', data: 'action=cancel' },
            style: 'secondary',
            height: 'sm',
            flex: 1,
          },
          {
            type: 'box',
            layout: 'vertical',
            flex: 1,
            cornerRadius: '8px',
            paddingAll: '10px',
            background: {
              type: 'linearGradient',
              angle: '135deg',
              startColor: '#9a4020',
              endColor: '#c97850',
            },
            action: { type: 'postback', label: 'ยืนยัน ✓', data: 'action=confirm' },
            contents: [
              {
                type: 'text',
                text: 'ยืนยัน ✓',
                color: '#ffffff',
                align: 'center',
                weight: 'bold',
                size: 'sm',
              },
            ],
          },
        ],
      },
    },
  }
}
