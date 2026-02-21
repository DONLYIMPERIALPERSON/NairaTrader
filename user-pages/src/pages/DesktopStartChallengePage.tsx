import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import DesktopHeader from '../components/DesktopHeader'
import DesktopSidebar from '../components/DesktopSidebar'
import DesktopFooter from '../components/DesktopFooter'
import PaymentDetailsModal from '../components/PaymentDetailsModal'
import {
  initPalmPayBankTransfer,
  previewCheckoutCoupon,
  refreshPaymentOrderStatus,
  type CheckoutCouponPreviewResponse,
  type PaymentOrderResponse,
} from '../lib/auth'
import '../styles/DesktopChallengeCheckoutPage.css'

interface AccountData {
  id?: string
  size: string
  drawdown: string
  target: string
  phases: string
  days: string
  payout: string
  fee: string
  status: string
}

const DesktopStartChallengePage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const accountData = location.state as AccountData | undefined

  const [agreements, setAgreements] = useState({ terms: false, refund: false })
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('')
  const [promoCode, setPromoCode] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState('')
  const [couponPreview, setCouponPreview] = useState<CheckoutCouponPreviewResponse | null>(null)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState('')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [currentOrder, setCurrentOrder] = useState<PaymentOrderResponse | null>(null)
  const [modalStatus, setModalStatus] = useState<'waiting' | 'confirming' | 'success'>('waiting')

  const inferPlanId = (account: AccountData | undefined): string => {
    if (!account) return ''
    if (account.id) return account.id
    const normalized = account.size.toLowerCase().replace(/\s+/g, '')
    if (normalized.includes('200k')) return '200k'
    if (normalized.includes('400k')) return '400k'
    if (normalized.includes('600k')) return '600k'
    if (normalized.includes('800k')) return '800k'
    if (normalized.includes('1.5m')) return '1.5m'
    if (normalized.includes('3m')) return '3m'
    return ''
  }

  const handleAgreementChange = (type: 'terms' | 'refund') => {
    setAgreements(prev => ({ ...prev, [type]: !prev[type] }))
  }

  const handleContinue = () => {
    if (!selectedPaymentMethod || !agreements.terms || !agreements.refund || !accountData) return
    if (selectedPaymentMethod !== 'bank-transfer') return

    const planId = inferPlanId(accountData)
    if (!planId) {
      setPaymentStatus('Unable to determine account size for payment')
      return
    }

    setPaymentLoading(true)
    setPaymentStatus('Initializing bank transfer...')

    initPalmPayBankTransfer({
      plan_id: planId,
      coupon_code: couponPreview?.code ?? (promoCode.trim() || null),
    })
      .then((order) => {
        setCurrentOrder(order)
        setShowPaymentModal(true)
        setPaymentStatus('')

        if (order.checkout_url) {
          window.open(order.checkout_url, '_blank', 'noopener,noreferrer')
        }
      })
      .catch((err: unknown) => {
        setPaymentStatus(err instanceof Error ? err.message : 'Failed to initialize payment')
      })
      .finally(() => {
        setPaymentLoading(false)
      })
  }

  const applyCoupon = async () => {
    if (!promoCode.trim() || !accountData) return
    const planId = inferPlanId(accountData)
    if (!planId) {
      setCouponError('Unable to determine account size for coupon check')
      return
    }

    setCouponLoading(true)
    setCouponError('')
    try {
      const preview = await previewCheckoutCoupon({
        code: promoCode.trim().toUpperCase(),
        plan_id: planId,
      })
      setCouponPreview(preview)
    } catch (err: unknown) {
      setCouponPreview(null)
      setCouponError(err instanceof Error ? err.message : 'Failed to apply coupon')
    } finally {
      setCouponLoading(false)
    }
  }

  const handleProceedToPayment = async () => {
    if (!currentOrder) return

    // Start polling for payment confirmation
    for (let i = 0; i < 12; i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 5000))
      try {
        const refreshed = await refreshPaymentOrderStatus(currentOrder.provider_order_id)
        if (refreshed.status === 'paid' && refreshed.assignment_status === 'assigned' && refreshed.challenge_id) {
          setModalStatus('success')
          // Auto redirect after 3 seconds
          setTimeout(() => {
            navigate('/')
          }, 3000)
          return
        }
        if (refreshed.status === 'failed' || refreshed.status === 'expired') {
          setModalStatus('waiting')
          setPaymentStatus(`Payment ${refreshed.status}. Please try again.`)
          setShowPaymentModal(false)
          return
        }
      } catch (error) {
        console.error('Payment status check failed:', error)
      }
    }

    // If polling completes without success, reset to waiting state
    setModalStatus('waiting')
    setPaymentStatus('Payment confirmation timed out. Please check your payment status.')
    setShowPaymentModal(false)
  }

  const handleCloseModal = () => {
    setShowPaymentModal(false)
    setCurrentOrder(null)
  }

  return (
    <div className="desktop-challenge-checkout-page">
      <DesktopHeader />
      <DesktopSidebar />

      <div className="desktop-challenge-content">
        <div className="desktop-checkout-back">
          <button onClick={() => navigate('/trading-accounts')}>
            <i className="fas fa-arrow-left"></i>
            Back to Trading Accounts
          </button>
        </div>

        <div className="desktop-checkout-header">
          <h1>Start Challenge</h1>
          <p>Complete checkout to start your selected account challenge.</p>
        </div>

        {!accountData ? (
          <div className="desktop-checkout-empty">
            No account selected. Please go back and choose an account type.
          </div>
        ) : (
          <>
            <div className="desktop-checkout-hero-panel">
              <div className="desktop-checkout-hero-content">
                <h2>Start Challenge</h2>
                <p>Show us your trading skills. Pass the Evaluation Process and receive a funded Account.</p>
                <span>If you sabi Trade, We Sabi Pay</span>
              </div>
              <div className="desktop-checkout-hero-stats">
                <div className="desktop-summary-row"><span>Account Balance</span><strong>{accountData.size}</strong></div>
                <div className="desktop-summary-row"><span>Trading Account Currency</span><strong>Naira</strong></div>
                <div className="desktop-summary-row"><span>Platform</span><strong>MetaTrader 5</strong></div>
              </div>
            </div>

            <div className="desktop-checkout-grid">
              <div className="desktop-checkout-column">
                <div className="desktop-checkout-panel">
                  <h3>Promo Code</h3>
                  <div className="desktop-promo-row">
                    <input
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="Enter promo code"
                    />
                    <button type="button" onClick={() => void applyCoupon()} disabled={couponLoading}>
                      {couponLoading ? 'Applying...' : 'Apply'}
                    </button>
                  </div>
                  {couponError && <p className="desktop-coupon-error">{couponError}</p>}
                  {couponPreview && (
                    <p className="desktop-coupon-success">
                      Applied {couponPreview.code}: -{couponPreview.formatted_discount_amount}
                    </p>
                  )}
                </div>

                <div className="desktop-checkout-panel">
                  <h3>Agreements</h3>
                  <label className="desktop-check-row">
                    <input type="checkbox" checked={agreements.terms} onChange={() => handleAgreementChange('terms')} />
                    I agree to the Terms and Conditions
                  </label>
                  <label className="desktop-check-row">
                    <input type="checkbox" checked={agreements.refund} onChange={() => handleAgreementChange('refund')} />
                    I agree to the Refund Policy
                  </label>
                </div>
              </div>

              <div className="desktop-checkout-column">
                <div className="desktop-checkout-panel">
                  <h3>Summary</h3>
                  <div className="desktop-summary-row"><span>Account Balance</span><strong>{accountData.size}</strong></div>
                  <div className="desktop-summary-row"><span>Challenge Type</span><strong>{accountData.phases}-Step</strong></div>
                  <div className="desktop-summary-row"><span>Target</span><strong>{accountData.target}</strong></div>
                  <div className="desktop-summary-row"><span>Max Drawdown</span><strong>{accountData.drawdown}</strong></div>
                  {couponPreview && (
                    <>
                      <div className="desktop-summary-row"><span>Original Amount</span><strong>{couponPreview.formatted_original_amount}</strong></div>
                      <div className="desktop-summary-row"><span>Discount ({couponPreview.code})</span><strong>-{couponPreview.formatted_discount_amount}</strong></div>
                    </>
                  )}
                  <div className="desktop-summary-row desktop-summary-total"><span>Total</span><strong>{couponPreview?.formatted_final_amount ?? accountData.fee}</strong></div>

                  <h4 className="desktop-payment-title">Select Payment Method</h4>
                  <label className="desktop-radio-row">
                    <input
                      type="radio"
                      name="payment"
                      value="bank-transfer"
                      checked={selectedPaymentMethod === 'bank-transfer'}
                      onChange={() => setSelectedPaymentMethod('bank-transfer')}
                    />
                    <span className="desktop-method-pill">
                      <i className="fas fa-university" aria-hidden="true"></i>
                      <span>Bank Transfer</span>
                    </span>
                  </label>
                  <label className="desktop-radio-row">
                    <input
                      type="radio"
                      name="payment"
                      value="atm-cards"
                      checked={selectedPaymentMethod === 'atm-cards'}
                      onChange={() => setSelectedPaymentMethod('atm-cards')}
                    />
                    <span className="desktop-method-pill">
                      <i className="fas fa-credit-card" aria-hidden="true"></i>
                      <span>ATM Cards &amp; USSD</span>
                    </span>
                  </label>

                  <button
                    className="desktop-checkout-continue"
                    onClick={handleContinue}
                    disabled={!selectedPaymentMethod || !agreements.terms || !agreements.refund || paymentLoading}
                  >
                    {paymentLoading ? 'Processing...' : 'Continue to Payment'}
                  </button>
                  {paymentStatus && <p className="desktop-coupon-success">{paymentStatus}</p>}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <DesktopFooter />

      {showPaymentModal && currentOrder && (
        <PaymentDetailsModal
          isOpen={showPaymentModal}
          onClose={handleCloseModal}
          paymentDetails={{
            bankName: currentOrder.payer_bank_name || '',
            accountName: currentOrder.payer_account_name || '',
            accountNumber: currentOrder.payer_virtual_acc_no || '',
            amount: `₦${(currentOrder.net_amount_kobo / 100).toLocaleString()}`,
          }}
          onProceedToPayment={handleProceedToPayment}
          isProcessing={false}
          status={modalStatus}
          onStatusChange={setModalStatus}
        />
      )}
    </div>
  )
}

export default DesktopStartChallengePage
