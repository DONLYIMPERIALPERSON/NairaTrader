import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import MobileDashboardHeader from '../components/MobileDashboardHeader'
import MobileDashboardBalanceOverview from '../components/MobileDashboardBalanceOverview'
import MobileTradingObjective from '../components/MobileTradingObjective'
import MobileStatsPerformance from '../components/MobileStatsPerformance'
import MobileDailySummary from '../components/MobileDailySummary'
import MobileCredentials from '../components/MobileCredentials'
import { fetchUserChallengeAccountDetail, type UserChallengeAccountDetailResponse } from '../lib/auth'
import '../styles/MobileAccountDetailsPage.css'

const MobileAccountDetailsPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState('Overview')
  const [accountData, setAccountData] = useState<UserChallengeAccountDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const challengeId = searchParams.get('challenge_id')

  useEffect(() => {
    if (!challengeId) {
      setError('Challenge ID is required')
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')
    fetchUserChallengeAccountDetail(challengeId)
      .then((data) => {
        setAccountData(data)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load account details')
      })
      .finally(() => setLoading(false))
  }, [challengeId])

  if (loading) {
    return (
      <div className="mobile-account-details-page">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white' }}>
          Loading account details...
        </div>
      </div>
    )
  }

  if (error || !accountData) {
    return (
      <div className="mobile-account-details-page">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#ff8b8b' }}>
          {error || 'Account not found'}
        </div>
      </div>
    )
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'Overview':
        return (
          <>
            <div className="mobile-account-details-card">
              <MobileDashboardBalanceOverview
                balance={accountData.metrics.balance}
                equity={accountData.metrics.equity}
                unrealizedPnl={accountData.metrics.unrealized_pnl}
                maxPermittedLossLeft={accountData.metrics.max_permitted_loss_left}
              />
            </div>
            <div className="mobile-account-details-card mobile-account-details-card-spaced">
              <MobileTradingObjective objectives={accountData.objectives} />
            </div>
          </>
        )
      case 'Statistics':
        return (
          <>
            <div className="mobile-account-details-card">
              <MobileStatsPerformance
                winRate={accountData.metrics.win_rate}
                closedTradesCount={accountData.metrics.closed_trades_count}
                winningTradesCount={accountData.metrics.winning_trades_count}
              />
            </div>
            <div className="mobile-account-details-card mobile-account-details-card-spaced">
              <MobileDailySummary
                todayClosedPnl={accountData.metrics.today_closed_pnl}
                todayTradesCount={accountData.metrics.today_trades_count}
                todayLotsTotal={accountData.metrics.today_lots_total}
              />
            </div>
          </>
        )
      case 'Account':
        return (
          <>
            {accountData.credentials && (
              <div className="mobile-account-details-card">
                <MobileCredentials
                  server={accountData.credentials.server}
                  accountNumber={accountData.credentials.account_number}
                  password={accountData.credentials.password}
                />
              </div>
            )}
          </>
        )
      default:
        return null
    }
  }

  return (
    <div className="mobile-account-details-page">
      <div className="mobile-account-details-fixed-header">
        <div className="mobile-account-details-header-shell">
          <MobileDashboardHeader activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </div>

      <div className="mobile-account-details-content">
        {renderContent()}
      </div>
    </div>
  )
}

export default MobileAccountDetailsPage
