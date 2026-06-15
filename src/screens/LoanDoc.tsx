import { useState, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../lib/navigation'
import type { Bike, Loan } from '../types'
import { MISSING_KEYS_OPTIONS } from '../types'
import { getBikeById, getLoans } from '../lib/storage'
import { formatDate } from '../lib/utils'

type Props = NativeStackScreenProps<RootStackParamList, 'LoanDoc'>

export default function LoanDoc({ route, navigation }: Props) {
  const { id, loanId } = route.params
  const [bike, setBike] = useState<Bike | undefined>()
  const [loan, setLoan] = useState<Loan | undefined>()
  const [loading, setLoading] = useState(true)

  useFocusEffect(useCallback(() => {
    (async () => {
      const [b, loans] = await Promise.all([getBikeById(id), getLoans(id)])
      setBike(b)
      setLoan(loans.find(l => l.id === loanId))
      setLoading(false)
    })()
  }, [id, loanId]))

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color="#1e3a8a" size="large" /></View>
  if (!bike || !loan) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: '#9ca3af' }}>לא נמצא טופס השאלה</Text></View>

  const missingKeyLabels = loan.loaned_missing_keys?.map(k => MISSING_KEYS_OPTIONS.find(o => o.value === k)?.label ?? k) ?? []

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 16 }}>
        <View style={{ alignItems: 'center', marginBottom: 20, paddingBottom: 16, borderBottomWidth: 2, borderBottomColor: '#f97316' }}>
          <Text style={{ fontSize: 20, fontWeight: '900', color: '#f97316' }}>נוסח השאלה</Text>
          <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>איחוד הצלה ישראל</Text>
        </View>

        <Row label="תאריך השאלה" value={formatDate(loan.loaned_at)} />
        <Row label="תאריך החזרה מבוקש" value={formatDate(loan.return_due_date)} highlight />
        <Divider />

        <Text style={{ fontSize: 13, fontWeight: '800', color: '#374151', marginBottom: 8, textAlign: 'right' }}>פרטי האופניים</Text>
        <Row label="מספר ארגוני" value={`#${bike.org_number}`} />
        {bike.frame_number && <Row label="מספר שלדה" value={bike.frame_number} />}
        {bike.manufacturer && <Row label="יצרן" value={bike.manufacturer} />}
        <Divider />

        <Text style={{ fontSize: 13, fontWeight: '800', color: '#374151', marginBottom: 8, textAlign: 'right' }}>פרטי השואל</Text>
        <Row label="שם מלא" value={loan.borrower_name} />
        <Row label="תעודת זהות" value={loan.borrower_id_number} />
        <Row label="טלפון" value={loan.borrower_phone} />
        <Divider />

        <Text style={{ fontSize: 13, fontWeight: '800', color: '#374151', marginBottom: 8, textAlign: 'right' }}>ציוד שיצא</Text>
        {[
          { key: 'loaned_battery', label: 'סוללה' }, { key: 'loaned_charger', label: 'מטען' },
          { key: 'loaned_chain', label: 'שרשרת' }, { key: 'loaned_lock', label: 'מנעול' },
          { key: 'loaned_seat_lock', label: 'מנעול כיסא' },
        ].filter(x => loan[x.key as keyof Loan]).map(x => (
          <Row key={x.key} label={x.label} value="✓" />
        ))}
        {loan.loaned_all_keys ? <Row label="מפתחות" value="כל המפתחות" /> : missingKeyLabels.length > 0 && (
          <Row label="מפתחות חסרים" value={missingKeyLabels.join(', ')} />
        )}
        {loan.loaned_medical && <Row label="ציוד רפואי" value={loan.loaned_medical_desc || '✓'} />}
        {loan.notes && <><Divider /><Row label="הערות" value={loan.notes} /></>}

        <View style={{ marginTop: 32, flexDirection: 'row', justifyContent: 'space-between', paddingTop: 16, borderTopWidth: 1, borderTopColor: '#e5e7eb' }}>
          <View style={{ alignItems: 'center', gap: 4 }}>
            <View style={{ width: 120, height: 1, backgroundColor: '#374151' }} />
            <Text style={{ fontSize: 11, color: '#6b7280' }}>חתימת השואל</Text>
          </View>
          <View style={{ alignItems: 'center', gap: 4 }}>
            <View style={{ width: 120, height: 1, backgroundColor: '#374151' }} />
            <Text style={{ fontSize: 11, color: '#6b7280' }}>חתימת המשאיל</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity onPress={() => navigation.navigate('BikeDetail', { id })}
        style={{ backgroundColor: '#1e3a8a', borderRadius: 14, paddingVertical: 15, alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>חזור לכרטיס האופניים</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
      <Text style={{ fontSize: highlight ? 15 : 14, fontWeight: highlight ? '800' : '600', color: highlight ? '#f97316' : '#0f172a' }}>{value}</Text>
      <Text style={{ fontSize: 13, color: '#6b7280' }}>{label}</Text>
    </View>
  )
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: '#f1f5f9', marginVertical: 12 }} />
}
