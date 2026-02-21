import React from 'react'
import MobileActiveAccountList from './MobileActiveAccountList'
import '../styles/MobileHiddenAccountList.css'
import type { UserChallengeAccountListItem } from '../lib/auth'

type MobileHiddenAccountListProps = {
  accounts: UserChallengeAccountListItem[]
}

const MobileHiddenAccountList: React.FC<MobileHiddenAccountListProps> = ({ accounts }) => {
  return (
    <div className="hidden-accounts-section">
      <input type="checkbox" id="toggle-hidden-mobile" style={{display: 'none'}} />
      <label htmlFor="toggle-hidden-mobile" className="hidden-accounts-trigger">
        <div className="trigger-left">
          <i className="fas fa-eye-slash"></i>
          <span>Hidden accounts</span>
        </div>
        <div className="trigger-right">
          <span className="hidden-count">{accounts.length}</span>
          <i className="fas fa-chevron-down"></i>
        </div>
      </label>
      <div className="hidden-accounts-list">
        {accounts.length === 0 ? (
          <div className="hidden-account-item">
            <div className="hidden-account-info">
              <div className="hidden-account-title">
                <span className="hidden-account-number">No hidden accounts yet</span>
              </div>
            </div>
          </div>
        ) : accounts.map((account) => (
          <MobileActiveAccountList
            key={account.challenge_id}
            challengeId={account.challenge_id}
            phase={account.phase}
            accountNumber={account.mt5_account ?? 'Pending'}
            startDate={account.started_at ? new Date(account.started_at).toLocaleDateString() : '-'}
            amount={account.account_size}
            status={(account.display_status as 'Active' | 'Ready' | 'Passed' | 'Failed')}
          />
        ))}
      </div>
    </div>
  )
}

export default MobileHiddenAccountList
