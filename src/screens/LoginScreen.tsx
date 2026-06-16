import { useState, useEffect, useRef } from 'react'
import {
  View, Text, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, ScrollView, Image, Modal, ActivityIndicator,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../context/AuthContext'
import { requestPasswordReset } from '../lib/auth'

type Step = 'login' | 'biometric-ask'

export default function LoginScreen() {
  const {
    needsBiometric, biometricAvailable, biometricEnabled,
    login, loginWithBiometric, enableBiometric,
  } = useAuth()

  const [step, setStep]         = useState<Step>('login')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const passRef = useRef<TextInput>(null)

  const [showReset, setShowReset]   = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSending, setResetSending] = useState(false)
  const [resetMsg, setResetMsg]     = useState<{ text: string; ok: boolean } | null>(null)

  const openReset = () => { setResetEmail(email); setResetMsg(null); setShowReset(true) }

  const handleSendReset = async () => {
    if (!resetEmail.trim()) return
    setResetSending(true)
    const { error: err } = await requestPasswordReset(resetEmail)
    setResetSending(false)
    setResetMsg(err
      ? { text: 'שליחת המייל נכשלה, נסה שוב', ok: false }
      : { text: 'אם הכתובת קיימת במערכת, נשלח אליה מייל לאיפוס הסיסמה', ok: true })
  }

  useEffect(() => {
    if (needsBiometric) triggerBiometric()
  }, [needsBiometric])

  const triggerBiometric = async () => { await loginWithBiometric() }

  const handleLogin = async () => {
    if (!email.trim() || !password) return
    setError('')
    setLoading(true)
    const err = await login(email, password)
    setLoading(false)
    if (err) {
      setError(err)
    } else if (biometricAvailable && !biometricEnabled) {
      setStep('biometric-ask')
    }
  }

  const handleEnableBiometric = async (enable: boolean) => {
    if (enable) await enableBiometric()
    setStep('login')
  }

  // ── Header ──────────────────────────────────────────────────
  const renderHeader = () => (
    <LinearGradient
      colors={['#ea580c', '#f97316']}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ paddingTop: 28, paddingBottom: 36, alignItems: 'center' }}
    >
      <Image
        source={require('../../assets/icon.png')}
        style={{ width: 190, height: 148, resizeMode: 'contain' }}
      />
      <Text style={{ color: 'rgba(0,0,0,0.65)', fontSize: 15, fontWeight: '700', marginTop: 6 }}>
        מרלו"ג איחוד הצלה
      </Text>
    </LinearGradient>
  )

  // ── Card body ────────────────────────────────────────────────
  const renderCard = () => {
    // Waiting for biometric
    if (needsBiometric) return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="finger-print" size={80} color="#ea580c" />
        <Text style={[S.title, { textAlign: 'center', marginTop: 20, marginBottom: 8 }]}>אמת זהות</Text>
        <Text style={[S.sub, { textAlign: 'center' }]}>השתמש בטביעת אצבע או זיהוי פנים</Text>
        <TouchableOpacity onPress={triggerBiometric} activeOpacity={0.85}
          style={[S.btn, { backgroundColor: '#ea580c', width: '100%', marginTop: 32, shadowColor: '#ea580c', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6 }]}>
          <Text style={[S.btnTxt, { color: '#fff' }]}>נסה שוב</Text>
        </TouchableOpacity>
      </View>
    )

    // Offer biometric after first login
    if (step === 'biometric-ask') return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
        <Ionicons name="finger-print" size={88} color="#ea580c" />
        <Text style={[S.title, { textAlign: 'center', marginTop: 24, marginBottom: 10 }]}>כניסה ביומטרית</Text>
        <Text style={[S.sub, { textAlign: 'center', marginBottom: 40, lineHeight: 22, paddingHorizontal: 8 }]}>
          בפעם הבאה אפשר להיכנס עם טביעת אצבע או זיהוי פנים — בלי להקליד סיסמה
        </Text>
        <TouchableOpacity onPress={() => handleEnableBiometric(true)} activeOpacity={0.85}
          style={[S.btn, { backgroundColor: '#ea580c', width: '100%', marginBottom: 14, shadowColor: '#ea580c', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6 }]}>
          <Text style={[S.btnTxt, { color: '#fff' }]}>הפעל ביומטרי</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleEnableBiometric(false)} activeOpacity={0.7}
          style={{ paddingVertical: 14, paddingHorizontal: 32 }}>
          <Text style={{ color: '#94a3b8', fontSize: 15, fontWeight: '500' }}>דלג בינתיים</Text>
        </TouchableOpacity>
      </View>
    )

    // Login form
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={[S.title, { textAlign: 'center' }]}>התחברות</Text>
          <Text style={[S.sub, { textAlign: 'center' }]}>הזן את פרטי הכניסה שלך</Text>

          {error ? (
            <View style={{ backgroundColor: '#fef2f2', borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#fecaca' }}>
              <Text style={{ color: '#dc2626', fontSize: 13, textAlign: 'right' }}>{error}</Text>
            </View>
          ) : null}

          <Text style={S.label}>אימייל</Text>
          <TextInput
            value={email} onChangeText={v => { setEmail(v); setError('') }}
            placeholder="you@example.com"
            placeholderTextColor="#94a3b8"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            returnKeyType="next"
            onSubmitEditing={() => passRef.current?.focus()}
            textAlign="right"
            style={[S.input, { borderColor: email ? '#ea580c' : '#e2e8f0' }]}
          />

          <Text style={S.label}>סיסמה</Text>
          <View style={{ position: 'relative', marginBottom: 24 }}>
            <TextInput
              ref={passRef}
              value={password} onChangeText={v => { setPassword(v); setError('') }}
              placeholder="••••••••"
              placeholderTextColor="#94a3b8"
              secureTextEntry={!showPass}
              autoComplete="password"
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              textAlign="right"
              style={[S.input, { borderColor: password ? '#ea580c' : '#e2e8f0', marginBottom: 0, paddingLeft: 48 }]}
            />
            <TouchableOpacity onPress={() => setShowPass(p => !p)}
              style={{ position: 'absolute', left: 14, top: 14 }}>
              <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={openReset} style={{ alignSelf: 'flex-end', marginTop: -14, marginBottom: 18 }}>
            <Text style={{ color: '#ea580c', fontSize: 13, fontWeight: '600' }}>שכחתי סיסמה</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading || !email.trim() || !password}
            activeOpacity={0.85}
            style={[S.btn, { backgroundColor: email.trim() && password ? '#ea580c' : '#e2e8f0' }]}>
            <Text style={[S.btnTxt, { color: email.trim() && password ? '#fff' : '#94a3b8' }]}>
              {loading ? 'מתחבר...' : 'התחברות'}
            </Text>
          </TouchableOpacity>

          {biometricEnabled && biometricAvailable && (
            <TouchableOpacity onPress={triggerBiometric} activeOpacity={0.8}
              style={{ marginTop: 20, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
              <Text style={{ color: '#ea580c', fontSize: 14, fontWeight: '600' }}>כניסה ביומטרית</Text>
              <Ionicons name="finger-print" size={22} color="#ea580c" />
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ea580c' }}>
      {renderHeader()}
      <View style={S.card}>{renderCard()}</View>

      <Modal visible={showReset} transparent animationType="fade" onRequestClose={() => setShowReset(false)}>
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}>
          <TouchableOpacity style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' }} activeOpacity={1} onPress={() => setShowReset(false)} />
          <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 20, gap: 14 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a', textAlign: 'right' }}>איפוס סיסמה</Text>
            <Text style={{ fontSize: 13, color: '#64748b', textAlign: 'right' }}>הזן את כתובת האימייל שלך, נשלח אליה קישור לאיפוס הסיסמה</Text>
            <TextInput
              value={resetEmail} onChangeText={v => { setResetEmail(v); setResetMsg(null) }}
              placeholder="you@example.com" placeholderTextColor="#94a3b8"
              keyboardType="email-address" autoCapitalize="none" textAlign="right"
              style={[S.input, { marginBottom: 0, borderColor: resetEmail ? '#ea580c' : '#e2e8f0' }]} />
            {resetMsg && (
              <Text style={{ fontSize: 13, textAlign: 'right', color: resetMsg.ok ? '#15803d' : '#dc2626' }}>{resetMsg.text}</Text>
            )}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={() => setShowReset(false)} style={{ flex: 1, paddingVertical: 13, borderRadius: 12, borderWidth: 1.5, borderColor: '#e5e7eb', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#64748b' }}>סגור</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSendReset} disabled={resetSending || !resetEmail.trim()}
                style={{ flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center', backgroundColor: '#ea580c', opacity: resetSending || !resetEmail.trim() ? 0.5 : 1 }}>
                {resetSending ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>שלח מייל</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const S = {
  card:   { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 28, paddingTop: 32, paddingBottom: 24 } as const,
  title:  { fontSize: 22, fontWeight: '800' as const, color: '#0f172a', marginBottom: 6 },
  sub:    { fontSize: 13, color: '#64748b', marginBottom: 26 },
  label:  { fontSize: 13, fontWeight: '600' as const, color: '#374151', textAlign: 'right' as const, marginBottom: 8 },
  input:  { height: 52, borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 16, fontSize: 16, color: '#0f172a', backgroundColor: '#f8fafc', marginBottom: 16 } as const,
  btn:    { height: 52, borderRadius: 14, alignItems: 'center' as const, justifyContent: 'center' as const },
  btnTxt: { fontSize: 16, fontWeight: '700' as const },
}
