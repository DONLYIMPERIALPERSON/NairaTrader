import React from 'react'
import '../styles/MobileTradingObjective.css'

interface MobileTradingObjectiveProps {
  objectives: Record<string, {
    label: string
    status: 'passed' | 'pending' | 'breached' | string
    note?: string | null
  }>
}

const MobileTradingObjective: React.FC<MobileTradingObjectiveProps> = ({ objectives }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <i className="fas fa-check-circle checked"></i>
      case 'breached':
        return <i className="fas fa-times-circle" style={{color: '#e74c3c'}}></i>
      default:
        return <i className="far fa-circle unchecked"></i>
    }
  }

  const getIconForObjective = (key: string) => {
    switch (key) {
      case 'max_drawdown':
        return <i className="fas fa-circle-exclamation" style={{color: '#FFD700'}}></i>
      case 'profit_target':
        return <i className="fas fa-bullseye"></i>
      case 'scalping_rule':
        return <i className="fas fa-hourglass-half" style={{color: '#FFD700'}}></i>
      case 'min_trading_days':
        return <i className="fas fa-calendar-days"></i>
      default:
        return <i className="fas fa-circle"></i>
    }
  }

  const getTooltipForObjective = (key: string) => {
    switch (key) {
      case 'max_drawdown':
        return "Maximum loss allowed per trade"
      case 'profit_target':
        return "Target profit to achieve"
      case 'scalping_rule':
        return "Minimum time between trades"
      case 'min_trading_days':
        return "Minimum number of trading days required"
      default:
        return ""
    }
  }

  return (
    <div className="section">
      <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px'}}>
        <i className="fas fa-clipboard-list" style={{color: '#FFD700', fontSize: '16px'}}></i>
        <span className="text-small" style={{textTransform: 'uppercase', fontWeight: '600', color: 'rgba(255,255,255,0.6)'}}>Trading objective</span>
      </div>
      <div className="objectives-list">
        {Object.entries(objectives).map(([key, objective]) => (
          <div key={key} className="objective-row">
            <div className="objective-left">
              <span className="objective-icon">{getIconForObjective(key)}</span>
              <span className="objective-text">
                {objective.label}
                <i
                  className="fas fa-info-circle"
                  style={{fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginLeft: '4px'}}
                  title={getTooltipForObjective(key)}
                ></i>
              </span>
            </div>
            <div className="check-status">
              {getStatusIcon(objective.status)}
            </div>
          </div>
        ))}
      </div>
      <div style={{marginTop: '12px', height: '2px', width: '60px', background: 'rgba(255,215,0,0.4)', borderRadius: '10px'}}></div>
    </div>
  )
}

export default MobileTradingObjective
