'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

interface MerchantInfo {
  id: string
  name_th: string | null
  name_eng: string | null
  categories: { name_th: string | null; name_eng: string | null; icon: string | null } | null
}

interface PromoInfo {
  title: string
  promo_type: string | null
  benefit_value: number
  benefit_unit: string | null
  max_cap: number | null
  min_spend: number | null
  end_date: string | null
  condition: string | null
  scope: 'merchant' | 'category' | 'none'
}

export interface CardRec {
  rank: number
  card: {
    id: string
    usersCardId: string
    card_name: string | null
    image_url: string | null
    last_four: string | null
    bank: { name_th: string | null; name_eng: string | null; color: string | null; initial: string | null } | null
  }
  promo: PromoInfo | null
}

interface SuggestedCard {
  card: {
    id: string
    card_name: string | null
    image_url: string | null
    bank: { name_th: string | null; name_eng: string | null; color: string | null; initial: string | null } | null
  }
  promo: PromoInfo
}

interface RecommendData {
  merchant: MerchantInfo
  recommendations: CardRec[]
  suggestedCards: SuggestedCard[]
  noCards?: boolean
}

interface Props {
  merchant: MerchantInfo | null
  userId: string
  open: boolean
  onClose: () => void
  onBackToSearch: () => void
}

type SortKey = 'value' | 'min_spend'

// ── Helpers ──────────────────────────────────────────────────────────────────

function bankColor(color: string | null): string {
  return color ?? '#0f8e5a'
}

function bankInitial(bank: { name_eng: string | null; name_th: string | null; initial: string | null } | null): string {
  return bank?.initial ?? (bank?.name_eng ?? bank?.name_th ?? '?').slice(0, 2).toUpperCase()
}

function formatBenefit(promo: PromoInfo): string {
  const val = promo.benefit_value
  const unit = promo.benefit_unit ?? ''
  if (promo.promo_type === 'installment') {
    return val === 0 ? 'ผ่อน 0% ดอกเบี้ย' : `ผ่อน ${val}% ดอกเบี้ย`
  }
  if (promo.promo_type === 'cashback') {
    return unit === '%' ? `คืน ${val}%` : `คืน ${val} ${unit}`
  }
  if (promo.promo_type === 'points') {
    return unit === 'x' || unit === '' ? `รับ ${val}x คะแนน` : `รับ ${val} ${unit}`
  }
  if (promo.promo_type === 'miles') {
    return unit === 'x' || unit === '' ? `รับ ${val}x ไมล์` : `รับ ${val} ${unit}`
  }
  return unit === '%' ? `ลด ${val}%` : `ลด ${val} ${unit}`
}

const MONTHS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']
function formatDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return `หมด ${d.getDate()} ${MONTHS[d.getMonth()]}`
}

function isExpiringSoon(iso: string | null): boolean {
  if (!iso) return false
  return (new Date(iso).getTime() - Date.now()) < 7 * 24 * 60 * 60 * 1000
}

// ── Sub-components ────────────────────────────────────────────────────────────

