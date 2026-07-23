'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'

const STORAGE_KEY = 'cardly-recent-searches'
const MAX_RECENT = 5

function getRecents(): string[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') } catch { return [] }
}
function persistRecents(list: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}
function addRecent(q: string) {
  const next = [q, ...getRecents().filter(r => r !== q)].slice(0, MAX_RECENT)
  persistRecents(next)
}

interface MerchantResult {
  id: string
  name_th: string | null
  name_eng: string | null
  category_id: string | null
  categories: {
    id: string
    name_th: string | null
    name_eng: string | null
    icon: string | null
  } | null
}

interface Props {
  open: boolean
  onClose: () => void
  onSelect?: (merchant: MerchantResult) => void
}

export const SearchOverlay = forwardRef<HTMLInputElement, Props>(
function SearchOverlay({ open, onClose, onSelect }, ref) {
  const inputRef = useRef<HTMLInputElement>(null)
  useImperativeHandle(ref, () => inputRef.current!, [])

  const [query, setQuery] = useState('')
  const [recents, setRecents] = useState<string[]>([])
  const [results, setResults] = useState<MerchantResult[]>([])
  const [loading, setLoading] = useState(false)

  // Sync recents on open; clear on close (no focus here — caller handles it)
  useEffect(() => {
    if (open) {
      setRecents(getRecents())
    } else {
      setQuery('')
      setResults([])
      setLoading(false)
    }
  }, [open])

  // Debounced search
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) { setResults([]); setLoading(false); return }

    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/merchants/search?q=${encodeURIComponent(q)}`)
        const data = await res.json() as { results: MerchantResult[] }
        setResults(data.results ?? [])
      } catch { setResults([]) }
      finally { setLoading(false) }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  function handleSelect(merchant: MerchantResult) {
    const label = merchant.name_eng ?? merchant.name_th ?? ''
    if (label) { addRecent(label); setRecents(getRecents()) }
    onSelect?.(merchant)
    onClose()
  }

  function handleRecentClick(q: string) {
    setQuery(q)
    inputRef.current?.focus()
  }

  function removeRecent(q: string, e: React.MouseEvent) {
    e.stopPropagation()
    const next = recents.filter(r => r !== q)
    persistRecents(next)
    setRecents(next)
  }

  const isTyping = query.trim().length >= 2

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 transition-opacity duration-300"
        style={{
          background: 'rgba(6,20,14,0.52)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
        }}
      />

      {/* Sheet */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 flex flex-col transition-transform duration-300 ease-out"
        style={{
          top: 72,
          borderRadius: '22px 22px 0 0',
          background: 'var(--surface)',
          boxShadow: '0 -8px 30px rgba(15,31,24,.12)',
          transform: open ? 'translateY(0)' : 'translateY(100%)',
        }}
      >
        {/* Search input */}
        <div
          className="flex items-center gap-2.5 mx-3.5 mt-3 px-3.5 py-[10px] shrink-0"
          style={{
            background: 'var(--surface)',
            border: '1.5px solid var(--brand-600)',
            borderRadius: 'var(--r-lg)',
            boxShadow: '0 0 0 3px rgba(15,142,90,.08)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brand-700)"
            strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="ค้นหาร้าน หมวด หรือธนาคาร"
            className="flex-1 bg-transparent text-[16px] text-ink placeholder:text-ink-4 outline-none"
          />
          {query.length > 0 && (
            <button onClick={() => setQuery('')} className="p-0.5 text-ink-4 shrink-0">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth={2.5} strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-3 pb-8">

          {/* Recent searches */}
          {!isTyping && recents.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-ink-4 uppercase tracking-wide mb-2">ล่าสุด</p>
              <div className="flex flex-col gap-1">
                {recents.map(r => (
                  <button
                    key={r}
                    onClick={() => handleRecentClick(r)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left group"
                    style={{ background: 'var(--surface-2)' }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--ink-4)"
                      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span className="flex-1 text-[13px] text-ink-2">{r}</span>
                    <span
                      role="button"
                      onClick={e => removeRecent(r, e)}
                      className="text-ink-4 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth={2.5} strokeLinecap="round">
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empty state — no recents yet */}
          {!isTyping && recents.length === 0 && (
            <div className="flex flex-col items-center gap-2.5 pt-14 text-center">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="var(--ink-4)"
                strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <p className="text-[13px] text-ink-3 font-medium">พิมพ์ชื่อร้านเพื่อดูว่าบัตรไหนคุ้มสุด</p>
              <p className="text-[11px] text-ink-4">เช่น Starbucks, Lotus's, PT Station</p>
            </div>
          )}

          {/* Loading skeletons */}
          {isTyping && loading && (
            <div className="flex flex-col gap-1.5 pt-1">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 px-3 py-3 rounded-xl"
                  style={{ background: 'var(--surface-2)' }}>
                  <div className="w-10 h-10 rounded-xl shrink-0 animate-pulse" style={{ background: 'var(--line)' }} />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 rounded animate-pulse w-3/5" style={{ background: 'var(--line)' }} />
                    <div className="h-2.5 rounded animate-pulse w-2/5" style={{ background: 'var(--line-soft)' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Results */}
          {isTyping && !loading && results.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-ink-4 uppercase tracking-wide mb-2">
                ผลลัพธ์ · {results.length} ร้าน
              </p>
              <div className="flex flex-col">
                {results.map(m => (
                  <button
                    key={m.id}
                    onClick={() => handleSelect(m)}
                    className="flex items-center gap-3 px-1 py-3 border-b text-left"
                    style={{ borderColor: 'var(--line-soft)' }}
                  >
                    <div
                      className="w-10 h-10 flex items-center justify-center text-xl shrink-0"
                      style={{ background: 'var(--surface-2)', borderRadius: 12 }}
                    >
                      {m.categories?.icon ?? '🏪'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-ink leading-snug truncate">
                        {m.name_eng ?? m.name_th}
                      </p>
                      {m.name_th && m.name_eng && (
                        <p className="text-[11px] text-ink-3 truncate">{m.name_th}</p>
                      )}
                      {m.categories?.name_th && (
                        <p className="text-[10px] text-ink-4 mt-0.5">{m.categories.name_th}</p>
                      )}
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-4)"
                      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No results */}
          {isTyping && !loading && results.length === 0 && (
            <div className="flex flex-col items-center gap-2 pt-12 text-center">
              <p className="text-[13px] text-ink-3 font-medium">ไม่พบร้านที่ตรงกัน</p>
              <p className="text-[11px] text-ink-4">ลองค้นหาหมวดหมู่ เช่น "คาเฟ่" หรือ "ร้านอาหาร"</p>
            </div>
          )}

        </div>
      </div>
    </>
  )
})
