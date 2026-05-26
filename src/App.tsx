import { useEffect, useState } from 'react';
import liff from '@line/liff';
import { signInWithLine } from './lib/auth'



function App() {
  const [userName, setUserName] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
  const mockProfile = {
    userId: 'U1234567890abcdef',
    displayName: 'ทดสอบ',
    pictureUrl: 'https://via.placeholder.com/60',
  }

  signInWithLine(mockProfile)
    .then((users) => {
      console.log('สำเร็จ:', users)
      setUserName(users.display_name)
      setIsLoading(false)
    })
    .catch((err) => {
      console.error('error:', err)  // เพิ่มบรรทัดนี้
      setIsLoading(false)           // เพิ่มบรรทัดนี้ด้วย ไม่งั้นค้างโหลดตลอด
    })
}, [])

  if (isLoading) return <div>กำลังโหลด...</div>;
  //if (error) return <div>เกิดข้อผิดพลาด: {error}</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>สวัสดีครับ {userName}!</h1>
    </div>
  )
}

export default App;


