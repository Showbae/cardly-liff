'use client'

import { useState } from 'react'

const THAI_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
]
const THAI_DOW = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}
function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

interface Props {
  value: Date
  onChange: (d: Date) => void
  /** Dates after this are disabled (defaults to today — no future spending) */
  maxDate?: Date
}

export function BuddhistCalendar({ value, onChange, maxDate }: Props) {
  const today = startOfDay(new Date())
  const max = maxDate ? startOfDay(maxDate) : today
  const [view, setView] = useState(() => new Date(value.getFullYear(), value.getMonth(), 1))

  const year = view.getFullYear()
  const month = view.getMonth()
  const firstDow = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Leading blanks + day cells
  const cells: (number | null)[] = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const canGoNext = new Date(year, month + 1, 1) <= max

  return (
    <div style={{ margin: '12px 8px 0' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 6px 10px' }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
          {THAI_MONTHS_FULL[month]} {year + 543}
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => setView(new Date(year, month - 1, 1))}
            aria-label="เดือนก่อนหน้า"
            style={navBtn}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <button
            onClick={() => canGoNext && setView(new Date(year, month + 1, 1))}
            disabled={!canGoNext}
            aria-label="เดือนถัดไป"
            style={{ ...navBtn, opacity: canGoNext ? 1 : 0.35, cursor: canGoNext ? 'pointer' : 'not-allowed' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>
      </div>

      {/* Day-of-week labels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {THAI_DOW.map(dow => (
          <div key={dow} style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-4)', textAlign: 'center', padding: '4px 0' }}>
            {dow}
          </div>
        ))}
      </div>

      {/* Days */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {cells.map((d, i) => {
          if (d === null) return <div key={`b${i}`} />
          const cellDate = new Date(year, month, d)
          const isFuture = cellDate > max
          const isSel = sameDay(cellDate, value)
          const isToday = sameDay(cellDate, today)
          return (
            <button
              key={d}
              onClick={() => !isFuture && onChange(cellDate)}
              disabled={isFuture}
              style={{
                aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontVariantNumeric: 'tabular-nums', borderRadius: 9,
                border: 'none', fontFamily: 'inherit', cursor: isFuture ? 'default' : 'pointer',
                background: isSel ? 'var(--brand-600)' : 'transparent',
                color: isSel ? '#fff' : isFuture ? 'var(--ink-4)' : isToday ? 'var(--brand-600)' : 'var(--ink-2)',
                fontWeight: isSel || isToday ? 700 : 500,
                opacity: isFuture ? 0.4 : 1,
              }}
            >
              {d}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const navBtn: React.CSSProperties = {
  width: 28, height: 28, borderRadius: 8,
  background: 'var(--surface-2)', border: 'none', color: 'var(--ink-3)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
}
