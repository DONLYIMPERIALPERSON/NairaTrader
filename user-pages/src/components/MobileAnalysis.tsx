import React from 'react'
import '../styles/MobileAnalysis.css'

interface MobileAnalysisProps {
  totalPnl: number
  maxPermittedLossLeft: number
}

const MobileAnalysis: React.FC<MobileAnalysisProps> = ({
  totalPnl,
  maxPermittedLossLeft,
}) => {
  const formatCurrency = (amount: number) => {
    return `N${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return (
    <div className="section">
      <span className="text-small" style={{textTransform: 'uppercase', fontWeight: '600', color: 'rgba(255,255,255,0.5)'}}>Analysis</span>
      <div className="analysis-duo mt-2">
        <div className="analysis-item">
          <div className="analysis-label">
            <i className="fas fa-arrow-trend-up" style={{color: '#FFD700'}}></i> Total's P/L
          </div>
          <div className="analysis-number" style={{color: totalPnl >= 0 ? '#2ecc71' : '#e74c3c'}}>
            {totalPnl >= 0 ? '+' : ''}{formatCurrency(totalPnl)}
          </div>
          <div className="analysis-sub">lifetime profit</div>
        </div>
        <div className="analysis-item">
          <div className="analysis-label">
            <i className="fas fa-flag-checkered" style={{color: '#FFD700'}}></i> Max P/L
            <i
              className="fas fa-info-circle"
              style={{ marginLeft: '6px', fontSize: '12px', opacity: 0.8 }}
              title="Amount left before account breaches maximum drawdown."
            ></i>
          </div>
          <div className="analysis-number">{formatCurrency(maxPermittedLossLeft)}</div>
          <div className="analysis-sub">max permitted loss left</div>
        </div>
      </div>
    </div>
  )
}

export default MobileAnalysis
