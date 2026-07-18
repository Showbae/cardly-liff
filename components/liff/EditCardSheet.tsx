'use client'

import { useState } from 'react'
import { updateCard, type UserCard } from '@/lib/cards'

const BANK_GRADIENT: Record<string, string> = {
  KBANK: 'linear-gradient(135deg, #1c8c75, #07332a 60%)',
  SCB:   'linear-gradient(135deg, #7c3fa8, #341252)',
  KTC:   'linear-gradient(135deg, #e3603f, #a02b1f)',
  UOB:   'linear-gradient(135deg, #c8253e, #1c2a6a)',
  BBL:   'linear-gradient(135deg, #1b4d9b, #0c2a5e)',
  BAY:   'linear-gradient(135deg, #d99211, #7a4f00)',
  AMEX:  'linear-gradient(135deg, #c1c7cd, #2f3942)',
  AEON:  'linear-gradient(135deg, #d9416f, #8b1a3d)',
}

function chipGradient(bankId?: string | null) {
  return BANK_GRADIENT[bankId ?? ''] ?? 'linear-gradient(135deg, #2a3a33, #0c1612)'
}

const QUICK_DAYS = [5, 10, 15, 20, 25, 28]

interface Props {
  card: UserCard
  onClose: () => void
  onSaved: (updated: Pick<UserCard, 'id' | 'last_four' | 'credit_limit' | 'billing_cycle_day'>) => void
}

