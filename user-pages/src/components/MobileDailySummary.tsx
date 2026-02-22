import React from 'react'
import '../styles/MobileDailySummary.css'

interface MobileDailySummaryProps {
  todayClosedPnl: number
  todayTradesCount: number
  todayLotsTotal: number
}

const MobileDailySummary: React.FC<MobileDailySummaryProps> = ({
  todayClosedPnl,
  todayTradesCount,
  todayLotsTotal
}) => {
  const formatCurrency = (amount: number) => {
    const sign = amount >= 0 ? '+' : ''
    return `${sign}$${Math.abs(amount).toFixed(2)}`
  }

  const getResultBadge = (pnl: number) => {
    if (pnl > 0) {
      return (
        <span className="profit-badge">
          <i className="fas fa-plus-circle icon-result"></i> {formatCurrency(pnl)}
        </span>
      )
    } else if (pnl < 0) {
      return (
        <span className="loss-badge">
          <i className="fas fa-minus-circle icon-result"></i> {formatCurrency(pnl)}
        </span>
      )
    } else {
      return (
        <span className="neutral-badge">
          <i className="fas fa-minus"></i> $0.00
        </span>
      )
    }
  }

  const today = new Date()
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })

  return (
    <div className="section">
      <div className="daily-summary-title">
        <i className="fas fa-calendar-lines" style={{color: '#FFD700', fontSize: '18px'}}></i>
        <span className="text-small" style={{color: 'rgba(255,255,255,0.7)'}}>Daily Summary</span>
      </div>

      <div className="summary-header">
        <span>Date</span>
        <span>Trades</span>
        <span>Lots</span>
        <span>Result</span>
      </div>

      <div className="summary-list">
        <div className="summary-row">
          <span className="row-date">{formattedDate}</span>
          <span className="row-trades">{todayTradesCount}</span>
          <span className="row-lots">{todayLotsTotal.toFixed(2)}</span>
          <span className="row-result">{getResultBadge(todayClosedPnl)}</span>
        </div>
      </div>

      <div style={{marginTop: '18px', display: 'flex', justifyContent: 'flex-end'}}>
        <span style={{fontSize: '12px', color: 'rgba(255,215,0,0.7)'}}><i className="fas fa-regular fa-circle"></i> today's trading activity</span>
      </div>
    </div>
  )
}

export default MobileDailySummary