'use client'

import { useEffect, useState } from 'react'
import { initLiff, getLiffProfile } from '@/lib/liff'
import { signInWithLine } from '@/lib/auth'

interface User {
  id: string
  display_name: string
  picture_url: string
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      try {
        await initLiff()
        const profile = await getLiffProfile()
        if (!profile) return
        const dbUser = await signInWithLine({
          userId: profile.userId,
          displayName: profile.displayName,
          pictureUrl: profile.pictureUrl ?? '',
        })
        setUser(dbUser)
      } catch (err) {
        setError('เกิดข้อผิดพลาด: ' + String(err))
      } finally {
        setIsLoading(false)
      }
    }

    init()
  }, [])

  if (isLoading) return <div>กำลังโหลด...</div>
  if (error) return <div>{error}</div>

  return (
    <div style={{ padding: '20px' }}>
      <h1>สวัสดีครับ {user?.display_name}!</h1>
      <img src={user?.picture_url} alt="Profile Picture" style={{ borderRadius: '50%', width: '150px', height: '150px' }} />
    </div>
  )
}
