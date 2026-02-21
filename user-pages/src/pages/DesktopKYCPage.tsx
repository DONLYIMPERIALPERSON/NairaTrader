import React, { useEffect, useMemo, useState } from 'react'
import DesktopHeader from '../components/DesktopHeader'
import DesktopSidebar from '../components/DesktopSidebar'
import DesktopFooter from '../components/DesktopFooter'
import '../styles/DesktopKYCPage.css'
import {
  fetchBankAccountProfile,
  fetchBankList,
  fetchKycEligibility,
  fetchProfile,
  persistAuthUser,
  resolveKycAccountName,
  submitKyc,
  type BankAccountProfile,
  type BankListItem,
} from '../lib/auth'

const DesktopKYCPage: React.FC = () => {
  const [banks, setBanks] = useState<BankListItem[]>([])
  const [bankProfile, setBankProfile] = useState<BankAccountProfile | null>(null)
  const [kycStatus, setKycStatus] = useState<string>('not_started')
  const [selectedBankCode, setSelectedBankCode] = useState('')
  const [bankAccountNumber, setBankAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [loading, setLoading] = useState(true)
  const [eligibleForKyc, setEligibleForKyc] = useState(false)
  const [eligibilityMessage, setEligibilityMessage] = useState('Checking KYC eligibility...')
  const [resolving, setResolving] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const selectedBank = useMemo(
    () => banks.find((bank) => bank.bank_code === (selectedBankCode || bankProfile?.bank_code || '')) || null,
    [banks, selectedBankCode, bankProfile?.bank_code],
  )

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setFormError('')
      try {
        const eligibility = await fetchKycEligibility()
        setEligibleForKyc(eligibility.eligible)
        setEligibilityMessage(eligibility.message)

        const [profileRes, bankRes] = await Promise.all([
          fetchProfile(),
          fetchBankAccountProfile(),
        ])
        setKycStatus((profileRes.kyc_status || 'not_started').toLowerCase())
        setBankProfile(bankRes)

        // Always try to load banks, regardless of eligibility status
        // This ensures banks load even if eligibility check fails initially
        try {
          const banksRes = await fetchBankList()
          setBanks(banksRes.banks)
        } catch (bankError) {
          // If bank loading fails, set empty array but don't fail the whole page
          setBanks([])
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load KYC data'
        setFormError(message)
        setEligibleForKyc(false)
        setEligibilityMessage('Unable to confirm KYC eligibility right now. Please try again shortly.')
        // Still try to load banks even if other requests fail
        try {
          const banksRes = await fetchBankList()
          setBanks(banksRes.banks)
        } catch (bankError) {
          setBanks([])
        }
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  const handleResolveAccountName = async () => {
    if (!selectedBankCode || bankAccountNumber.length < 10) {
      setFormError('Select bank and enter valid account number before verification.')
      return
    }

    if (!eligibleForKyc) {
      setFormError(eligibilityMessage || 'You are not eligible for KYC yet.')
      return
    }

    setResolving(true)
    setFormError('')
    setFormSuccess('')
    try {
      const result = await resolveKycAccountName({
        bank_code: selectedBankCode,
                bank_account_number: bankAccountNumber,
      })
      setAccountName(result.account_name)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to verify account name'
      setFormError(message)
      setAccountName('')
    } finally {
      setResolving(false)
    }
  }

  // Auto-verify when account number reaches 10 digits
  useEffect(() => {
    if (selectedBankCode && bankAccountNumber.length === 10 && eligibleForKyc && !accountName) {
      handleResolveAccountName()
    }
  }, [bankAccountNumber, selectedBankCode, eligibleForKyc])

  const handleSubmitKYC = () => {
    if (!selectedBankCode || bankAccountNumber.length < 10 || !accountName) {
      setFormError('Complete bank selection, account number and account-name verification.')
      return
    }

    if (!eligibleForKyc) {
      setFormError(eligibilityMessage || 'You are not eligible for KYC yet.')
      return
    }

    setSubmitting(true)
    setFormError('')
    setFormSuccess('')

    submitKyc({
      bank_code: selectedBankCode,
      bank_account_number: bankAccountNumber,
    })
      .then(async (res) => {
        setKycStatus((res.kyc_status || 'approved').toLowerCase())
        setBankProfile(res.bank_account)
        setFormSuccess(res.message)
        const updated = await fetchProfile()
        persistAuthUser(updated)
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : 'KYC submission failed'
        setFormError(message)
      })
      .finally(() => setSubmitting(false))
  }

  return (
    <div className="kyc-page">
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
          <h1>KYC Verification</h1>
          <p>KYC is profile-based and submitted once per user profile.</p>
        </div>

        {/* KYC Content */}
        <div className="kyc-content">
          {!eligibleForKyc ? (
            <div className="kyc-form-section">
              <div className="section-header">
                <div className="status-icon" style={{ background: '#6b7280', color: '#fff' }}>
                  <i className="fas fa-lock"></i>
                </div>
                <div>
                  <h2 className="status-title">KYC Not Eligible Yet</h2>
                  <p className="status-subtitle" style={{ color: '#6b7280' }}>
                    {eligibilityMessage || 'You need at least one funded account before KYC becomes available.'}
                  </p>
                </div>
              </div>
            </div>
          ) : kycStatus === 'approved' ? (
            <>
              <div className="kyc-records-section">
                <div className="section-header">
                  <i className="fas fa-folder-open section-icon"></i>
                  <h3 className="section-title">Current Profile KYC</h3>
                </div>

                <div className="kyc-records-table-wrap">
                  <table className="kyc-records-table">
                    <thead>
                      <tr>
                        <th>KYC Status</th>
                        <th>Verified Date</th>
                        <th>Bank Account Number</th>
                        <th>Bank Name</th>
                        <th>Account Name</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <span className={`kyc-status-badge ${kycStatus === 'approved' ? 'approved' : 'pending'}`}>
                            {kycStatus === 'approved' ? 'Approved' : 'Not Submitted'}
                          </span>
                        </td>
                        <td>{bankProfile?.verified_at ? new Date(bankProfile.verified_at).toLocaleDateString() : '-'}</td>
                        <td className="account-number">{bankProfile?.bank_account_number || '-'}</td>
                        <td>{selectedBank?.bank_name || '-'}</td>
                        <td>{bankProfile?.account_name || '-'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="kyc-form-section">
                <div className="section-header">
                  <div className="status-icon">
                    <i className="fas fa-plus"></i>
                  </div>
                  <div>
                    <h2 className="status-title">Submit Profile KYC</h2>
                    <p className="status-subtitle">Select bank, input account number, verify account name, and submit once.</p>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-item">
                    <label className="form-label">Bank</label>
                    <select
                      className="form-input"
                      value={selectedBankCode}
                      onChange={(e) => {
                        setSelectedBankCode(e.target.value)
                        setAccountName('')
                        if (formError) setFormError('')
                      }}
                    >
                      <option value="">Select bank</option>
                      {banks.map((bank) => (
                        <option key={bank.bank_code} value={bank.bank_code}>{bank.bank_name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-item">
                    <label className="form-label">Bank Account Number</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        className="form-input account-number-input"
                        value={bankAccountNumber}
                        onChange={(e) => {
                          setBankAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))
                          if (formError) setFormError('')
                        }}
                        placeholder="Enter bank account number"
                        maxLength={10}
                        disabled={resolving}
                      />
                      {resolving && (
                        <div style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          color: '#6b7280',
                          fontSize: '14px'
                        }}>
                          <i className="fas fa-spinner fa-spin"></i>
                          <span>Verifying...</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-item">
                    <label className="form-label">Full name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={accountName}
                      readOnly
                      placeholder="Full name"
                    />
                  </div>
                </div>

                {formError && <div className="kyc-form-error">{formError}</div>}
                {formSuccess && <div className="kyc-form-error" style={{ color: '#1f8b3a' }}>{formSuccess}</div>}

                <button
                  onClick={handleSubmitKYC}
                  className="submit-button"
                  disabled={loading || submitting || !eligibleForKyc}
                >
                  {submitting ? 'Submitting...' : 'Submit KYC'}
                </button>
              </div>
              {/* Important Information */}
              <div className="info-card warning">
                <div className="info-header">
                  <i className="fas fa-exclamation-triangle info-icon"></i>
                  <h4 className="info-title">Warning</h4>
                </div>
                <div className="info-content">
                  <div>• Please ensure you enter the correct bank account details. Changing them later may be difficult and can take time.</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <DesktopFooter />
    </div>
  )
}

export default DesktopKYCPage
