import { useState, useRef } from 'react'
import {
  View, Text, TouchableOpacity, TextInput,
  Animated, Easing, Alert,
} from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../lib/navigation'
import { useAuth } from '../context/AuthContext'

type Props = NativeStackScreenProps<RootStackParamList, 'SetupViewer'>
type Step = 'name' | 'pin-new' | 'pin-confirm'

const PIN_LENGTH = 4

function PinDots({ count }: { count: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 18, justifyContent: 'center', marginVertical: 28 }}>
      {Array.from({ length: PIN_LENGTH }).map((_, i) => (
        <View key={i} style={{
          width: 18, height: 18, borderRadius: 9,
          backgroundColor: i < count ? '#1e3a8a' : 'transparent',
          borderWidth: 2, borderColor: i < count ? '#1e3a8a' : '#cbd5e1',
        }} />
      ))}
    </View>
  )
}

function NumPad({ onPress, onDelete }: { onPress: (d: string) => void; onDelete: () => void }) {
  const rows = [['1','2','3'],['4','5','6'],['7','8','9'],['','0','⌫']]
  return (
    <View style={{ gap: 12 }}>
      {rows.map((row, ri) => (
        <View key={ri} style={{ flexDirection: 'row', gap: 12, justifyContent: 'center' }}>
          {row.map((k, ki) => (
            <TouchableOpacity key={ki} onPress={() => k === '⌫' ? onDelete() : k ? onPress(k) : undefined}
              disabled={!k} activeOpacity={0.65}
              style={{
                width: 80, height: 80, borderRadius: 40,
                backgroundColor: k ? '#f8fafc' : 'transparent',
                borderWidth: k ? 1.5 : 0, borderColor: '#e2e8f0',
                alignItems: 'center', justifyContent: 'center',
                shadowColor: '#000', shadowOpacity: k ? 0.06 : 0, shadowRadius: 4, elevation: k ? 2 : 0,
              }}>
              <Text style={{ fontSize: k === '⌫' ? 22 : 26, fontWeight: '600', color: '#0f172a' }}>{k}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  )
}

export default function SetupViewerScreen({ navigation }: Props) {
  const { setupViewer, viewerProfile, removeViewer } = useAuth()
  const [step, setStep] = useState<Step>('name')
  const [name, setName] = useState('')
  const [pinNew, setPinNew] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [error, setError] = useState('')
  const shakeAnim = useRef(new Animated.Value(0)).current

  const doShake = () => {
    shakeAnim.setValue(0)
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12, duration: 70, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 70, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(shakeAnim, { toValue: 7, duration: 55, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 40, useNativeDriver: true, easing: Easing.linear }),
    ]).start()
  }

  const activePin = step === 'pin-new' ? pinNew : pinConfirm
  const setActivePin = step === 'pin-new' ? setPinNew : setPinConfirm

  const handleDigit = (digit: string) => {
    setError('')
    const next = activePin + digit
    if (next.length > PIN_LENGTH) return
    setActivePin(next)
    if (next.length < PIN_LENGTH) return

    setTimeout(async () => {
      if (step === 'pin-new') {
        setPinConfirm('')
        setStep('pin-confirm')
      } else {
        if (next !== pinNew) {
          doShake()
          setError('PINים לא תואמים — נסה שוב')
          setPinConfirm('')
        } else {
          await setupViewer(name.trim(), pinNew)
          navigation.goBack()
        }
      }
    }, 100)
  }

  const handleDelete = () => {
    setError('')
    setActivePin(p => p.slice(0, -1))
  }

  const handleRemove = () => {
    Alert.alert('הסרת משתמש צפיה', `להסיר את ${viewerProfile?.name}?`, [
      { text: 'הסר', style: 'destructive', onPress: async () => { await removeViewer(); navigation.goBack() } },
      { text: 'ביטול', style: 'cancel' },
    ])
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>

      {/* Existing viewer info */}
      {viewerProfile && step === 'name' && (
        <View style={{ marginHorizontal: 16, marginTop: 16, backgroundColor: '#eff6ff', borderRadius: 14, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#bfdbfe' }}>
          <TouchableOpacity onPress={handleRemove}>
            <Text style={{ fontSize: 13, color: '#ef4444', fontWeight: '600' }}>הסר</Text>
          </TouchableOpacity>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#1e40af' }}>משתמש קיים: {viewerProfile.name}</Text>
            <Text style={{ fontSize: 11, color: '#60a5fa', marginTop: 2 }}>הגדרה חדשה תחליף את הקיים</Text>
          </View>
        </View>
      )}

      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 32 }}>

        {step === 'name' && (
          <>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#0f172a', textAlign: 'right', marginBottom: 6 }}>
              {viewerProfile ? 'עדכון משתמש צפיה' : 'הוספת משתמש צפיה'}
            </Text>
            <Text style={{ fontSize: 13, color: '#64748b', textAlign: 'right', marginBottom: 28 }}>
              משתמש זה יוכל לצפות במלאי הכלים בלבד
            </Text>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', textAlign: 'right', marginBottom: 8 }}>שם</Text>
            <TextInput
              value={name} onChangeText={setName}
              placeholder="שם משתמש הצפיה"
              placeholderTextColor="#94a3b8"
              textAlign="right" autoFocus
              style={{ height: 52, borderWidth: 1.5, borderColor: name ? '#1e3a8a' : '#e2e8f0', borderRadius: 14, paddingHorizontal: 16, fontSize: 16, color: '#0f172a', backgroundColor: '#fff', marginBottom: 16 }}
            />
            <TouchableOpacity
              onPress={() => name.trim().length > 1 && setStep('pin-new')}
              activeOpacity={0.85}
              style={{ height: 52, borderRadius: 14, backgroundColor: name.trim().length > 1 ? '#1e3a8a' : '#e2e8f0', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: name.trim().length > 1 ? '#fff' : '#94a3b8' }}>המשך ←</Text>
            </TouchableOpacity>
          </>
        )}

        {(step === 'pin-new' || step === 'pin-confirm') && (
          <>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a', textAlign: 'center', marginBottom: 4 }}>
              {step === 'pin-new' ? 'צור PIN לצפיה' : 'אשר את ה-PIN'}
            </Text>
            <Text style={{ fontSize: 13, color: '#64748b', textAlign: 'center', marginBottom: 0 }}>
              {step === 'pin-new' ? '4 ספרות לכניסת משתמש הצפיה' : 'הזן שוב לאישור'}
            </Text>
            {error ? <Text style={{ color: '#ef4444', textAlign: 'center', fontSize: 13, marginTop: 4 }}>{error}</Text> : null}
            <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
              <PinDots count={activePin.length} />
            </Animated.View>
            <NumPad onPress={handleDigit} onDelete={handleDelete} />
            <TouchableOpacity
              onPress={() => { setStep('pin-new'); setPinNew(''); setPinConfirm(''); setError('') }}
              style={{ marginTop: 20, alignItems: 'center' }}>
              <Text style={{ color: '#94a3b8', fontSize: 13 }}>← חזור</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  )
}
