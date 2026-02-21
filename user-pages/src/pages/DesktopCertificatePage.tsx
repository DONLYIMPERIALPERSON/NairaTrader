import React, { useState, useEffect } from 'react'
import DesktopHeader from '../components/DesktopHeader'
import DesktopSidebar from '../components/DesktopSidebar'
import DesktopFooter from '../components/DesktopFooter'
import { fetchCertificates, fetchProfile } from '../lib/auth'
import '../styles/DesktopCertificatePage.css'

interface Certificate {
  id: number
  certificate_type: string
  title: string
  description: string | null
  certificate_url: string
  generated_at: string
  related_entity_id: string | null
  certificate_metadata: string | null
}

const DesktopCertificatePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'payout' | 'funded'>('funded')
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [kycStatus, setKycStatus] = useState<string>('not_started')

  useEffect(() => {
    fetchCertificatesData()
    fetchKycStatus()
  }, [])

  const fetchCertificatesData = async () => {
    try {
      const data = await fetchCertificates()
      setCertificates(data.certificates)
    } catch (error) {
      console.error('Error fetching certificates:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchKycStatus = async () => {
    try {
      const profile = await fetchProfile()
      setKycStatus(profile.kyc_status || 'not_started')
    } catch (error) {
      console.error('Error fetching KYC status:', error)
    }
  }

  const handleShare = (certificate: Certificate) => {
    if (navigator.share) {
      navigator.share({
        title: certificate.title,
        text: certificate.description || 'Check out my trading achievement!',
        url: certificate.certificate_url
      })
    }
  }

  const handleDownload = (certificate: Certificate) => {
    // Create a temporary link to download the certificate
    const link = document.createElement('a')
    link.href = certificate.certificate_url
    link.download = `${certificate.title.replace(/\s+/g, '_')}.png`
    link.target = '_blank' // Open in new tab if download doesn't work
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredCertificates = certificates.filter(cert =>
    activeTab === 'payout' ? cert.certificate_type === 'payout' : cert.certificate_type === 'funding'
  )

  // Check if user is eligible (has completed KYC)
  const KYC_COMPLETED_STATUSES = new Set(['verified', 'approved', 'completed'])
  const isEligible = KYC_COMPLETED_STATUSES.has((kycStatus || '').toLowerCase())

  if (loading) {
    return (
      <div className="certificate-page">
        <DesktopHeader />
        <DesktopSidebar />
        <div style={{
          marginLeft: '280px',
          padding: '24px',
          paddingTop: '80px',
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div>Loading certificates...</div>
        </div>
      </div>
    )
  }

  // If user is not eligible (KYC not completed), show only the KYC warning
  if (!isEligible) {
    return (
      <div className="certificate-page">
        <DesktopHeader />
        <DesktopSidebar />
        <div style={{
          marginLeft: '280px', // Account for sidebar
          padding: '24px',
          paddingTop: '80px', // Add top padding to avoid header overlap
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* KYC Warning - Full Page */}
          <div className="kyc-warning" style={{
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '8px',
            padding: '32px',
            maxWidth: '500px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
          }}>
            <i className="fas fa-exclamation-triangle" style={{ color: '#856404', fontSize: '48px' }}></i>
            <div>
              <div style={{ fontWeight: 'bold', color: '#856404', fontSize: '24px', marginBottom: '8px' }}>
                KYC Required
              </div>
              <div style={{ color: '#856404', fontSize: '16px', lineHeight: '1.5' }}>
                Complete your KYC verification to access and generate certificates for your trading achievements.
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="certificate-page">
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
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'transparent',
            border: 'none',
            color: '#666',
            cursor: 'pointer',
            fontSize: '16px',
            padding: '8px 0',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#333'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#666'}
        >
          <i className="fas fa-arrow-left"></i>
          Back to Accounts Overview
        </button>

        {/* Page Header */}
        <div className="page-header">
          <h1>Trading Certificates</h1>
          <p>View and download your trading achievements and certificates</p>
        </div>

        {/* Tabs */}
        <div className="tabs-container">
          <div className="tabs">
            <button
              className={`tab-button ${activeTab === 'funded' ? 'active' : ''}`}
              onClick={() => setActiveTab('funded')}
            >
              Funded Certificates
            </button>
            <button
              className={`tab-button ${activeTab === 'payout' ? 'active' : ''}`}
              onClick={() => setActiveTab('payout')}
            >
              Payout Certificates
            </button>
          </div>
        </div>

        {/* Certificates Grid */}
        {filteredCertificates.length > 0 ? (
          <div className="certificates-grid">
            {filteredCertificates.map((cert: Certificate) => (
              <div key={cert.id} className="certificate-card">
                {/* Certificate Image */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.05) 100%)',
                  border: '2px solid rgba(255,215,0,0.3)',
                  borderRadius: '12px',
                  padding: '16px',
                  textAlign: 'center',
                  marginBottom: '16px',
                  overflow: 'hidden'
                }}>
                  <img
                    src={cert.certificate_url}
                    alt={cert.title}
                    style={{
                      width: '100%',
                      height: 'auto',
                      maxHeight: '250px',
                      objectFit: 'contain',
                      borderRadius: '8px',
                      marginBottom: '12px'
                    }}
                    onError={(e) => {
                      // Fallback to placeholder if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `
                          <div style="padding: 24px; text-align: center;">
                            <i class="fas fa-certificate" style="font-size: 48px; color: #FFD700; margin-bottom: 12px; opacity: 0.7;"></i>
                            <div style="font-size: 18px; font-weight: 600; color: white; margin-bottom: 4px;">${cert.title}</div>
                            <div style="font-size: 14px; color: rgba(255,255,255,0.6); margin-bottom: 8px;">${new Date(cert.generated_at).toLocaleDateString()}</div>
                            <div style="font-size: 16px; font-weight: 600; color: #FFD700;">${cert.certificate_type === 'funding' ? 'Funded Account' : 'Payout'}</div>
                          </div>
                        `;
                      }
                    }}
                  />
                </div>

                {/* Action Buttons */}
                <div className="certificate-actions">
                  <button
                    className="action-button share-button"
                    onClick={() => handleShare(cert)}
                  >
                    <i className="fas fa-share"></i>
                    Share
                  </button>
                  <button
                    className="action-button download-button"
                    onClick={() => handleDownload(cert)}
                  >
                    <i className="fas fa-download"></i>
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="empty-state">
            <i className="fas fa-certificate empty-icon"></i>
            <div className="empty-title">No Certificates Yet</div>
            <div className="empty-description">
              {activeTab === 'payout'
                ? 'Complete payouts to earn certificates'
                : 'Complete challenges to get funded certificates'
              }
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <DesktopFooter />
    </div>
  )
}

export default DesktopCertificatePage
