import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import {
  signIn, signOut, fetchProfile, getSessionProfile,
  isBiometricAvailable, authenticateBiometric,
  getBiometricEnabled, setBiometricEnabled,
  type UserProfile,
} from '../lib/auth'

type AuthContextType = {
  profile: UserProfile | null
  isAdmin: boolean
  isAuthenticated: boolean
  isLoading: boolean
  needsBiometric: boolean
  biometricAvailable: boolean
  biometricEnabled: boolean
  login: (email: string, password: string) => Promise<string | null>
  loginWithBiometric: () => Promise<boolean>
  enableBiometric: () => Promise<boolean>
  disableBiometric: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile]               = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading]           = useState(true)
  const [needsBiometric, setNeedsBiometric] = useState(false)
  const [biometricAvailable, setBioAvail]   = useState(false)
  const [biometricEnabled, setBioEnabled]   = useState(false)

  useEffect(() => {
    async function init() {
      const [bioAvail, bioEnabled] = await Promise.all([
        isBiometricAvailable(),
        getBiometricEnabled(),
      ])
      setBioAvail(bioAvail)
      setBioEnabled(bioEnabled)

      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        if (bioEnabled && bioAvail) {
          setNeedsBiometric(true)
        } else {
          const p = await getSessionProfile()
          setProfile(p)
        }
      }
      setIsLoading(false)
    }
    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setProfile(null)
        setNeedsBiometric(false)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const login = async (email: string, password: string): Promise<string | null> => {
    const { data, error } = await signIn(email, password)
    if (error || !data.user) {
      if (error?.message?.includes('Invalid login')) return 'אימייל או סיסמה שגויים'
      return error?.message ?? 'שגיאה בכניסה'
    }
    const p = await fetchProfile(data.user.id, data.user.email ?? email)
    if (!p) return 'פרופיל לא נמצא — פנה למנהל המערכת'
    setProfile(p)
    return null
  }

  const loginWithBiometric = async (): Promise<boolean> => {
    const ok = await authenticateBiometric()
    if (!ok) return false
    const p = await getSessionProfile()
    if (p) { setProfile(p); setNeedsBiometric(false); return true }
    setNeedsBiometric(false)
    return false
  }

  const enableBiometric = async (): Promise<boolean> => {
    const ok = await authenticateBiometric()
    if (ok) { await setBiometricEnabled(true); setBioEnabled(true) }
    return ok
  }

  const disableBiometric = async () => {
    await setBiometricEnabled(false)
    setBioEnabled(false)
  }

  const logout = async () => {
    await signOut()
    setProfile(null)
    setNeedsBiometric(false)
  }

  return (
    <AuthContext.Provider value={{
      profile,
      isAdmin: profile?.role === 'admin',
      isAuthenticated: !!profile,
      isLoading,
      needsBiometric,
      biometricAvailable,
      biometricEnabled,
      login,
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
