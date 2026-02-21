import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchCertificates, fetchProfile } from '../lib/auth'
import '../styles/MobileCertificatePage.css'

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

const MobileCertificatePage: React.FC = () => {
  const navigate = useNavigate()
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

  const handleBack = () => {
    navigate(-1)
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
      <div className="mobile-certificate-page">
        <div className="mobile-certificate-fixed-header">
          <div className="mobile-certificate-header-shell">
            <div className="mobile-certificate-header-row">
              <div className="mobile-certificate-header-left">
                <div className="mobile-certificate-back-button" onClick={handleBack}>
                  <i className="fas fa-chevron-left"></i>
                </div>
              </div>
              <div className="mobile-certificate-header-center">
                <span className="mobile-certificate-header-title">Certificates</span>
              </div>
              <div className="mobile-certificate-header-right" aria-hidden="true" />
            </div>
          </div>
        </div>
        <div className="mobile-certificate-content-container">
          <div className="mobile-certificate-content-padding" style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '200px'
          }}>
            <div>Loading certificates...</div>
          </div>
        </div>
      </div>
    )
  }

  // If user is not eligible (KYC not completed), show only the KYC warning
  if (!isEligible) {
    return (
      <div className="mobile-certificate-page">
        <div className="mobile-certificate-fixed-header">
          <div className="mobile-certificate-header-shell">
            <div className="mobile-certificate-header-row">
              <div className="mobile-certificate-header-left">
                <div className="mobile-certificate-back-button" onClick={handleBack}>
                  <i className="fas fa-chevron-left"></i>
                </div>
              </div>
              <div className="mobile-certificate-header-center">
                <span className="mobile-certificate-header-title">Certificates</span>
              </div>
              <div className="mobile-certificate-header-right" aria-hidden="true" />
            </div>
          </div>
        </div>

        <div className="mobile-certificate-content-container">
          <div className="mobile-certificate-content-padding" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            padding: '40px 20px'
          }}>
            {/* KYC Warning - Full Page */}
            <div className="mobile-certificate-card" style={{
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '8px',
              padding: '32px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px'
            }}>
              <i className="fas fa-exclamation-triangle" style={{color: '#856404', fontSize: '48px'}}></i>
              <div>
                <div style={{fontWeight: 'bold', color: '#856404', fontSize: '24px', marginBottom: '8px'}}>
                  KYC Required
                </div>
                <div style={{color: '#856404', fontSize: '16px', lineHeight: '1.5'}}>
                  Complete your KYC verification to access and generate certificates for your trading achievements.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mobile-certificate-page">
      <div className="mobile-certificate-fixed-header">
        <div className="mobile-certificate-header-shell">
          <div className="mobile-certificate-header-row">
            <div className="mobile-certificate-header-left">
              <div className="mobile-certificate-back-button" onClick={handleBack}>
                <i className="fas fa-chevron-left"></i>
              </div>
            </div>
            <div className="mobile-certificate-header-center">
              <span className="mobile-certificate-header-title">Certificates</span>
            </div>
            <div className="mobile-certificate-header-right" aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="mobile-certificate-content-container">
        <div className="mobile-certificate-content-padding">

          {/* Tabs */}
          <div className="mobile-certificate-card" style={{marginBottom: '20px'}}>
            <div className="mobile-certificate-card-inner">
              <div style={{display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '4px'}}>
                <button
                  onClick={() => setActiveTab('funded')}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    background: activeTab === 'funded' ? '#FFD700' : 'transparent',
                    color: activeTab === 'funded' ? '#000' : 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                >
                  Funded
                </button>
                <button
                  onClick={() => setActiveTab('payout')}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    background: activeTab === 'payout' ? '#FFD700' : 'transparent',
                    color: activeTab === 'payout' ? '#000' : 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                >
                  Payout
                </button>
              </div>
            </div>
          </div>

          {/* Certificates List */}
          <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
            {filteredCertificates.map((cert: Certificate) => (
              <div key={cert.id} className="mobile-certificate-card">
                <div className="mobile-certificate-card-inner">
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
                        maxHeight: '300px',
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
                  <div style={{display: 'flex', gap: '12px'}}>
                    <button
                      onClick={() => handleShare(cert)}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        background: 'rgba(29, 161, 242, 0.1)',
                        border: '1px solid rgba(29, 161, 242, 0.3)',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        color: '#1DA1F2',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      <i className="fas fa-share"></i>
                      Share
                    </button>
                    <button
                      onClick={() => handleDownload(cert)}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        background: 'rgba(255,215,0,0.8)',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        color: 'black',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      <i className="fas fa-download"></i>
                      Download
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredCertificates.length === 0 && (
            <div className="mobile-certificate-card" style={{textAlign: 'center', padding: '40px 20px'}}>
              <i className="fas fa-certificate" style={{
                fontSize: '48px',
                color: 'rgba(255,215,0,0.3)',
                marginBottom: '16px'
              }}></i>
              <div style={{fontSize: '18px', fontWeight: '600', color: 'white', marginBottom: '8px'}}>
                No Certificates Yet
              </div>
              <div style={{fontSize: '14px', color: 'rgba(255,255,255,0.6)'}}>
                {activeTab === 'payout'
                  ? 'Complete payouts to earn certificates'
                  : 'Complete challenges to get funded certificates'
                }
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default MobileCertificatePage