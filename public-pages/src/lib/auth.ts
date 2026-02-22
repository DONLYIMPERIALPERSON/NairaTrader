import { getSessionToken } from '@descope/react-sdk'

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL

export type BankListItem = {
  bank_code: string
  bank_name: string
  bank_url?: string | null
}

function redirectToUserLogin(): void {
  if (typeof window === 'undefined') return
  if (window.location.pathname !== '/login') {
    window.location.replace('/login')
  }
}

if (!BACKEND_BASE_URL) {
  throw new Error('VITE_BACKEND_URL is required')
}

function parseBackendError(prefix: string, status: number, rawText: string): Error {
  let detail = rawText
  try {
    const parsed = JSON.parse(rawText) as { detail?: unknown }
    if (typeof parsed.detail === 'string') {
      detail = parsed.detail
    }
  } catch {
    // keep raw text fallback
  }
  return new Error(`${prefix}: ${status} ${detail || 'Request failed'}`)
}

async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = getSessionToken()
  if (!token) {
    throw new Error('No Descope session token available')
  }

  const response = await fetch(`${BACKEND_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
  })

  if (response.status === 401) {
    redirectToUserLogin()
  }

  return response
}

export async function fetchBankList(refresh = false): Promise<{ banks: BankListItem[] }> {
  const query = refresh ? '?refresh=true' : ''
  const response = await authFetch(`/profile/banks${query}`)
  if (!response.ok) {
    const errorText = await response.text()
    throw parseBackendError('Failed to load banks', response.status, errorText)
  }
  return response.json() as Promise<{ banks: BankListItem[] }>
}