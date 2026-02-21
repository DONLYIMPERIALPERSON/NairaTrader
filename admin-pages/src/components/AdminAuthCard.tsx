import { useCallback, useState } from 'react'
import { Descope } from '@descope/react-sdk'

type FlowNextFn = (interactionId: string, form: Record<string, any>) => Promise<unknown>

type AdminAuthCardProps = {
  onSuccess: (sessionJwt?: string) => Promise<void> | void
  onError: (message: string) => void
  forceEnroll?: boolean
}

type DescopeSuccessPayload = {
  detail?: {
    sessionJwt?: string
  }
}

const adminFlowId = import.meta.env.VITE_ADMIN_DESCOPE_FLOW_ID ?? 'sign-up-or-in-cross-device-passkeys'
const authDebugEnabled = import.meta.env.DEV || import.meta.env.VITE_ADMIN_AUTH_DEBUG === 'true'
const promoteSkipInteractionId = 'Tta9SiPHJk'
const promoteAddInteractionId = 'UZgoCc-hSj'

const supportedCustomScreens = new Set([
  'Welcome Screen',
  'Passkey was not found for device',
  'Email Sign In Screen',
  'Verify OTP',
  'Promote Biometrics',
  'Access denied',
])
const descopeProjectId = import.meta.env.VITE_DESCOPE_PROJECT_ID ?? ''

function findActionId(context: unknown, candidates: string[], fallback: string): string {
  const wanted = candidates.map((c) => c.toLowerCase())
  const looksLikeActionId = (v: string): boolean => /[A-Za-z0-9_-]{6,}/.test(v)

  const walk = (value: unknown): string | null => {
    if (!value || typeof value !== 'object') return null

    if (Array.isArray(value)) {
      for (const item of value) {
        const found = walk(item)
        if (found) return found
      }
      return null
    }

    const obj = value as Record<string, unknown>

    for (const [key, raw] of Object.entries(obj)) {
      const keyLower = key.toLowerCase()

      if (
        typeof raw === 'string' &&
        raw &&
        (keyLower.includes('interactionid') || keyLower === 'id' || keyLower.includes('taskid')) &&
        looksLikeActionId(raw)
      ) {
        return raw
      }

      if (typeof raw === 'string') {
        const rawLower = raw.toLowerCase()
        if (wanted.some((w) => rawLower.includes(w))) {
          const idCandidate = obj.interactionId ?? obj.id ?? obj.taskId
          if (typeof idCandidate === 'string' && looksLikeActionId(idCandidate)) return idCandidate
        }
      }
    }

    for (const nested of Object.values(obj)) {
      const found = walk(nested)
      if (found) return found
    }

    return null
  }

  const found = walk(context)
  if (found) return found
  return fallback
}

function debugLog(message: string, payload?: unknown): void {
  if (!authDebugEnabled) return
  if (payload === undefined) {
    console.debug(`[AdminAuthDebug] ${message}`)
    return
  }
  console.debug(`[AdminAuthDebug] ${message}`, payload)
}

function collectActionIds(context: unknown): string[] {
  const ids: string[] = []
  const seen = new Set<string>()
  const looksLikeActionId = (v: string): boolean => /[A-Za-z0-9_-]{6,}/.test(v) && !v.startsWith('SC')

  const walk = (value: unknown) => {
    if (!value || typeof value !== 'object') return
    if (Array.isArray(value)) {
      value.forEach(walk)
      return
    }

    const obj = value as Record<string, unknown>
    for (const [key, raw] of Object.entries(obj)) {
      const keyLower = key.toLowerCase()
      if ((keyLower.includes('interactionid') || keyLower.includes('taskid') || keyLower === 'id') && typeof raw === 'string' && looksLikeActionId(raw) && !seen.has(raw)) {
        seen.add(raw)
        ids.push(raw)
      }
      walk(raw)
    }
  }

  walk(context)
  return ids
}

