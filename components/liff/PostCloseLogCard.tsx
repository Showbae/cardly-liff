'use client'

import { useState } from 'react'
import type { CardRec } from './RecommendSheet'

interface MerchantInfo {
  id: string
  name_th: string | null
  name_eng: string | null
  categories: { name_th: string | null; name_eng: string | null; icon: string | null } | null
}

function bankColor(color: string | null): string {
  return color ?? '#0f8e5a'
}

interface Props {
  merchant: MerchantInfo
  recommendations: CardRec[]
  onDismiss: () => void
}

const NUMPAD_KEYS = ['1','2','3','4','5','6','7','8','9','.','0','⌫']

export function PostCloseLogCard({ merchant, recommendations, onDismiss }: Props) {
  const [selectedId, setSelectedId] = useState(recommendations[0]?.card.usersCardId ?? '')
  const [amount, setAmount] = useState('')
  const [numpadOpen, setNumpadOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const selectedCard = (recommendations.find(r => r.card.usersCardId === selectedId) ?? recommendations[0])?.card

  function handleKey(k: string) {
    if (k === '⌫') { setAmount(a => a.slice(0, -1)); return }
    if (k === '.') {
      if (amount.includes('.')) return
      setAmount(a => (a === '' ? '0.' : a + '.'))
      return
    }
    const [intPart, decPart] = amount.split('.')
    if (decPart !== undefined && decPart.length >= 2) return
    if (!amount.includes('.') && (intPart ?? '').length >= 6) return
    setAmount(a => (a === '0' ? k : a + k))
  }

  async function handleSave() {
    if (!selectedCard || !amount || amount === '0') return
    setSaving(true)
    try {
      await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usersCardId: selectedCard.usersCardId,
          merchantId: merchant.id,
          amount: parseFloat(amount),
        }),
      })
      setSaved(true)
      setTimeout(() => { setNumpadOpen(false); onDismiss() }, 1000)
    } catch {
      // fail silently
    } finally {
      setSaving(false)
    }
  }

  const displayAmount = amount === '' ? '0' : amount
  const hasAmount = amount !== '' && amount !== '0'

  return (
    <>
      {/* Post-close card */}
      <div
        className="mx-4 mb-4 rounded-[var(--r-lg)] overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--line)', boxShadow: 'var(--shadow-md)' }}
      >
        {/* Header */}
        <div className="px-4 pt-3 pb-3 flex items-start gap-3" style={{ borderBottom: '1px solid var(--line-soft)' }}>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-[20px] shrink-0"
            style={{ background: 'var(--surface-2)' }}
          >
            {merchant.categories?.icon ?? '🏪'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-[3px]">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--brand-600)' }} />
              <span
                className="text-[9px] font-bold tracking-widest uppercase"
                style={{ color: 'var(--brand-600)' }}
              >
                เพิ่งใช้ CARDLY
              </span>
            </div>
            <p className="text-[13px] font-bold text-ink leading-snug">
              รูดที่ {merchant.name_eng ?? merchant.name_th} บันทึกยอดเลยไหม?
            </p>
            <p className="text-[10px] mt-[2px]" style={{ color: 'var(--ink-4)' }}>
              บันทึกช่วยติดตาม cashback ที่ได้รับ
            </p>
          </div>
        </div>

        {/* Card picker — show only when user has multiple cards */}
        {recommendations.length > 1 && (
          <div className="flex gap-1.5 px-4 pt-3 overflow-x-auto scrollbar-none pb-0">
            {recommendations.map(rec => {
              const color = bankColor(rec.card.bank?.color ?? null)
              const selected = rec.card.usersCardId === selectedId
              const bankName = rec.card.bank?.name_eng ?? rec.card.bank?.name_th ?? ''
              return (
                <button
                  key={rec.card.usersCardId}
                  onClick={() => setSelectedId(rec.card.usersCardId)}
                  className="flex items-center gap-[5px] px-3 py-[6px] rounded-full shrink-0 text-[11px] font-bold"
                  style={selected
                    ? { background: color, color: '#fff' }
                    : { background: 'var(--surface-2)', color: 'var(--ink-3)', border: '1px solid var(--line)' }
                  }
                >
                  <div
                    className="w-[6px] h-[6px] rounded-full shrink-0"
                    style={{ background: selected ? '#fff' : color }}
                  />
                  {bankName}
                  {rec.card.last_four ? ` ••${rec.card.last_four}` : ''}
                </button>
              )
            })}
          </div>
        )}

        {/* Amount field + buttons */}
        <div className="px-4 pt-3 pb-4">
          {/* Tap to open numpad */}
          <button
            onClick={() => setNumpadOpen(true)}
            className="w-full flex items-center gap-2 px-4 py-[11px] rounded-[var(--r-md)] mb-3 text-left"
            style={{ background: 'var(--surface-2)', border: '1.5px solid var(--line)' }}
          >
            <span className="text-[15px]" style={{ color: 'var(--ink-3)' }}>฿</span>
            <span
              className="flex-1 text-[22px] font-black tracking-tight"
              style={{
                color: hasAmount ? 'var(--ink)' : 'var(--ink-4)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {hasAmount
                ? Number(displayAmount).toLocaleString('th-TH', { maximumFractionDigits: 2 })
                : 'กรอกยอด'}
            </span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--ink-4)"
              strokeWidth={2.5} strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>

          <div className="flex gap-2">
            <button
              onClick={hasAmount ? handleSave : () => setNumpadOpen(true)}
              disabled={saving || saved}
              className="flex-1 py-[11px] rounded-[var(--r-lg)] text-[14px] font-bold text-white flex items-center justify-center gap-1.5"
              style={{
                background: saved ? '#1a7a48' : 'var(--brand-600)',
                opacity: !hasAmount ? 0.45 : 1,
              }}
            >
              {saved ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white"
                    strokeWidth={2.5} strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  บันทึกแล้ว
                </>
              ) : saving ? 'กำลังบันทึก...' : hasAmount
                ? `บันทึก ฿${Number(displayAmount).toLocaleString('th-TH', { maximumFractionDigits: 2 })}`
                : 'บันทึก'}
            </button>
            <button
              onClick={onDismiss}
              className="px-4 py-[11px] rounded-[var(--r-lg)] text-[14px] font-semibold"
              style={{ background: 'var(--surface-2)', color: 'var(--ink-3)', border: '1px solid var(--line)' }}
            >
              ข้าม
            </button>
          </div>
        </div>
      </div>

      {/* Numpad bottom sheet */}
      {numpadOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end"
          style={{ background: 'rgba(6,20,14,.45)' }}
          onClick={() => setNumpadOpen(false)}
        >
          <div
            className="flex flex-col"
            style={{
              background: 'var(--surface)',
              borderRadius: '18px 18px 0 0',
              borderTop: '1px solid var(--line)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Context + amount display */}
            <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid var(--line)' }}>
              <div className="flex items-center gap-2.5 mb-3">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[14px] shrink-0"
                  style={{ background: 'var(--surface-2)' }}
                >
                  {merchant.categories?.icon ?? '🏪'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-ink leading-none">
                    {selectedCard?.bank?.name_eng ?? ''} · {merchant.name_eng ?? merchant.name_th}
                  </p>
                  <p className="text-[9px] mt-[2px]" style={{ color: 'var(--ink-4)' }}>
                    บันทึกวันนี้ · {merchant.categories?.name_th ?? ''}
                  </p>
                </div>
                <button
                  onClick={() => setNumpadOpen(false)}
                  className="text-[10px] font-semibold px-2.5 py-1 rounded-lg shrink-0"
                  style={{ background: 'var(--surface-2)', color: 'var(--ink-3)' }}
                >
                  ปิด
                </button>
              </div>
              <div className="text-center">
                <span className="text-[16px]" style={{ color: 'var(--ink-3)' }}>฿</span>
                <span
                  className="text-[40px] font-black tracking-tight"
                  style={{
                    color: amount ? 'var(--ink)' : 'var(--ink-4)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {Number(displayAmount).toLocaleString('th-TH', { maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Numpad grid */}
            <div className="grid grid-cols-3" style={{ borderBottom: '1px solid var(--line)' }}>
              {NUMPAD_KEYS.map(k => (
                <button
                  key={k}
                  onClick={() => handleKey(k)}
                  className="flex items-center justify-center py-[13px] text-[18px] font-semibold text-ink"
                  style={{ borderRight: '1px solid var(--line-soft)', borderBottom: '1px solid var(--line-soft)' }}
                >
                  {k === '⌫' ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth={2} strokeLinecap="round">
                      <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/>
                      <line x1="15" y1="9" x2="9" y2="15"/>
                      <line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                  ) : k}
                </button>
              ))}
            </div>

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={saving || saved || !hasAmount}
              className="mx-4 my-3 py-3 rounded-[var(--r-lg)] text-[14px] font-black text-white flex items-center justify-center gap-2"
              style={{
                background: saved ? '#1a7a48' : 'var(--brand-600)',
                opacity: !hasAmount ? 0.45 : 1,
              }}
            >
              {saved ? (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white"
                    strokeWidth={2.5} strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  บันทึกแล้ว
                </>
              ) : saving ? 'กำลังบันทึก...'
                : `บันทึก ฿${Number(displayAmount).toLocaleString('th-TH', { maximumFractionDigits: 2 })}`}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
