interface LineProfile {
  userId: string
  displayName: string
  pictureUrl: string
}

export interface DbUser {
  id: string
  display_name: string
  picture_url: string
}

export async function signInWithLine(profile: LineProfile): Promise<DbUser> {
  const res = await fetch('/api/auth/line', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  })
  if (!res.ok) throw new Error(`signInWithLine failed: ${res.status}`)
  const user = await res.json()
  return {
    id: user.id,
    display_name: user.display_name ?? '',
    picture_url: user.picture_url ?? '',
  }
}
