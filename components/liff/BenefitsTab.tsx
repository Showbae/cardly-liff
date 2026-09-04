'use client'

import { useState } from 'react'
import {
  type CardProfile,
  type ProfileBenefit,
  type ProfilePromo,
  URGENT_DAYS,
  bestRate,
  formatBenefitValue,
  formatCap,
  formatDaysLeft,
  formatEquivalentRate,
  formatThaiDate,
} from '@/lib/card-profile'

/**
 * แท็บ "สิทธิประโยชน์" — ดีไซน์แบบ ค
 *
 * ลำดับบนหน้าจอสะท้อนการตัดสินใจข้อ 2 ใน docs/admin-portal.md:
 * **ของที่มีวันหมดขึ้นบนสุด** เพราะเป็นส่วนเดียวที่ทำให้ user กลับมาเปิดซ้ำ
 * ส่วนอัตรา/สิทธิ์ถาวรเป็นข้อมูลอ้างอิงที่เปิดดูนาน ๆ ที จึงพับเป็น accordion
 * ทำให้บัตรที่ข้อมูลน้อยกับเยอะยาวพอ ๆ กัน
 */

// ── ชิ้นส่วนย่อย ────────────────────────────────────────────────────────

function Caption({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      className="text-[11px] font-semibold uppercase text-ink-4"
      style={{ letterSpacing: 1, ...style }}
    >
      {children}
    </div>
  )
}

function Tile({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex items-center justify-center text-[17px] flex-shrink-0"
      style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--surface-2)' }}
    >
      {children}
    </div>
  )
}

/** บรรทัดรองของโปร — เอาเท่าที่มี ไม่ยัดทุกช่องจนล้น */
function promoSubtitle(p: ProfilePromo): string | null {
  const parts = [p.description, p.condition, p.merchants.slice(0, 3).join(' · ')]
  return parts.find(v => v != null && v.trim() !== '') ?? null
}

function DaysChip({ days }: { days: number }) {
  const urgent = days <= URGENT_DAYS
  return (
    <div
      className="flex-shrink-0 text-[10px] font-bold"
      style={{
        marginLeft: 'auto',
        padding: '4px 9px',
        borderRadius: 999,
        fontVariantNumeric: 'tabular-nums',
        background: urgent ? 'var(--warn-bg)' : 'var(--surface-2)',
        color: urgent ? '#a5411a' : 'var(--ink-3)',
      }}
    >
      {formatDaysLeft(days)}
    </div>
  )
}

