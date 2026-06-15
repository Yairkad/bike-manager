import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'
import { supabase } from './supabase'
import type { Database } from '../types/supabase'

// ── Fixed internal emails (just Supabase identifiers, not real inboxes) ──
export const ADMIN_EMAIL  = 'admin@bike-ihud.local'
export const VIEWER_EMAIL = 'viewer@bike-ihud.local'

const ADMIN_NAME_KEY      = 'auth_admin_name_v1'
const VIEWER_NAME_KEY     = 'auth_viewer_name_v1'
const ADMIN_REGISTERED_KEY = 'auth_admin_registered_v1'
const BIOMETRIC_KEY       = 'auth_biometric_v1'

export type UserRole = 'admin' | 'viewer'

export type UserProfile = {
  id: string
  name: string
  role: UserRole
}

// ── Cached names (for UI display without re-fetching) ─────────
export const getCachedAdminName  = (): Promise<string | null> => AsyncStorage.getItem(ADMIN_NAME_KEY)
export const getCachedViewerName = (): Promise<string | null> => AsyncStorage.getItem(VIEWER_NAME_KEY)
const setCachedAdminName  = (n: string) => AsyncStorage.setItem(ADMIN_NAME_KEY, n)
const setCachedViewerName = (n: string) => AsyncStorage.setItem(VIEWER_NAME_KEY, n)

export const isAdminRegistered = async (): Promise<boolean> => {
  const val = await AsyncStorage.getItem(ADMIN_REGISTERED_KEY)
  return val === 'true'
}
const markAdminRegistered = () => AsyncStorage.setItem(ADMIN_REGISTERED_KEY, 'true')

// ── Fetch profile from Supabase ────────────────────────────────
export const fetchProfile = async (userId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase.from('profiles').select('id, name, role').eq('id', userId).single()
  if (error || !data) return null
  return { id: data.id, name: data.name, role: data.role as UserRole }
}

// ── Get profile from current session ──────────────────────────
export const getSessionProfile = async (): Promise<UserProfile | null> => {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null
  return fetchProfile(session.user.id)
}

// ── Sign up admin (first launch) ──────────────────────────────
export const signUpAdmin = async (name: string, pin: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase.auth.signUp({
    email: ADMIN_EMAIL,
    password: pin,
    options: { data: { name, role: 'admin' } },
  })
  if (error || !data.user) return null
  await markAdminRegistered()
  await setCachedAdminName(name)
  // signUp auto-signs in when email confirmation is disabled
  if (data.session) return fetchProfile(data.user.id)
  // Fallback: sign in explicitly
  return signInWithPin(pin)
}

// ── Sign in by PIN — auto-detect role ─────────────────────────
export const signInWithPin = async (pin: string): Promise<UserProfile | null> => {
  // Try admin first (most logins are admin)
  const { data: adminData, error: adminErr } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL, password: pin,
  })
  if (!adminErr && adminData.user) {
    const p = await fetchProfile(adminData.user.id)
    if (p?.name) await setCachedAdminName(p.name)
    return p
  }
  // Try viewer
  const { data: viewerData, error: viewerErr } = await supabase.auth.signInWithPassword({
    email: VIEWER_EMAIL, password: pin,
  })
  if (!viewerErr && viewerData.user) {
    const p = await fetchProfile(viewerData.user.id)
    if (p?.name) await setCachedViewerName(p.name)
    return p
  }
  return null
}

// ── Create viewer (admin action, uses temp non-persistent client) ─
export const signUpViewer = async (name: string, pin: string): Promise<'ok' | 'exists' | 'error'> => {
  const url  = process.env.EXPO_PUBLIC_SUPABASE_URL  ?? ''
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ''
  const tmp = createClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { error } = await tmp.auth.signUp({
    email: VIEWER_EMAIL,
    password: pin,
    options: { data: { name, role: 'viewer' } },
  })
  if (!error) {
    await setCachedViewerName(name)
    return 'ok'
  }
  // Supabase returns fake-success for duplicate emails — if "ok" returned but user existed,
  // we detect it via "User already registered" message
  if (error.message?.toLowerCase().includes('already')) return 'exists'
  return 'error'
}

// ── Update viewer PIN (admin changes it) ──────────────────────
export const updateViewerPin = async (currentPin: string, newPin: string): Promise<boolean> => {
  const url  = process.env.EXPO_PUBLIC_SUPABASE_URL  ?? ''
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ''
  const tmp = createClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { error: signInErr } = await tmp.auth.signInWithPassword({ email: VIEWER_EMAIL, password: currentPin })
  if (signInErr) return false
  const { error: updateErr } = await tmp.auth.updateUser({ password: newPin })
  return !updateErr
}

// ── Sign out ──────────────────────────────────────────────────
export const signOut = (): Promise<{ error: unknown }> => supabase.auth.signOut()

// ── Biometric flag (stored locally — not in Supabase) ─────────
export const getBiometricEnabled = async (): Promise<boolean> => {
  const v = await AsyncStorage.getItem(BIOMETRIC_KEY)
  return v === 'true'
}
export const setBiometricEnabled = (v: boolean): Promise<void> =>
  AsyncStorage.setItem(BIOMETRIC_KEY, String(v))

// ── Biometric auth ─────────────────────────────────────────────
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

// ── Display helper ─────────────────────────────────────────────
export const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/)
  return parts.length >= 2 ? parts[0][0] + parts[1][0] : name.trim().slice(0, 2)
}
