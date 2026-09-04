'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import type { AdminNavStats } from '@/lib/admin-stats'

/**
 * แถบนำทางด้านข้างของ Admin Portal
 *
 * ── ทำไมอยู่ข้าง ไม่ใช่อยู่บน ──────────────────────────────────────────
 *
 * 1. หน้าหลักของแอดมินคือฟอร์มกรอก benefit ต่อรุ่นบัตร ซึ่งยาวลงเป็นสิบฟิลด์
 *    แถบบนกินความสูงถาวรทุกหน้าจอ ในหน้าที่ขาดความสูงที่สุด
 * 2. ต้องมีที่ติด "ค่าแต้มเก่า" ค้างไว้ตลอด — ดูเหตุผลใน lib/admin-stats.ts
 * 3. เมนูจะโตขึ้นเมื่อ promotions / merchants เข้ามาในเฟสถัดไป
 *
 * ── จอแคบ ─────────────────────────────────────────────────────────────
 *
 * ต่ำกว่า md แถบข้างพับเป็นแถบบนแบบเรียบ (ไม่มีตัวเลขกำกับ) เพราะ 232px
 * บนจอ 640px กินพื้นที่เกินครึ่ง · แอดมินเป็นงานเดสก์ท็อป จอแคบแค่ต้องใช้ได้
 */

interface NavLink {
  href: string
  label: string
  icon: string
  count?: number
  flag?: string
}

