import { useState, useEffect, useRef } from 'react'
import {
  View, Text, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, ScrollView, Image,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../context/AuthContext'

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
          style={[S.btn, { backgroundColor: '#ea580c', marginTop: 32 }]}>
          <Text style={[S.btnTxt, { color: '#fff' }]}>נסה שוב</Text>
        </TouchableOpacity>
      </View>
    )

    // Offer biometric after first login
    if (step === 'biometric-ask') return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 }}>
        <Ionicons name="finger-print" size={80} color="#ea580c" />
        <Text style={[S.title, { textAlign: 'center', marginTop: 20, marginBottom: 8 }]}>כניסה ביומטרית</Text>
        <Text style={[S.sub, { textAlign: 'center', marginBottom: 40, lineHeight: 20 }]}>
          בפעם הבאה אפשר להיכנס עם טביעת אצבע או זיהוי פנים
        </Text>
        <TouchableOpacity onPress={() => handleEnableBiometric(true)} activeOpacity={0.85}
          style={[S.btn, { backgroundColor: '#ea580c', marginBottom: 12 }]}>
          <Text style={[S.btnTxt, { color: '#fff' }]}>הפעל ביומטרי</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleEnableBiometric(false)} activeOpacity={0.85}
          style={[S.btn, { backgroundColor: '#f1f5f9' }]}>
          <Text style={[S.btnTxt, { color: '#64748b' }]}>דלג</Text>
        </TouchableOpacity>
      </View>
    )

    // Login form
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