function NavBar({ merchant, onBack, onClose }: {
  merchant: MerchantInfo | null
  onBack: () => void
  onClose: () => void
}) {
  return (
    <div
      className="flex items-center gap-2 px-3.5 py-2.5 shrink-0"
      style={{ background: 'var(--surface)', borderBottom: '1px solid var(--line)' }}
    >
      <button
        onClick={onBack}
        className="w-9 h-9 rounded-xl flex items-center justify-center text-ink-3 shrink-0"
        style={{ background: 'var(--surface-2)' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <div className="flex-1 flex flex-col items-center min-w-0">
        {merchant && (
          <>
            <div className="flex items-center gap-1.5">
              <span className="text-[16px] leading-none">{merchant.categories?.icon ?? '🏪'}</span>
              <span className="text-[14px] font-bold text-ink truncate">
                {merchant.name_eng ?? merchant.name_th}
              </span>
            </div>
            {merchant.categories?.name_th && (
              <span className="text-[10px] text-ink-4 mt-0.5">{merchant.categories.name_th}</span>
            )}
          </>
        )}
      </div>

      <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center text-ink-4 shrink-0">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth={2.5} strokeLinecap="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

function SortBar({ sortBy, onChange }: { sortBy: SortKey; onChange: (k: SortKey) => void }) {
  const opts: { key: SortKey; label: string }[] = [
    { key: 'value',     label: 'คุ้มสุด' },
    { key: 'min_spend', label: 'ขั้นต่ำต่ำสุด' },
  ]
  return (
    <div className="flex items-center gap-2 mb-3 shrink-0">
      <span className="text-[11px] text-ink-4 whitespace-nowrap">เรียงตาม</span>
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
        {opts.map(o => (
          <button
            key={o.key}
            onClick={() => onChange(o.key)}
            className="text-[11px] font-semibold px-3 py-[5px] rounded-full whitespace-nowrap shrink-0"
            style={sortBy === o.key
              ? { background: 'var(--ink)', color: 'var(--bg)' }
              : { background: 'var(--surface-2)', color: 'var(--ink-3)' }
            }
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function DetailCard({ rec, rank }: { rec: CardRec; rank: number }) {
  const color = bankColor(rec.card.bank?.color ?? null)
  const rankLabel = rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'
  const expiring = isExpiringSoon(rec.promo?.end_date ?? null)

  return (
    <div
      className="flex rounded-[var(--r-lg)] overflow-hidden mb-2"
      style={{ background: 'var(--surface)', border: '1px solid var(--line)', boxShadow: 'var(--shadow-md)' }}
    >
      <div className="w-1 shrink-0" style={{ background: color }} />
      <div className="flex-1 px-3.5 py-3 min-w-0">
        {/* Top row */}
        <div className="flex items-start gap-2 mb-[5px]">
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white shrink-0 mt-[1px]"
            style={{ background: color }}
          >
            {rank}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-bold text-ink leading-snug">
              {rec.card.card_name ?? 'Credit Card'}
            </p>
            <p className="text-[10px] text-ink-4 mt-[1px]">
              {rec.card.bank?.name_eng ?? rec.card.bank?.name_th ?? ''}
              {rec.card.last_four ? ` · ****${rec.card.last_four}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[13px]">{rankLabel}</span>
            {rec.promo?.scope === 'merchant' && (
              <span
                className="text-[9px] font-bold px-[6px] py-[2px] rounded-full"
                style={{ background: 'var(--brand-100)', color: 'var(--brand-700)' }}
              >
                โปรร้านนี้
              </span>
            )}
          </div>
        </div>

        {/* Benefit */}
        {rec.promo ? (
          <>
            <p className="text-[19px] font-black leading-none mb-[5px]" style={{ color, letterSpacing: '-.5px' }}>
              {formatBenefit(rec.promo)
                .replace(/ สูงสุด.*/, '')}{' '}
              <span className="text-[12px] font-semibold text-ink-3">
                {rec.promo.max_cap ? `สูงสุด ฿${rec.promo.max_cap.toLocaleString()}` : ''}
              </span>
            </p>
            <div className="flex items-center gap-2 flex-wrap mb-[5px]">
              {rec.promo.min_spend && (
                <span className="text-[10px] text-ink-3">💵 ขั้นต่ำ ฿{rec.promo.min_spend.toLocaleString()}</span>
              )}
              {rec.promo.end_date && (
                <span
                  className="text-[10px]"
                  style={{ color: expiring ? 'var(--warn)' : 'var(--ink-3)' }}
                >
                  {expiring ? '⏱' : '📅'} {formatDate(rec.promo.end_date)}
                </span>
              )}
            </div>
            {rec.promo.condition && (
              <p
                className="text-[10px] text-ink-4 leading-[1.4] pt-[4px]"
                style={{ borderTop: '1px solid var(--line-soft)' }}
              >
                {rec.promo.condition}
              </p>
            )}
          </>
        ) : (
          <p className="text-[11px] text-ink-4">ไม่มีโปรพิเศษสำหรับร้านนี้</p>
        )}
      </div>
    </div>
  )
}

function SuggestedCard({ rec }: { rec: SuggestedCard }) {
  const color = bankColor(rec.card.bank?.color ?? null)
  const expiring = isExpiringSoon(rec.promo.end_date)

  return (
    <div
      className="flex rounded-[var(--r-lg)] overflow-hidden mb-2"
      style={{ background: 'var(--surface)', border: '1.5px dashed var(--line)' }}
    >
      <div className="w-1 shrink-0" style={{ background: color, opacity: .6 }} />
      <div className="flex-1 px-3.5 py-3 min-w-0">
        {/* Top row */}
        <div className="flex items-start gap-2 mb-[5px]">
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-[1px]"
            style={{ border: `1.5px dashed ${color}`, color }}
          >
            +
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-bold text-ink leading-snug">
              {rec.card.card_name ?? 'Credit Card'}
            </p>
            <p className="text-[10px] text-ink-4 mt-[1px]">
              {rec.card.bank?.name_eng ?? rec.card.bank?.name_th ?? ''}
            </p>
          </div>
          {rec.promo.scope === 'merchant' && (
            <span
              className="text-[9px] font-bold px-[6px] py-[2px] rounded-full shrink-0"
              style={{ background: 'var(--brand-100)', color: 'var(--brand-700)' }}
            >
              โปรร้านนี้
            </span>
          )}
        </div>

        {/* Benefit */}
        <p className="text-[19px] font-black leading-none mb-[5px]" style={{ color, letterSpacing: '-.5px', opacity: .85 }}>
          {formatBenefit(rec.promo).replace(/ สูงสุด.*/, '')}{' '}
          <span className="text-[12px] font-semibold text-ink-3">
            {rec.promo.max_cap ? `สูงสุด ฿${rec.promo.max_cap.toLocaleString()}` : ''}
          </span>
        </p>
        <div className="flex items-center gap-2 flex-wrap mb-[5px]">
          {rec.promo.min_spend && (
            <span className="text-[10px] text-ink-3">💵 ขั้นต่ำ ฿{rec.promo.min_spend.toLocaleString()}</span>
          )}
          {rec.promo.end_date && (
            <span className="text-[10px]" style={{ color: expiring ? 'var(--warn)' : 'var(--ink-3)' }}>
              {expiring ? '⏱' : '📅'} {formatDate(rec.promo.end_date)}
            </span>
          )}
        </div>
        {rec.promo.condition && (
          <p
            className="text-[10px] text-ink-4 leading-[1.4] pt-[4px]"
            style={{ borderTop: '1px solid var(--line-soft)' }}
          >
            {rec.promo.condition}
          </p>
        )}
      </div>
    </div>
  )
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 my-4">
      <div className="flex-1 h-px" style={{ background: 'var(--line)' }} />
      <span className="text-[10px] font-bold tracking-wider uppercase text-ink-4 whitespace-nowrap">
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: 'var(--line)' }} />
    </div>
  )
}


function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-2 pt-1">
      {[1, 2, 3].map(i => (
        <div key={i} className="rounded-[var(--r-lg)] overflow-hidden flex"
          style={{ background: 'var(--surface)', border: '1px solid var(--line)', height: 88 }}>
          <div className="w-1 shrink-0 animate-pulse" style={{ background: 'var(--line)' }} />
          <div className="flex-1 p-3.5 flex flex-col gap-2">
            <div className="h-3 rounded animate-pulse w-1/2" style={{ background: 'var(--line)' }} />
            <div className="h-5 rounded animate-pulse w-1/3" style={{ background: 'var(--line-soft)' }} />
            <div className="h-2.5 rounded animate-pulse w-3/4" style={{ background: 'var(--line-soft)' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

const NUMPAD_KEYS = ['1','2','3','4','5','6','7','8','9','.','0','⌫']

export function RecommendSheet({ merchant, userId, open, onClose, onBackToSearch }: Props) {
  const router = useRouter()
  const [data, setData] = useState<RecommendData | null>(null)
  const [loading, setLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [sortBy, setSortBy] = useState<SortKey>('value')

  // Log spending state
  const [logCardId, setLogCardId] = useState('')
  const [logAmount, setLogAmount] = useState('')
  const [numpadOpen, setNumpadOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [logDismissed, setLogDismissed] = useState(false)

  useEffect(() => {
    if (!open || !merchant) return
    const controller = new AbortController()
    setLoading(true)
    setData(null)
    setHasError(false)
    setSortBy('value')
    setLogCardId('')
    setLogAmount('')
    setNumpadOpen(false)
    setSaved(false)
    setLogDismissed(false)
    fetch(
      `/api/recommend?merchantId=${encodeURIComponent(merchant.id)}&userId=${encodeURIComponent(userId)}`,
      { signal: controller.signal },
    )
      .then(r => r.json())
      .then((d: RecommendData) => setData(d))
      .catch(err => { if (err.name !== 'AbortError') setHasError(true) })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [open, merchant, userId])

  const sorted = useMemo(() => {
    if (!data?.recommendations) return []
    const recs = [...data.recommendations]
    if (sortBy === 'min_spend') {
      // null min_spend = no minimum = best → sort to top (treat as 0)
      return recs.sort((a, b) => (a.promo?.min_spend ?? 0) - (b.promo?.min_spend ?? 0))
    }
    return recs
  }, [data, sortBy])

  // Derive log card: prefer explicit selection, fallback to rank 1
  const logCard = (sorted.find(r => r.card.usersCardId === logCardId) ?? sorted[0])?.card ?? null
  const hasAmount = logAmount !== '' && logAmount !== '0'

  function handleNumpadKey(k: string) {
    if (k === '⌫') { setLogAmount(a => a.slice(0, -1)); return }
    if (k === '.') {
      if (logAmount.includes('.')) return
      setLogAmount(a => (a === '' ? '0.' : a + '.'))
      return
    }
    const [intPart, decPart] = logAmount.split('.')
    if (decPart !== undefined && decPart.length >= 2) return
    if (!logAmount.includes('.') && (intPart ?? '').length >= 6) return
    setLogAmount(a => (a === '0' ? k : a + k))
  }

  async function handleSave() {
    if (!logCard || !hasAmount) return
    setSaving(true)
    try {
      await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usersCardId: logCard.usersCardId,
          merchantId: merchant?.id,
          amount: parseFloat(logAmount),
        }),
      })
      setSaved(true)
      setTimeout(() => { setNumpadOpen(false); setSaved(false); setLogDismissed(true) }, 1200)
    } catch {
      // fail silently
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{
        background: 'var(--bg)',
        transform: open ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform .3s ease-out',
      }}
    >
      <NavBar merchant={merchant} onBack={onBackToSearch} onClose={onClose} />

      <div
        className="flex-1 overflow-y-auto overscroll-contain px-4 pt-3 scrollbar-none"
        style={{ paddingBottom: sorted.length > 0 && !logDismissed ? '200px' : '40px' }}
      >

        {loading && <LoadingSkeleton />}

        {!loading && hasError && (
          <div className="flex flex-col items-center gap-3 pt-20 text-center">
            <span className="text-[40px]">⚠️</span>
            <p className="text-[14px] font-bold text-ink">โหลดข้อมูลไม่สำเร็จ</p>
            <p className="text-[12px] text-ink-3">กรุณาลองใหม่อีกครั้ง</p>
            <button
              onClick={() => {
                if (!merchant) return
                const controller = new AbortController()
                setLoading(true)
                setHasError(false)
                fetch(
                  `/api/recommend?merchantId=${encodeURIComponent(merchant.id)}&userId=${encodeURIComponent(userId)}`,
                  { signal: controller.signal },
                )
                  .then(r => r.json())
                  .then((d: RecommendData) => setData(d))
                  .catch(err => { if (err.name !== 'AbortError') setHasError(true) })
                  .finally(() => setLoading(false))
              }}
              className="mt-1 px-5 py-2.5 rounded-full text-[13px] font-bold text-white"
              style={{ background: 'var(--brand-600)' }}
            >
              ลองอีกครั้ง
            </button>
          </div>
        )}

        {!loading && !hasError && data?.noCards && (
          <div className="flex flex-col items-center gap-3 pt-20 text-center">
            <span className="text-[40px]">💳</span>
            <p className="text-[14px] font-bold text-ink">ยังไม่มีบัตรใน Wallet</p>
            <p className="text-[12px] text-ink-3">เพิ่มบัตรก่อนเพื่อให้ Cardly แนะนำได้</p>
            <button
              onClick={() => { onClose(); router.push('/wallet') }}
              className="mt-2 px-5 py-2.5 rounded-full text-[13px] font-bold text-white"
              style={{ background: 'var(--brand-600)' }}
            >
              ไปเพิ่มบัตร
            </button>
          </div>
        )}

        {!loading && !hasError && data && !data.noCards && (
          <>
            <SortBar sortBy={sortBy} onChange={setSortBy} />

            {sorted.length > 0 ? (
              sorted.map((rec, i) => <DetailCard key={rec.card.id} rec={rec} rank={i + 1} />)
            ) : (
              <div className="flex flex-col items-center gap-2 pt-16 text-center">
                <p className="text-[13px] font-semibold text-ink-3">ไม่พบโปรพิเศษสำหรับบัตรที่มี</p>
                <p className="text-[11px] text-ink-4">ลองดูหมวดอื่นหรือตรวจสอบโปรใหม่ในภายหลัง</p>
              </div>
            )}

            {data.suggestedCards.length > 0 && (
              <>
                <SectionDivider label="คุ้มกว่าถ้ามีบัตรนี้" />
                {data.suggestedCards.map(s => (
                  <SuggestedCard key={s.card.id} rec={s} />
                ))}
              </>
            )}
          </>
        )}

      </div>

      {/* ── Log spending section ── */}
      {sorted.length > 0 && !logDismissed && !numpadOpen && (
        <div
          className="shrink-0 px-4 pt-3 pb-4"
          style={{ background: 'var(--surface)', borderTop: '1px solid var(--line)' }}
        >
          <div className="flex items-center gap-1.5 mb-2.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--brand-600)' }} />
            <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: 'var(--brand-600)' }}>
              บันทึกยอดที่รูด
            </span>
          </div>

          {sorted.length > 1 && (
            <div className="flex gap-1.5 mb-3 -mx-1 px-1 overflow-x-auto scrollbar-none">
              {sorted.map(rec => {
                const color = bankColor(rec.card.bank?.color ?? null)
                const sel = rec.card.usersCardId === (logCardId || sorted[0]?.card.usersCardId)
                const bankName = rec.card.bank?.name_eng ?? rec.card.bank?.name_th ?? ''
                return (
                  <button
                    key={rec.card.usersCardId}
                    onClick={() => setLogCardId(rec.card.usersCardId)}
                    className="flex items-center gap-[5px] px-3 py-[6px] rounded-full shrink-0 text-[11px] font-bold"
                    style={sel
                      ? { background: color, color: '#fff' }
                      : { background: 'var(--surface-2)', color: 'var(--ink-3)', border: '1px solid var(--line)' }
                    }
                  >
                    <div className="w-[6px] h-[6px] rounded-full shrink-0" style={{ background: sel ? '#fff' : color }} />
                    {bankName}{rec.card.last_four ? ` ••${rec.card.last_four}` : ''}
                  </button>
                )
              })}
            </div>
          )}

          <button
            onClick={() => setNumpadOpen(true)}
            className="w-full flex items-center gap-2 px-4 py-[11px] rounded-[var(--r-md)] mb-3 text-left"
            style={{ background: 'var(--surface-2)', border: '1.5px solid var(--line)' }}
          >
            <span className="text-[15px]" style={{ color: 'var(--ink-3)' }}>฿</span>
            <span
              className="flex-1 text-[22px] font-black tracking-tight"
              style={{ color: hasAmount ? 'var(--ink)' : 'var(--ink-4)', fontVariantNumeric: 'tabular-nums' }}
            >
              {hasAmount ? Number(logAmount).toLocaleString('th-TH', { maximumFractionDigits: 2 }) : 'กรอกยอด'}
            </span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--ink-4)"
              strokeWidth={2.5} strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>

          <div className="flex gap-2">
            <button
              onClick={hasAmount ? handleSave : () => setNumpadOpen(true)}
              disabled={saving || saved}
              className="flex-1 py-[11px] rounded-[var(--r-lg)] text-[14px] font-bold text-white flex items-center justify-center gap-1.5"
              style={{ background: saved ? '#1a7a48' : 'var(--brand-600)', opacity: !hasAmount ? 0.45 : 1 }}
            >
              {saved ? (
                <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white"
                  strokeWidth={2.5} strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>บันทึกแล้ว</>
              ) : saving ? 'กำลังบันทึก...' : hasAmount
                ? `บันทึก ฿${Number(logAmount).toLocaleString('th-TH', { maximumFractionDigits: 2 })}`
                : 'บันทึก'}
            </button>
            <button
              onClick={() => setLogDismissed(true)}
              className="px-4 py-[11px] rounded-[var(--r-lg)] text-[14px] font-semibold"
              style={{ background: 'var(--surface-2)', color: 'var(--ink-3)', border: '1px solid var(--line)' }}
            >
              ข้าม
            </button>
          </div>
        </div>
      )}

      {/* Numpad overlay — absolute within fixed parent */}
      {numpadOpen && logCard && (
        <div
          className="absolute inset-x-0 bottom-0 z-10 flex flex-col"
          style={{ background: 'var(--surface)', borderTop: '1px solid var(--line)', borderRadius: '18px 18px 0 0' }}
        >
          <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid var(--line)' }}>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[14px] shrink-0"
                style={{ background: 'var(--surface-2)' }}>
                {merchant?.categories?.icon ?? '🏪'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-ink leading-none">
                  {logCard.bank?.name_eng ?? ''} · {merchant?.name_eng ?? merchant?.name_th ?? 'ร้านค้า'}
                </p>
                <p className="text-[9px] mt-[2px]" style={{ color: 'var(--ink-4)' }}>
                  บันทึกวันนี้ · {merchant?.categories?.name_th ?? ''}
                </p>
              </div>
              <button onClick={() => setNumpadOpen(false)}
                className="text-[10px] font-semibold px-2.5 py-1 rounded-lg shrink-0"
                style={{ background: 'var(--surface-2)', color: 'var(--ink-3)' }}>
                ปิด
              </button>
            </div>
            <div className="text-center">
              <span className="text-[16px]" style={{ color: 'var(--ink-3)' }}>฿</span>
              <span className="text-[40px] font-black tracking-tight"
                style={{ color: logAmount ? 'var(--ink)' : 'var(--ink-4)', fontVariantNumeric: 'tabular-nums' }}>
                {Number(logAmount || '0').toLocaleString('th-TH', { maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3" style={{ borderBottom: '1px solid var(--line)' }}>
            {NUMPAD_KEYS.map(k => (
              <button key={k} onClick={() => handleNumpadKey(k)}
                className="flex items-center justify-center py-[13px] text-[18px] font-semibold text-ink"
                style={{ borderRight: '1px solid var(--line-soft)', borderBottom: '1px solid var(--line-soft)' }}>
                {k === '⌫' ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth={2} strokeLinecap="round">
                    <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/>
                    <line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                ) : k}
              </button>
            ))}
          </div>

          <button onClick={handleSave} disabled={saving || saved || !hasAmount}
            className="mx-4 my-3 py-3 rounded-[var(--r-lg)] text-[14px] font-black text-white flex items-center justify-center gap-2"
            style={{ background: saved ? '#1a7a48' : 'var(--brand-600)', opacity: !hasAmount ? 0.45 : 1 }}>
            {saved ? (
              <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white"
                strokeWidth={2.5} strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>บันทึกแล้ว</>
            ) : saving ? 'กำลังบันทึก...'
              : `บันทึก ฿${Number(logAmount || '0').toLocaleString('th-TH', { maximumFractionDigits: 2 })}`}
          </button>
        </div>
      )}
    </div>
  )
}
