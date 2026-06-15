import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import {
  signInWithPin, signUpAdmin, signUpViewer, updateViewerPin, signOut,
  getSessionProfile,
  isAdminRegistered, getCachedAdminName, getCachedViewerName,
  isBiometricAvailable, authenticateBiometric,
  getBiometricEnabled, setBiometricEnabled,
  fetchProfile,
  type UserProfile,
} from '../lib/auth'

type AuthContextType = {
  // Currently authenticated user profile (null when not signed in)
  profile: UserProfile | null
  isAdmin: boolean
  isAuthenticated: boolean
  // True during initial load OR when a session exists but biometric hasn't been passed yet
  isLoading: boolean
  // Whether the app is waiting for biometric (session valid, gate not passed)
  needsBiometric: boolean
  // Whether an admin account has ever been created
  adminRegistered: boolean
  // Cached admin name for LoginScreen display (available before login)
  adminName: string | null
  // Cached viewer name for SettingsScreen display
  viewerName: string | null
  biometricAvailable: boolean
  biometricEnabled: boolean
  setupAdmin: (name: string, pin: string) => Promise<boolean>
  setupViewer: (name: string, pin: string) => Promise<'ok' | 'exists' | 'error'>
  changeViewerPin: (currentPin: string, newPin: string) => Promise<boolean>
  loginWithPin: (pin: string) => Promise<boolean>
  loginWithBiometric: () => Promise<boolean>
  enableBiometric: () => Promise<boolean>
  disableBiometric: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile]                   = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading]               = useState(true)
  const [needsBiometric, setNeedsBiometric]     = useState(false)
  const [adminRegistered, setAdminRegistered]   = useState(false)
  const [adminName, setAdminName]               = useState<string | null>(null)
  const [viewerName, setViewerName]             = useState<string | null>(null)
  const [biometricAvailable, setBioAvailable]   = useState(false)
  const [biometricEnabled, setBioEnabled]       = useState(false)

  useEffect(() => {
    async function init() {
      const [adminReg, cachedAdmin, cachedViewer, bioAvail, bioEnabled] = await Promise.all([
        isAdminRegistered(),
        getCachedAdminName(),
        getCachedViewerName(),
        isBiometricAvailable(),
        getBiometricEnabled(),
      ])
      setAdminRegistered(adminReg)
      setAdminName(cachedAdmin)
      setViewerName(cachedViewer)
      setBioAvailable(bioAvail)
      setBioEnabled(bioEnabled)

      // Check existing Supabase session
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        if (bioEnabled && bioAvail) {
          // Valid session but biometric gate required
          setNeedsBiometric(true)
        } else {
          const p = await getSessionProfile()
          setProfile(p)
        }
      }
      setIsLoading(false)
    }
    init()

    // Handle token refresh / sign-out events from Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setProfile(null)
        setNeedsBiometric(false)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  // ── Admin setup ────────────────────────────────────────────
  const setupAdmin = async (name: string, pin: string): Promise<boolean> => {
    const p = await signUpAdmin(name, pin)
    if (p) {
      setProfile(p)
      setAdminRegistered(true)
      setAdminName(p.name)
    }
    return !!p
  }

  // ── Viewer setup ───────────────────────────────────────────
  const setupViewer = async (name: string, pin: string) => {
    const result = await signUpViewer(name, pin)
    if (result === 'ok') setViewerName(name)
    return result
  }

  const changeViewerPin = async (currentPin: string, newPin: string): Promise<boolean> => {
    return updateViewerPin(currentPin, newPin)
  }

  // ── Login with PIN ─────────────────────────────────────────
  const loginWithPin = async (pin: string): Promise<boolean> => {
    const p = await signInWithPin(pin)
    if (p) {
      setProfile(p)
      setNeedsBiometric(false)
      if (p.role === 'admin') setAdminName(p.name)
    }
    return !!p
  }

  // ── Login with biometric (restores existing session) ───────
  const loginWithBiometric = async (): Promise<boolean> => {
    const ok = await authenticateBiometric()
    if (!ok) return false
    const p = await getSessionProfile()
    if (p) {
      setProfile(p)
      setNeedsBiometric(false)
      return true
    }
    // Session expired — fall back to PIN
    setNeedsBiometric(false)
    return false
  }

  // ── Biometric management ───────────────────────────────────
  const enableBiometric = async (): Promise<boolean> => {
    const ok = await authenticateBiometric()
    if (ok) {
      await setBiometricEnabled(true)
      setBioEnabled(true)
    }
    return ok
  }

  const disableBiometric = async () => {
    await setBiometricEnabled(false)
    setBioEnabled(false)
  }

  // ── Logout ─────────────────────────────────────────────────
  const logout = async () => {
    await signOut()
    setProfile(null)
    setNeedsBiometric(false)
  }

  // Re-fetch viewer name when admin reads profiles
  useEffect(() => {
    if (!profile || profile.role !== 'admin') return
    // Fetch viewer profile so we can show their name in Settings
    supabase.from('profiles').select('name').neq('id', profile.id).maybeSingle()
      .then(({ data }) => { if (data?.name) setViewerName(data.name) })
  }, [profile])

  return (
    <AuthContext.Provider value={{
      profile,
      isAdmin: profile?.role === 'admin',
      isAuthenticated: !!profile,
      isLoading,
      needsBiometric,
      adminRegistered,
      adminName,
      viewerName,
      biometricAvailable,
      biometricEnabled,
      setupAdmin,
      setupViewer,
      changeViewerPin,
      loginWithPin,
      loginWithBiometric,
      enableBiometric,
      disableBiometric,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
