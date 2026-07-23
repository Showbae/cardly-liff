'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { initLiff, getLiffProfile } from '@/lib/liff'
import { signInWithLine } from '@/lib/auth'
import { getMyCards } from '@/lib/cards'
import { SearchOverlay } from '@/components/liff/SearchOverlay'
import { RecommendSheet } from '@/components/liff/RecommendSheet'

interface MerchantInfo {
  id: string
  name_th: string | null
  name_eng: string | null
  categories: { name_th: string | null; name_eng: string | null; icon: string | null } | null
}

const CATEGORIES = [
  { emoji: '☕', label: 'คาเฟ่' },
  { emoji: '🍜', label: 'ร้านอาหาร' },
  { emoji: '🛒', label: 'ซูเปอร์' },
  { emoji: '⛽', label: 'น้ำมัน' },
  { emoji: '🛍️', label: 'ช้อปปิ้ง' },
  { emoji: '🏥', label: 'โรงพยาบาล' },
]

const URGENCY_ALERTS = [
  {
    icon: '🔥',
    iconBg: '#fdece1',
    title: 'โปร KBank ลด 15% ใกล้หมด',
    sub: 'ร้านในห้าง · ใช้ก่อนหมดสิทธิ์',
    tag: 'เหลือ 2 วัน',
    tagStyle: 'bg-warn-bg text-warn',
  },
  {
    icon: '⚠️',
    iconBg: '#e3edfb',
    title: 'SCB M ใช้ครบเพดาน cashback แล้ว',
    sub: 'รอบนี้สลับไปใช้ KTC Forever แทน',
    tag: 'สลับใบ',
    tagStyle: 'bg-brand-100 text-brand-700',
  },
  {
    icon: '🎁',
    iconBg: '#fbe9b6',
    title: 'อีก ฿1,200 ครบขั้นต่ำรับของแถม',
    sub: 'UOB Privi · รูดให้ถึง ฿15,000',
    tag: '฿1,200',
    tagStyle: 'bg-gold-100 text-gold-600',
  },
]

const RECENTS_KEY = 'cardly-recent-searches'

function loadHomeRecents(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENTS_KEY) ?? '[]') } catch { return [] }
}

