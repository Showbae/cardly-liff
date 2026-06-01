import liff from '@line/liff'

export const initLiff = async () => {
  if (typeof window === 'undefined') return
  await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! })
}

export const getLiffProfile = async () => {
  if (!liff.isLoggedIn()) {
    liff.login()
    return null
  }
  return liff.getProfile()
}
