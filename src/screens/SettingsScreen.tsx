import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../lib/navigation'
import { useAuth } from '../context/AuthContext'

type Props = NativeStackScreenProps<RootStackParamList, 'SettingsScreen'>

export default function SettingsScreen({ navigation }: Props) {
  const { biometricEnabled, biometricAvailable, disableBiometric, enableBiometric } = useAuth()

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }} contentContainerStyle={{ paddingBottom: 40 }}>

      {/* Biometric */}
      {biometricAvailable && (
        <View style={{ marginTop: 20, marginHorizontal: 14 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#94a3b8', marginBottom: 8, textAlign: 'right', letterSpacing: 0.5 }}>
            אבטחה
          </Text>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9' }}>
            <TouchableOpacity
              onPress={biometricEnabled ? disableBiometric : enableBiometric}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16 }}>
              <View style={{ backgroundColor: biometricEnabled ? '#dcfce7' : '#f1f5f9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: biometricEnabled ? '#15803d' : '#64748b' }}>
                  {biometricEnabled ? 'פעיל' : 'כבוי'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a' }}>כניסה ביומטרית 👆</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* App info */}
      <View style={{ marginTop: 20, marginHorizontal: 14 }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: '#94a3b8', marginBottom: 8, textAlign: 'right', letterSpacing: 0.5 }}>
          אפליקציה
        </Text>
        <View style={{ backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 }}>
            <Text style={{ fontSize: 11, color: '#94a3b8' }}>v1.0.3 — BIKE-native</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a' }}>גרסה</Text>
              <Text style={{ fontSize: 18 }}>ℹ️</Text>
            </View>
          </View>
        </View>
      </View>

    </ScrollView>
  )
}