/** โปรตัวที่ใกล้หมดที่สุด — การ์ดใหญ่สีเข้ม ให้เห็นก่อนอย่างอื่นทั้งหมด */
function PromoHero({ promo }: { promo: ProfilePromo }) {
  const sub = promoSubtitle(promo)
  return (
    <div
      style={{
        borderRadius: 16,
        padding: 15,
        color: '#fff',
        background: 'linear-gradient(135deg, #0e6e4b, #062a1f)',
        boxShadow: '0 10px 24px rgba(6,28,18,.22)',
      }}
    >
      {promo.days_left != null && (
        <div
          className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase"
          style={{
            letterSpacing: 0.8,
            padding: '4px 9px',
            borderRadius: 999,
            background: 'rgba(232,179,57,.22)',
            color: 'var(--gold-100)',
          }}
        >
          ⏳ เหลือ {formatDaysLeft(promo.days_left)}
        </div>
      )}
      <div className="text-[16px] font-bold mt-2.5 tracking-tight">{promo.title}</div>
      {sub && (
        <div className="text-[12px] mt-1" style={{ color: 'rgba(255,255,255,.72)' }}>
          {sub}
        </div>
      )}
      {(promo.end_date || promo.source_url) && (
        <div
          className="flex items-center justify-between text-[11px] mt-3 pt-[11px]"
          style={{
            borderTop: '1px solid rgba(255,255,255,.16)',
            color: 'rgba(255,255,255,.8)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          <span>{promo.end_date ? `ถึง ${formatThaiDate(promo.end_date)}` : 'ไม่มีวันหมด'}</span>
          {promo.source_url && (
            <a
              href={promo.source_url}
              target="_blank"
              rel="noreferrer noopener"
              style={{ color: 'inherit' }}
            >
              ดูเงื่อนไข ›
            </a>
          )}
        </div>
      )}
    </div>
  )
}

function PromoRow({ promo, first }: { promo: ProfilePromo; first: boolean }) {
  const sub = promoSubtitle(promo)
  return (
    <div
      className="flex items-center gap-[11px] py-3"
      style={{
        borderTop: first ? 'none' : '1px solid var(--line-soft)',
        marginTop: first ? 6 : 0,
      }}
    >
      <Tile>{promo.category?.icon ?? '🎫'}</Tile>
      <div className="min-w-0">
        <div className="text-[13px] font-semibold text-ink">{promo.title}</div>
        {sub && <div className="text-[11px] text-ink-4 mt-0.5 truncate">{sub}</div>}
      </div>
      {promo.days_left != null && <DaysChip days={promo.days_left} />}
    </div>
  )
}

interface AccordionProps {
  icon: string
  title: string
  subtitle: string | null
  open: boolean
  onToggle: () => void
  children?: React.ReactNode
}

function Accordion({ icon, title, subtitle, open, onToggle, children }: AccordionProps) {
  const expandable = children != null
  return (
    <div
      style={{
        border: '1px solid var(--line)',
        borderRadius: 13,
        background: 'var(--surface)',
        marginTop: 9,
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={expandable ? onToggle : undefined}
        aria-expanded={expandable ? open : undefined}
        className="w-full flex items-center gap-2.5 p-[13px] text-left"
        style={{ background: 'none', border: 'none', cursor: expandable ? 'pointer' : 'default' }}
      >
        <Tile>{icon}</Tile>
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-ink">{title}</div>
          {subtitle && <div className="text-[11px] text-ink-4 mt-0.5">{subtitle}</div>}
        </div>
        {expandable && (
          <div className="ml-auto text-[13px] text-ink-4 flex-shrink-0">{open ? '⌃' : '⌄'}</div>
        )}
      </button>
      {expandable && open && (
        <div className="px-[13px] pb-[5px]" style={{ borderTop: '1px solid var(--line-soft)' }}>
          {children}
        </div>
      )}
    </div>
  )
}

function MiniRow({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex items-center gap-2.5 py-2.5"
      style={{ borderBottom: '1px solid var(--line-soft)' }}
    >
      {children}
    </div>
  )
}

function BenefitRow({ benefit }: { benefit: ProfileBenefit }) {
  // category = null คือ "อัตราพื้นฐานที่ใช้กับทุกหมวด" ไม่ใช่ข้อมูลขาด
  const name = benefit.category?.name_th ?? 'ใช้จ่ายทั่วไป'
  const icon = benefit.category?.icon ?? '💳'
  const equivalent = formatEquivalentRate(benefit)
  const cap = formatCap(benefit.max_cap, benefit.cap_period)
  const detail = [
    benefit.condition,
    benefit.min_spend != null
      ? `ขั้นต่ำ ฿${benefit.min_spend.toLocaleString('th-TH', { maximumFractionDigits: 0 })}`
      : null,
    cap ? `เพดาน ${cap}` : null,
  ].filter(Boolean).join(' · ')

  return (
    <MiniRow>
      <div className="min-w-0">
        <div className="text-[12px] font-semibold text-ink">{icon} {name}</div>
        {detail && <div className="text-[10px] text-ink-4 mt-px">{detail}</div>}
      </div>
      <div className="ml-auto text-right flex-shrink-0">
        <div
          className="text-[14px] font-bold text-ink tracking-tight"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {formatBenefitValue(benefit)}
        </div>
        {equivalent && <div className="text-[10px] text-ink-4">{equivalent}</div>}
      </div>
    </MiniRow>
  )
}

// ── แท็บ ────────────────────────────────────────────────────────────────

type SectionKey = 'rates' | 'perks' | 'fee'

export function BenefitsTab({ profile }: { profile: CardProfile }) {
  const { card, promos, benefits, perks } = profile

  const hasRates = benefits.length > 0
  const hasPerks = perks.length > 0
  // annual_fee = 0 คือ "ไม่มีค่าธรรมเนียม" ซึ่งเป็นข้อมูลที่ user อยากรู้
  // ต้องเช็ก null ไม่ใช่ falsy ไม่งั้นบัตรฟรีจะไม่ขึ้นบรรทัดนี้เลย
  const hasFee = card?.annual_fee != null

  // "accordion ตัวแรกกางเสมอ" — ตัวแรกที่มีข้อมูลจริง ไม่ใช่ตัวแรกตามลำดับคงที่
  const firstSection: SectionKey | null =
    hasRates ? 'rates' : hasPerks ? 'perks' : hasFee ? 'fee' : null
  const [open, setOpen] = useState<SectionKey | null>(firstSection)
  const toggle = (k: SectionKey) => setOpen(prev => (prev === k ? null : k))

  const top = bestRate(benefits)
  const program = card?.point_program ?? null

  const ratesTitle = program ? 'คะแนนสะสม' : 'เงินคืน'
  const ratesSubtitle = top
    ? [
        `สูงสุด ${formatBenefitValue(top)}`,
        formatCap(top.max_cap, top.cap_period) && `เพดาน ${formatCap(top.max_cap, top.cap_period)}`,
      ].filter(Boolean).join(' · ')
    : null

  const feeSubtitle = hasFee
    ? [
        card!.annual_fee === 0
          ? 'ไม่มีค่าธรรมเนียมรายปี'
          : `รายปี ฿${card!.annual_fee!.toLocaleString('th-TH', { maximumFractionDigits: 0 })}`,
        card!.fee_waiver_condition,
      ].filter(Boolean).join(' · ')
    : null

  const bankName = card?.bank?.name_th ?? card?.bank?.name_eng ?? card?.bank?.id ?? null
  const allBankWide = promos.length > 0 && promos.every(p => p.card_scope === 'bank')

  const [hero, ...rest] = promos

  return (
    <div className="pb-6">

      {/* ── ของที่มีวันหมด — ครึ่งบนของหน้าจอ ────────────────────────── */}
      <Caption style={{ marginBottom: 9 }}>ใช้ได้ตอนนี้</Caption>

      {promos.length === 0 ? (
        <div
          className="flex flex-col items-center gap-2 text-center"
          style={{
            border: '1px dashed var(--line)',
            borderRadius: 14,
            padding: '26px 18px',
            background: 'var(--surface)',
          }}
        >
          <div className="text-[26px]">🗓️</div>
          <p className="text-[13px] font-semibold text-ink-3">ยังไม่มีโปรที่ใช้ได้ตอนนี้</p>
          <p className="text-[11px] text-ink-4 leading-relaxed">
            {bankName
              ? `เมื่อ ${bankName} มีแคมเปญใหม่ จะขึ้นตรงนี้ก่อนใคร`
              : 'เมื่อมีแคมเปญใหม่ จะขึ้นตรงนี้ก่อนใคร'}
            <br />
            สิทธิ์ประจำของบัตรดูได้ข้างล่าง
          </p>
        </div>
      ) : (
        <>
          <PromoHero promo={hero} />
          {rest.map((p, i) => (
            <PromoRow key={p.id} promo={p} first={i === 0} />
          ))}
          {allBankWide && bankName && (
            <p className="text-[10px] text-ink-4 mt-2.5 leading-relaxed">
              โปรทั้งหมดนี้เป็นแคมเปญระดับธนาคาร — ใช้ได้กับบัตร {bankName} ทุกใบ ไม่ใช่เฉพาะใบนี้
            </p>
          )}
        </>
      )}

      {/* ── สิทธิ์ถาวร — พับเก็บ ──────────────────────────────────────── */}
      {firstSection == null ? (
        <p className="text-[11px] text-ink-4 text-center mt-8">
          ยังไม่มีข้อมูลสิทธิประโยชน์ของบัตรรุ่นนี้
        </p>
      ) : (
        <>
          <Caption style={{ margin: '26px 0 2px' }}>สิทธิ์ประจำของบัตร</Caption>

          {hasRates && (
            <Accordion
              icon={program ? '⭐' : '💰'}
              title={ratesTitle}
              subtitle={ratesSubtitle}
              open={open === 'rates'}
              onToggle={() => toggle('rates')}
            >
              {benefits.map(b => (
                <BenefitRow key={b.id} benefit={b} />
              ))}
              {program && (
                // display-only ล้วน — จงใจไม่เข้าสูตร effective_rate_pct เพราะ
                // จะคิดว่าวันหมดอายุลดค่าแต้มเท่าไหร่ต้องรู้พฤติกรรม user
                // ซึ่งเราไม่รู้ · เอามาแสดงให้ user ตัดสินเองดีกว่าแอบเดาแทน
                <p className="text-[10px] text-ink-4 py-2.5 leading-relaxed">
                  {[
                    `${program.name} · 1 คะแนน ≈ ฿${program.point_value_thb}`,
                    program.point_expiry_months != null
                      ? `หมดอายุใน ${program.point_expiry_months} เดือน`
                      : 'คะแนนไม่มีวันหมดอายุ',
                    program.min_redemption != null
                      ? `แลกขั้นต่ำ ${program.min_redemption.toLocaleString('th-TH')} คะแนน`
                      : null,
                  ].filter(Boolean).join(' · ')}
                </p>
              )}
            </Accordion>
          )}

          {hasPerks && (
            <Accordion
              icon="🎁"
              title="สิทธิพิเศษ"
              subtitle={perks.map(p => p.title).join(' · ')}
              open={open === 'perks'}
              onToggle={() => toggle('perks')}
            >
              {perks.map(p => {
                const detail = [p.description, p.condition].filter(Boolean).join(' · ')
                return (
                  <MiniRow key={p.id}>
                    <div className="min-w-0">
                      <div className="text-[12px] font-semibold text-ink">{p.title}</div>
                      {detail && <div className="text-[10px] text-ink-4 mt-px">{detail}</div>}
                    </div>
                    {p.value_text && (
                      <div className="ml-auto text-[12px] font-bold text-ink-2 flex-shrink-0">
                        {p.value_text}
                      </div>
                    )}
                  </MiniRow>
                )
              })}
            </Accordion>
          )}

          {hasFee && (
            <Accordion
              icon="📋"
              title="ค่าธรรมเนียม"
              subtitle={feeSubtitle}
              open={open === 'fee'}
              onToggle={() => toggle('fee')}
            >
              <MiniRow>
                <div className="text-[12px] font-semibold text-ink">ค่าธรรมเนียมรายปี</div>
                <div
                  className="ml-auto text-[13px] font-bold text-ink"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {card!.annual_fee === 0
                    ? 'ฟรี'
                    : `฿${card!.annual_fee!.toLocaleString('th-TH', { maximumFractionDigits: 0 })}`}
                </div>
              </MiniRow>
              {card!.fee_waiver_condition && (
                <MiniRow>
                  <div className="min-w-0">
                    <div className="text-[12px] font-semibold text-ink">เงื่อนไขยกเว้น</div>
                    <div className="text-[10px] text-ink-4 mt-px">{card!.fee_waiver_condition}</div>
                  </div>
                </MiniRow>
              )}
            </Accordion>
          )}
        </>
      )}
    </div>
  )
}
