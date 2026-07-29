'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTabBarStore } from '@/stores/tabBarStore'

const TABS = [
  {
    id: 'home',
    href: '/',
    label: 'หน้าหลัก',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={active ? 2 : 1.75} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    id: 'wallet',
    href: '/wallet',
    label: 'บัตร',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={active ? 2 : 1.75} strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    ),
  },
  {
    id: 'promo',
    href: '/promo',
    label: 'โปร',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={active ? 2 : 1.75} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
    ),
  },
  {
    id: 'me',
    href: '/me',
    label: 'ฉัน',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={active ? 2 : 1.75} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
]

export function BottomTabBar() {
  const pathname = usePathname()
  const visible = useTabBarStore(state => state.visible)

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-50 grid grid-cols-4 bg-surface border-t border-line transition-transform duration-200 ease-out ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}
    >
      {TABS.map(tab => {
        const active = isActive(tab.href)
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={`flex flex-col items-center gap-[3px] pt-2 pb-2 text-[10.5px] tracking-wide transition-colors ${
              active ? 'text-brand-700 font-semibold' : 'text-ink-4'
            }`}
          >
            {tab.icon(active)}
            <span>{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
