'use client'

import { useState } from 'react'

// ── Types ─────────────────────────────────────────────────────
type Network = 'visa' | 'mastercard' | 'jcb' | 'amex'
type RewardType = 'cashback' | 'miles' | 'points'

interface WizardForm {
  bankId: string
  bankName: string
  bankColor: string
  productName: string
  last4: string
  nameOnCard: string
  network: Network
  colorVariant: string
  rewardType: RewardType
  rate: string
  statementDay: string
  dueDay: string
  creditLimit: string
}

export interface AddCardWizardProps {
  onClose: () => void
  onComplete: () => void
}

// ── Constants ─────────────────────────────────────────────────
const BANKS = [
  { id: 'KBANK', name: 'KASIKORNBANK',     initial: 'K', color: '#0a8665' },
  { id: 'SCB',   name: 'SCB',              initial: 'ส', color: '#5e2b8f' },
  { id: 'KTC',   name: 'KTC',              initial: 'K', color: '#e3603f' },
  { id: 'UOB',   name: 'UOB',              initial: 'U', color: '#1c2a6a' },
  { id: 'BBL',   name: 'Bangkok Bank',     initial: 'B', color: '#0a3a8b' },
  { id: 'BAY',   name: 'Krungsri',         initial: 'ก', color: '#d99211' },
  { id: 'AEON',  name: 'AEON',             initial: 'A', color: '#d9416f' },
  { id: 'AMEX',  name: 'American Express', initial: 'A', color: '#2c343c' },
  { id: 'CITI',  name: 'Citi',             initial: 'C', color: '#0e2c5c' },
]

const CARD_SWATCHES = [
  { id: 'kbank', bg: 'linear-gradient(135deg, #1c8c75, #07332a)' },
  { id: 'scb',   bg: 'linear-gradient(135deg, #6b2d8c, #341252)' },
  { id: 'ktc',   bg: 'linear-gradient(135deg, #e3603f, #a02b1f)' },
  { id: 'uob',   bg: 'linear-gradient(135deg, #c8253e, #1c2a6a)' },
  { id: 'amex',  bg: 'linear-gradient(135deg, #c1c7cd, #2f3942)' },
  { id: 'dark',  bg: 'linear-gradient(135deg, #2a3a33, #0c1612)' },
]

const BANK_DEFAULT_SWATCH: Record<string, string> = {
  KBANK: 'kbank', SCB: 'scb', KTC: 'ktc', UOB: 'uob',
  BBL: 'dark', BAY: 'dark', AEON: 'ktc', AMEX: 'amex', CITI: 'dark',
}

const NETWORKS: Array<{ id: Network; label: string }> = [
  { id: 'visa', label: 'VISA' },
  { id: 'mastercard', label: 'Master' },
  { id: 'jcb', label: 'JCB' },
  { id: 'amex', label: 'AMEX' },
]

const REWARD_ITEMS: Array<{ id: RewardType; label: string; emoji: string }> = [
  { id: 'cashback', label: 'Cashback', emoji: '🎁' },
  { id: 'miles',    label: 'ไมล์',     emoji: '✈️' },
  { id: 'points',   label: 'พอยต์',   emoji: '⭐' },
]

const INITIAL_FORM: WizardForm = {
  bankId: '', bankName: '', bankColor: '',
  productName: '', last4: '', nameOnCard: '',
  network: 'visa', colorVariant: 'kbank',
  rewardType: 'cashback', rate: '1',
  statementDay: '5', dueDay: '25', creditLimit: '',
}

// ── Shared ────────────────────────────────────────────────────
function StepDots({ step }: { step: number }) {
  return (
    <div style={{ display: 'flex', gap: 5 }}>
      {[1, 2, 3, 4].map(i => (
        <span key={i} style={{
          height: 4, borderRadius: 999, flexShrink: 0, transition: 'all .2s',
          width: i === step ? 22 : 7,
          background: i <= step ? 'var(--brand-600)' : 'var(--surface-3)',
        }} />
      ))}
    </div>
  )
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      width: 34, height: 34, borderRadius: 11, flexShrink: 0,
      background: 'var(--surface)', border: '1px solid var(--line)',
      display: 'grid', placeItems: 'center', color: 'var(--ink-2)', cursor: 'pointer',
    }}>
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
        style={{ transform: 'scaleX(-1)' }}>
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  )
}

