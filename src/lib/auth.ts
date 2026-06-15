import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'
import { supabase } from './supabase'

const BIOMETRIC_KEY = 'auth_biometric_v1'

export type UserRole = 'admin' | 'viewer'
export type UserProfile = { id: string; name: string; role: UserRole; email: string }

// ── Profile ────────────────────────────────────────────────────
export const fetchProfile = async (userId: string): Promise<UserProfile | null> => {
  const { data: authData } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('profiles').select('id, name, role').eq('id', userId).single()
  if (error || !data) return null
  const row = data as unknown as { id: string; name: string; role: string }
  return {
    id: row.id,
    name: row.name,
    role: row.role as UserRole,
    email: authData.user?.email ?? '',
  }
}

export const getSessionProfile = async (): Promise<UserProfile | null> => {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null
  return fetchProfile(session.user.id)
}

// ── Auth ───────────────────────────────────────────────────────
export const signIn = (email: string, password: string) =>
  supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })

export const signOut = () => supabase.auth.signOut()

// ── Biometric ──────────────────────────────────────────────────
export const getBiometricEnabled = async (): Promise<boolean> =>
  (await AsyncStorage.getItem(BIOMETRIC_KEY)) === 'true'

export const setBiometricEnabled = (v: boolean): Promise<void> =>
  AsyncStorage.setItem(BIOMETRIC_KEY, String(v))

export const isBiometricAvailable = async (): Promise<boolean> => {
  if (Platform.OS === 'web') return false
  try {
    const LA = await import('expo-local-authentication')
    const [hw, en] = await Promise.all([LA.hasHardwareAsync(), LA.isEnrolledAsync()])
    return hw && en
  } catch { return false }
}

export const authenticateBiometric = async (): Promise<boolean> => {
  if (Platform.OS === 'web') return false
  try {
    const LA = await import('expo-local-authentication')
    const res = await LA.authenticateAsync({
      promptMessage: 'אמת זהות כדי להיכנס',
      fallbackLabel: 'בטל',
      cancelLabel: 'ביטול',
    })
    return res.success
  } catch { return false }
}

// ── Helpers ────────────────────────────────────────────────────
export const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/)
  return parts.length >= 2 ? parts[0][0] + parts[1][0] : name.trim().slice(0, 2)
}
