import { useCallback, useState } from 'react'
import { auth, signInWithEmailAndPassword } from '../lib/firebase'

type FirebaseAdminAuthCardProps = {
  onSuccess: (idToken: string) => Promise<void> | void
  onError: (message: string) => void
}

function toSafeAuthErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    const message = err.message.toLowerCase()

    if (message.includes('failed to fetch') || message.includes('network')) {
      return 'Network error. Please check your connection and try again.'
    }

    if (
      message.includes('invalid') ||
      message.includes('wrong-password') ||
      message.includes('user-not-found')
    ) {
      return 'Invalid admin credentials. Please try again.'
    }

    if (message.includes('too-many-requests')) {
      return 'Too many attempts. Please wait a moment and try again.'
    }
  }

  return 'Authentication failed. Please try again shortly.'
}

const FirebaseAdminAuthCard = ({ onSuccess, onError }: FirebaseAdminAuthCardProps) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password')
      return
    }

    setError('')
    setLoading(true)

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password.trim())
      const idToken = await userCredential.user.getIdToken()
      await onSuccess(idToken)
    } catch (err) {
      console.error('Authentication failed', err)
      const errorMsg = toSafeAuthErrorMessage(err)
      setError(errorMsg)
      onError(errorMsg)
    } finally {
      setLoading(false)
    }
  }, [email, password, onSuccess])

  return (
    <div>
      <h2 className="admin-auth-title">Admin Login</h2>
      <p className="admin-auth-subtitle">Enter your admin credentials</p>

      <form onSubmit={handleSubmit} className="admin-auth-stack">
        <label className="admin-auth-label">Admin Email</label>
        <input
          className="admin-auth-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter admin email"
          disabled={loading}
          required
        />

        <label className="admin-auth-label">Password</label>
        <input
          className="admin-auth-input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your admin password"
          disabled={loading}
          required
        />

        <button
          className="admin-auth-primary-btn"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>

        {error && <p className="admin-auth-error">{error}</p>}
      </form>
    </div>
  )
}

export default FirebaseAdminAuthCard
