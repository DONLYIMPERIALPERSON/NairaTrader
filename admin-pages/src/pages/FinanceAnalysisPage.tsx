import { useEffect, useMemo, useState } from 'react'
import { getSessionToken } from '@descope/react-sdk'
import {
  fetchAdminHeroStats,
  fetchAdminChallengeConfig,
  fetchMonthlyFinanceStats,
  type HeroStatsConfig,
  sendAdminChallengeConfigOtp,
  type ChallengePlanConfig,
  updateAdminChallengeConfig,
  updateAdminHeroStats,
} from '../lib/adminAuth'
import './FinanceAnalysisPage.css'

type AccountPriceItem = {
  id: string
  accountSize: string
  price: string
  payoutPercent: string
  withdrawalFrequencyHours: string
  profitCapPercent: string
  maxDrawdownPercent: string
  profitTargetPercent: string
  phases: string
  minTradingDays: string
  enabled: boolean
  status: 'Available' | 'Paused'
}

const mapPlanToAccountPricing = (plan: ChallengePlanConfig): AccountPriceItem => ({
  id: plan.id,
  accountSize: plan.name,
  price: plan.price,
  payoutPercent: plan.profit_split.replace('%', ''),
  withdrawalFrequencyHours: plan.payout_frequency.toLowerCase().replace('hr', ''),
  profitCapPercent: plan.profit_cap.replace('%', ''),
  maxDrawdownPercent: plan.max_drawdown.replace('%', ''),
  profitTargetPercent: plan.profit_target.replace('%', ''),
  phases: plan.phases,
  minTradingDays: plan.min_trading_days,
  enabled: plan.enabled,
  status: plan.status,
})

const mapAccountPricingToPlan = (item: AccountPriceItem): ChallengePlanConfig => ({
  id: item.id,
  name: item.accountSize,
  price: item.price,
  max_drawdown: `${item.maxDrawdownPercent}%`,
  profit_target: `${item.profitTargetPercent}%`,
  phases: item.phases,
  min_trading_days: item.minTradingDays,
  profit_split: `${item.payoutPercent}%`,
  profit_cap: `${item.profitCapPercent}%`,
  payout_frequency: `${item.withdrawalFrequencyHours}hr`,
  status: item.enabled ? 'Available' : 'Paused',
  enabled: item.enabled,
})

const defaultHeroStats: HeroStatsConfig = {
  total_paid_out: '1000000000',
  paid_this_month: '97999480',
  paid_today: '11551014',
  trusted_traders: '50000',
}

