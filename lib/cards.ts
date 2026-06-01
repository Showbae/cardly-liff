import { createSupabaseClient } from './supabase/client'

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
  const supabase = createSupabaseClient()
  const { data, error } = await supabase
    .from('credit_cards')
    .select('*, banks(*)')
    .order('bank_id')
  if (error) throw error
  return data ?? []
}

export async function getMyCards(userId: string): Promise<UserCard[]> {
  const supabase = createSupabaseClient()
  const { data, error } = await supabase
    .from('users_card')
    .select('*, credit_cards(*, banks(*))')
    .eq('user_id', userId)
  if (error) throw error
  return data ?? []
}

export async function addCard(userId: string, cardId: string): Promise<void> {
  const supabase = createSupabaseClient()
  const { error } = await supabase
    .from('users_card')
    .insert({ user_id: userId, card_id: cardId })
  if (error) throw error
}

export async function removeCard(userCardId: string): Promise<void> {
  const supabase = createSupabaseClient()
  const { error } = await supabase
    .from('users_card')
    .delete()
    .eq('id', userCardId)
  if (error) throw error
}
