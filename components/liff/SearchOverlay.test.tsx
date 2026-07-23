import { createRef } from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { SearchOverlay } from './SearchOverlay'

const STORAGE_KEY = 'cardly-recent-searches'

const MOCK_MERCHANTS = [
  {
    id: 'starbucks-id',
    name_eng: 'Starbucks',
    name_th: 'สตาร์บัคส์',
    category_id: 'cafe-id',
    categories: { id: 'cafe-id', name_th: 'คาเฟ่', name_eng: 'Café', icon: '☕' },
  },
]

function mockFetch(results = MOCK_MERCHANTS) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ json: () => Promise.resolve({ results }) }),
  )
}

function renderOverlay(props: {
  open?: boolean
  onClose?: () => void
  onSelect?: (m: (typeof MOCK_MERCHANTS)[0]) => void
} = {}) {
  const ref = createRef<HTMLInputElement>()
  const onClose = props.onClose ?? vi.fn()
  const onSelect = props.onSelect ?? vi.fn()
  const utils = render(
    <SearchOverlay
      ref={ref}
      open={props.open ?? true}
      onClose={onClose}
      onSelect={onSelect as never}
    />,
  )
  return { ref, onClose, onSelect, ...utils }
}

beforeEach(() => {
  localStorage.clear()
  mockFetch()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

// Helper: type into search and wait past the 300ms debounce
async function typeAndWait(input: HTMLElement, value: string) {
  fireEvent.change(input, { target: { value } })
  await new Promise(resolve => setTimeout(resolve, 350))
}

describe('SearchOverlay', () => {
  describe('closed state', () => {
    it('slides sheet off-screen when open=false', () => {
      const { container } = renderOverlay({ open: false })
      const sheet = container.querySelector<HTMLElement>('[style*="translateY(100%)"]')
      expect(sheet).toBeTruthy()
    })
  })

  describe('open state — no recents', () => {
    it('shows the search input', () => {
      renderOverlay()
      expect(screen.getByPlaceholderText('ค้นหาร้าน หมวด หรือธนาคาร')).toBeInTheDocument()
    })

    it('shows empty-state prompt when no recents and query is empty', () => {
      renderOverlay()
      expect(screen.getByText('พิมพ์ชื่อร้านเพื่อดูว่าบัตรไหนคุ้มสุด')).toBeInTheDocument()
    })
  })

  describe('recent searches', () => {
    it('shows recent searches loaded from localStorage', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(['Starbucks', 'Lotus']))
      renderOverlay()
      expect(screen.getByText('Starbucks')).toBeInTheDocument()
      expect(screen.getByText('Lotus')).toBeInTheDocument()
    })

    it('does not show empty-state when recents exist', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(['Starbucks']))
      renderOverlay()
      expect(screen.queryByText('พิมพ์ชื่อร้านเพื่อดูว่าบัตรไหนคุ้มสุด')).not.toBeInTheDocument()
    })
  })

  describe('search query', () => {
    it('does NOT call fetch when query is only 1 character', async () => {
      renderOverlay()
      const input = screen.getByPlaceholderText('ค้นหาร้าน หมวด หรือธนาคาร')
      await typeAndWait(input, 'S')
      expect(fetch).not.toHaveBeenCalled()
    }, 2000)

    it('calls fetch after 300ms debounce when query >= 2 chars', async () => {
      renderOverlay()
      const input = screen.getByPlaceholderText('ค้นหาร้าน หมวด หรือธนาคาร')
      await typeAndWait(input, 'St')
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/merchants/search?q='))
    }, 2000)

    it('shows merchant results after successful fetch', async () => {
      renderOverlay()
      const input = screen.getByPlaceholderText('ค้นหาร้าน หมวด หรือธนาคาร')
      await typeAndWait(input, 'Star')
      await waitFor(() => expect(screen.getByText('Starbucks')).toBeInTheDocument(), { timeout: 2000 })
    }, 4000)

    it('shows "ไม่พบร้านที่ตรงกัน" when fetch returns empty results', async () => {
      mockFetch([])
      renderOverlay()
      const input = screen.getByPlaceholderText('ค้นหาร้าน หมวด หรือธนาคาร')
      await typeAndWait(input, 'xyz')
      await waitFor(() => expect(screen.getByText('ไม่พบร้านที่ตรงกัน')).toBeInTheDocument(), { timeout: 2000 })
    }, 4000)

    it('clears the input when ✕ clear button is clicked', async () => {
      renderOverlay()
      const input = screen.getByPlaceholderText('ค้นหาร้าน หมวด หรือธนาคาร')
      fireEvent.change(input, { target: { value: 'Star' } })
      expect(input).toHaveValue('Star')

      // The clear button appears inside the input row when query is non-empty
      const inputRow = input.closest('div')!
      const clearButton = inputRow.querySelector('button')!
      fireEvent.click(clearButton)

      expect(input).toHaveValue('')
    })
  })

  describe('merchant selection', () => {
    it('calls onSelect with the merchant data when a result is clicked', async () => {
      const onSelect = vi.fn()
      renderOverlay({ onSelect })
      const input = screen.getByPlaceholderText('ค้นหาร้าน หมวด หรือธนาคาร')
      await typeAndWait(input, 'Star')
      await waitFor(() => screen.getByText('Starbucks'), { timeout: 2000 })
      fireEvent.click(screen.getByText('Starbucks'))
      expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'starbucks-id' }))
    }, 5000)

    it('calls onClose after merchant is selected', async () => {
      const onClose = vi.fn()
      renderOverlay({ onClose })
      const input = screen.getByPlaceholderText('ค้นหาร้าน หมวด หรือธนาคาร')
      await typeAndWait(input, 'Star')
      await waitFor(() => screen.getByText('Starbucks'), { timeout: 2000 })
      fireEvent.click(screen.getByText('Starbucks'))
      expect(onClose).toHaveBeenCalled()
    }, 5000)

    it('saves selected merchant name to recent searches in localStorage', async () => {
      renderOverlay()
      const input = screen.getByPlaceholderText('ค้นหาร้าน หมวด หรือธนาคาร')
      await typeAndWait(input, 'Star')
      await waitFor(() => screen.getByText('Starbucks'), { timeout: 2000 })
      fireEvent.click(screen.getByText('Starbucks'))
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as string[]
      expect(saved).toContain('Starbucks')
    }, 5000)
  })
})
