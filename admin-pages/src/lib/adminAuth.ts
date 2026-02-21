import { getSessionToken } from '@descope/react-sdk'

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL

function redirectToAdminLogin(): void {
  if (typeof window === 'undefined') return
  if (window.location.pathname !== '/login') {
    window.location.replace('/login')
  }
}

if (!BACKEND_BASE_URL) {
  throw new Error('VITE_BACKEND_URL is required')
}

export type AdminAuthMeResponse = {
  id: number
  descope_user_id: string
  email: string
  full_name: string | null
  nick_name?: string | null
  role: string
  status: string
}

export type AdminEmailPrecheckResponse = {
  allowlisted: boolean
  status: string | null
  role: string | null
  require_mfa: boolean
  mfa_enrolled: boolean
}

export type ChallengePlanConfig = {
  id: string
  name: string
  price: string
  max_drawdown: string
  profit_target: string
  phases: string
  min_trading_days: string
  profit_split: string
  profit_cap: string
  payout_frequency: string
  status: 'Available' | 'Paused'
  enabled: boolean
}

export type ChallengeConfigResponse = {
  plans: ChallengePlanConfig[]
}

export type HeroStatsConfig = {
  total_paid_out: string
  paid_this_month: string
  paid_today: string
  trusted_traders: string
}

export type HeroStatsResponse = {
  stats: HeroStatsConfig
}

export type AdminCoupon = {
  id: number
  code: string
  discount_type: 'percent' | 'fixed'
  discount_value: number
  is_active: boolean
  expires_at: string | null
  max_uses: number | null
  used_count: number
  applicable_plan_ids: string[]
  applies_to_all_plans: boolean
  status: 'Active' | 'Expired' | string
}

export type AdminCouponsResponse = {
  coupons: AdminCoupon[]
}

export type MT5Stage = 'Ready' | 'Phase 1' | 'Phase 2' | 'Funded' | 'Disabled'

export type MT5AssignmentMode = 'manual' | 'automatic'

export type MT5Account = {
  id: number
  server: string
  account_number: string
  password: string
  investor_password: string
  account_size: string
  status: MT5Stage
  assignment_mode: MT5AssignmentMode | null
  assigned_by_admin_name: string | null
  assigned_user_id: number | null
  assigned_at: string | null
  created_at: string
  updated_at: string
}

export type MT5AccountsResponse = {
  accounts: MT5Account[]
}

export type MT5SummaryResponse = {
  total: number
  ready: number
  assigned: number
  disabled: number
}

export type ChallengeAccountListItem = {
  challenge_id: string
  user_id: number
  trader_name: string | null
  account_size: string
  phase: 'Phase 1' | 'Phase 2' | 'Funded'
  mt5_account: string | null
  mt5_server: string | null
  mt5_password: string | null
  objective_status?: string | null
  breached_reason?: string | null
  breached_at?: string | null
  passed_at?: string | null
}

export type ChallengeBreachListItem = {
  challenge_id: string
  user_id: number
  trader_name: string | null
  account_size: string
  phase: 'Phase 1' | 'Phase 2' | 'Funded'
  mt5_account: string | null
  breach_reason: string | null
  breached_at: string | null
}

export type ChallengeBreachesResponse = {
  accounts: ChallengeBreachListItem[]
}

export type AdminUsersListItem = {
  user_id: number
  name: string
  email: string
  status: string
  trading: string
  accounts: string
  revenue: string
  orders: string
  payouts: string
}

export type AdminUsersResponse = {
  users: AdminUsersListItem[]
  stats: {
    total_users: number
    funded_users: number
    breached_users: number
  }
}

export type AdminKycProfileItem = {
  user_id: number
  name: string
  email: string
  status: string
  eligible_since: string | null
  funded_accounts: number
  total_challenge_accounts: number
}

export type AdminKycProfilesResponse = {
  profiles: AdminKycProfileItem[]
  stats: {
    eligible_profiles: number
    today_eligible: number
  }
}

export type OrderStats = {
  period: string
  total_orders: number
  paid_orders: number
  pending_orders: number
  failed_orders: number
  total_volume_formatted: string
  success_rate_formatted: string
}

