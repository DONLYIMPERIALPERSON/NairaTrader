import { useEffect, useMemo, useState } from 'react'
import type { AdminUser } from './UsersPage'
import { fetchFundedChallengeAccounts, type ChallengeAccountListItem } from '../lib/adminAuth'

interface FundedAccountsPageProps {
  onOpenProfile: (user: AdminUser) => void
}

const FundedAccountsPage = ({ onOpenProfile }: FundedAccountsPageProps) => {
  const [leaderboardPage, setLeaderboardPage] = useState(1)
  const [fundedListPage, setFundedListPage] = useState(1)
  const [fundedAccounts, setFundedAccounts] = useState<ChallengeAccountListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const leaderboardPageSize = 3
  const fundedListPageSize = 10

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await fetchFundedChallengeAccounts()
        setFundedAccounts(response.accounts)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load funded accounts')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  const topTraders = [
    { rank: 1, trader: 'Chinedu A.', accountSize: '₦1.5m', profit: '+₦2,480,000', winRate: '74%' },
    { rank: 2, trader: 'Fatima S.', accountSize: '₦800k', profit: '+₦2,120,000', winRate: '71%' },
    { rank: 3, trader: 'Tunde O.', accountSize: '₦1.5m', profit: '+₦1,920,000', winRate: '69%' },
    { rank: 4, trader: 'Grace O.', accountSize: '₦600k', profit: '+₦1,540,000', winRate: '67%' },
    { rank: 5, trader: 'Favour M.', accountSize: '₦400k', profit: '+₦1,120,000', winRate: '66%' },
    { rank: 6, trader: 'Rasheed T.', accountSize: '₦800k', profit: '+₦990,000', winRate: '64%' },
    { rank: 7, trader: 'Amina Y.', accountSize: '₦600k', profit: '+₦860,000', winRate: '63%' },
    { rank: 8, trader: 'Samuel P.', accountSize: '₦400k', profit: '+₦790,000', winRate: '61%' },
    { rank: 9, trader: 'Kelvin D.', accountSize: '₦800k', profit: '+₦710,000', winRate: '60%' },
    { rank: 10, trader: 'Ngozi R.', accountSize: '₦600k', profit: '+₦680,000', winRate: '59%' },
  ]

  const openProfileFromName = (name: string, revenue: string) => {
    onOpenProfile({
      name,
      email: `${name.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z.]/g, '')}@mail.com`,
      accounts: '1 / 1',
      revenue,
      orders: '5',
      payouts: '₦280,000',
    })
  }

  const totalLeaderboardPages = Math.ceil(topTraders.length / leaderboardPageSize)
  const paginatedLeaderboard = useMemo(() => {
    const start = (leaderboardPage - 1) * leaderboardPageSize
    return topTraders.slice(start, start + leaderboardPageSize)
  }, [topTraders, leaderboardPage])

  const totalFundedPages = Math.max(1, Math.ceil(fundedAccounts.length / fundedListPageSize))
  const paginatedFundedAccounts = useMemo(() => {
    const start = (fundedListPage - 1) * fundedListPageSize
    return fundedAccounts.slice(start, start + fundedListPageSize)
  }, [fundedAccounts, fundedListPage])

  return (
    <section className="admin-page-stack">
      <div className="admin-dashboard-card">
        <h2>Funded Accounts</h2>
        <p>View funded traders, monitor performance, and quickly open trader profiles.</p>
      </div>

      <div className="admin-kpi-grid">
        <article className="admin-kpi-card">
          <h3>Total Funded Accounts</h3>
          <strong>{fundedAccounts.length}</strong>
        </article>
      </div>

      <div className="admin-table-card">
        <h3 style={{ color: '#fff', margin: 0, padding: '14px 16px 8px' }}>Top 10 Profitable Traders</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Trader</th>
              <th>Account Size</th>
              <th>Profit</th>
              <th>Win Rate</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLeaderboard.map((row) => (
              <tr key={row.rank}>
                <td>#{row.rank}</td>
                <td>{row.trader}</td>
                <td>{row.accountSize}</td>
                <td>{row.profit}</td>
                <td>{row.winRate}</td>
                <td>
                  <button type="button" onClick={() => openProfileFromName(row.trader, row.profit)}>
                    View Profile
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '12px',
            padding: '0 16px 16px',
            gap: 12,
          }}
        >
          <small style={{ color: '#d1d5db', fontWeight: 600 }}>
            Showing {(leaderboardPage - 1) * leaderboardPageSize + 1} - {Math.min(leaderboardPage * leaderboardPageSize, topTraders.length)} of {topTraders.length}
          </small>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setLeaderboardPage((prev) => Math.max(prev - 1, 1))}
              disabled={leaderboardPage === 1}
              style={{
                border: '1px solid #2a2f3a',
                background: '#151a22',
                color: '#e5e7eb',
                borderRadius: 10,
                padding: '6px 12px',
                fontWeight: 700,
                cursor: leaderboardPage === 1 ? 'not-allowed' : 'pointer',
                opacity: leaderboardPage === 1 ? 0.5 : 1,
              }}
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => setLeaderboardPage((prev) => Math.min(prev + 1, totalLeaderboardPages))}
              disabled={leaderboardPage === totalLeaderboardPages}
              style={{
                border: '1px solid #2a2f3a',
                background: '#151a22',
                color: '#e5e7eb',
                borderRadius: 10,
                padding: '6px 12px',
                fontWeight: 700,
                cursor: leaderboardPage === totalLeaderboardPages ? 'not-allowed' : 'pointer',
                opacity: leaderboardPage === totalLeaderboardPages ? 0.5 : 1,
              }}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <div className="admin-table-card">
        <h3 style={{ color: '#fff', margin: 0, padding: '14px 16px 8px' }}>Funded Accounts List</h3>
        {loading && <p style={{ color: '#9ca3af', margin: 0, padding: '2px 16px 10px' }}>Loading funded accounts...</p>}
        {!loading && error && <p style={{ color: '#fca5a5', margin: 0, padding: '2px 16px 10px' }}>{error}</p>}
        <table className="admin-table">
          <thead>
            <tr>
              <th>Account ID</th>
              <th>Trader</th>
              <th>Account Size</th>
              <th>MT5 Account</th>
              <th>Phase</th>
              <th>Current PNL</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedFundedAccounts.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: '#9ca3af' }}>
                  No funded accounts yet.
                </td>
              </tr>
            ) : (
              paginatedFundedAccounts.map((row) => (
                <tr key={row.challenge_id}>
                  <td>{row.challenge_id}</td>
                  <td>{row.trader_name ?? `User ${row.user_id}`}</td>
                  <td>{row.account_size}</td>
                  <td>{row.mt5_account ?? '-'}</td>
                  <td>{row.phase}</td>
                  <td>+₦0 (dummy)</td>
                  <td>
                    <button type="button" onClick={() => openProfileFromName(row.trader_name ?? `User ${row.user_id}`, '+₦0 (dummy)')}>
                      View Profile
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '12px',
            padding: '0 16px 16px',
            gap: 12,
          }}
        >
          <small style={{ color: '#d1d5db', fontWeight: 600 }}>
            Showing {fundedAccounts.length === 0 ? 0 : (fundedListPage - 1) * fundedListPageSize + 1} - {Math.min(fundedListPage * fundedListPageSize, fundedAccounts.length)} of {fundedAccounts.length}
          </small>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setFundedListPage((prev) => Math.max(prev - 1, 1))}
              disabled={fundedListPage === 1}
              style={{
                border: '1px solid #2a2f3a',
                background: '#151a22',
                color: '#e5e7eb',
                borderRadius: 10,
                padding: '6px 12px',
                fontWeight: 700,
                cursor: fundedListPage === 1 ? 'not-allowed' : 'pointer',
                opacity: fundedListPage === 1 ? 0.5 : 1,
              }}
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => setFundedListPage((prev) => Math.min(prev + 1, totalFundedPages))}
              disabled={fundedListPage === totalFundedPages}
              style={{
                border: '1px solid #2a2f3a',
                background: '#151a22',
                color: '#e5e7eb',
                borderRadius: 10,
                padding: '6px 12px',
                fontWeight: 700,
                cursor: fundedListPage === totalFundedPages ? 'not-allowed' : 'pointer',
                opacity: fundedListPage === totalFundedPages ? 0.5 : 1,
              }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default FundedAccountsPage
