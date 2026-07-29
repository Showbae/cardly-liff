'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import liff from '@line/liff'
import { initLiff } from '@/lib/liff'
import { useTabBarStore } from '@/stores/tabBarStore'

// LINE's native swipe-to-close gate checks the WebView's actual scroll
// position (contentOffset.y <= 0), not whether JS called preventDefault —
// so scrollTop must never be allowed to rest at (or reach) exactly 0.
// Needs to be large enough that a fast flick's first frame can't blow
// through it before onTouchMove gets a chance to re-pin it.
const BUFFER = 24

// Tab-bar direction tracking
const NEAR_TOP = 50 // always show the tab bar this close to the top
const NEAR_BOTTOM = 50 // ...and this close to the bottom — nothing left to hide it for
const DIRECTION_THRESHOLD = 12 // ignore sub-threshold jitter/bounce

function scrollMetrics(target: EventTarget) {
  const el = target instanceof HTMLElement ? target : (document.scrollingElement as HTMLElement | null)
  if (!el) return { top: 0, max: 0 }
  return { top: el.scrollTop, max: el.scrollHeight - el.clientHeight }
}

// Set right before we programmatically force scrollTop (clamp/pin) so the
// scroll event that write triggers doesn't get misread as a real user
// scroll and flip the tab-bar direction incorrectly.
let ignoreNextScroll = false

function clamp(el: HTMLElement) {
  if (el.scrollHeight - el.clientHeight < BUFFER) return
  if (el.scrollTop < BUFFER) {
    ignoreNextScroll = true
    el.scrollTop = BUFFER
  }
}

function clampAll() {
  const se = document.scrollingElement as HTMLElement | null
  if (se) clamp(se)
  document.querySelectorAll<HTMLElement>('[class*="overflow-y-auto"]').forEach(clamp)
}

export function LiffSwipeLock() {
  const isInClientRef = useRef(false)
  const pathname = usePathname()

  useEffect(() => {
    initLiff()
      .then(() => {
        isInClientRef.current = liff.isInClient()
        if (isInClientRef.current) clampAll()
      })
      .catch(() => {})

    let lastSource: EventTarget | null = null
    let lastScrollTop = 0

    function onScroll(e: Event) {
      if (!isInClientRef.current) return
      const target = e.target
      if (!target) return

      if (target instanceof HTMLElement) clamp(target)
      else clampAll() // scroll originated on document/body

      if (ignoreNextScroll) {
        ignoreNextScroll = false
        return
      }

      const { top: currentTop, max: maxScrollTop } = scrollMetrics(target)

      if (target !== lastSource) {
        // new scroll source (e.g. just navigated to a page with a different
        // scroll container) — nothing to compare against yet
        lastSource = target
        lastScrollTop = currentTop
        return
      }

      if (currentTop < NEAR_TOP || maxScrollTop - currentTop < NEAR_BOTTOM) {
        useTabBarStore.getState().setVisible(true)
        lastScrollTop = currentTop
        return
      }

      const delta = currentTop - lastScrollTop
      if (Math.abs(delta) < DIRECTION_THRESHOLD) return

      useTabBarStore.getState().setVisible(delta < 0) // scrolling up (delta<0) => show
      lastScrollTop = currentTop
    }

    // capture: true — scroll events don't bubble, so listen on the capture
    // phase at document level to catch scrolling from any nested container
    document.addEventListener('scroll', onScroll, { capture: true, passive: true })

    let startY = 0

    function onTouchStart(e: TouchEvent) {
      startY = e.touches[0]?.clientY ?? 0
    }

    function onTouchMove(e: TouchEvent) {
      if (!isInClientRef.current) return
      const touch = e.touches[0]
      if (!touch) return
      const dy = touch.clientY - startY
      if (dy <= 0) return // finger moving up = scrolling content down, always allow

      // Ancestor scroll container still has room above the buffer floor — a
      // normal in-content scroll-up, not a pull past the top. Allow it.
      let el = e.target as HTMLElement | null
      while (el && el !== document.documentElement) {
        const ov = window.getComputedStyle(el).overflowY
        if ((ov === 'auto' || ov === 'scroll') && el.scrollTop > BUFFER) return
        if ((ov === 'auto' || ov === 'scroll') && el.scrollHeight - el.clientHeight >= BUFFER) {
          ignoreNextScroll = true
          el.scrollTop = BUFFER // re-pin before the browser can apply this frame's scroll
          e.preventDefault()
          return
        }
        el = el.parentElement
      }

      // No nested scroll container — page scrolls natively via body/html
      const se = document.scrollingElement as HTMLElement | null
      const pageScrollTop = se?.scrollTop ?? window.scrollY
      if (pageScrollTop > BUFFER) return
      if (se && se.scrollHeight - se.clientHeight >= BUFFER) {
        ignoreNextScroll = true
        se.scrollTop = BUFFER
      }

      // At the top of all scroll containers — block LINE's swipe-to-close
      e.preventDefault()
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchmove', onTouchMove, { passive: false })

    return () => {
      document.removeEventListener('scroll', onScroll, true)
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchmove', onTouchMove)
    }
  }, [])

  // Route changes swap in new content (and new overflow-y-auto containers)
  // that need their own buffer applied once they've rendered/loaded. The
  // freshly-mounted page also starts scrolled to the top, so the tab bar
  // should always be visible again.
  useEffect(() => {
    useTabBarStore.getState().setVisible(true)
    if (!isInClientRef.current) return
    const t1 = setTimeout(clampAll, 50)
    const t2 = setTimeout(clampAll, 300)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [pathname])

  return null
}
