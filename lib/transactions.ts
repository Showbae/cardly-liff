export interface TxMerchant {
  id: string
  name_th: string | null
  name_eng: string | null
  categories: { icon: string | null; name_th: string | null } | null
}

export interface Transaction {
  id: string
  amount: number
  spent_at: string
  note: string | null
  merchants: TxMerchant | null
}

export interface UpdateTransactionPayload {
  amount?: number
  spentAt?: string        // ISO 8601
  merchantId?: string
}

export interface TransactionsPage {
  transactions: Transaction[]
  nextCursor: string | null   // pass back as `before` to load the next 6-month window
  hasMore: boolean            // true when older transactions exist beyond this window
  total: number               // count of all transactions for the card (window-independent)
}

/**
 * Fetch one 6-month window of a card's transactions. Omit `before` for the most
 * recent window; pass a previous page's `nextCursor` to load the next 6 months.
 */
export async function getTransactions(
  usersCardId: string,
  before?: string,
): Promise<TransactionsPage> {
  const params = new URLSearchParams({ usersCardId })
  if (before) params.set('before', before)
  const res = await fetch(`/api/transactions?${params.toString()}`)
  if (!res.ok) throw new Error(`getTransactions failed: ${res.status}`)
  return res.json()
}

export async function updateTransaction(
  id: string,
  payload: UpdateTransactionPayload,
): Promise<Transaction> {
  const res = await fetch(`/api/transactions/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`updateTransaction failed: ${res.status}`)
  return res.json()
}

export async function deleteTransaction(id: string): Promise<void> {
  const res = await fetch(`/api/transactions/${encodeURIComponent(id)}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`deleteTransaction failed: ${res.status}`)
}
