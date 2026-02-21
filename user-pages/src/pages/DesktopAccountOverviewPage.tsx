import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import DesktopHeader from '../components/DesktopHeader'
import DesktopSidebar from '../components/DesktopSidebar'
import DesktopFooter from '../components/DesktopFooter'
import { fetchUserChallengeAccountDetail, type UserChallengeAccountDetailResponse } from '../lib/auth'
import '../styles/DesktopAccountOverviewPage.css'

const DesktopAccountOverviewPage: React.FC = () => {
  const [searchParams] = useSearchParams()
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
      <div className="account-overview-page">
        <DesktopHeader />
        <DesktopSidebar />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white' }}>
          Loading account details...
        </div>
      </div>
    )
  }

  if (error || !accountData) {
    return (
      <div className="account-overview-page">
        <DesktopHeader />
        <DesktopSidebar />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#ff8b8b' }}>
          {error || 'Account not found'}
        </div>
      </div>
    )
  }
  return (
    <div className="account-overview-page">
      <DesktopHeader />
      <DesktopSidebar />
      <div className="account-overview-content">
        {/* Back Button */}
        <div className="back-button">
          <button onClick={() => window.history.back()}>
            <i className="fas fa-arrow-left"></i>
            Back to Accounts Overview
          </button>
        </div>

        {/* Page Header */}
        <div className="page-header">
          <div className="page-header-content">
            <h1>Account Overview</h1>
            <p>Detailed metrics and performance data for your trading account</p>
          </div>
          <button className="refresh-button">
            <i className="fas fa-sync-alt"></i>
            Refresh
          </button>
        </div>

        {/* Balance Overview Section */}
        <div className="balance-overview-section">
          <div className="balance-overview-header">
            <span className="balance-overview-title">Balance Overview</span>
            <span className="connection-status">Connected</span>
          </div>
          <div className="balance-grid">
            <div className="balance-card">
              <div className="balance-card-header">
                <i className="fas fa-wallet"></i>
                Balance
              </div>
              <div className="balance-value">N{accountData.metrics.balance.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
            <div className="balance-card">
              <div className="balance-card-header">
                <i className="fas fa-chart-line"></i>
                Equity
              </div>
              <div className="balance-value">N{accountData.metrics.equity.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
            <div className="balance-card">
              <div className="balance-card-header">
                <i className="fas fa-chart-simple"></i>
                Unrealized PnL
              </div>
              <div className={`balance-value ${accountData.metrics.unrealized_pnl >= 0 ? 'positive' : 'negative'}`}>
                {accountData.metrics.unrealized_pnl >= 0 ? '+' : ''}N{accountData.metrics.unrealized_pnl.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            {accountData.phase === 'Funded' && (
              <div className="balance-card">
                <div className="balance-card-header">
                  <i className="fas fa-trophy"></i>
                  Total Profit
                </div>
                <div className={`balance-value ${(accountData.funded_profit_raw || 0) >= 0 ? 'positive' : 'negative'}`}>
                  {(accountData.funded_profit_raw || 0) >= 0 ? '+' : ''}N{(accountData.funded_profit_raw || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            )}
            <div className="balance-card today-profit">
              <div className="balance-card-header">
                <i className="fas fa-sun"></i>
                Max Permitted Loss Left
                <i
                  className="fas fa-info-circle"
                  style={{ marginLeft: '6px', fontSize: '12px', opacity: 0.8 }}
                  title="Amount left before account breaches maximum drawdown."
                ></i>
              </div>
              <div className="balance-value">N{accountData.metrics.max_permitted_loss_left.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
          </div>
        </div>

        {/* Trading Objective Section */}
        <div className="trading-objective-section">
          <div className="trading-objective-header">
            <i className="fas fa-clipboard-list"></i>
            <span className="trading-objective-title">Trading Objective</span>
          </div>
          <div className="objectives-list">
            {Object.entries(accountData.objectives).map(([key, objective]) => (
              <div key={key} className="objective-item">
                <div className="objective-content">
                  <i className={`fas fa-${key === 'max_drawdown' ? 'circle-exclamation' : key === 'profit_target' ? 'bullseye' : key === 'scalping_rule' ? 'hourglass-half' : 'calendar-days'} objective-icon ${key === 'max_drawdown' ? 'max-loss' : key === 'profit_target' ? 'profit-target' : key === 'scalping_rule' ? 'time-rule' : 'trading-days'}`}></i>
                  <span className="objective-text">{objective.label}</span>
                  <i className="fas fa-info-circle objective-info" title={objective.note || ''}></i>
                </div>
                <i className={`fas fa-${objective.status === 'passed' ? 'check-circle' : objective.status === 'breached' ? 'times-circle' : 'far fa-circle'} objective-status ${objective.status === 'passed' ? 'completed' : objective.status === 'breached' ? 'breached' : 'pending'}`} style={objective.status === 'breached' ? {color: '#e74c3c'} : undefined}></i>
              </div>
            ))}
          </div>
          <div className="objective-progress-bar"></div>
        </div>
      </div>

      {/* Footer */}
      <DesktopFooter />
    </div>
  )
}

export default DesktopAccountOverviewPage