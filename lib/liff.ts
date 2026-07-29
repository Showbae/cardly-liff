import liff from '@line/liff'

let initPromise: Promise<void> | null = null

// Shared across all callers so liff.init() only ever runs once per page load —
// calling it concurrently from multiple components can race and leave later callers stuck.
export const initLiff = (): Promise<void> => {
  if (typeof window === 'undefined') return Promise.resolve()
  if (!initPromise) {
    initPromise = liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! })
  }
  return initPromise
}

export const getLiffProfile = async () => {
  if (!liff.isLoggedIn()) {
    // ใน LINE app → redirect login, ใน browser ปกติ → return null ไม่ redirect
    if (liff.isInClient()) liff.login()
    return null
  }
  return liff.getProfile()
}
