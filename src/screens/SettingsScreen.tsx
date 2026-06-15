import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../lib/navigation'
import { useAuth } from '../context/AuthContext'

type Props = NativeStackScreenProps<RootStackParamList, 'SettingsScreen'>

const SOON_ITEMS = [
  {
    section: 'ניהול כלים',
    rows: [
      { icon: '🔧', label: 'ניהול כלים מתקדם', sub: 'עריכה ידנית, מחיקה, שינוי סטטוס' },
      { icon: '📊', label: 'ייצוא נתונים', sub: 'CSV / Excel' },
    ],
  },
  {
    section: 'מסמכים',
    rows: [
      { icon: '✍️', label: 'חתימת מוכר קבועה', sub: 'שמירת חתימה לשטרי מכר' },
      { icon: '📄', label: 'שיתוף מסמכים', sub: 'PDF של שטר מכר / טופס השאלה' },
    ],
  },
]

export default function SettingsScreen({ navigation }: Props) {
  const { viewerProfile, isAdmin } = useAuth()

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }} contentContainerStyle={{ paddingBottom: 40 }}>

      {/* ── Users section (admin only) ── */}
      {isAdmin && (
        <View style={{ marginTop: 20, marginHorizontal: 14 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#94a3b8', marginBottom: 8, textAlign: 'right', letterSpacing: 0.5 }}>
            ניהול משתמשים
          </Text>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9' }}>

            {/* Viewer user row */}
            <TouchableOpacity
              onPress={() => navigation.navigate('SetupViewer')}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {viewerProfile ? (
                  <View style={{ backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#15803d' }}>פעיל</Text>
                  </View>
                ) : (
                  <View style={{ backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748b' }}>לא מוגדר</Text>
                  </View>
                )}
                <Text style={{ fontSize: 11, color: '#94a3b8' }}>
                  {viewerProfile ? viewerProfile.name : 'הוסף משתמש צפיה'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a', textAlign: 'right' }}>משתמש צפיה</Text>
                <Text style={{ fontSize: 18 }}>👁</Text>
              </View>
            </TouchableOpacity>

          </View>
        </View>
      )}

      {/* ── Soon items ── */}
      {SOON_ITEMS.map(group => (
        <View key={group.section} style={{ marginTop: 20, marginHorizontal: 14 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#94a3b8', marginBottom: 8, textAlign: 'right', letterSpacing: 0.5 }}>
            {group.section.toUpperCase()}
          </Text>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9' }}>
            {group.rows.map((row, i) => (
              <TouchableOpacity
                key={row.label}
                onPress={() => Alert.alert('בקרוב', 'תכונה זו תהיה זמינה בגרסה הבאה 🔜')}
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  paddingHorizontal: 16, paddingVertical: 14,
                  borderTopWidth: i === 0 ? 0 : 1, borderTopColor: '#f8fafc',
                }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ backgroundColor: '#fef9c3', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                    <Text style={{ fontSize: 9, fontWeight: '700', color: '#92400e' }}>בקרוב</Text>
                  </View>
                  <Text style={{ fontSize: 11, color: '#94a3b8' }}>{row.sub}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a', textAlign: 'right' }}>{row.label}</Text>
                  <Text style={{ fontSize: 18 }}>{row.icon}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      {/* ── App info ── */}
      <View style={{ marginTop: 20, marginHorizontal: 14 }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: '#94a3b8', marginBottom: 8, textAlign: 'right', letterSpacing: 0.5 }}>
          אפליקציה
        </Text>
        <View style={{ backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 }}>
            <Text style={{ fontSize: 11, color: '#94a3b8' }}>v1.0.0 — BIKE-native</Text>
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