export type Order = {
  id: number
  provider_order_id: string
  status: string
  assignment_status: string
  account_size: string
  net_amount_formatted: string
  created_at: string | null
  paid_at: string | null
  user: {
    id: string
    name: string
    email: string
  }
  challenge_id: string | null
}

export type OrdersResponse = {
  orders: Order[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export type ChallengeAccountsResponse = {
  accounts: ChallengeAccountListItem[]
}

type AuthorizedRequestInit = RequestInit & { headers?: Record<string, string> }

function getTokenOrThrow(sessionToken?: string): string {
  const token = sessionToken || getSessionToken()
  if (!token) {
    throw new Error('No Descope session token available')
  }
  return token
}

async function authFetch(path: string, init: AuthorizedRequestInit = {}, sessionToken?: string): Promise<Response> {
  const token = getTokenOrThrow(sessionToken)

  const response = await fetch(`${BACKEND_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
  })

  if (response.status === 401) {
    clearPersistedAdminUser()
    redirectToAdminLogin()
  }

  return response
}

async function parseBackendError(prefix: string, response: Response): Promise<Error> {
  const rawText = await response.text()
  let detail = rawText

  try {
    const parsed = JSON.parse(rawText) as { detail?: unknown }
    if (typeof parsed.detail === 'string') {
      detail = parsed.detail
    }
  } catch {
    // keep raw text fallback
  }

  return new Error(`${prefix}: ${response.status} ${detail || response.statusText}`)
}

export async function adminLoginWithBackend(sessionToken?: string): Promise<AdminAuthMeResponse> {
  const response = await authFetch('/admin/auth/login', { method: 'POST' }, sessionToken)
  if (!response.ok) {
    throw await parseBackendError('Admin login failed', response)
  }
  return response.json() as Promise<AdminAuthMeResponse>
}

export async function fetchAdminMe(sessionToken?: string): Promise<AdminAuthMeResponse> {
  const response = await authFetch('/admin/auth/me', {}, sessionToken)
  if (!response.ok) {
    throw await parseBackendError('Admin profile fetch failed', response)
  }
  return response.json() as Promise<AdminAuthMeResponse>
}

export async function precheckAdminEmail(email: string): Promise<AdminEmailPrecheckResponse> {
  const params = new URLSearchParams({ email })
  const response = await fetch(`${BACKEND_BASE_URL}/admin/auth/precheck?${params.toString()}`)
  if (!response.ok) {
    if (response.status >= 500) {
      throw new Error('Admin service temporarily unavailable. Please retry in a moment.')
    }
    throw await parseBackendError('Admin precheck failed', response)
  }
  return response.json() as Promise<AdminEmailPrecheckResponse>
}

export async function logoutAdmin(sessionToken?: string): Promise<void> {
  try {
    await authFetch('/admin/auth/logout', { method: 'POST' }, sessionToken)
  } catch {
    // best effort logout
  }
}

export async function fetchAdminChallengeConfig(sessionToken?: string): Promise<ChallengeConfigResponse> {
  const response = await authFetch('/admin/challenges/config', {}, sessionToken)
  if (!response.ok) {
    throw await parseBackendError('Failed to load challenge config', response)
  }
  return response.json() as Promise<ChallengeConfigResponse>
}

export async function updateAdminChallengeConfig(
  payload: { otp: string; plans: ChallengePlanConfig[] },
  sessionToken?: string,
): Promise<ChallengeConfigResponse> {
  const response = await authFetch(
    '/admin/challenges/config',
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    sessionToken,
  )
  if (!response.ok) {
    throw await parseBackendError('Failed to update challenge config', response)
  }
  return response.json() as Promise<ChallengeConfigResponse>
}

export async function sendAdminChallengeConfigOtp(sessionToken?: string): Promise<{ message: string }> {
  const response = await authFetch('/admin/challenges/config/send-otp', { method: 'POST' }, sessionToken)
  if (!response.ok) {
    throw await parseBackendError('Failed to send admin OTP', response)
  }
  return response.json() as Promise<{ message: string }>
}

export async function fetchAdminHeroStats(sessionToken?: string): Promise<HeroStatsResponse> {
  const response = await authFetch('/admin/hero/stats', {}, sessionToken)
  if (!response.ok) {
    throw await parseBackendError('Failed to load hero stats', response)
  }
  return response.json() as Promise<HeroStatsResponse>
}

export async function fetchAdminCoupons(sessionToken?: string): Promise<AdminCouponsResponse> {
  const response = await authFetch('/admin/coupons', {}, sessionToken)
  if (!response.ok) {
    throw await parseBackendError('Failed to load coupons', response)
  }
  return response.json() as Promise<AdminCouponsResponse>
}

export async function createAdminCoupon(
  payload: {
    code: string
    discount_type: 'percent' | 'fixed'
    discount_value: number
    max_uses?: number | null
    expires_at?: string | null
    apply_all_plans: boolean
    applicable_plan_ids: string[]
  },
  sessionToken?: string,
): Promise<AdminCoupon> {
  const response = await authFetch(
    '/admin/coupons',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    sessionToken,
  )
  if (!response.ok) {
    throw await parseBackendError('Failed to create coupon', response)
  }
  return response.json() as Promise<AdminCoupon>
}

export async function updateAdminCouponStatus(
  couponId: number,
  isActive: boolean,
  sessionToken?: string,
): Promise<AdminCoupon> {
  const response = await authFetch(
    `/admin/coupons/${couponId}/status`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: isActive }),
    },
    sessionToken,
  )
  if (!response.ok) {
    throw await parseBackendError('Failed to update coupon status', response)
  }
  return response.json() as Promise<AdminCoupon>
}

export async function toggleAdminCouponPlan(
  couponId: number,
  payload: { plan_id: string; enabled: boolean },
  sessionToken?: string,
): Promise<AdminCoupon> {
  const response = await authFetch(
    `/admin/coupons/${couponId}/plans`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    sessionToken,
  )
  if (!response.ok) {
    throw await parseBackendError('Failed to update coupon plan toggle', response)
  }
  return response.json() as Promise<AdminCoupon>
}

export async function updateAdminHeroStats(
  payload: { otp: string; stats: HeroStatsConfig },
  sessionToken?: string,
): Promise<HeroStatsResponse> {
  const response = await authFetch(
    '/admin/hero/stats',
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    sessionToken,
  )
  if (!response.ok) {
    throw await parseBackendError('Failed to update hero stats', response)
  }
  return response.json() as Promise<HeroStatsResponse>
}

export async function fetchMT5Accounts(status?: MT5Stage, sessionToken?: string): Promise<MT5AccountsResponse> {
  const query = status ? `?status=${encodeURIComponent(status)}` : ''
  const response = await authFetch(`/admin/mt5/accounts${query}`, {}, sessionToken)
  if (!response.ok) {
    throw await parseBackendError('Failed to load MT5 accounts', response)
  }
  return response.json() as Promise<MT5AccountsResponse>
}

export async function fetchAssignedMT5Accounts(sessionToken?: string): Promise<MT5AccountsResponse> {
  const response = await authFetch('/admin/mt5/accounts/assigned', {}, sessionToken)
  if (!response.ok) {
    throw await parseBackendError('Failed to load assigned MT5 accounts', response)
  }
  return response.json() as Promise<MT5AccountsResponse>
}

export async function fetchMT5Summary(sessionToken?: string): Promise<MT5SummaryResponse> {
  const response = await authFetch('/admin/mt5/accounts/summary', {}, sessionToken)
  if (!response.ok) {
    throw await parseBackendError('Failed to load MT5 summary', response)
  }
  return response.json() as Promise<MT5SummaryResponse>
}

export async function fetchNextChallengeId(mode: 'manual' | 'system' = 'manual', sessionToken?: string): Promise<{ challenge_id: string }> {
  const response = await authFetch(`/admin/mt5/challenge-id/next?mode=${encodeURIComponent(mode)}`, {}, sessionToken)
  if (!response.ok) {
    throw await parseBackendError('Failed to generate challenge id', response)
  }
  return response.json() as Promise<{ challenge_id: string }>
}

export async function assignMT5Account(
  accountId: number,
  payload: {
    stage: 'Phase 1' | 'Phase 2' | 'Funded'
    assigned_user_email: string
    challenge_id?: string
  },
  sessionToken?: string,
): Promise<MT5Account> {
  const response = await authFetch(
    `/admin/mt5/accounts/${accountId}/assign`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    sessionToken,
  )
  if (!response.ok) {
    throw await parseBackendError('Failed to assign MT5 account', response)
  }
  return response.json() as Promise<MT5Account>
}

export async function downloadMT5Template(sessionToken?: string): Promise<string> {
  const response = await authFetch('/admin/mt5/accounts/template', {}, sessionToken)
  if (!response.ok) {
    throw await parseBackendError('Failed to download MT5 template', response)
  }
  return response.text()
}

export async function uploadMT5AccountsTxt(content: string, sessionToken?: string): Promise<MT5AccountsResponse> {
  const response = await authFetch(
    '/admin/mt5/accounts/upload-txt',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    },
    sessionToken,
  )
  if (!response.ok) {
    throw await parseBackendError('Failed to upload MT5 TXT', response)
  }
  return response.json() as Promise<MT5AccountsResponse>
}

export async function fetchChallengeAccounts(sessionToken?: string): Promise<ChallengeAccountsResponse> {
  const response = await authFetch('/admin/challenge-accounts', {}, sessionToken)
  if (!response.ok) {
    throw await parseBackendError('Failed to load challenge accounts', response)
  }
  return response.json() as Promise<ChallengeAccountsResponse>
}

export async function fetchFundedChallengeAccounts(sessionToken?: string): Promise<ChallengeAccountsResponse> {
  const response = await authFetch('/admin/challenge-accounts/funded', {}, sessionToken)
  if (!response.ok) {
    throw await parseBackendError('Failed to load funded challenge accounts', response)
  }
  return response.json() as Promise<ChallengeAccountsResponse>
}

export async function fetchAwaitingNextStageAccounts(sessionToken?: string): Promise<ChallengeAccountsResponse> {
  const response = await authFetch('/admin/challenge-accounts/awaiting-next-stage', {}, sessionToken)
  if (!response.ok) {
    throw await parseBackendError('Failed to load awaiting next stage accounts', response)
  }
  return response.json() as Promise<ChallengeAccountsResponse>
}

export async function fetchBreachedChallengeAccounts(sessionToken?: string): Promise<ChallengeBreachesResponse> {
  const response = await authFetch('/admin/challenge-accounts/breaches', {}, sessionToken)
  if (!response.ok) {
    throw await parseBackendError('Failed to load breached challenge accounts', response)
  }
  return response.json() as Promise<ChallengeBreachesResponse>
}

export async function fetchAdminUsers(sessionToken?: string): Promise<AdminUsersResponse> {
  const response = await authFetch('/admin/users', {}, sessionToken)
  if (!response.ok) {
    throw await parseBackendError('Failed to load admin users', response)
  }
  return response.json() as Promise<AdminUsersResponse>
}

export async function fetchAdminKycProfiles(sessionToken?: string): Promise<AdminKycProfilesResponse> {
  const response = await authFetch('/admin/kyc/profiles', {}, sessionToken)
  if (!response.ok) {
    throw await parseBackendError('Failed to load KYC profiles', response)
  }
  return response.json() as Promise<AdminKycProfilesResponse>
}

export async function fetchOrderStats(period: 'today' | 'week' | 'month' = 'today', sessionToken?: string): Promise<OrderStats> {
  const response = await authFetch(`/admin/orders/stats?period=${encodeURIComponent(period)}`, {}, sessionToken)
  if (!response.ok) {
    throw await parseBackendError('Failed to load order stats', response)
  }
  return response.json() as Promise<OrderStats>
}

export async function fetchOrders(
  page: number = 1,
  limit: number = 50,
  period: 'today' | 'week' | 'month' = 'today',
  statusFilter?: string,
  search?: string,
  sessionToken?: string,
): Promise<OrdersResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    period,
  })
  if (statusFilter) params.append('status_filter', statusFilter)
  if (search) params.append('search', search)

  const response = await authFetch(`/admin/orders?${params.toString()}`, {}, sessionToken)
  if (!response.ok) {
    throw await parseBackendError('Failed to load orders', response)
  }
  return response.json() as Promise<OrdersResponse>
}

export async function fetchPendingAssignments(
  page: number = 1,
  limit: number = 50,
  sessionToken?: string,
): Promise<OrdersResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  })

  const response = await authFetch(`/admin/orders/pending-assignments?${params.toString()}`, {}, sessionToken)
  if (!response.ok) {
    throw await parseBackendError('Failed to load pending assignments', response)
  }
  return response.json() as Promise<OrdersResponse>
}

export async function generateCertificates(sessionToken?: string): Promise<{ message: string; generated: number; failed: number }> {
  const response = await authFetch('/admin/certificates/generate-certificates', { method: 'POST' }, sessionToken)
  if (!response.ok) {
    throw await parseBackendError('Failed to generate certificates', response)
  }
  return response.json() as Promise<{ message: string; generated: number; failed: number }>
}

export async function generatePayoutCertificates(sessionToken?: string): Promise<{ message: string; generated: number; failed: number }> {
  const response = await authFetch('/admin/payouts/generate-payout-certificates', { method: 'POST' }, sessionToken)
  if (!response.ok) {
    throw await parseBackendError('Failed to generate certificates', response)
  }
  return response.json() as Promise<{ message: string; generated: number; failed: number }>
}

export type PayoutStats = {
  period: string
  pending_review: number
  approved_today: number
  paid_today_kobo: number
  paid_today_formatted: string
  rejected: number
}

export type PayoutRequest = {
  id: number
  provider_order_id: string
  status: string
  amount_kobo: number
  amount_formatted: string
  created_at: string
  completed_at: string | null
  user: {
    id: number
    name: string
    email: string
  }
  account: {
    challenge_id: string
    account_size: string
  }
  metadata: any
}

export type PayoutRequestsResponse = {
  payouts: PayoutRequest[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export async function fetchPayoutStats(period: 'today' | 'week' | 'month' = 'today', sessionToken?: string): Promise<PayoutStats> {
  const response = await authFetch(`/admin/payouts/stats?period=${encodeURIComponent(period)}`, {}, sessionToken)
  if (!response.ok) {
    throw await parseBackendError('Failed to load payout stats', response)
  }
  return response.json() as Promise<PayoutStats>
}

export async function fetchPayoutRequests(
  page: number = 1,
  limit: number = 50,
  period: 'today' | 'week' | 'month' = 'today',
  statusFilter?: string,
  search?: string,
  sessionToken?: string,
): Promise<PayoutRequestsResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    period,
  })
  if (statusFilter) params.append('status_filter', statusFilter)
  if (search) params.append('search', search)

  const response = await authFetch(`/admin/payouts?${params.toString()}`, {}, sessionToken)
  if (!response.ok) {
    throw await parseBackendError('Failed to load payout requests', response)
  }
  return response.json() as Promise<PayoutRequestsResponse>
}

export async function approvePayout(payoutId: number, sessionToken?: string): Promise<{ success: boolean; message: string }> {
  const response = await authFetch(`/admin/payouts/${payoutId}/approve`, { method: 'POST' }, sessionToken)
  if (!response.ok) {
    throw await parseBackendError('Failed to approve payout', response)
  }
  return response.json() as Promise<{ success: boolean; message: string }>
}

export async function rejectPayout(payoutId: number, reason: string, sessionToken?: string): Promise<{ success: boolean; message: string }> {
  const response = await authFetch(`/admin/payouts/${payoutId}/reject?reason=${encodeURIComponent(reason)}`, { method: 'POST' }, sessionToken)
  if (!response.ok) {
    throw await parseBackendError('Failed to reject payout', response)
  }
  return response.json() as Promise<{ success: boolean; message: string }>
}

export function persistAdminUser(user: AdminAuthMeResponse): void {
  localStorage.setItem('nairatrader_admin_auth_user', JSON.stringify(user))
}

export function getPersistedAdminUser(): AdminAuthMeResponse | null {
  const raw = localStorage.getItem('nairatrader_admin_auth_user')
  if (!raw) return null

  try {
    return JSON.parse(raw) as AdminAuthMeResponse
  } catch {
    return null
  }
}

export function clearPersistedAdminUser(): void {
  localStorage.removeItem('nairatrader_admin_auth_user')
}