export default function HomePage() {
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [cardCount, setCardCount] = useState<number | null>(null)
  const [authDone, setAuthDone] = useState(false)
  const [userId, setUserId] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [homeRecents, setHomeRecents] = useState<string[]>([])
  const overlayInputRef = useRef<HTMLInputElement>(null)
  const [selectedMerchant, setSelectedMerchant] = useState<MerchantInfo | null>(null)
  const [recommendOpen, setRecommendOpen] = useState(false)

  function openSearch() {
    overlayInputRef.current?.focus({ preventScroll: true })
    setSearchOpen(true)
  }

  useEffect(() => {
    const init = async () => {
      try {
        await initLiff()
        const profile = await getLiffProfile()

        // Dev fallback: ใช้ Showbae account เมื่อไม่ได้อยู่ใน LINE
        const dbUser = profile
          ? await signInWithLine({
              userId: profile.userId,
              displayName: profile.displayName,
              pictureUrl: profile.pictureUrl ?? '',
            })
          : { id: '9ee6ee16-d45a-4750-8bcb-ef59285bf2e4', display_name: 'Showbae🍀' }

        setUserId(dbUser.id)
        setFirstName(dbUser.display_name.split(' ')[0])
        const cards = await getMyCards(dbUser.id)
        setCardCount(cards.length)
      } catch {
        // fail silently on Home; Wallet page shows detailed errors
      } finally {
        setAuthDone(true)
      }
    }
    init()
  }, [])

  useEffect(() => {
    setHomeRecents(loadHomeRecents())
  }, [])

  function handleSearchClose() {
    setSearchOpen(false)
    setHomeRecents(loadHomeRecents())
  }

  function handleMerchantSelect(merchant: MerchantInfo) {
    if (!authDone || !userId) return  // wait for auth before fetching recommendations
    setSelectedMerchant(merchant)
    setRecommendOpen(true)
  }

  function handleRecommendClose() {
    setRecommendOpen(false)
    setTimeout(() => setSelectedMerchant(null), 320)  // clear after slide-out animation
  }

  function handleBackToSearch() {
    setRecommendOpen(false)
    setTimeout(() => setSelectedMerchant(null), 320)
    setSearchOpen(true)
  }

  return (
    <div className="min-h-screen bg-bg">

      {/* ── App Header ────────────────────────────── */}
      <div className="px-5 pt-10 pb-2 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-ink leading-tight">
            วันนี้จะรูดที่ไหน?
          </h1>
          <p className="text-[12px] text-ink-3 mt-0.5 flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            ทองหล่อ
            {firstName ? ` · สวัสดี, ${firstName}` : ''}
          </p>
        </div>
        <button className="w-9 h-9 rounded-xl bg-surface border border-line flex items-center justify-center text-ink-2 relative shrink-0 mt-1 shadow-depth-sm">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="absolute top-[7px] right-[8px] w-1.5 h-1.5 rounded-full bg-warn border border-surface" />
        </button>
      </div>

      <div className="px-4 pb-6 space-y-0">

        {/* ── Zone 1 · Search Hero ─────────────────── */}
        <div
          onClick={openSearch}
          className="flex items-center gap-[11px] px-4 py-[15px] bg-surface border-[1.5px] border-line shadow-depth-md mt-3 cursor-pointer"
          style={{ borderRadius: 'var(--r-lg)' }}
        >
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="var(--brand-700)"
            strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span className="flex-1 text-[15px] text-ink-4">ค้นหาร้าน หมวด หรือธนาคาร</span>
          <button
            className="w-8 h-8 bg-brand-100 text-brand-700 flex items-center justify-center"
            style={{ borderRadius: 'var(--r-xs)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>
          </button>
        </div>

        &nbsp;

        {/* Categories */}
        <div className="flex gap-3 overflow-x-auto mt-[14px] pb-1 -mx-1 px-1 scrollbar-none">
          {CATEGORIES.map(c => (
            <button key={c.label} className="flex flex-col items-center gap-1.5 min-w-[58px]">
              <div className="w-[52px] h-[52px] rounded-2xl bg-surface border border-line flex items-center justify-center text-[23px]">
                {c.emoji}
              </div>
              <span className="text-[11px] text-ink-2 whitespace-nowrap">{c.label}</span>
            </button>
          ))}
        </div>

        {/* Recent searches */}
        {homeRecents.length > 0 && (
        <div className="flex items-center gap-1.5 mt-[14px] flex-wrap">
          <span className="text-[11px] text-ink-4">ล่าสุด</span>
          {homeRecents.map(q => (
            <button
              key={q}
              onClick={openSearch}
              className="inline-flex items-center gap-1 text-[12px] font-medium px-[11px] py-[5px] rounded-full bg-surface-2 text-ink-2"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {q}
            </button>
          ))}
        </div>
        )}

        {/* ── Zone 2 · ต้องรีบ ─────────────────────── */}
        <div className="flex justify-between items-center mt-[18px] mb-2 mx-0.5">
          <h3 className="text-[13px] font-semibold text-ink">ต้องรีบ</h3>
          <button className="text-[12px] text-brand-700">ดูทั้งหมด</button>
        </div>
        <div className="flex flex-col gap-2">
          {URGENCY_ALERTS.map((item, i) => (
            <div
              key={i}
              className="grid gap-3 items-center px-3 py-[10px] bg-surface border border-line"
              style={{ gridTemplateColumns: '40px 1fr auto', borderRadius: 'var(--r-md)' }}
            >
              <div
                className="w-10 h-10 flex items-center justify-center text-[19px]"
                style={{ background: item.iconBg, borderRadius: 12 }}
              >
                {item.icon}
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-ink leading-snug">{item.title}</p>
                <p className="text-[11px] text-ink-3 mt-0.5">{item.sub}</p>
              </div>
              <span className={`inline-flex text-[11px] font-medium px-[9px] py-[5px] rounded-full whitespace-nowrap ${item.tagStyle}`}>
                {item.tag}
              </span>
            </div>
          ))}
        </div>
         &nbsp;
        {/* ── Zone 3 · บัตรของฉัน pill ─────────────── */}
        <div className="flex justify-center mt-4">
          <button
            onClick={() => router.push('/wallet')}
            className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-surface border border-line shadow-depth-sm"
          >
            {/* mini card stack */}
            <div className="relative w-[38px] h-6 shrink-0">
              <div
                className="absolute left-0 top-[3px] w-[26px] h-[17px]"
                style={{
                  borderRadius: 4,
                  background: 'linear-gradient(135deg, #6b2d8c 0%, #341252 100%)',
                  transform: 'rotate(-12deg)',
                }}
              />
              <div
                className="absolute left-[6px] top-[2px] w-[26px] h-[17px]"
                style={{
                  borderRadius: 4,
                  background: 'linear-gradient(135deg, #e3603f 0%, #a02b1f 100%)',
                  transform: 'rotate(-3deg)',
                }}
              />
              <div
                className="absolute left-[12px] top-[1px] w-[26px] h-[17px]"
                style={{
                  borderRadius: 4,
                  background: 'linear-gradient(135deg, #1c8c75 0%, #07332a 100%)',
                  boxShadow: '0 1px 3px rgba(0,0,0,.25)',
                }}
              />
            </div>
           
            <span className="text-[12px] font-semibold text-ink">
              {!authDone
                ? 'บัตรของฉัน'
                : `บัตรของฉัน · ${cardCount ?? 0} ใบ`}
            </span>

            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink-4)"
              strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

      </div>

      <SearchOverlay
        ref={overlayInputRef}
        open={searchOpen}
        onClose={handleSearchClose}
        onSelect={handleMerchantSelect}
      />
      <RecommendSheet
        merchant={selectedMerchant}
        userId={userId}
        open={recommendOpen}
        onClose={handleRecommendClose}
        onBackToSearch={handleBackToSearch}
      />
    </div>
  )
}