function AppBar({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px 10px', flexShrink: 0 }}>
      <BackBtn onClick={onBack} />
      <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-.3px', color: 'var(--ink)' }}>{title}</div>
    </div>
  )
}

function StepHeader({ step, label }: { step: number; label: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <StepDots step={step} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-.4px', color: 'var(--ink)' }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>ขั้น {step}/4</div>
      </div>
    </div>
  )
}

function Footer({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      flexShrink: 0, padding: '10px 16px 28px',
      borderTop: '1px solid var(--line-soft)', background: 'var(--surface)',
    }}>
      {children}
    </div>
  )
}

function PrimaryBtn({ children, icon, onClick, disabled }: {
  children: React.ReactNode
  icon?: 'next' | 'check' | 'plus'
  onClick?: () => void
  disabled?: boolean
}) {
  const iconSvg = icon === 'next' ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ) : icon === 'check' ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ) : icon === 'plus' ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ) : null

  return (
    <button onClick={onClick} disabled={disabled} style={{
      flex: 1, padding: '12px 18px', borderRadius: 13, border: 'none',
      fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: disabled ? 'default' : 'pointer',
      background: disabled ? 'var(--surface-3)' : 'var(--brand-600)',
      color: disabled ? 'var(--ink-4)' : '#fff',
      boxShadow: disabled ? 'none' : '0 4px 12px -2px rgba(15,142,90,.35)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    }}>
      {iconSvg}{children}
    </button>
  )
}

function GhostBtn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{
      flexShrink: 0, width: 96, padding: '11px 18px', borderRadius: 13,
      border: '1.5px solid var(--line)', background: 'transparent',
      color: 'var(--ink-2)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
    }}>
      {children}
    </button>
  )
}

// ── Live preview card ─────────────────────────────────────────
function PreviewCard({ form, size = 'full' }: { form: WizardForm; size?: 'full' | 'mini' }) {
  const bg = CARD_SWATCHES.find(s => s.id === form.colorVariant)?.bg
    ?? 'linear-gradient(135deg, #2a3a33, #0c1612)'
  return (
    <div style={{
      width: size === 'mini' ? 210 : '100%',
      aspectRatio: '1.586 / 1',
      borderRadius: 'var(--r-card)',
      background: bg,
      boxShadow: 'var(--shadow-card)',
      padding: '18px 20px',
      color: '#fff',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.8px', opacity: .8, textTransform: 'uppercase' }}>
          {form.bankName || 'BANK'}
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, opacity: .7, textTransform: 'uppercase' }}>
          {form.network.toUpperCase()}
        </div>
      </div>
      <div style={{
        width: 30, height: 22, borderRadius: 4,
        background: 'linear-gradient(135deg, #e8d97e, #c9a84c)',
        border: '1px solid rgba(255,255,255,.2)',
      }} />
      <div>
        <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 14, letterSpacing: 2, opacity: .85 }}>
          •••• •••• •••• {form.last4 || '••••'}
        </div>
        <div style={{ marginTop: 6, fontSize: 13, fontWeight: 600, letterSpacing: '-.2px' }}>
          {form.productName || 'ชื่อบัตร'}
        </div>
        {form.nameOnCard && (
          <div style={{ fontSize: 10, opacity: .6, textTransform: 'uppercase', letterSpacing: '.6px', marginTop: 2 }}>
            {form.nameOnCard}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Form field ────────────────────────────────────────────────
function Field({
  label, value, onChange, placeholder, prefix, suffix, required, hint, maxLength,
}: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; prefix?: string; suffix?: string
  required?: boolean; hint?: string; maxLength?: number
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <div style={{
        background: 'var(--surface)', borderRadius: 12, padding: '9px 13px',
        border: `1.5px solid ${focused ? 'var(--brand-600)' : 'var(--line)'}`,
        boxShadow: focused ? '0 0 0 3px var(--brand-50)' : 'none',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10.5, fontWeight: 500, color: focused ? 'var(--brand-700)' : 'var(--ink-3)' }}>
            {label}{required && <span style={{ color: 'var(--warn)' }}> *</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
            {prefix && value && <span style={{ fontSize: 14, color: 'var(--ink-3)' }}>{prefix}</span>}
            <input
              value={value}
              onChange={e => onChange(e.target.value)}
              placeholder={placeholder}
              maxLength={maxLength}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              style={{
                flex: 1, minWidth: 0, background: 'transparent',
                border: 'none', outline: 'none', fontFamily: 'inherit',
                fontSize: 14.5, fontWeight: value ? 500 : 400,
                color: value ? 'var(--ink)' : 'var(--ink-4)',
              }}
            />
            {suffix && value && <span style={{ fontSize: 13, color: 'var(--ink-3)', flexShrink: 0 }}>{suffix}</span>}
          </div>
        </div>
      </div>
      {hint && <div style={{ fontSize: 11, color: 'var(--ink-4)', margin: '5px 2px 0' }}>{hint}</div>}
    </div>
  )
}

// ── Section label ─────────────────────────────────────────────
function SectionLabel({ label, hint }: { label: string; hint?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0 2px 8px' }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.6px', textTransform: 'uppercase', color: 'var(--ink-3)' }}>
        {label}
      </div>
      {hint && <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>{hint}</div>}
    </div>
  )
}

