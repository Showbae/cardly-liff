'use client'

import { useEffect, useState } from 'react'

// ── Types ────────────────────────────────────────────────────
interface Category {
  id: string
  name_th: string | null
  icon: string | null
}

interface Promo {
  id: string
  title: string
  bank_id: string | null
  promo_type: string | null
  benefit_value: number | null
  benefit_unit: string | null
  min_spend: number | null
  max_cap: number | null
  end_date: string | null
  condition: string | null
  banks: { name_th: string | null; color: string | null } | null
  categories: { name_th: string | null; icon: string | null } | null
  promotion_merchants: Array<{ merchants: { name_th: string | null } | null }>
}

// ── Helpers ──────────────────────────────────────────────────
function daysLeft(endDate: string | null): number | null {
  if (!endDate) return null
  return Math.ceil((new Date(endDate).getTime() - Date.now()) / 86_400_000)
}

function formatDate(d: string | null): string {
  if (!d) return ''
  return new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
}

function benefitLabel(type: string | null, value: number | null, unit: string | null): string {
  if (value == null) return ''
  const prefix = type === 'cashback' ? 'คืน' : type === 'discount' ? 'ลด' : 'ผ่อน'
  if (unit === '%') return `${prefix} ${value}%`
  if (unit === 'บาท') return `${prefix} ฿${value}`
  if (unit === '% ดอกเบี้ย') return `ผ่อน 0% ดบ.`
  return `${prefix} ${value} ${unit ?? ''}`
}

const TYPE_STYLE: Record<string, { bg: string; text: string }> = {
  cashback:    { bg: 'var(--brand-50)',  text: 'var(--brand-700)' },
  discount:    { bg: 'var(--warn-bg)',   text: 'var(--warn)'      },
  installment: { bg: 'var(--info-bg)',   text: 'var(--info)'      },
}

// ── Promo Card ───────────────────────────────────────────────
function PromoCard({ p }: { p: Promo }) {
  const days = daysLeft(p.end_date)
  const urgent = days != null && days <= 7
  const typeStyle = TYPE_STYLE[p.promo_type ?? ''] ?? { bg: 'var(--surface-2)', text: 'var(--ink-3)' }
  const merchant = p.promotion_merchants[0]?.merchants?.name_th ?? null

  return (
    <div style={{
      background: 'var(--surface)', borderRadius: 'var(--r-md)',
      border: '1px solid var(--line)', padding: '13px 14px',
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          {/* Bank badge */}
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '.5px',
            padding: '3px 8px', borderRadius: 99,
            background: p.banks?.color ?? 'var(--surface-3)',
            color: '#fff',
          }}>
            {p.bank_id}
          </span>
          {/* Benefit pill */}
          <span style={{
            fontSize: 12, fontWeight: 700,
            padding: '3px 9px', borderRadius: 99,
            background: typeStyle.bg, color: typeStyle.text,
          }}>
            {benefitLabel(p.promo_type, p.benefit_value, p.benefit_unit)}
          </span>
        </div>
        {/* Urgency badge */}
        {urgent && days != null && (
          <span style={{
            fontSize: 11, fontWeight: 600, letterSpacing: '.2px',
            padding: '3px 8px', borderRadius: 99, flexShrink: 0,
            background: 'var(--warn-bg)', color: 'var(--warn)',
          }}>
            เหลือ {days} วัน
          </span>
        )}
      </div>

      {/* Title */}
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.35 }}>
        {p.title}
      </div>

      {/* Meta row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {p.categories && (
          <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>
            {p.categories.icon} {p.categories.name_th}
          </span>
        )}
        {merchant && (
          <>
            <span style={{ color: 'var(--line)', fontSize: 11 }}>·</span>
            <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{merchant}</span>
          </>
        )}
        {p.min_spend && (
          <>
            <span style={{ color: 'var(--line)', fontSize: 11 }}>·</span>
            <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>ขั้นต่ำ ฿{p.min_spend.toLocaleString()}</span>
          </>
        )}
        {p.max_cap && (
          <>
            <span style={{ color: 'var(--line)', fontSize: 11 }}>·</span>
            <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>สูงสุด ฿{p.max_cap.toLocaleString()}</span>
          </>
        )}
      </div>

      {/* Condition + date */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        {p.condition && (
          <span style={{
            fontSize: 11, color: 'var(--ink-4)', lineHeight: 1.4,
            flex: 1, minWidth: 0,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {p.condition}
          </span>
        )}
        {p.end_date && (
          <span style={{ fontSize: 11, color: 'var(--ink-4)', flexShrink: 0 }}>
            ถึง {formatDate(p.end_date)}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────
export default function PromoPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [promos, setPromos] = useState<Promo[]>([])
  const [selectedCat, setSelectedCat] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(setCategories)
      .catch(() => {})
  }, [])

  useEffect(() => {
    setIsLoading(true)
    const url = selectedCat
      ? `/api/promotions?categoryId=${selectedCat}`
      : '/api/promotions'
    fetch(url)
      .then(r => r.json())
      .then(setPromos)
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [selectedCat])

  return (
    <div className="min-h-screen bg-bg">

      {/* Header */}
      <div style={{ padding: '40px 20px 12px' }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '1.4px', textTransform: 'uppercase', color: 'var(--ink-4)' }}>
          โปรโมชั่น
        </div>
        <h1 style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-.5px', color: 'var(--ink)', marginTop: 4, lineHeight: 1 }}>
          {isLoading ? '–' : promos.length} รายการ
        </h1>
      </div>

      {/* Category filter tabs */}
      <div style={{
        display: 'flex', gap: 8, overflowX: 'auto', padding: '0 20px 12px',
        scrollbarWidth: 'none',
      }}>
        <button
          onClick={() => setSelectedCat(null)}
          style={{
            flexShrink: 0, padding: '7px 14px', borderRadius: 99, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
            background: selectedCat === null ? 'var(--ink)' : 'var(--surface)',
            color: selectedCat === null ? 'var(--bg)' : 'var(--ink-2)',
            border: selectedCat === null ? 'none' : '1px solid var(--line)',
          }}
        >
          ทั้งหมด
        </button>
        {categories.map(c => (
          <button
            key={c.id}
            onClick={() => setSelectedCat(c.id)}
            style={{
              flexShrink: 0, padding: '7px 14px', borderRadius: 99, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
              background: selectedCat === c.id ? 'var(--ink)' : 'var(--surface)',
              color: selectedCat === c.id ? 'var(--bg)' : 'var(--ink-2)',
              border: selectedCat === c.id ? 'none' : '1px solid var(--line)',
            }}
          >
            {c.icon} {c.name_th}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '0 16px 100px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{
              height: 110, borderRadius: 'var(--r-md)',
              background: 'var(--surface-2)', animation: 'pulse 1.5s ease-in-out infinite',
            }} />
          ))
        ) : promos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--ink-4)' }}>
            <div style={{ fontSize: 36 }}>🏷️</div>
            <div style={{ fontSize: 14, marginTop: 10 }}>ไม่พบโปรโมชั่น</div>
          </div>
        ) : (
          promos.map(p => <PromoCard key={p.id} p={p} />)
        )}
      </div>
    </div>
  )
}
