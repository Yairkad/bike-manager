import { useState, useEffect, useRef } from 'react'
import {
  View, Text, TouchableOpacity, TextInput, Platform,
  Animated, Easing, KeyboardAvoidingView, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../context/AuthContext'
import { getInitials } from '../lib/auth'

// ── PIN length ─────────────────────────────────────────────────
const PIN_LENGTH = 4

type SetupStep = 'name' | 'pin-new' | 'pin-confirm' | 'biometric-ask'
type LoginStep = 'login-pin'
type Step = SetupStep | LoginStep

// ── Sub-components ─────────────────────────────────────────────
function PinDots({ count }: { count: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 18, justifyContent: 'center', marginVertical: 28 }}>
      {Array.from({ length: PIN_LENGTH }).map((_, i) => (
        <View
          key={i}
          style={{
            width: 18, height: 18, borderRadius: 9,
            backgroundColor: i < count ? '#1e3a8a' : 'transparent',
            borderWidth: 2,
            borderColor: i < count ? '#1e3a8a' : '#cbd5e1',
          }}
        />
      ))}
    </View>
  )
}

function NumPad({
  onPress,
  onDelete,
  biometricAvailable,
  onBiometric,
  showBiometric,
}: {
  onPress: (digit: string) => void
  onDelete: () => void
  biometricAvailable: boolean
  onBiometric?: () => void
  showBiometric?: boolean
}) {
  const rows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    [showBiometric && biometricAvailable ? '👆' : '', '0', '⌫'],
  ]

  return (
    <View style={{ gap: 12 }}>
      {rows.map((row, ri) => (
        <View key={ri} style={{ flexDirection: 'row', gap: 12, justifyContent: 'center' }}>
          {row.map((k, ki) => {
            const isEmpty = !k
            const isBio = k === '👆'
            const isDel = k === '⌫'
            return (
              <TouchableOpacity
                key={ki}
                onPress={() => {
                  if (isEmpty) return
                  if (isDel) onDelete()
                  else if (isBio) onBiometric?.()
                  else onPress(k)
                }}
                disabled={isEmpty}
                activeOpacity={0.65}
                style={{
                  width: 80, height: 80, borderRadius: 40,
                  backgroundColor: isEmpty ? 'transparent' : isBio ? '#eff6ff' : '#f8fafc',
                  borderWidth: isEmpty ? 0 : 1.5,
                  borderColor: isBio ? '#bfdbfe' : '#e2e8f0',
                  alignItems: 'center', justifyContent: 'center',
                  shadowColor: '#000',
                  shadowOpacity: isEmpty ? 0 : 0.06,
                  shadowRadius: 4,
                  elevation: isEmpty ? 0 : 2,
                }}
              >
                <Text style={{
                  fontSize: isDel || isBio ? 22 : 26,
                  fontWeight: '600',
                  color: isDel ? '#64748b' : '#0f172a',
                }}>
                  {k}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      ))}
    </View>
  )
}

// ── Main screen ────────────────────────────────────────────────
export default function LoginScreen() {
  const { adminProfile, biometricAvailable, setupUser, loginWithPin, loginWithBiometric, testBiometric } = useAuth()

  const isSetup = !adminProfile
  const [step, setStep] = useState<Step>(isSetup ? 'name' : 'login-pin')
  const [name, setName] = useState('')
  const [pinNew, setPinNew] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [loginPin, setLoginPin] = useState('')
  const [error, setError] = useState('')

  const shakeAnim = useRef(new Animated.Value(0)).current
  const nameRef = useRef<TextInput>(null)

  // Auto-trigger biometric on login screen mount (admin only)
  useEffect(() => {
    if (!isSetup && adminProfile?.biometricEnabled && biometricAvailable) {
      triggerBiometric()
    }
  }, [])

  const triggerBiometric = async () => {
    await loginWithBiometric()
    // AuthContext sets isAuthenticated → App re-renders and shows main stack
  }

  const doShake = () => {
    shakeAnim.setValue(0)
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12, duration: 70, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 70, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(shakeAnim, { toValue: 7, duration: 55, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(shakeAnim, { toValue: -4, duration: 45, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 40, useNativeDriver: true, easing: Easing.linear }),
    ]).start()
  }

  // ── PIN digit handlers ─────────────────────────────────────
  const activePin = step === 'pin-new' ? pinNew : step === 'pin-confirm' ? pinConfirm : loginPin
  const setActivePin = step === 'pin-new' ? setPinNew : step === 'pin-confirm' ? setPinConfirm : setLoginPin

  const handleDigit = (digit: string) => {
    setError('')
    const next = activePin + digit
    if (next.length > PIN_LENGTH) return
    setActivePin(next)

    if (next.length < PIN_LENGTH) return

    // PIN complete — act after a short paint delay
    setTimeout(async () => {
      if (step === 'login-pin') {
        const ok = await loginWithPin(next)
        if (!ok) {
          doShake()
          setError('PIN שגוי — נסה שוב')
          setLoginPin('')
        }
      } else if (step === 'pin-new') {
        setPinConfirm('')
        setStep('pin-confirm')
      } else if (step === 'pin-confirm') {
        if (next !== pinNew) {
          doShake()
          setError('PINים לא תואמים — נסה שוב')
          setPinConfirm('')
        } else if (biometricAvailable) {
          setStep('biometric-ask')
        } else {
          await setupUser(name.trim(), pinNew, false)
        }
      }
    }, 100)
  }

  const handleDelete = () => {
    setError('')
    setActivePin(p => p.slice(0, -1))
  }

  const handleEnableBiometric = async (enable: boolean) => {
    if (enable) {
      const ok = await testBiometric()
      await setupUser(name.trim(), pinNew, ok)
    } else {
      await setupUser(name.trim(), pinNew, false)
    }
  }

  // ── Blue header ──────────────────────────────────────────────
  const renderHeader = () => (
    <View style={{ paddingTop: 36, paddingBottom: 44, alignItems: 'center' }}>
      <Text style={{ fontSize: 60, marginBottom: 10 }}>🚲</Text>
      <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: 0.2 }}>מחסן אופניים</Text>
      <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 4 }}>איחוד הצלה ישראל</Text>
    </View>
  )

  // ── Card body per step ───────────────────────────────────────
  const renderCard = () => {
    // ── Setup: name ──
    if (step === 'name') {
      return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Text style={styles.cardTitle}>ברוך הבא! 👋</Text>
          <Text style={styles.cardSub}>בוא נגדיר את הפרופיל שלך</Text>

          <Text style={styles.label}>השם שלך</Text>
          <TextInput
            ref={nameRef}
            value={name}
            onChangeText={setName}
            placeholder="ישראל ישראלי"
            placeholderTextColor="#94a3b8"
            textAlign="right"
            autoFocus
            returnKeyType="done"
            onSubmitEditing={() => name.trim().length > 1 && setStep('pin-new')}
            style={[styles.input, { borderColor: name ? '#1e3a8a' : '#e2e8f0' }]}
          />

          <TouchableOpacity
            onPress={() => name.trim().length > 1 && setStep('pin-new')}
            activeOpacity={0.85}
            style={[styles.btn, { backgroundColor: name.trim().length > 1 ? '#1e3a8a' : '#e2e8f0' }]}
          >
            <Text style={[styles.btnText, { color: name.trim().length > 1 ? '#fff' : '#94a3b8' }]}>המשך ←</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      )
    }

    // ── PIN steps (new / confirm / login) ──
    if (step === 'pin-new' || step === 'pin-confirm' || step === 'login-pin') {
      const pinLabel =
        step === 'pin-new' ? 'צור PIN בן 4 ספרות' :
        step === 'pin-confirm' ? 'אשר את ה-PIN' :
        `שלום, ${adminProfile?.name.split(' ')[0]} 👋`

      const pinSub =
        step === 'pin-new' ? 'PIN זה ישמש לכניסה לאפליקציה' :
        step === 'pin-confirm' ? 'הזן שוב לאישור' :
        'הזן PIN לכניסה'

      const pinCount = step === 'pin-confirm' ? pinConfirm.length : step === 'pin-new' ? pinNew.length : loginPin.length

      return (
        <View style={{ flex: 1 }}>
          {/* Avatar for login mode */}
          {step === 'login-pin' && adminProfile && (
            <View style={{ alignItems: 'center', marginBottom: 8 }}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{getInitials(adminProfile.name)}</Text>
              </View>
            </View>
          )}

          <Text style={[styles.cardTitle, { textAlign: 'center', marginBottom: 2 }]}>{pinLabel}</Text>
          <Text style={[styles.cardSub, { textAlign: 'center' }]}>{pinSub}</Text>

          {error ? (
            <Text style={{ color: '#ef4444', textAlign: 'center', fontSize: 13, marginTop: 4 }}>{error}</Text>
          ) : null}

          <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
            <PinDots count={pinCount} />
          </Animated.View>

          <NumPad
            onPress={handleDigit}
            onDelete={handleDelete}
            biometricAvailable={biometricAvailable}
            showBiometric={step === 'login-pin' && adminProfile?.biometricEnabled}
            onBiometric={triggerBiometric}
          />

          {step === 'pin-confirm' && (
            <TouchableOpacity
              onPress={() => { setStep('pin-new'); setPinConfirm(''); setPinNew(''); setError('') }}
              style={{ marginTop: 20, alignItems: 'center' }}
            >
              <Text style={{ color: '#94a3b8', fontSize: 13 }}>← חזור</Text>
            </TouchableOpacity>
          )}
        </View>
      )
    }

    // ── Biometric enrollment ask ──
    if (step === 'biometric-ask') {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 }}>
          <Text style={{ fontSize: 68, marginBottom: 20 }}>👆</Text>
          <Text style={[styles.cardTitle, { textAlign: 'center', marginBottom: 8 }]}>כניסה ביומטרית</Text>
          <Text style={[styles.cardSub, { textAlign: 'center', marginBottom: 40, lineHeight: 20 }]}>
            אפשר להשתמש בטביעת אצבע או זיהוי פנים לכניסה מהירה בפעמים הבאות
          </Text>
          <TouchableOpacity
            onPress={() => handleEnableBiometric(true)}
            activeOpacity={0.85}
            style={[styles.btn, { backgroundColor: '#1e3a8a', marginBottom: 12 }]}
          >
            <Text style={[styles.btnText, { color: '#fff' }]}>הפעל ביומטרי</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleEnableBiometric(false)}
            activeOpacity={0.85}
            style={[styles.btn, { backgroundColor: '#f1f5f9' }]}
          >
            <Text style={[styles.btnText, { color: '#64748b' }]}>דלג — רק PIN</Text>
          </TouchableOpacity>
        </View>
      )
    }

    return null
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1e3a8a' }}>
      {renderHeader()}
      <View style={styles.card}>
        {renderCard()}
      </View>
    </SafeAreaView>
  )
}

// ── Shared styles ──────────────────────────────────────────────
const styles = {
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 24,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#0f172a',
    textAlign: 'right' as const,
    marginBottom: 6,
  },
  cardSub: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'right' as const,
    marginBottom: 26,
  },
  label: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#374151',
    textAlign: 'right' as const,
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    marginBottom: 16,
  },
  btn: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    width: '100%' as const,
  },
  btnText: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1e3a8a',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 10,
    shadowColor: '#1e3a8a',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800' as const,
    letterSpacing: 1,
  },
}
