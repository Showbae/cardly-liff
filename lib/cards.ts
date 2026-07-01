export interface Bank {
  id: string
  name_th: string | null
  name_eng: string | null
}

export interface CreditCard {
  id: string
  bank_id: string | null
  card_name: string | null
  card_tier: string | null
  image_url: string | null
  banks: Bank | null
}

export interface UserCard {
  id: string
  card_id: string | null
  credit_cards: CreditCard | null
}

export async function getCatalogCards(): Promise<CreditCard[]> {
  const res = await fetch('/api/cards/catalog')
  if (!res.ok) throw new Error(`getCatalogCards failed: ${res.status}`)
  return res.json()
}

export async function getMyCards(userId: string): Promise<UserCard[]> {
  const res = await fetch(`/api/cards/my?userId=${encodeURIComponent(userId)}`)
  if (!res.ok) throw new Error(`getMyCards failed: ${res.status}`)
  return res.json()
}

export async function addCard(userId: string, cardId: string): Promise<void> {
  const res = await fetch('/api/cards/my', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, cardId }),
  })
  if (!res.ok) throw new Error(`addCard failed: ${res.status}`)
}

export async function removeCard(userCardId: string): Promise<void> {
  const res = await fetch(`/api/cards/my/${encodeURIComponent(userCardId)}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error(`removeCard failed: ${res.status}`)
}
