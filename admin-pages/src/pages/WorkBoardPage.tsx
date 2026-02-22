import { useState, useEffect } from 'react'
import { fetchAdminWorkboardStats, fetchAdminActivities, type AdminWorkboardStats, type AdminActivity } from '../lib/adminAuth'
import './WorkBoardPage.css'


const WorkBoardPage = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'activities'>('overview')
  const [workboardData, setWorkboardData] = useState<AdminWorkboardStats | null>(null)
  const [activities, setActivities] = useState<AdminActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activitiesPage, setActivitiesPage] = useState(1)
  const [hasMoreActivities, setHasMoreActivities] = useState(true)

  useEffect(() => {
    loadWorkboardData()
  }, [])

  useEffect(() => {
    if (activeTab === 'activities' && activities.length === 0) {
      loadActivities()
    }
  }, [activeTab])

  const loadWorkboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchAdminWorkboardStats()
      setWorkboardData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workboard data')
    } finally {
      setLoading(false)
    }
  }

  const loadActivities = async (page: number = 1) => {
    try {
      const data = await fetchAdminActivities(page, 20)
      if (page === 1) {
        setActivities(data.activities)
      } else {
        setActivities(prev => [...prev, ...data.activities])
      }
      setHasMoreActivities(data.activities.length === 20)
    } catch (err) {
      console.error('Failed to load activities:', err)
    }
  }

  const loadMoreActivities = () => {
    const nextPage = activitiesPage + 1
    setActivitiesPage(nextPage)
    loadActivities(nextPage)
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'approve_payout':
        return '✅'
      case 'reject_payout':
        return '❌'
      case 'approve_milestone':
        return '🏆'
      case 'reject_milestone':
        return '🚫'
      case 'suspend_user':
        return '🚫'
      case 'ban_user':
        return '🔨'
      case 'update_user_status':
        return '👤'
      case 'send_email':
        return '📧'
      case 'add_note':
        return '📝'
      default:
        return '⚡'
    }
  }

  const formatActionText = (action: string) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  if (loading) {
    return (
      <section className="admin-page-stack">
        <div className="admin-dashboard-card">
          <h2>Work Board</h2>
          <p>Loading admin activity data...</p>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="admin-page-stack">
        <div className="admin-dashboard-card">
          <h2>Work Board</h2>
          <p className="error">Error: {error}</p>
          <button onClick={loadWorkboardData}>Retry</button>
        </div>
      </section>
    )
  }

  return (
    <section className="admin-page-stack">
      <div className="admin-dashboard-card">
        <h2>Work Board</h2>
        <p>Track admin productivity, monitor activities, and identify top-performing team members.</p>
      </div>

      {/* Tab Navigation */}
      <div className="admin-dashboard-card">
        <div className="tab-navigation">
          <button
            className={activeTab === 'overview' ? 'active' : ''}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={activeTab === 'activities' ? 'active' : ''}
            onClick={() => setActiveTab('activities')}
          >
            Activity Log
          </button>
        </div>
      </div>

      {activeTab === 'overview' && workboardData && (
        <>
          <div className="admin-kpi-grid">
            <article className="admin-kpi-card">
              <h3>Top Performer</h3>
              <strong>{workboardData.top_performer?.admin_name || 'N/A'}</strong>
              <p>{workboardData.top_performer?.performance_score || 0} score</p>
            </article>
            <article className="admin-kpi-card">
              <h3>Total Actions</h3>
              <strong>{workboardData.summary.total_actions}</strong>
              <p>Last {workboardData.summary.period_days} days</p>
            </article>
            <article className="admin-kpi-card">
              <h3>Active Admins</h3>
              <strong>{workboardData.summary.total_admins}</strong>
            </article>
          </div>

          {/* Recent Activities */}
          <div className="admin-dashboard-card">
            <h3>Recent Activities (Last 24h)</h3>
            <div className="recent-activities">
              {workboardData.recent_activities.length > 0 ? (
                workboardData.recent_activities.map((activity, index) => (
                  <div key={index} className="activity-item">
                    <span className="activity-icon">{getActionIcon(activity.action)}</span>
                    <div className="activity-content">
                      <strong>{activity.admin_name}</strong> {formatActionText(activity.action)}
                      <div className="activity-description">{activity.description}</div>
                      <small className="activity-time">{activity.time_ago}</small>
                    </div>
                  </div>
                ))
              ) : (
                <p>No recent activities</p>
              )}
            </div>
          </div>

          {/* Admin Rankings */}
          <div className="admin-table-card">
            <h3 style={{ color: '#fff' }}>Admin Performance Rankings</h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Admin</th>
                  <th>Role</th>
                  <th>Total Actions</th>
                  <th>Performance Score</th>
                  <th>Avg. Response</th>
                </tr>
              </thead>
              <tbody>
                {workboardData.admin_rankings.map((admin) => (
                  <tr key={admin.admin_id}>
                    <td>
                      <span className={`rank-badge ${admin.rank === 1 ? 'gold' : admin.rank === 2 ? 'silver' : admin.rank === 3 ? 'bronze' : ''}`}>
                        #{admin.rank}
                      </span>
                    </td>
                    <td>{admin.admin_name}</td>
                    <td>{admin.role}</td>
                    <td>{admin.total_actions}</td>
                    <td>
                      <strong>{admin.performance_score}</strong>
                    </td>
                    <td>{admin.avg_response_time}</td>
                  </tr>
                ))}
                {workboardData.admin_rankings.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: '#9ca3af' }}>
                      No admin activity data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'activities' && (
        <div className="admin-dashboard-card">
          <h3>Admin Activity Log</h3>
          <div className="activity-log">
            {activities.map((activity) => (
              <div key={activity.id} className="activity-log-item">
                <div className="activity-header">
                  <span className="activity-icon">{getActionIcon(activity.action)}</span>
                  <strong>{activity.admin_name}</strong>
                  <span className="activity-action">{formatActionText(activity.action)}</span>
                  <small className="activity-time">{activity.time_ago}</small>
                </div>
                <div className="activity-description">
                  {activity.description}
                </div>
                {activity.entity_type && (
                  <div className="activity-entity">
                    <small>
                      Entity: {activity.entity_type}
                      {activity.entity_id && ` #${activity.entity_id}`}
                    </small>
                  </div>
                )}
              </div>
            ))}
            {activities.length === 0 && (
              <p style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>
                No activities found
              </p>
            )}
            {hasMoreActivities && (
              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <button
                  onClick={loadMoreActivities}
                  className="load-more-btn"
                >
                  Load More Activities
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

export default WorkBoardPage
