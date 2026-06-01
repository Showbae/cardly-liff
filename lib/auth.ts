import { createSupabaseClient } from './supabase/client'

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
  updated_date: string | null
  last_login: string | null
}

export async function signInWithLine(profile: LineProfile): Promise<SupabaseUser> {
  const supabase = createSupabaseClient()
  const now = new Date().toISOString()

  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('line_id', profile.userId)
    .single()

  if (existingUser) {
    const profileChanged =
      existingUser.display_name !== profile.displayName ||
      existingUser.picture_url !== profile.pictureUrl

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({
        last_login: now,
        ...(profileChanged && {
          display_name: profile.displayName,
          picture_url: profile.pictureUrl,
          updated_date: now,
        }),
      })
      .eq('line_id', profile.userId)
      .select()
      .single()

    if (error) throw error
    return updatedUser
  }

  // สร้าง user ใหม่
  const { data: newUser, error } = await supabase
    .from('users')
    .upsert(
      {
        line_id: profile.userId,
        display_name: profile.displayName,
        picture_url: profile.pictureUrl,
        last_login: now,
      },
      { onConflict: 'line_id' }
    )
    .select()
    .single()

  if (error) throw error
  return newUser
}
