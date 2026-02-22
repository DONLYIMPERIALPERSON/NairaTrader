import {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from './firebase'
import type { User } from './firebase'
import { fetchSignInMethodsForEmail } from 'firebase/auth'

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL

function redirectToUserLogin(): void {
  if (typeof window === 'undefined') return
  if (window.location.pathname !== '/login') {
    window.location.replace('/login')
  }
}

if (!BACKEND_BASE_URL) {
  throw new Error('VITE_BACKEND_URL is required')
}

export type AuthMeResponse = {
  id: number
  firebase_uid: string
  email: string
  full_name: string | null
  nick_name?: string | null
  use_nickname_for_certificates?: boolean
  role: string
  status: string
  kyc_status?: string | null
}

// Check if email is registered (has firebase_uid in backend)
export async function checkEmailRegistration(email: string): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_BASE_URL}/auth/check-user-registration?email=${encodeURIComponent(email)}`)
    if (!response.ok) {
      console.error('Error checking user registration:', response.status)
      return false
    }
    const data = await response.json()
    return data.is_registered
  } catch (error) {
    console.error('Error checking user registration:', error)
    return false
  }
}

// Sign in existing user with email and password
export async function signInUser(email: string, password: string): Promise<User> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return userCredential.user
  } catch (error: any) {
    throw new Error(error.message || 'Sign in failed')
  }
}

// Send OTP for new user registration
export async function sendRegistrationOTP(email: string): Promise<void> {
  try {
    const response = await fetch(`${BACKEND_BASE_URL}/auth/send-registration-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Failed to send OTP')
    }
  } catch (error: any) {
    throw new Error(error.message || 'Failed to send OTP')
  }
}

// Create new user account with email and password
export async function createUserAccount(email: string, password: string): Promise<User> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    return userCredential.user
  } catch (error: any) {
    throw new Error(error.message || 'Account creation failed')
  }
}

// Sign out user
export async function signOutUser(): Promise<void> {
  try {
    await firebaseSignOut(auth)
    clearPersistedAuthUser()
  } catch (error: any) {
    console.error('Sign out error:', error)
  }
}

// Get current Firebase user
export function getCurrentFirebaseUser(): User | null {
  return auth.currentUser
}

// Listen to auth state changes
export function onAuthStateChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback)
}

// Get Firebase ID token
export async function getIdToken(): Promise<string> {
  const user = auth.currentUser
  if (!user) {
    throw new Error('No authenticated user')
  }
  return await user.getIdToken()
}

// Backend authentication functions
export async function fetchCurrentUser(): Promise<AuthMeResponse> {
  try {
    const token = await getIdToken()

    const response = await fetch(`${BACKEND_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      if (response.status === 401) {
        clearPersistedAuthUser()
        await signOutUser()
      }
      throw new Error(`Backend auth failed: ${response.status} ${errorText}`)
    }

    return response.json() as Promise<AuthMeResponse>
  } catch (error) {
    if (error instanceof Error && error.message.includes('No authenticated user')) {
      clearPersistedAuthUser()
      redirectToUserLogin()
    }
    throw error
  }
}

export async function loginWithBackend(): Promise<AuthMeResponse> {
  try {
    const token = await getIdToken()

    const response = await fetch(`${BACKEND_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      if (response.status === 401) {
        clearPersistedAuthUser()
        await signOutUser()
      }
      throw new Error(`Backend login failed: ${response.status} ${errorText}`)
    }

    return response.json() as Promise<AuthMeResponse>
  } catch (error) {
    if (error instanceof Error && error.message.includes('No authenticated user')) {
      clearPersistedAuthUser()
      redirectToUserLogin()
    }
    throw error
  }
}

export async function logoutFromBackend(): Promise<void> {
  try {
    const token = await getIdToken()

    await fetch(`${BACKEND_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  } catch (error) {
    console.error('Backend logout error:', error)
  }
}

// Auth persistence functions
export function persistAuthUser(user: AuthMeResponse): void {
  localStorage.setItem('nairatrader_auth_user', JSON.stringify(user))
}

export function getPersistedAuthUser(): AuthMeResponse | null {
  const raw = localStorage.getItem('nairatrader_auth_user')
  if (!raw) return null

  try {
    return JSON.parse(raw) as AuthMeResponse
  } catch {
    return null
  }
}

export function clearPersistedAuthUser(): void {
  localStorage.removeItem('nairatrader_auth_user')
}