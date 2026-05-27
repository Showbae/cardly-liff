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
}

export async function signInWithLine(profile: LineProfile): Promise<SupabaseUser> {
  const supabase = createSupabaseClient()

  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('line_id', profile.userId)
    .single()

  if (existingUser) return existingUser

  const { data: newUser, error } = await supabase
    .from('users')
    .upsert(
      {
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