export function EditCardSheet({ card, onClose, onSaved }: Props) {
  const creditCard = card.credit_cards
  const bank = creditCard?.banks

  const [lastFour, setLastFour] = useState(card.last_four ?? '')
  const [creditLimit, setCreditLimit] = useState(
    card.credit_limit ? Number(card.credit_limit).toLocaleString('th-TH', { maximumFractionDigits: 0 }) : ''
  )
  const [billingDay, setBillingDay] = useState<number | null>(card.billing_cycle_day ?? null)
  const [customDay, setCustomDay] = useState(
    card.billing_cycle_day && !QUICK_DAYS.includes(card.billing_cycle_day)
      ? String(card.billing_cycle_day)
      : ''
  )
  const [useCustomDay, setUseCustomDay] = useState(
    card.billing_cycle_day ? !QUICK_DAYS.includes(card.billing_cycle_day) : false
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    const rawLimit = creditLimit.replace(/,/g, '')
    const limitNum = rawLimit ? Number(rawLimit) : null
    const dayNum = useCustomDay ? (Number(customDay) || null) : billingDay

    setSaving(true)
    setError(null)
    try {
      await updateCard(card.id, {
        last_four: lastFour.length === 4 ? lastFour : null,
        credit_limit: limitNum,
        billing_cycle_day: dayNum,
      })
      onSaved({
        id: card.id,
        last_four: lastFour.length === 4 ? lastFour : null,
        credit_limit: limitNum !== null ? String(limitNum) : null,
        billing_cycle_day: dayNum,
      })
    } catch {
      setError('บันทึกไม่สำเร็จ กรุณาลองใหม่')
      setSaving(false)
    }
  }

  const handleLimitInput = (val: string) => {
    const digits = val.replace(/\D/g, '')
    if (!digits) { setCreditLimit(''); return }
    setCreditLimit(Number(digits).toLocaleString('th-TH', { maximumFractionDigits: 0 }))
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 40,
          background: 'rgba(0,0,0,.4)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
        }}
      />

      {/* Sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        background: 'var(--surface)',
        borderRadius: '24px 24px 0 0',
        padding: '12px 22px 40px',
        boxShadow: '0 -2px 40px rgba(0,0,0,.15)',
      }}>
        {/* Handle */}
        <div style={{
          width: 36, height: 4, borderRadius: 2,
          background: 'var(--line)',
          margin: '0 auto 20px',
        }} />

        {/* Card identity */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          paddingBottom: 18,
          borderBottom: '1px solid var(--line-soft)',
          marginBottom: 24,
        }}>
          <div style={{
            width: 44, height: 30, borderRadius: 6, flexShrink: 0,
            display: 'grid', placeItems: 'center',
            color: '#fff', fontSize: 13, fontWeight: 700,
            background: chipGradient(creditCard?.bank_id),
            boxShadow: '0 2px 6px rgba(0,0,0,.18)',
          }}>
            {bank?.initial ?? creditCard?.bank_id?.charAt(0) ?? '?'}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-.2px' }}>
              {creditCard?.card_name}
            </div>
            {creditCard?.card_tier && (
              <span style={{
                fontSize: 10, fontWeight: 600, letterSpacing: '.5px', textTransform: 'uppercase',
                padding: '2px 6px', borderRadius: 4,
                background: 'var(--surface-2)', color: 'var(--ink-3)',
                display: 'inline-block', marginTop: 3,
              }}>
                {creditCard.card_tier}
              </span>
            )}
          </div>
        </div>

        {/* Fields */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-3)', marginBottom: 8 }}>
            เลขบัตร 4 ตัวท้าย
          </div>
          <div style={{
            display: 'flex', alignItems: 'center',
            border: '1.5px solid var(--line)', borderRadius: 12, background: 'var(--bg)',
          }}>
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              placeholder="เลข 4 หลักท้ายบัตร"
              value={lastFour}
              onChange={e => setLastFour(e.target.value.replace(/\D/g, ''))}
              style={{
                flex: 1, padding: '13px 14px',
                fontSize: 15, color: 'var(--ink)', background: 'transparent',
                border: 'none', outline: 'none',
                fontFamily: 'ui-monospace, "SF Mono", monospace',
                letterSpacing: 2,
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-3)', marginBottom: 8 }}>
            วงเงินเครดิต
          </div>
          <div style={{
            display: 'flex', alignItems: 'center',
            border: '1.5px solid var(--line)', borderRadius: 12, background: 'var(--bg)',
          }}>
            <span style={{ fontSize: 15, color: 'var(--ink-3)', padding: '0 0 0 14px', flexShrink: 0 }}>฿</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={creditLimit}
              onChange={e => handleLimitInput(e.target.value)}
              style={{
                flex: 1, padding: '13px 14px',
                fontSize: 15, color: 'var(--ink)', background: 'transparent',
                border: 'none', outline: 'none', fontFamily: 'inherit',
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-3)', marginBottom: 8 }}>
            วันตัดรอบ
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {QUICK_DAYS.map(d => (
              <button
                key={d}
                onClick={() => { setBillingDay(d); setUseCustomDay(false) }}
                style={{
                  minWidth: 36, height: 34, borderRadius: 8, padding: '0 10px',
                  fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
                  background: (!useCustomDay && billingDay === d) ? 'var(--brand-50)' : 'var(--surface-2)',
                  border: `1.5px solid ${(!useCustomDay && billingDay === d) ? 'var(--brand)' : 'transparent'}`,
                  color: (!useCustomDay && billingDay === d) ? 'var(--brand-700)' : 'var(--ink-3)',
                  transition: 'all .12s',
                }}
              >
                {d}
              </button>
            ))}
            <button
              onClick={() => setUseCustomDay(true)}
              style={{
                minWidth: 52, height: 34, borderRadius: 8, padding: '0 10px',
                fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
                background: useCustomDay ? 'var(--brand-50)' : 'var(--surface-2)',
                border: `1.5px solid ${useCustomDay ? 'var(--brand)' : 'transparent'}`,
                color: useCustomDay ? 'var(--brand-700)' : 'var(--ink-3)',
                transition: 'all .12s',
              }}
            >
              อื่นๆ
            </button>
          </div>

          {useCustomDay && (
            <div style={{
              display: 'flex', alignItems: 'center', marginTop: 10,
              border: '1.5px solid var(--line)', borderRadius: 12, background: 'var(--bg)',
            }}>
              <input
                type="text"
                inputMode="numeric"
                maxLength={2}
                placeholder="วันที่ 1–28"
                value={customDay}
                onChange={e => setCustomDay(e.target.value.replace(/\D/g, ''))}
                autoFocus
                style={{
                  flex: 1, padding: '13px 14px',
                  fontSize: 15, color: 'var(--ink)', background: 'transparent',
                  border: 'none', outline: 'none', fontFamily: 'inherit',
                }}
              />
              <span style={{ fontSize: 12, color: 'var(--ink-4)', paddingRight: 14, whiteSpace: 'nowrap' }}>
                ของทุกเดือน
              </span>
            </div>
          )}
        </div>

        {error && (
          <div style={{
            padding: '10px 14px', borderRadius: 10, marginBottom: 12,
            background: 'var(--warn-bg)', color: 'var(--warn)', fontSize: 13,
          }}>
            {error}
          </div>
        )}

        {/* Actions */}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%', padding: 15, borderRadius: 999,
            background: 'var(--ink)', color: 'var(--bg)',
            border: 'none', fontSize: 15, fontWeight: 600,
            fontFamily: 'inherit', cursor: saving ? 'not-allowed' : 'pointer',
            letterSpacing: '-.2px', opacity: saving ? .6 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {saving && (
            <span style={{
              width: 14, height: 14, borderRadius: 999,
              border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff',
              display: 'inline-block', animation: 'spin 1s linear infinite',
            }} />
          )}
          {saving ? 'กำลังบันทึก...' : 'บันทึก'}
        </button>
        <button
          onClick={onClose}
          disabled={saving}
          style={{
            width: '100%', padding: 10, marginTop: 10,
            borderRadius: 999, background: 'transparent', border: 'none',
            fontSize: 14, fontWeight: 500, color: 'var(--ink-3)',
            fontFamily: 'inherit', cursor: 'pointer',
          }}
        >
          ยกเลิก
        </button>
      </div>
    </>
  )
}