const AdminAuthCard = ({ onSuccess, onError, forceEnroll: _forceEnroll = false }: AdminAuthCardProps) => {
  const [interactionLoading, setInteractionLoading] = useState(false)
  const [screenName, setScreenName] = useState('')
  const [screenContext, setScreenContext] = useState<Record<string, unknown>>({})
  const [nextAction, setNextAction] = useState<FlowNextFn | null>(null)
  const [email, setEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [localError, setLocalError] = useState('')

  const submitInteractionWithCandidates = useCallback(async (candidateIds: string[], form: Record<string, unknown> = {}) => {
    if (!nextAction) {
      onError('Authentication action is not ready. Please try again.')
      return
    }

    const ids = Array.from(new Set(candidateIds.filter(Boolean)))
    if (ids.length === 0) {
      setLocalError('No valid action was found for this step. Please refresh and retry.')
      return
    }

    setLocalError('')
    setInteractionLoading(true)
    let lastError = ''
    debugLog('Submitting interaction candidates', {
      screenName,
      candidates: ids,
      formKeys: Object.keys(form),
    })

    for (const id of ids) {
      try {
        await nextAction(id, form)
        debugLog('Candidate interaction succeeded', { screenName, interactionId: id })
        setInteractionLoading(false)
        return
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err)
        debugLog('Candidate interaction failed', { screenName, interactionId: id, message: lastError })
      }
    }

    setInteractionLoading(false)
    setLocalError(lastError || 'Could not complete this step.')
    onError(lastError || 'Could not complete this step.')
  }, [nextAction, onError, screenName])

  const onScreenUpdate = useCallback((incomingScreenName: string, context: Record<string, unknown>, next: FlowNextFn, _ref: HTMLElement) => {
    if (!supportedCustomScreens.has(incomingScreenName)) {
      return false
    }

    setScreenName(incomingScreenName)
    setScreenContext(context)
    setNextAction(() => next)
    setInteractionLoading(false)
    setLocalError('')

    return true
  }, [onError])

  const handleSuccess = useCallback(async (event: DescopeSuccessPayload) => {
    await onSuccess(event?.detail?.sessionJwt)
  }, [onSuccess])

  const handleError = useCallback((event: unknown) => {
    const detail = event && typeof event === 'object' && 'detail' in event
      ? (event as { detail: unknown }).detail
      : null

    const rawMessage = typeof detail === 'string'
      ? detail
      : detail
        ? JSON.stringify(detail)
        : 'Descope flow error'

    if (
      rawMessage.includes('E064002') ||
      rawMessage.toLowerCase().includes('failed to load user') ||
      rawMessage.toLowerCase().includes('refresh token')
    ) {
      setLocalError('Please sign in to continue.')
      onError('Please sign in to continue.')
      return
    }

    if (
      rawMessage.includes('E067011') ||
      rawMessage.toLowerCase().includes('missing domain in webauthn settings') ||
      rawMessage.toLowerCase().includes('no value for domain or origin')
    ) {
      const webauthnConfigMessage = 'Add passkey is not configured in Descope yet (missing WebAuthn domain/origin). Use "Not now, maybe later" for now.'
      setLocalError(webauthnConfigMessage)
      onError(webauthnConfigMessage)
      return
    }

    const message = rawMessage
    if (message.toLowerCase().includes('failed to fetch')) {
      setLocalError('Auth service unreachable. Check your network/ad blocker and retry.')
      onError('Auth service unreachable. Check your network/ad blocker and retry.')
      return
    }
    setLocalError(message)
    onError(message)
  }, [onError])

  const renderCustomScreen = () => {
    switch (screenName) {
      case 'Welcome Screen':
        return (
          <div className="admin-auth-stack">
            <p className="admin-auth-helper">Continue with your registered admin passkey.</p>
            <button
              className="admin-auth-primary-btn"
              type="button"
              disabled={interactionLoading}
              onClick={() => {
                const interactionId = findActionId(screenContext, ['passkey', 'continue', 'sign in'], 'mbeJnFYaVs')
                const discovered = collectActionIds(screenContext)
                void submitInteractionWithCandidates([interactionId, ...discovered])
              }}
            >
              {interactionLoading ? 'Opening passkey prompt...' : 'Sign in with Passkey'}
            </button>
            {!!localError && <p className="admin-auth-error">{localError}</p>}
          </div>
        )

      case 'Passkey was not found for device':
      case 'Email Sign In Screen':
        return (
          <div className="admin-auth-stack">
            <p className="admin-auth-helper">Continue with email OTP if passkey is unavailable.</p>
            <label className="admin-auth-label">Admin Email</label>
            <input
              className="admin-auth-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter admin email"
            />
            <button
              className="admin-auth-primary-btn"
              type="button"
              disabled={interactionLoading || !email.trim()}
              onClick={() => {
                const interactionId = findActionId(screenContext, ['email', 'continue', 'otp'], 'YmifOdV05E')
                const discovered = collectActionIds(screenContext)
                void submitInteractionWithCandidates([interactionId, ...discovered], { email: email.trim().toLowerCase() })
              }}
            >
              {interactionLoading ? 'Please wait...' : 'Continue'}
            </button>
            {!!localError && <p className="admin-auth-error">{localError}</p>}
          </div>
        )

      case 'Verify OTP':
        return (
          <div className="admin-auth-stack">
            <p className="admin-auth-helper">Enter your OTP code to continue.</p>
            <input
              className="admin-auth-input"
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              placeholder="Enter 6-digit OTP"
            />
            <button
              className="admin-auth-primary-btn"
              type="button"
              disabled={interactionLoading || !otpCode.trim()}
              onClick={() => {
                const interactionId = findActionId(screenContext, ['one time code', 'verify', 'otp', 'continue'], 'oneTimeCodeId')
                const discovered = collectActionIds(screenContext)
                void submitInteractionWithCandidates([interactionId, ...discovered], { code: otpCode.trim() })
              }}
            >
              {interactionLoading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button
              className="admin-auth-secondary-btn"
              type="button"
              disabled={interactionLoading}
              onClick={() => {
                const interactionId = findActionId(screenContext, ['resend', 'send again'], 'resend')
                const discovered = collectActionIds(screenContext)
                void submitInteractionWithCandidates([interactionId, ...discovered])
              }}
            >
              Send again
            </button>
            {!!localError && <p className="admin-auth-error">{localError}</p>}
          </div>
        )

      case 'Promote Biometrics':
        return (
          <div className="admin-auth-stack">
            <p className="admin-auth-helper">Add passkey for faster admin sign in next time.</p>
            <button
              className="admin-auth-primary-btn"
              type="button"
              disabled={interactionLoading}
              onClick={() => {
                void submitInteractionWithCandidates([promoteAddInteractionId])
              }}
            >
              {interactionLoading ? 'Please wait...' : 'Add passkeys'}
            </button>
            <button
              className="admin-auth-secondary-btn"
              type="button"
              disabled={interactionLoading}
              onClick={() => {
                void submitInteractionWithCandidates([promoteSkipInteractionId])
              }}
            >
              {interactionLoading ? 'Please wait...' : 'Not now, maybe later'}
            </button>
            {!!localError && <p className="admin-auth-error">{localError}</p>}
          </div>
        )

      case 'Access denied':
        return <p className="admin-auth-error">Access denied.</p>

      default:
        return <p>Loading secure admin authentication...</p>
    }
  }

  if (!descopeProjectId) {
    return <p>Missing VITE_DESCOPE_PROJECT_ID</p>
  }

  return (
    <Descope
      key={'admin-signin-flow'}
      flowId={adminFlowId}
      onSuccess={handleSuccess}
      onError={handleError}
      onScreenUpdate={onScreenUpdate}
    >
      {renderCustomScreen()}
    </Descope>
  )
}

export default AdminAuthCard