// ── Wizard ────────────────────────────────────────────────────
export function AddCardWizard({ onClose, onComplete }: AddCardWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [form, setForm] = useState<WizardForm>(INITIAL_FORM)
  const [searchBank, setSearchBank] = useState('')

  const set = <K extends keyof WizardForm>(key: K, val: WizardForm[K]) =>
    setForm(f => ({ ...f, [key]: val }))

  const filteredBanks = BANKS.filter(b =>
    b.name.toLowerCase().includes(searchBank.toLowerCase()) ||
    b.id.toLowerCase().includes(searchBank.toLowerCase())
  )

  const swatch = CARD_SWATCHES.find(s => s.id === form.colorVariant)?.bg
    ?? 'linear-gradient(135deg, #2a3a33, #0c1612)'

  // ── Step 1 — เลือกธนาคาร ─────────────────────────────────
  if (step === 1) return (
    <div className="fixed inset-0 z-50 bg-surface flex flex-col overflow-hidden">
      <AppBar title="เพิ่มบัตร" onBack={onClose} />

      <div className="flex-1 overflow-y-auto px-4 pt-1 pb-2">
        <StepHeader step={1} label="เลือกธนาคาร" />

        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 9, padding: '10px 13px',
          background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, marginBottom: 10,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink-4)"
            strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={searchBank}
            onChange={e => setSearchBank(e.target.value)}
            placeholder="ค้นหาธนาคารหรือผู้ออกบัตร"
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontSize: 13, color: 'var(--ink)', fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Bank list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {filteredBanks.map(b => {
            const sel = form.bankId === b.id
            return (
              <button key={b.id}
                onClick={() => setForm(f => ({
                  ...f,
                  bankId: b.id, bankName: b.name, bankColor: b.color,
                  colorVariant: BANK_DEFAULT_SWATCH[b.id] ?? 'dark',
                }))}
                style={{
                  display: 'flex', alignItems: 'center', gap: 11, padding: '10px 12px',
                  background: 'var(--surface)', borderRadius: 12, textAlign: 'left',
                  border: `1.5px solid ${sel ? 'var(--brand-600)' : 'var(--line)'}`,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                  background: b.color, color: '#fff',
                  display: 'grid', placeItems: 'center', fontWeight: 600,
                }}>{b.initial}</div>
                <div style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>{b.name}</div>
                {sel
                  ? <div style={{
                      width: 22, height: 22, borderRadius: 999, background: 'var(--brand-600)',
                      color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0,
                    }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  : <div style={{ width: 22, height: 22, borderRadius: 999, border: '2px solid var(--surface-3)', flexShrink: 0 }} />
                }
              </button>
            )
          })}
        </div>
      </div>

      <Footer>
        <PrimaryBtn icon="next" onClick={() => setStep(2)} disabled={!form.bankId}>ถัดไป</PrimaryBtn>
      </Footer>
    </div>
  )

  // ── Step 2 — รายละเอียดบัตร ──────────────────────────────
  if (step === 2) {
    const canNext = form.last4.length === 4
    return (
      <div className="fixed inset-0 z-50 bg-surface flex flex-col overflow-hidden">
        <AppBar title="เพิ่มบัตร" onBack={() => setStep(1)} />

        <div className="flex-1 overflow-y-auto px-4 pt-1 pb-2">
          <StepHeader step={2} label="รายละเอียดบัตร" />

          <PreviewCard form={form} />
          <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--ink-4)', margin: '8px 0 4px' }}>
            พรีวิวอัปเดตตามที่กรอก · เก็บแค่ 4 ตัวท้าย
          </div>

          {/* Card info */}
          <div style={{ marginTop: 16 }}>
            <SectionLabel label="ข้อมูลบัตร" hint="จำเป็น" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Field label="ชื่อบัตร / ประเภท" value={form.productName}
                onChange={v => set('productName', v)} placeholder="เช่น Journey Platinum" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <Field label="เลข 4 ตัวท้าย" value={form.last4}
                  onChange={v => set('last4', v.replace(/\D/g, '').slice(0, 4))}
                  placeholder="4521" prefix="••••" required maxLength={4} />
                <Field label="ชื่อบนบัตร" value={form.nameOnCard}
                  onChange={v => set('nameOnCard', v)} placeholder="ชื่อ-นามสกุล" />
              </div>
            </div>
          </div>

          {/* Network & color */}
          <div style={{ marginTop: 16 }}>
            <SectionLabel label="เครือข่าย & สีบัตร" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Network picker */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                {NETWORKS.map(n => {
                  const sel = form.network === n.id
                  return (
                    <button key={n.id} onClick={() => set('network', n.id)} style={{
                      padding: '9px 4px', borderRadius: 10, textAlign: 'center',
                      border: `1.5px solid ${sel ? 'var(--brand-600)' : 'var(--line)'}`,
                      background: sel ? 'var(--brand-50)' : 'var(--surface)',
                      color: sel ? 'var(--brand-700)' : 'var(--ink-3)',
                      fontSize: 11, fontWeight: 600, letterSpacing: '.2px',
                      cursor: 'pointer', fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                    }}>
                      {sel && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                          strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                      {n.label}
                    </button>
                  )
                })}
              </div>
              {/* Color swatches */}
              <div style={{ display: 'flex', gap: 9, marginTop: 2 }}>
                {CARD_SWATCHES.map(s => {
                  const sel = form.colorVariant === s.id
                  return (
                    <button key={s.id} onClick={() => set('colorVariant', s.id)} style={{
                      width: 40, height: 26, borderRadius: 6, background: s.bg, flexShrink: 0,
                      border: sel ? '2px solid var(--ink)' : '2px solid transparent',
                      boxShadow: sel
                        ? '0 0 0 2px var(--bg), 0 2px 5px rgba(0,0,0,.2)'
                        : '0 1px 3px rgba(0,0,0,.15)',
                      cursor: 'pointer', position: 'relative',
                    }}>
                      {sel && (
                        <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#fff' }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
          <div style={{ height: 4 }} />
        </div>

        <Footer>
          <div style={{ display: 'flex', gap: 8 }}>
            <GhostBtn onClick={() => setStep(1)}>ย้อนกลับ</GhostBtn>
            <PrimaryBtn icon="next" onClick={() => setStep(3)} disabled={!canNext}>ถัดไป</PrimaryBtn>
          </div>
        </Footer>
      </div>
    )
  }

  // ── Step 3 — สิทธิ์ & รอบบัตร ────────────────────────────
  if (step === 3) return (
    <div className="fixed inset-0 z-50 bg-surface flex flex-col overflow-hidden">
      <AppBar title="เพิ่มบัตร" onBack={() => setStep(2)} />

      <div className="flex-1 overflow-y-auto px-4 pt-1 pb-2">
        <StepHeader step={3} label="สิทธิ์ & รอบบัตร" />

        {/* Continuity strip */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 11, padding: '9px 12px', marginBottom: 4,
          background: 'var(--surface)', border: '1px solid var(--line-soft)', borderRadius: 10,
        }}>
          <div style={{ width: 46, height: 29, borderRadius: 5, background: swatch, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>
              {form.bankId} · {form.productName || 'ชื่อบัตร'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 1 }}>
              •••• {form.last4} · {form.network.toUpperCase()}
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--good)"
            strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        {/* Reward type */}
        <div style={{ marginTop: 16 }}>
          <SectionLabel label="ประเภทสิทธิประโยชน์" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 7 }}>
              {REWARD_ITEMS.map(t => {
                const sel = form.rewardType === t.id
                return (
                  <button key={t.id} onClick={() => set('rewardType', t.id)} style={{
                    padding: '12px 4px', borderRadius: 12, textAlign: 'center',
                    border: `1.5px solid ${sel ? 'var(--brand-600)' : 'var(--line)'}`,
                    background: sel ? 'var(--brand-50)' : 'var(--surface)',
                    color: sel ? 'var(--brand-700)' : 'var(--ink-3)',
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                    <div style={{ fontSize: 20 }}>{t.emoji}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, marginTop: 5 }}>{t.label}</div>
                  </button>
                )
              })}
            </div>
            <Field label="อัตรา" value={form.rate}
              onChange={v => set('rate', v.replace(/[^\d.]/g, ''))}
              suffix="% ทุกหมวด" placeholder="1" />
          </div>
        </div>

        {/* Billing cycle */}
        <div style={{ marginTop: 16 }}>
          <SectionLabel label="รอบบัตร & วงเงิน" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Field label="วันสรุปยอด" value={form.statementDay}
                onChange={v => set('statementDay', v.replace(/\D/g, '').slice(0, 2))}
                placeholder="5" hint="ทุกวันที่" />
              <Field label="วันครบกำหนด" value={form.dueDay}
                onChange={v => set('dueDay', v.replace(/\D/g, '').slice(0, 2))}
                placeholder="25" hint="ทุกวันที่" />
            </div>
            <Field label="วงเงิน" value={form.creditLimit}
              onChange={v => set('creditLimit', v.replace(/[^\d,]/g, ''))}
              prefix="฿" placeholder="60,000" />
          </div>
        </div>
        <div style={{ height: 4 }} />
      </div>

      <Footer>
        <div style={{ display: 'flex', gap: 8 }}>
          <GhostBtn onClick={() => setStep(2)}>ย้อนกลับ</GhostBtn>
          <PrimaryBtn icon="check" onClick={() => setStep(4)}>เพิ่มบัตร</PrimaryBtn>
        </div>
      </Footer>
    </div>
  )

  // ── Step 4 — สำเร็จ ───────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 bg-surface flex flex-col overflow-hidden">
      <div style={{ padding: '18px 16px 0', flexShrink: 0 }}>
        <StepDots step={4} />
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-6 text-center"
        style={{ gap: 4 }}>
        <div style={{
          width: 78, height: 78, borderRadius: 999, background: 'var(--good-bg)',
          display: 'grid', placeItems: 'center', marginBottom: 8,
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 999, background: 'var(--good)',
            color: '#fff', display: 'grid', placeItems: 'center',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>
        <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-.3px', color: 'var(--ink)' }}>
          เพิ่มบัตรสำเร็จ
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-3)', maxWidth: 230, lineHeight: 1.4 }}>
          {form.bankId} {form.productName} •••• {form.last4} พร้อมใช้งานแล้ว
        </div>
        <div style={{ marginTop: 18 }}>
          <PreviewCard form={form} size="mini" />
        </div>
      </div>

      <Footer>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={onComplete} style={{
            width: '100%', padding: '12px 18px', borderRadius: 13, border: 'none',
            fontFamily: 'inherit', fontSize: 14, fontWeight: 600, color: '#fff',
            background: 'var(--brand-600)', cursor: 'pointer',
            boxShadow: '0 4px 12px -2px rgba(15,142,90,.35)',
          }}>
            ดูบัตรในกระเป๋า
          </button>
          <button onClick={() => { setForm(INITIAL_FORM); setSearchBank(''); setStep(1) }} style={{
            width: '100%', padding: '11px 18px', borderRadius: 13,
            border: '1.5px solid var(--line)', background: 'transparent',
            color: 'var(--ink-2)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            เพิ่มอีกใบ
          </button>
        </div>
      </Footer>
    </div>
  )
}