const FinanceAnalysisPage = () => {
  const [monthlyFinance, setMonthlyFinance] = useState<Array<{ month: string; totalPurchase: string; totalPayouts: string }>>([])
  const [selectedMonth, setSelectedMonth] = useState('')
  const [accountPricing, setAccountPricing] = useState<AccountPriceItem[]>([
    { id: '200k', accountSize: '₦200k Account', price: '₦8,900', payoutPercent: '70', withdrawalFrequencyHours: '24', profitCapPercent: '100', maxDrawdownPercent: '20', profitTargetPercent: '10', phases: '2', minTradingDays: '1', enabled: true, status: 'Available' },
    { id: '400k', accountSize: '₦400k Account', price: '₦18,500', payoutPercent: '70', withdrawalFrequencyHours: '24', profitCapPercent: '100', maxDrawdownPercent: '20', profitTargetPercent: '10', phases: '2', minTradingDays: '1', enabled: true, status: 'Available' },
    { id: '600k', accountSize: '₦600k Account', price: '₦28,000', payoutPercent: '70', withdrawalFrequencyHours: '24', profitCapPercent: '100', maxDrawdownPercent: '20', profitTargetPercent: '10', phases: '2', minTradingDays: '1', enabled: true, status: 'Available' },
    { id: '800k', accountSize: '₦800k Account', price: '₦38,000', payoutPercent: '70', withdrawalFrequencyHours: '24', profitCapPercent: '100', maxDrawdownPercent: '20', profitTargetPercent: '10', phases: '2', minTradingDays: '1', enabled: true, status: 'Available' },
    { id: '1.5m', accountSize: '₦1.5m Account', price: '₦99,000', payoutPercent: '70', withdrawalFrequencyHours: '24', profitCapPercent: '50', maxDrawdownPercent: '20', profitTargetPercent: '10', phases: '2', minTradingDays: '1', enabled: true, status: 'Available' },
    { id: '3m', accountSize: '₦3m Account', price: '₦180,000', payoutPercent: '70', withdrawalFrequencyHours: '24', profitCapPercent: '50', maxDrawdownPercent: '20', profitTargetPercent: '10', phases: '2', minTradingDays: '1', enabled: false, status: 'Paused' },
  ])
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    price: '',
    payoutPercent: '',
    withdrawalFrequencyHours: '',
    profitCapPercent: '',
    maxDrawdownPercent: '',
    profitTargetPercent: '',
    phases: '',
    minTradingDays: '',
  })
  const [authError, setAuthError] = useState('')
  const [loadingConfig, setLoadingConfig] = useState(true)
  const [saveSuccess, setSaveSuccess] = useState('')
  const [togglingAccountId, setTogglingAccountId] = useState<string | null>(null)
  const [otpModalOpen, setOtpModalOpen] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [otpFeedback, setOtpFeedback] = useState('')
  const [otpError, setOtpError] = useState('')
  const [otpSending, setOtpSending] = useState(false)
  const [otpSubmitting, setOtpSubmitting] = useState(false)
  const [pendingPricing, setPendingPricing] = useState<AccountPriceItem[] | null>(null)
  const [pendingHeroStats, setPendingHeroStats] = useState<HeroStatsConfig | null>(null)
  const [pendingOperation, setPendingOperation] = useState<'challenge' | 'hero' | null>(null)
  const [shouldCloseEditAfterOtp, setShouldCloseEditAfterOtp] = useState(false)
  const [heroStats, setHeroStats] = useState<HeroStatsConfig>(defaultHeroStats)
  const [editingHeroStats, setEditingHeroStats] = useState(false)
  const [heroForm, setHeroForm] = useState<HeroStatsConfig>(defaultHeroStats)

  useEffect(() => {
    let mounted = true

    const loadConfig = async () => {
      try {
        const [challengeResponse, heroStatsResponse, financeResponse] = await Promise.all([
          fetchAdminChallengeConfig(),
          fetchAdminHeroStats(),
          fetchMonthlyFinanceStats(),
        ])
        if (!mounted) return
        setAccountPricing(challengeResponse.plans.map(mapPlanToAccountPricing))
        setHeroStats(heroStatsResponse.stats)
        setMonthlyFinance(financeResponse.monthlyFinance)
        // Set the most recent month as selected by default
        if (financeResponse.monthlyFinance.length > 0) {
          setSelectedMonth(financeResponse.monthlyFinance[0].month)
        }
      } catch {
        if (!mounted) return
        setAuthError('Could not load challenge config from backend. Showing local values.')
      } finally {
        if (mounted) setLoadingConfig(false)
      }
    }

    void loadConfig()
    return () => {
      mounted = false
    }
  }, [])

  const selectedMonthFinance = useMemo(
    () => monthlyFinance.find((entry) => entry.month === selectedMonth) ?? (monthlyFinance.length > 0 ? monthlyFinance[0] : { month: '', totalPurchase: '₦0', totalPayouts: '₦0' }),
    [selectedMonth, monthlyFinance],
  )

  const closeEditModal = () => {
    setEditingAccountId(null)
    setEditForm({
      price: '',
      payoutPercent: '',
      withdrawalFrequencyHours: '',
      profitCapPercent: '',
      maxDrawdownPercent: '',
      profitTargetPercent: '',
      phases: '',
      minTradingDays: '',
    })
    setAuthError('')
  }

  const closeOtpModal = () => {
    setOtpModalOpen(false)
    setOtpCode('')
    setOtpFeedback('')
    setOtpError('')
    setOtpSending(false)
    setOtpSubmitting(false)
    setPendingPricing(null)
    setPendingHeroStats(null)
    setPendingOperation(null)
    setShouldCloseEditAfterOtp(false)
    setTogglingAccountId(null)
  }

  const closeHeroModal = () => {
    setEditingHeroStats(false)
    setHeroForm(heroStats)
  }

  const openHeroModal = () => {
    setHeroForm(heroStats)
    setEditingHeroStats(true)
    setSaveSuccess('')
    setAuthError('')
  }

  const openAccountPriceModal = (accountId: string) => {
    const account = accountPricing.find((entry) => entry.id === accountId)
    if (!account) return

    setEditingAccountId(accountId)
    setEditForm({
      price: account.price,
      payoutPercent: account.payoutPercent,
      withdrawalFrequencyHours: account.withdrawalFrequencyHours,
      profitCapPercent: account.profitCapPercent,
      maxDrawdownPercent: account.maxDrawdownPercent,
      profitTargetPercent: account.profitTargetPercent,
      phases: account.phases,
      minTradingDays: account.minTradingDays,
    })
    setAuthError('')
    setSaveSuccess('')
  }

  const saveAllPricing = async (nextPricing: AccountPriceItem[], otp: string) => {
    try {
      await updateAdminChallengeConfig({
        otp,
        plans: nextPricing.map(mapAccountPricingToPlan),
      })
      setAccountPricing(nextPricing)
      setAuthError('')
      setSaveSuccess('Challenge settings saved and synced to public page.')
    } catch (error) {
      if (!getSessionToken()) {
        setAuthError('Admin session expired. Please sign in again.')
      } else {
        setAuthError(error instanceof Error ? error.message : 'Failed to save settings')
      }
      throw error
    }
  }

  const handleSendOtp = async () => {
    setOtpError('')
    setOtpFeedback('')
    setOtpSending(true)

    try {
      const response = await sendAdminChallengeConfigOtp()
      setOtpFeedback(response.message || 'OTP sent successfully. Check your admin email.')
    } catch (error) {
      setOtpError(error instanceof Error ? error.message : 'Failed to send OTP')
    } finally {
      setOtpSending(false)
    }
  }

  const openOtpModalForAction = (nextPricing: AccountPriceItem[], closeEditAfterOtp: boolean) => {
    setPendingOperation('challenge')
    setPendingPricing(nextPricing)
    setPendingHeroStats(null)
    setShouldCloseEditAfterOtp(closeEditAfterOtp)
    setOtpModalOpen(true)
    setOtpCode('')
    setOtpFeedback('')
    setOtpError('')
  }

  const openOtpModalForHeroAction = (nextHeroStats: HeroStatsConfig) => {
    setPendingOperation('hero')
    setPendingHeroStats(nextHeroStats)
    setPendingPricing(null)
    setShouldCloseEditAfterOtp(false)
    setOtpModalOpen(true)
    setOtpCode('')
    setOtpFeedback('')
    setOtpError('')
  }

  const submitOtpAndSave = async () => {
    if (!/^\d{6}$/.test(otpCode)) {
      setOtpError('OTP must be 6 digits')
      return
    }

    setOtpSubmitting(true)
    setOtpError('')

    try {
      if (pendingOperation === 'challenge') {
        if (!pendingPricing) {
          setOtpError('No pending settings update found.')
          return
        }

        await saveAllPricing(pendingPricing, otpCode)
        if (shouldCloseEditAfterOtp) {
          closeEditModal()
        }
      }

      if (pendingOperation === 'hero') {
        if (!pendingHeroStats) {
          setOtpError('No pending hero stats update found.')
          return
        }

        const response = await updateAdminHeroStats({ otp: otpCode, stats: pendingHeroStats })
        setHeroStats(response.stats)
        setSaveSuccess('Hero payout stats saved and synced to public page.')
        closeHeroModal()
      }

      closeOtpModal()
    } catch (error) {
      setOtpError(error instanceof Error ? error.message : 'Failed to save settings')
    } finally {
      setOtpSubmitting(false)
    }
  }

  const saveSettingUpdate = async () => {
    if (!editingAccountId) return

    const nextPricing = accountPricing.map((entry) =>
      entry.id === editingAccountId
        ? {
            ...entry,
            price: editForm.price,
            payoutPercent: editForm.payoutPercent,
            withdrawalFrequencyHours: editForm.withdrawalFrequencyHours,
            profitCapPercent: editForm.profitCapPercent,
            maxDrawdownPercent: editForm.maxDrawdownPercent,
            profitTargetPercent: editForm.profitTargetPercent,
            phases: editForm.phases,
            minTradingDays: editForm.minTradingDays,
          }
        : entry,
    )

    openOtpModalForAction(nextPricing, true)
  }

  const toggleAccountEnabled = async (accountId: string) => {
    setTogglingAccountId(accountId)

    const nextPricing: AccountPriceItem[] = accountPricing.map((entry) =>
      entry.id === accountId
        ? { ...entry, enabled: !entry.enabled, status: !entry.enabled ? 'Available' as const : 'Paused' as const }
        : entry,
    )

    openOtpModalForAction(nextPricing, false)
  }

  const saveHeroStatsUpdate = () => {
    openOtpModalForHeroAction(heroForm)
  }

  return (
    <section className="admin-page-stack">
      <div className="admin-dashboard-card">
        <h2>Finance Analysis</h2>
        <p>Month-to-month finance insights for purchases and payouts.</p>
      </div>

      <div className="admin-dashboard-card">
        <div className="analysis-topbar-filters">
          <label>
            Month
            <select value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} disabled={monthlyFinance.length === 0}>
              {monthlyFinance.length === 0 ? (
                <option value="">Loading...</option>
              ) : (
                monthlyFinance.map((entry) => (
                  <option key={entry.month} value={entry.month}>{entry.month}</option>
                ))
              )}
            </select>
          </label>
        </div>
      </div>

      <div className="admin-kpi-grid analysis-kpi-grid">
        <article className="admin-kpi-card analysis-kpi-card">
          <h3>Total Purchase ({selectedMonth || 'Loading...'})</h3>
          <strong>{selectedMonthFinance.totalPurchase}</strong>
        </article>
        <article className="admin-kpi-card analysis-kpi-card">
          <h3>Total Payouts ({selectedMonth || 'Loading...'})</h3>
          <strong>{selectedMonthFinance.totalPayouts}</strong>
        </article>
      </div>

      <div className="admin-dashboard-card">
        <h3>Settings</h3>
        <p className="finance-settings-note">Current saved values are shown below. Use edit icon to update each setting.</p>
        {loadingConfig && <p className="finance-settings-note">Loading challenge configuration…</p>}
        {!editingAccountId && authError && <p className="finance-auth-error">{authError}</p>}
        {saveSuccess && <p style={{ marginTop: 6, color: '#86efac', fontSize: 13 }}>{saveSuccess}</p>}

        <div className="finance-account-price-section">
          <h4>Account Size Pricing</h4>
          <div className="finance-account-price-list">
            {accountPricing.map((account) => (
              <article key={account.id} className="finance-account-price-row">
                <div>
                  <strong>{account.accountSize}</strong>
                  <p>{account.price}</p>
                  <p className="finance-account-meta">
                    Payout: {account.payoutPercent}% • Frequency: {account.withdrawalFrequencyHours}h • Profit Cap: {account.profitCapPercent}%
                  </p>
                  <p className="finance-account-meta">
                    Max DD: {account.maxDrawdownPercent}% • Target: {account.profitTargetPercent}% • Phases: {account.phases} • Min Days: {account.minTradingDays}
                  </p>
                </div>

                <div className="finance-account-price-actions">
                  <button type="button" className="finance-setting-edit-btn" onClick={() => openAccountPriceModal(account.id)}>
                    ✎ Edit Price
                  </button>
                  <button
                    type="button"
                    className={`finance-toggle-btn ${account.enabled ? 'disable' : 'enable'}`}
                    onClick={() => toggleAccountEnabled(account.id)}
                    disabled={togglingAccountId === account.id}
                  >
                    {togglingAccountId === account.id
                      ? 'Saving...'
                      : account.enabled ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="finance-account-price-section">
          <h4>Hero Payout Stats</h4>
          <article className="finance-account-price-row">
            <div>
              <strong>Public Hero Statistics</strong>
              <p className="finance-account-meta">Over paid out: ₦{heroStats.total_paid_out}</p>
              <p className="finance-account-meta">Paid this month: ₦{heroStats.paid_this_month}</p>
              <p className="finance-account-meta">Paid today: ₦{heroStats.paid_today}</p>
              <p className="finance-account-meta">Trusted traders: {heroStats.trusted_traders}</p>
            </div>

            <div className="finance-account-price-actions">
              <button type="button" className="finance-setting-edit-btn" onClick={openHeroModal}>
                ✎ Edit Hero Stats
              </button>
            </div>
          </article>
        </div>
      </div>

      {editingAccountId && (
        <div className="finance-settings-modal-backdrop" onClick={closeEditModal}>
          <div className="finance-settings-modal" onClick={(event) => event.stopPropagation()}>
            <h3>
              Edit {accountPricing.find((entry) => entry.id === editingAccountId)?.accountSize} Settings
            </h3>

            <div className="finance-settings-modal-grid">
              <label>
                Account Price
                <input value={editForm.price} onChange={(event) => setEditForm((prev) => ({ ...prev, price: event.target.value }))} />
              </label>

              <label>
                Payout %
                <input value={editForm.payoutPercent} onChange={(event) => setEditForm((prev) => ({ ...prev, payoutPercent: event.target.value }))} />
              </label>

              <label>
                Payout Frequency (hours)
                <input value={editForm.withdrawalFrequencyHours} onChange={(event) => setEditForm((prev) => ({ ...prev, withdrawalFrequencyHours: event.target.value }))} />
              </label>

              <label>
                Profit Cap %
                <input value={editForm.profitCapPercent} onChange={(event) => setEditForm((prev) => ({ ...prev, profitCapPercent: event.target.value }))} />
              </label>

              <label>
                Max DD %
                <input value={editForm.maxDrawdownPercent} onChange={(event) => setEditForm((prev) => ({ ...prev, maxDrawdownPercent: event.target.value }))} />
              </label>

              <label>
                Profit Target %
                <input value={editForm.profitTargetPercent} onChange={(event) => setEditForm((prev) => ({ ...prev, profitTargetPercent: event.target.value }))} />
              </label>

              <label>
                Phases
                <input value={editForm.phases} onChange={(event) => setEditForm((prev) => ({ ...prev, phases: event.target.value }))} />
              </label>

              <label>
                Min Trading Days
                <input value={editForm.minTradingDays} onChange={(event) => setEditForm((prev) => ({ ...prev, minTradingDays: event.target.value }))} />
              </label>
            </div>

            {authError && <p className="finance-auth-error">{authError}</p>}

            <div className="finance-settings-modal-actions">
              <button type="button" onClick={closeEditModal}>Cancel</button>
              <button type="button" className="primary" onClick={saveSettingUpdate}>Save Update</button>
            </div>
          </div>
        </div>
      )}

      {editingHeroStats && (
        <div className="finance-settings-modal-backdrop" onClick={closeHeroModal}>
          <div className="finance-settings-modal" onClick={(event) => event.stopPropagation()}>
            <h3>Edit Hero Payout Stats</h3>

            <div className="finance-settings-modal-grid">
              <label>
                Over Paid Out
                <input
                  value={heroForm.total_paid_out}
                  onChange={(event) => setHeroForm((prev) => ({ ...prev, total_paid_out: event.target.value }))}
                  placeholder="1000000000"
                />
              </label>

              <label>
                Paid this month
                <input
                  value={heroForm.paid_this_month}
                  onChange={(event) => setHeroForm((prev) => ({ ...prev, paid_this_month: event.target.value }))}
                  placeholder="97999480"
                />
              </label>

              <label>
                Trusted traders
                <input
                  value={heroForm.trusted_traders}
                  onChange={(event) => setHeroForm((prev) => ({ ...prev, trusted_traders: event.target.value }))}
                  placeholder="50000"
                />
              </label>

              <label>
                Paid today
                <input
                  value={heroForm.paid_today}
                  onChange={(event) => setHeroForm((prev) => ({ ...prev, paid_today: event.target.value }))}
                  placeholder="11551014"
                />
              </label>
            </div>

            {authError && <p className="finance-auth-error">{authError}</p>}

            <div className="finance-settings-modal-actions">
              <button type="button" onClick={closeHeroModal}>Cancel</button>
              <button type="button" className="primary" onClick={saveHeroStatsUpdate}>Save Update</button>
            </div>
          </div>
        </div>
      )}

      {otpModalOpen && (
        <div className="finance-settings-modal-backdrop" onClick={closeOtpModal}>
          <div className="finance-settings-modal" onClick={(event) => event.stopPropagation()}>
            <h3>Security Verification</h3>
            <p className="finance-settings-note">
              Enter OTP sent to your admin email before editing, enabling, or disabling challenge settings.
            </p>

            <label>
              OTP Code
              <input
                value={otpCode}
                onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit OTP"
              />
            </label>

            <div className="finance-settings-modal-actions" style={{ justifyContent: 'flex-start' }}>
              <button type="button" onClick={handleSendOtp} disabled={otpSending || otpSubmitting}>
                {otpSending ? 'Sending...' : 'Send / Resend OTP'}
              </button>
            </div>

            {otpError && <p className="finance-auth-error">{otpError}</p>}
            {otpFeedback && <p style={{ margin: 0, color: '#86efac', fontSize: 12 }}>{otpFeedback}</p>}

            <div className="finance-settings-modal-actions">
              <button type="button" onClick={closeOtpModal} disabled={otpSubmitting}>Cancel</button>
              <button type="button" className="primary" onClick={submitOtpAndSave} disabled={otpSubmitting}>
                {otpSubmitting ? 'Verifying...' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default FinanceAnalysisPage
