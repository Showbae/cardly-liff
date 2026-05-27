'use client'

import { useEffect, useState } from 'react'
import { signInWithLine } from '@/lib/auth'

export default function HomePage() {
  const [userName, setUserName] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    const mockProfile = {
      userId: 'U1234567890abcdef',
      displayName: 'ทดสอบ',
      pictureUrl: 'https://via.placeholder.com/60',
    }

    signInWithLine(mockProfile)
      .then((user) => {
        setUserName(user.display_name)
        setIsLoading(false)
      })
      .catch((err) => {
        console.error('error:', err)
        setIsLoading(false)
      })
  }, [])

  if (isLoading) return <div>กำลังโหลด...</div>

  return (
    <div style={{ padding: '20px' }}>
      <h1>สวัสดีครับ {userName}!</h1>
    </div>
  )
}
