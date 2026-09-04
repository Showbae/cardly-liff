'use client'

import { useEffect, useRef, useState } from 'react'
import { SearchOverlay } from './SearchOverlay'
import { BuddhistCalendar } from './BuddhistCalendar'
import { updateTransaction, type Transaction } from '@/lib/transactions'

const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}
function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}
function daysAgo(n: number): Date {
  const d = startOfDay(new Date())
  d.setDate(d.getDate() - n)
  return d
}
function fmtDate(d: Date): string {
  return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]}`
}

const DATE_CHIPS = [
  { n: 0, label: 'วันนี้' },
  { n: 1, label: 'เมื่อวาน' },
  { n: 2, label: '2 วันก่อน' },
  { n: 3, label: '3 วันก่อน' },
]

interface Props {
  tx: Transaction
  onClose: () => void
  onSaved: (updated: Transaction) => void
}

export function EditTransactionSheet({ tx, onClose, onSaved }: Props) {
  const original = tx.merchants
  const [merchantId, setMerchantId] = useState<string | null>(original?.id ?? null)
  const [merchantName, setMerchantName] = useState(
    original?.name_eng ?? original?.name_th ?? tx.note ?? '—'
  )
  const [merchantIcon, setMerchantIcon] = useState(original?.categories?.icon ?? '🏪')
  const [merchantCat, setMerchantCat] = useState(original?.categories?.name_th ?? 'ไม่ระบุหมวด')
  const [merchantChanged, setMerchantChanged] = useState(false)

  const [amount, setAmount] = useState(String(tx.amount))
  const [date, setDate] = useState(() => new Date(tx.spent_at))
  const [calendarOpen, setCalendarOpen] = useState(false)

  const [searchOpen, setSearchOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchInputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 60)
  }, [searchOpen])

  // Lock the page behind so only the sheet scrolls until it is dismissed.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  // Drag the handle down to dismiss.
  const [dragY, setDragY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const dragStartY = useRef<number | null>(null)

  const onDragStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY
    setDragging(true)
  }
  const onDragMove = (e: React.TouchEvent) => {
    if (dragStartY.current === null) return
    setDragY(Math.max(0, e.touches[0].clientY - dragStartY.current))
  }
  const onDragEnd = () => {
    setDragging(false)
    dragStartY.current = null
    if (dragY > 90) onClose()
    else setDragY(0)
  }

  const handleAmountInput = (val: string) => {
    const cleaned = val.replace(/[^\d.]/g, '')
    // keep only the first decimal point
    const parts = cleaned.split('.')
    setAmount(parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : cleaned)
  }

  const handleSave = async () => {
    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('กรุณาใส่จำนวนเงินให้ถูกต้อง')
      return
    }

    // Preserve the original time-of-day, only swap the calendar date.
    const orig = new Date(tx.spent_at)
    const spentAt = new Date(
      date.getFullYear(), date.getMonth(), date.getDate(),
      orig.getHours(), orig.getMinutes(), orig.getSeconds()
    )

    setSaving(true)
    setError(null)
    try {
      const updated = await updateTransaction(tx.id, {
        amount: amountNum,
        spentAt: spentAt.toISOString(),
        ...(merchantChanged && merchantId ? { merchantId } : {}),
      })
      onSaved(updated)
    } catch {
      setError('บันทึกไม่สำเร็จ กรุณาลองใหม่')
      setSaving(false)
    }
  }

  const busy = saving

  return (
    <>
      {/* Overlay — above the bottom tab bar (z-50), locks the page behind */}
      <div
        onClick={busy ? undefined : onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 60,
          background: 'rgba(0,0,0,.4)',
          backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)',
          touchAction: 'none',
        }}
      />

      {/* Sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 61,
        background: 'var(--surface)',
        borderRadius: '24px 24px 0 0',
        padding: '12px 0 34px',
        boxShadow: '0 -2px 40px rgba(0,0,0,.15)',
        maxHeight: '90vh', overflowY: 'auto',
        transform: `translateY(${dragY}px)`,
        transition: dragging ? 'none' : 'transform .25s ease',
      }}>
        {/* Drag handle — pull down to dismiss */}
        <div
          onTouchStart={onDragStart}
          onTouchMove={onDragMove}
          onTouchEnd={onDragEnd}
          style={{ padding: '4px 0 10px', margin: '-4px 0 0', cursor: 'grab', touchAction: 'none' }}
        >
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--line)', margin: '0 auto' }} />
        </div>

        {/* ── Edit form ── */}
        <>
            <div style={{ fontSize: 13, fontWeight: 700, textAlign: 'center', color: 'var(--ink)', padding: '4px 0 12px', borderBottom: '1px solid var(--line-soft)' }}>
              แก้ไขรายการ
            </div>

            {/* Merchant row (tap to re-search) */}
            <button onClick={() => setSearchOpen(true)} style={{
              display: 'flex', alignItems: 'center', gap: 11, width: '100%',
              padding: '14px 22px', background: 'none', border: 'none',
              borderBottom: '1px solid var(--line-soft)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 11, background: 'var(--brand-50)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, flexShrink: 0,
              }}>{merchantIcon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-.2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{merchantName}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{merchantCat}</div>
              </div>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--brand-600)', flexShrink: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 600 }}>เปลี่ยน</span>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
              </span>
            </button>

            {/* Amount */}
            <div style={{ padding: '16px 22px 0' }}>
              <label style={fieldLabel}>ยอด (บาท)</label>
              <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid var(--line)', borderRadius: 12, background: 'var(--bg)' }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-3)', padding: '0 0 0 14px', flexShrink: 0 }}>฿</span>
                <input
                  type="text" inputMode="decimal" value={amount}
                  onChange={e => handleAmountInput(e.target.value)}
                  style={{
                    flex: 1, padding: '13px 14px', fontSize: 16, fontWeight: 600, color: 'var(--ink)',
                    background: 'transparent', border: 'none', outline: 'none', fontFamily: 'inherit',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                />
              </div>
            </div>

            {/* Date */}
            <div style={{ padding: '16px 22px 0' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ ...fieldLabel, marginBottom: 0 }}>วันที่ใช้จ่าย</label>
                {!calendarOpen && !DATE_CHIPS.some(c => sameDay(daysAgo(c.n), date)) && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--brand-700)' }}>
                    เลือกไว้: {fmtDate(date)}
                  </span>
                )}
              </div>
              {!calendarOpen ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[DATE_CHIPS.slice(0, 2), DATE_CHIPS.slice(2, 4)].map((row, ri) => (
                    <div key={ri} style={{ display: 'flex', gap: 8 }}>
                      {row.map(chip => {
                        const chipDate = daysAgo(chip.n)
                        const active = sameDay(chipDate, date)
                        return (
                          <button key={chip.n} onClick={() => setDate(chipDate)} style={{
                            flex: 1, textAlign: 'center', padding: '10px 6px', borderRadius: 12,
                            fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
                            background: active ? 'var(--brand-50)' : 'var(--surface-2)',
                            border: `1.5px solid ${active ? 'var(--brand-600)' : 'transparent'}`,
                            color: active ? 'var(--brand-700)' : 'var(--ink-2)',
                          }}>
                            {chip.label}
                            <div style={{ fontSize: 9, marginTop: 2, fontWeight: 500, color: active ? 'var(--brand-600)' : 'var(--ink-4)' }}>{fmtDate(chipDate)}</div>
                          </button>
                        )
                      })}
                    </div>
                  ))}
                  <button onClick={() => setCalendarOpen(true)} style={dashedBtn}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                    เลือกวันอื่น
                  </button>
                </div>
              ) : (
                <div>
                  <button onClick={() => setCalendarOpen(false)} style={{ ...dashedBtn, borderStyle: 'solid', borderColor: 'var(--brand-600)', color: 'var(--brand-700)', background: 'var(--brand-50)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="18 15 12 9 6 15" /></svg>
                    เลือกจากปุ่มด่วน
                  </button>
                  <BuddhistCalendar value={date} onChange={setDate} />
                </div>
              )}
            </div>

            {error && <div style={{ ...errBox, margin: '14px 22px 0' }}>{error}</div>}

            {/* Actions */}
            <div style={{ padding: '18px 22px 0' }}>
              <button onClick={handleSave} disabled={busy} style={{
                width: '100%', padding: 14, borderRadius: 999, background: 'var(--ink)', color: 'var(--bg)',
                border: 'none', fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
                cursor: busy ? 'not-allowed' : 'pointer', letterSpacing: '-.2px', opacity: busy ? 0.6 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                {saving && <span style={spinner} />}
                {saving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </>
      </div>

      {/* Merchant re-search — reuse SearchOverlay */}
      <SearchOverlay
        ref={searchInputRef}
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={m => {
          setMerchantId(m.id)
          setMerchantName(m.name_eng ?? m.name_th ?? '—')
          setMerchantIcon(m.categories?.icon ?? '🏪')
          setMerchantCat(m.categories?.name_th ?? 'ไม่ระบุหมวด')
          setMerchantChanged(true)
        }}
      />
    </>
  )
}

const fieldLabel: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, letterSpacing: '.8px', textTransform: 'uppercase',
  color: 'var(--ink-4)', display: 'block', marginBottom: 8,
}
const dashedBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
  padding: 11, borderRadius: 12, fontSize: 12, fontWeight: 600, color: 'var(--ink-3)',
  background: 'none', border: '1.5px dashed var(--line)', cursor: 'pointer',
  fontFamily: 'inherit', width: '100%',
}
const errBox: React.CSSProperties = {
  padding: '10px 14px', borderRadius: 10, background: 'var(--warn-bg)',
  color: 'var(--warn)', fontSize: 13, marginTop: 14,
}
const spinner: React.CSSProperties = {
  width: 14, height: 14, borderRadius: 999,
  border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff',
  display: 'inline-block', animation: 'spin 1s linear infinite',
}
