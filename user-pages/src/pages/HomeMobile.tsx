import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MobileHomeHeader from '../components/MobileHomeHeader'
import MobileActiveAccountList from '../components/MobileActiveAccountList'
import MobileHiddenAccountList from '../components/MobileHiddenAccountList'
import BottomNav from '../components/BottomNav'
import '../styles/Home.css'
import { fetchUserChallengeAccounts, getPinStatus, type UserChallengeAccountListItem } from '../lib/auth'

const HomeMobile: React.FC = () => {
  const navigate = useNavigate()
  const [showPinPrompt, setShowPinPrompt] = useState(false)
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  const [accountLoadError, setAccountLoadError] = useState('')
  const [activeAccounts, setActiveAccounts] = useState<UserChallengeAccountListItem[]>([])
  const [historyAccounts, setHistoryAccounts] = useState<UserChallengeAccountListItem[]>([])
  const [hasAnyAccounts, setHasAnyAccounts] = useState(false)

  useEffect(() => {
    getPinStatus()
      .then((status) => {
        if (!status.has_pin) setShowPinPrompt(true)
      })
      .catch(() => {
        // fallback: still show prompt so user can quickly set PIN from home
        setShowPinPrompt(true)
      })
  }, [])

  useEffect(() => {
    setLoadingAccounts(true)
    setAccountLoadError('')
    fetchUserChallengeAccounts()
      .then((res) => {
        setActiveAccounts(res.active_accounts)
        setHistoryAccounts(res.history_accounts)
        setHasAnyAccounts(res.has_any_accounts)
      })
      .catch((err: unknown) => {
        setAccountLoadError(err instanceof Error ? err.message : 'Unable to load accounts')
      })
      .finally(() => setLoadingAccounts(false))
  }, [])

  return (
    <div style={{backgroundColor: '#000000', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '0 12px 16px', minHeight: '100vh', color: 'white', lineHeight: '1.4', WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale'}}>
      <MobileHomeHeader />
      <div style={{maxWidth: '400px', width: '100%', margin: '0 auto', paddingTop: '80px'}}>
        {loadingAccounts ? (
          <div style={{ color: 'rgba(255,255,255,0.75)', padding: '14px 0' }}>Loading accounts...</div>
        ) : accountLoadError ? (
          <div style={{ color: '#ff8b8b', padding: '14px 0' }}>{accountLoadError}</div>
        ) : !hasAnyAccounts ? (
          <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '16px', padding: '18px' }}>
            <h3 style={{ margin: 0, color: 'white', fontSize: '18px' }}>No account yet</h3>
            <p style={{ marginTop: '10px', color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
              You have not started any challenge account yet.
            </p>
            <button
              onClick={() => navigate('/trading-accounts')}
              style={{ marginTop: '12px', background: '#FFD700', color: '#111', border: 'none', borderRadius: '10px', padding: '10px 14px', fontWeight: 600 }}
            >
              Start New Challenge
            </button>
          </div>
        ) : (
          <>
            <div style={{textAlign: 'left', fontSize: '12px', color: 'white', marginBottom: '8px', fontWeight: '600'}}>Active</div>
            {activeAccounts.length === 0 ? (
              <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '16px', padding: '16px', marginBottom: '12px' }}>
                <div style={{ color: 'white', fontWeight: 600 }}>No active account</div>
                <p style={{ marginTop: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>
                  You currently have no active challenge. Your hidden/history accounts are shown below.
                </p>
                <button
                  onClick={() => navigate('/trading-accounts')}
                  style={{ marginTop: '10px', background: '#FFD700', color: '#111', border: 'none', borderRadius: '10px', padding: '10px 14px', fontWeight: 600 }}
                >
                  Start New Challenge
                </button>
              </div>
            ) : activeAccounts.map((account) => (
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
            <MobileHiddenAccountList accounts={historyAccounts} />
          </>
        )}
      </div>
      <BottomNav />

      {showPinPrompt && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 3000,
          padding: '16px',
        }}>
          <div style={{ background: '#111', width: '100%', maxWidth: '360px', borderRadius: '12px', padding: '18px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ margin: 0, color: '#fff' }}>Set PIN Required</h3>
            <p style={{ color: 'rgba(255,255,255,0.75)', marginTop: '10px' }}>
              Set your transaction PIN to continue securely.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button onClick={() => setShowPinPrompt(false)} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', cursor: 'pointer' }}>Later</button>
              <button
                onClick={() => {
                  setShowPinPrompt(false)
                  navigate('/settings')
                }}
                style={{ padding: '10px 14px', borderRadius: '8px', border: 'none', background: '#FFD700', color: '#000', cursor: 'pointer', fontWeight: 600 }}
              >
                Set PIN Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HomeMobile
