'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { initLiff, getLiffProfile } from '@/lib/liff'
import { signInWithLine } from '@/lib/auth'

interface MenuItem {
  icon: React.ReactNode
  label: string
  sub: string
  href: string
}

function ChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-4)"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

export default function MePage() {
  const [displayName, setDisplayName] = useState('')
  const [pictureUrl, setPictureUrl] = useState('')

  useEffect(() => {
    const init = async () => {
      try {
        await initLiff()
        const profile = await getLiffProfile()
        if (profile) {
          setDisplayName(profile.displayName)
          setPictureUrl(profile.pictureUrl ?? '')
        } else {
          // Dev fallback
          const dbUser = await signInWithLine({
            userId: 'dev',
            displayName: 'Showbae🍀',
            pictureUrl: '',
          }).catch(() => ({ display_name: 'Showbae🍀' }))
          setDisplayName(dbUser.display_name)
        }
      } catch {
        // fail silently
      }
    }
    init()
  }, [])

  const menus: MenuItem[] = [
    {
      label: 'โปรไฟล์',
      sub: 'ชื่อ รูปโปรไฟล์ LINE',
      href: '/me/profile',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
    {
      label: 'บัตรของฉัน',
      sub: 'เพิ่ม แก้ไข จัดการบัตรเครดิต',
      href: '/me/cards',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
      ),
    },
    {
      label: 'การแจ้งเตือน',
      sub: 'วันตัดรอบ ชำระเงิน โปรโมชัน',
      href: '/me/notifications',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-bg">

      {/* Profile header */}
      <div className="px-[22px] pt-10 pb-6 flex items-center gap-4"
        style={{ borderBottom: '1px solid var(--line-soft)' }}>
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-[24px] flex-shrink-0 overflow-hidden"
          style={{ background: 'var(--surface-2)', border: '2px solid var(--line)' }}
        >
          {pictureUrl
            ? <img src={pictureUrl} alt="" className="w-full h-full object-cover" />
            : '👤'
          }
        </div>
        <div>
          <div className="text-[18px] font-bold text-ink tracking-tight">
            {displayName || '…'}
          </div>
          <div className="text-[12px] text-ink-4 mt-0.5">Cardly Member</div>
        </div>
      </div>

      {/* Menu list */}
      <div className="px-[22px] pt-4">
        <div
          className="rounded-[var(--r-lg)] overflow-hidden"
          style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}
        >
          {menus.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-4 px-4 py-[14px] active:opacity-60 transition-opacity"
              style={{ borderTop: i === 0 ? 'none' : '1px solid var(--line-soft)' }}
            >
              <div
                className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 text-brand-700"
                style={{ background: 'var(--brand-50)' }}
              >
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-semibold text-ink">{item.label}</div>
                <div className="text-[11px] text-ink-4 mt-0.5">{item.sub}</div>
              </div>
              <ChevronRight />
            </Link>
          ))}
        </div>
      </div>

    </div>
  )
}
