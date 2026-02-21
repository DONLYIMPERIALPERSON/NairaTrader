import React, { useState, useEffect } from 'react'
import DesktopHeader from '../components/DesktopHeader'
import DesktopSidebar from '../components/DesktopSidebar'
import DesktopFooter from '../components/DesktopFooter'
import { fetchPublicCoupons, type PublicCouponResponse } from '../lib/auth'
import '../styles/DesktopPromotionsPage.css'

const DesktopPromotionsPage: React.FC = () => {
  const [coupons, setCoupons] = useState<PublicCouponResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    fetchPublicCoupons()
      .then((data) => {
        setCoupons(data.coupons)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load coupons')
      })
      .finally(() => setLoading(false))
  }, [])

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    // You could add a toast notification here
  }

  if (loading) {
    return (
      <div className="promotions-page">
        <DesktopHeader />
        <DesktopSidebar />
        <div style={{
          marginLeft: '280px',
          padding: '24px',
          paddingTop: '80px',
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'white'
        }}>
          Loading promotions...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="promotions-page">
        <DesktopHeader />
        <DesktopSidebar />
        <div style={{
          marginLeft: '280px',
          padding: '24px',
          paddingTop: '80px',
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: '#ff8b8b'
        }}>
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="promotions-page">
      <DesktopHeader />
      <DesktopSidebar />
      <div style={{
        marginLeft: '280px', // Account for sidebar
        padding: '24px',
        paddingTop: '80px', // Add top padding to avoid header overlap
        minHeight: '100vh'
      }}>
        {/* Back Button */}
        <button
          onClick={() => window.history.back()}
          className="back-button"
        >
          <i className="fas fa-arrow-left"></i>
          Back to Accounts Overview
        </button>

        {/* Page Header */}
        <div className="page-header">
          <h1>Promotions</h1>
          <p>Discount codes and special offers</p>
        </div>

        {/* Promotions Content */}
        <div className="promotions-content">
          <div className="tab-content">
            <h3 className="tab-title">Discount Codes</h3>

            {coupons.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#888', padding: '40px' }}>
                No active promotions available at the moment.
              </div>
            ) : (
              coupons.map((coupon) => (
                <div key={coupon.id} className="discount-card">
                  <div className="discount-header">
                    <div className="discount-code">Code: {coupon.code}</div>
                    <div className="discount-amount">
                      {coupon.discount_type === 'percent'
                        ? `${coupon.discount_value}% OFF`
                        : `₦${coupon.discount_value.toLocaleString('en-NG')} OFF`
                      }
                    </div>
                  </div>

                  <div className="discount-details">
                    <div className="discount-expiry">
                      Expiry: {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString() : 'No expiry'}
                    </div>
                    <div className="discount-usage">
                      Usage: {coupon.used_count}{coupon.max_uses ? ` / ${coupon.max_uses}` : ' / Unlimited'}
                    </div>
                  </div>

                  <button
                    onClick={() => handleCopyCode(coupon.code)}
                    className="copy-button"
                  >
                    Copy code
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <DesktopFooter />
    </div>
  )
}

export default DesktopPromotionsPage
