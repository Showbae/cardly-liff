import { supabase } from './supabase'
interface LineProfile {
  userId: string
  displayName: string
  pictureUrl: string
}

interface SupabaseUser {
  id: string
  line_id: string
  display_name: string
  picture_url: string
  created_date: string
}

// เรียกฟังก์ชันนี้หลังจาก liff.getProfile() สำเร็จ
export async function signInWithLine(profile: LineProfile) {
  // เช็คก่อนว่า user คนนี้มีในระบบแล้วหรือยัง
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('line_id', profile.userId)
    .single()

  if (existingUser) {
    // มีแล้ว return ข้อมูลเดิมได้เลย
    return existingUser
  }

 // ยังไม่มี สร้าง user ใหม่
  const { data: newUser, error } = await supabase
    .from('users')
    .upsert({
      line_id: profile.userId,
      display_name: profile.displayName,
      picture_url: profile.pictureUrl,
    },
    { onConflict: 'line_id' }
    )
    .select()
    .single()

  if (error) throw error
  return newUser
}