export function AdminSidebar({
  email,
  displayName,
  stats,
}: {
  email: string
  displayName: string | null
  stats: AdminNavStats
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  const logout = async () => {
    setBusy(true)
    try {
      await fetch('/api/admin/logout', { method: 'POST' })
      router.replace('/admin/login')
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  const links: NavLink[] = [
    {
      href: '/admin/cards',
      label: 'บัตรเครดิต',
      icon: '▤',
      count: stats.cardCount,
    },
    {
      // ชื่อสั้นกว่า "โปรแกรมสะสมแต้ม" เพราะต้องอยู่บรรทัดเดียวกับ badge ให้ได้ใน 232px
      href: '/admin/programs',
      label: 'โปรแกรมสะสม',
      icon: '◈',
      count: stats.programCount,
      flag: stats.staleProgramCount > 0 ? `${stats.staleProgramCount} เก่า` : undefined,
    },
    {
      href: '/admin/promotions',
      label: 'โปรโมชัน',
      icon: '◷',
      count: stats.promoCount,
      // โปรที่เผยแพร่อยู่แต่หมดอายุแล้ว = ข้อมูลผิดที่ผู้ใช้เห็นอยู่ตอนนี้
      flag: stats.expiredActivePromoCount > 0
        ? `${stats.expiredActivePromoCount} หมดอายุ`
        : undefined,
    },
    {
      href: '/admin/catalog',
      label: 'ร้านค้า · หมวด',
      icon: '⌖',
      count: stats.merchantCount,
      flag: stats.uncategorizedMerchantCount > 0
        ? `${stats.uncategorizedMerchantCount} ไร้หมวด`
        : undefined,
    },
  ]

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <>
      {/* ── จอกว้าง · แถบข้าง ─────────────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col shrink-0 sticky top-0 h-screen"
        style={{
          width: 232,
          background: 'var(--surface-2)',
          borderRight: '1px solid var(--line)',
        }}
      >
        <div className="px-4 pt-4 pb-3.5">
          <Link href="/admin/cards" className="flex items-center gap-2.5">
            <span
              className="shrink-0"
              style={{
                width: 22,
                height: 22,
                borderRadius: 7,
                background: 'linear-gradient(135deg, var(--brand-500), var(--brand-700))',
              }}
            />
            <span className="text-[13px] font-bold tracking-[-.2px]">Cardly Admin</span>
          </Link>
        </div>

        <nav className="flex-1 px-2.5 flex flex-col gap-[3px]">
          <SectionCap>แคตตาล็อก</SectionCap>
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l.href) ? 'page' : undefined}
              className="flex items-center gap-2.5 rounded-lg text-[12.5px] transition-colors"
              style={{
                padding: '8px 10px',
                background: isActive(l.href) ? 'var(--surface)' : 'transparent',
                color: isActive(l.href) ? 'var(--ink)' : 'var(--ink-2)',
                fontWeight: isActive(l.href) ? 600 : 400,
                boxShadow: isActive(l.href) ? '0 1px 2px rgba(15,31,24,.06)' : undefined,
              }}
            >
              <span className="w-[15px] text-center shrink-0 opacity-80">{l.icon}</span>
              <span className="truncate">{l.label}</span>
              {/* มีคำเตือนแล้วไม่ต้องโชว์จำนวน — เตือนสำคัญกว่า และสองอย่างพร้อมกัน
                  จะดันชื่อเมนูตกบรรทัด */}
              {l.flag ? (
                <span
                  className="ml-auto shrink-0 text-[10px] font-bold whitespace-nowrap"
                  style={{
                    padding: '1px 7px',
                    borderRadius: 999,
                    background: 'var(--warn-bg)',
                    color: '#a5411a',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {l.flag}
                </span>
              ) : (
                l.count != null && (
                  <span
                    className="ml-auto shrink-0 text-[11px]"
                    style={{ color: 'var(--ink-4)', fontVariantNumeric: 'tabular-nums' }}
                  >
                    {l.count}
                  </span>
                )
              )}
            </Link>
          ))}

        </nav>

        <div
          className="px-4 py-3 flex flex-col gap-0.5"
          style={{ borderTop: '1px solid var(--line)' }}
        >
          <span className="text-[11.5px] font-semibold truncate" style={{ color: 'var(--ink-2)' }}>
            {displayName ?? email}
          </span>
          <button
            onClick={logout}
            disabled={busy}
            className="text-[11px] text-left disabled:opacity-50"
            style={{ color: 'var(--ink-4)', cursor: busy ? 'default' : 'pointer' }}
          >
            {busy ? 'กำลังออก…' : 'ออกจากระบบ'}
          </button>
        </div>
      </aside>

      {/* ── จอแคบ · แถบบนแบบเรียบ ─────────────────────────────────── */}
      <header
        className="md:hidden sticky top-0 z-20"
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--line)' }}
      >
        <div className="flex items-center gap-4 px-4 h-13" style={{ height: 52 }}>
          <span className="text-[13px] font-bold tracking-[-.2px] shrink-0">Cardly Admin</span>
          <nav className="flex items-center gap-1 flex-1 overflow-x-auto scrollbar-none">
            {links.map(l => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={isActive(l.href) ? 'page' : undefined}
                className="text-[12.5px] font-medium px-2.5 py-1.5 rounded-md whitespace-nowrap"
                style={{
                  background: isActive(l.href) ? 'var(--brand-50)' : 'transparent',
                  color: isActive(l.href) ? 'var(--brand-700)' : 'var(--ink-3)',
                }}
              >
                {l.label}
                {l.flag && ' ⚠︎'}
              </Link>
            ))}
          </nav>
          <button
            onClick={logout}
            disabled={busy}
            className="text-[11.5px] font-semibold shrink-0 disabled:opacity-50"
            style={{ color: 'var(--ink-3)', cursor: busy ? 'default' : 'pointer' }}
          >
            {busy ? '…' : 'ออก'}
          </button>
        </div>
      </header>
    </>
  )
}

function SectionCap({ children, dim }: { children: React.ReactNode; dim?: boolean }) {
  return (
    <div
      className="text-[10px] font-bold uppercase"
      style={{
        letterSpacing: 1,
        color: 'var(--ink-4)',
        opacity: dim ? 0.75 : 1,
        padding: '14px 6px 5px',
      }}
    >
      {children}
    </div>
  )
}
