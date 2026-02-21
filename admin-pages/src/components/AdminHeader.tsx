import './AdminHeader.css'

type AdminHeaderProps = {
  roleLabel?: string
  fullName?: string
}

const AdminHeader = ({ roleLabel = 'Admin', fullName }: AdminHeaderProps) => {
  return (
    <header className="admin-header">
      <div className="admin-header-left">
        <img src="/white-logo.svg" alt="NairaTrader" className="admin-header-logo" />
      </div>
      <div className="admin-header-right">
        {fullName ? <span className="admin-header-email">{fullName}</span> : null}
        <span className="admin-header-badge">{roleLabel}</span>
      </div>
    </header>
  )
}

export default AdminHeader
