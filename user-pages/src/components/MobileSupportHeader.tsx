import React from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/MobileSupportHeader.css'

const MobileSupportHeader: React.FC = () => {
  const navigate = useNavigate()

  const handleBack = () => {
    navigate('/support') // Go back to previous chats page
  }

  return (
    <div className="mobile-support-header">
      <div className="mobile-support-header-row">
        <div className="mobile-support-header-left">
          <div className="mobile-support-back-button" onClick={handleBack} style={{cursor: 'pointer'}}>
            <i className="fas fa-chevron-left"></i>
          </div>
        </div>
        <div className="mobile-support-header-center">
          <span className="mobile-support-header-title">Support</span>
        </div>
        <div className="mobile-support-header-right" aria-hidden="true" />
      </div>
    </div>
  )
}

export default MobileSupportHeader