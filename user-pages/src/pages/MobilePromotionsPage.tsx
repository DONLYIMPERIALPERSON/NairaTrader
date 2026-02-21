import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchPublicCoupons, type PublicCouponResponse } from '../lib/auth'
import '../styles/MobilePromotionsPage.css'

const MobilePromotionsPage: React.FC = () => {
  const navigate = useNavigate()
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

  const handleBack = () => {
    navigate(-1)
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    // You could add a toast notification here
  }

  if (loading) {
    return (
      <div className="mobile-promotions-page">
        <div className="mobile-promotions-fixed-header">
          <div className="mobile-promotions-header-shell">
            <div className="mobile-promotions-header-row">
              <div className="mobile-promotions-header-left">
                <div className="mobile-promotions-back-button" onClick={handleBack}>
                  <i className="fas fa-chevron-left"></i>
                </div>
              </div>
              <div className="mobile-promotions-header-center">
                <span className="mobile-promotions-header-title">Promotions</span>
              </div>
              <div className="mobile-promotions-header-right" aria-hidden="true" />
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', color: 'white' }}>
          Loading promotions...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mobile-promotions-page">
        <div className="mobile-promotions-fixed-header">
          <div className="mobile-promotions-header-shell">
            <div className="mobile-promotions-header-row">
              <div className="mobile-promotions-header-left">
                <div className="mobile-promotions-back-button" onClick={handleBack}>
                  <i className="fas fa-chevron-left"></i>
                </div>
              </div>
              <div className="mobile-promotions-header-center">
                <span className="mobile-promotions-header-title">Promotions</span>
              </div>
              <div className="mobile-promotions-header-right" aria-hidden="true" />
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', color: '#ff8b8b' }}>
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="mobile-promotions-page">
      <div className="mobile-promotions-fixed-header">
        <div className="mobile-promotions-header-shell">
          <div className="mobile-promotions-header-row">
            <div className="mobile-promotions-header-left">
              <div className="mobile-promotions-back-button" onClick={handleBack}>
                <i className="fas fa-chevron-left"></i>
              </div>
            </div>
            <div className="mobile-promotions-header-center">
              <span className="mobile-promotions-header-title">Promotions</span>
            </div>
            <div className="mobile-promotions-header-right" aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="mobile-promotions-content-container">
        <div className="mobile-promotions-content-padding">
          {/* Description */}
          <div className="mobile-promotions-description-wrap">
            <p className="mobile-promotions-description">
              Discount codes and special offers.
            </p>
          </div>

          {/* Content */}
          <div className="mobile-promotions-card">
            <div className="mobile-promotions-card-inner">
              <h3 style={{fontSize: '18px', fontWeight: '600', color: 'white', marginBottom: '16px'}}>Discount Codes</h3>

              {coupons.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#888', padding: '40px', fontSize: '14px' }}>
                  No active promotions available at the moment.
                </div>
              ) : (
                coupons.map((coupon) => (
                  <div key={coupon.id} style={{padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', marginBottom: '16px'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'}}>
                      <div style={{fontSize: '16px', fontWeight: '600', color: 'white'}}>Code: {coupon.code}</div>
                      <div style={{fontSize: '14px', fontWeight: '600', color: '#FFD700'}}>
                        {coupon.discount_type === 'percent'
                          ? `${coupon.discount_value}% OFF`
                          : `₦${coupon.discount_value.toLocaleString('en-NG')} OFF`
                        }
                      </div>
                    </div>

                    <div style={{fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px'}}>
                      Expiry: {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString() : 'No expiry'}
                    </div>

                    <div style={{fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '16px'}}>
                      Usage: {coupon.used_count}{coupon.max_uses ? ` / ${coupon.max_uses}` : ' / Unlimited'}
                    </div>

                    <button
                      onClick={() => handleCopyCode(coupon.code)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: 'rgba(255,215,0,0.8)',
                        color: 'black',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Copy code
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MobilePromotionsPage