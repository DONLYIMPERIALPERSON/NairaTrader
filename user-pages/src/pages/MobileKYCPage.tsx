import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/MobileKYCPage.css'
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

const MobileKYCPage: React.FC = () => {
  const navigate = useNavigate()
  const [banks, setBanks] = useState<BankListItem[]>([])
  const [bankProfile, setBankProfile] = useState<BankAccountProfile | null>(null)
  const [kycStatus, setKycStatus] = useState<string>('not_started')
  const [selectedBankCode, setSelectedBankCode] = useState('')
  const [bankAccountNumber, setBankAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
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
      }
    }

    void load()
  }, [])

  const handleBack = () => {
    navigate(-1)
  }

  const handleResolveAccountName = async () => {
    if (!selectedBankCode || bankAccountNumber.length < 10) {
      setFormError('Select bank and enter account number before verification.')
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
      const message = error instanceof Error ? error.message : 'Failed to resolve account name'
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

  const handleSubmitKyc = () => {
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
    <div className="mobile-kyc-page">
      <div className="mobile-kyc-fixed-header">
        <div className="mobile-kyc-header-shell">
          <div className="mobile-kyc-header-row">
            <div className="mobile-kyc-header-left">
              <div className="mobile-kyc-back-button" onClick={handleBack}>
                <i className="fas fa-chevron-left"></i>
              </div>
            </div>
            <div className="mobile-kyc-header-center">
              <span className="mobile-kyc-header-title">KYC Verification</span>
            </div>
            <div className="mobile-kyc-header-right" aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="mobile-kyc-content-container">
        <div className="mobile-kyc-content-padding">

          {!eligibleForKyc ? (
            <div className="mobile-kyc-card" style={{ marginBottom: '20px' }}>
              <div className="mobile-kyc-card-inner">
                <div className="mobile-kyc-title-row">
                  <i className="fas fa-lock" style={{ color: '#9ca3af' }}></i>
                  <h3>KYC Not Eligible Yet</h3>
                </div>
                <div className="mobile-kyc-form-error" style={{ color: 'rgba(255,255,255,0.78)' }}>
                  {eligibilityMessage || 'You need at least one funded account before KYC becomes available.'}
                </div>
              </div>
            </div>
          ) : kycStatus === 'approved' ? (
            <>
              {/* KYC Records */}
              <div className="mobile-kyc-card" style={{ marginBottom: '20px' }}>
                <div className="mobile-kyc-card-inner">
                  <div className="mobile-kyc-title-row">
                    <i className="fas fa-folder-open"></i>
                    <h3>Current Profile KYC</h3>
                  </div>

                  <div className="mobile-kyc-record-list">
                    <div className="mobile-kyc-record-item">
                      <div className="mobile-kyc-record-top">
                        <span>Profile KYC</span>
                        <span className={`mobile-kyc-status-badge ${kycStatus === 'approved' ? 'approved' : 'pending'}`}>
                          {kycStatus === 'approved' ? 'Approved' : 'Not Submitted'}
                        </span>
                      </div>
                      <div className="mobile-kyc-record-grid">
                        <div><label>Verified Date</label><p>{bankProfile?.verified_at ? new Date(bankProfile.verified_at).toLocaleDateString() : '-'}</p></div>
                        <div><label>Bank Account</label><p>{bankProfile?.bank_account_number || '-'}</p></div>
                        <div><label>Bank Name</label><p>{selectedBank?.bank_name || '-'}</p></div>
                        <div><label>Account Name</label><p>{bankProfile?.account_name || '-'}</p></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* New KYC Form */}
              <div className="mobile-kyc-card" style={{ marginBottom: '20px' }}>
                <div className="mobile-kyc-card-inner">
                  <div className="mobile-kyc-title-row">
                    <i className="fas fa-plus"></i>
                    <h3>Submit Profile KYC</h3>
                  </div>

                  <div className="mobile-kyc-form-grid">
                    <div>
                      <label>Select Bank</label>
                      <select
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

                    <div>
                      <label>Bank Account Number</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
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

                    <div>
                      <label>Full name</label>
                      <input
                        type="text"
                        value={accountName}
                        readOnly
                        placeholder="Full name"
                      />
                    </div>
                  </div>

                  {formError && <div className="mobile-kyc-form-error">{formError}</div>}
                  {formSuccess && <div className="mobile-kyc-form-error" style={{ color: '#64d282' }}>{formSuccess}</div>}

                  <button className="mobile-kyc-submit-btn" onClick={handleSubmitKyc} disabled={submitting || !eligibleForKyc}>
                    {submitting ? 'Submitting...' : 'Submit KYC'}
                  </button>
                </div>
              </div>

              {/* Warnings and Information */}
              <div className="mobile-kyc-card" style={{background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.2)', marginBottom: '20px'}}>
                <div className="mobile-kyc-card-inner">
                  <div style={{display: 'flex', alignItems: 'flex-start', gap: '12px'}}>
                    <i className="fas fa-exclamation-triangle" style={{color: '#FFD700', marginTop: '2px'}}></i>
                    <div>
                      <div style={{fontSize: '14px', fontWeight: '600', color: 'white', marginBottom: '8px'}}>
                        Warning
                      </div>
                      <div style={{fontSize: '12px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.5'}}>
                        <div>• Please ensure you enter the correct bank account details. Changing them later may be difficult and can take time.</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  )
}

export default MobileKYCPage