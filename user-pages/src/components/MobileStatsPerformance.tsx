import React from 'react'
import '../styles/MobileStatsPerformance.css'

interface MobileStatsPerformanceProps {
  winRate: number
  closedTradesCount: number
  winningTradesCount: number
}

const MobileStatsPerformance: React.FC<MobileStatsPerformanceProps> = ({
  winRate,
  closedTradesCount,
  winningTradesCount
}) => {
  // Calculate win rate percentage
  const winRatePercentage = Math.round(winRate * 100)

  return (
    <div className="section mobile-stats-performance-section">
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px'}}>
        <span className="text-small"><i className="fas fa-chart-pie" style={{color: '#FFD700', marginRight: '6px'}}></i> Performance</span>
        <span style={{color: 'rgba(255,215,0,0.8)', fontSize: '13px', background: 'rgba(255,215,0,0.12)', padding: '4px 12px', borderRadius: '30px'}}>this month</span>
      </div>
      <div className="mobile-stats-grid">
        <div className="mobile-stat-card">
          <div className="mobile-stat-label">
            <i className="fas fa-trophy" style={{color: '#FFD700'}}></i> Win Rate
          </div>
          <div className="mobile-stat-number">{winRatePercentage}<span style={{fontSize: '24px', color: '#FFD700'}}>%</span></div>
          <div className="mobile-stat-tag">
            <i className="fas fa-check-circle" style={{color: '#2ecc71'}}></i> {winningTradesCount} winning trades
          </div>
        </div>
        <div className="mobile-stat-card">
          <div className="mobile-stat-label">
            <i className="fas fa-arrow-right-arrow-left" style={{color: '#FFD700'}}></i> No. of trades
          </div>
          <div className="mobile-stat-number">{closedTradesCount}</div>
          <div className="mobile-stat-tag">
            <i className="fas fa-clock"></i> total closed trades
          </div>
        </div>
      </div>
    </div>
  )
}

export default MobileStatsPerformance