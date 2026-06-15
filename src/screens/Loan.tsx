import { useState, useCallback } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../lib/navigation'
import type { Bike, Loan as LoanType } from '../types'
import { getBikeById, saveLoan, getActiveLoan, getReturnEvents } from '../lib/storage'
import { todayISO, formatDate, uid } from '../lib/utils'
import { defaultEquipment, type EquipmentState } from '../lib/forms'
import EquipmentForm from '../components/forms/EquipmentForm'

type Props = NativeStackScreenProps<RootStackParamList, 'Loan'>

const STEPS = ['פרטי שואל', 'ציוד שיוצא']

export default function Loan({ route, navigation }: Props) {
  const { id } = route.params
  const [bike, setBike] = useState<Bike | undefined>()
  const [activeLoan, setActiveLoan] = useState<LoanType | undefined>()
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(1)

  const [borrowerName, setBorrowerName] = useState('')
  const [borrowerIdNum, setBorrowerIdNum] = useState('')
  const [borrowerPhone, setBorrowerPhone] = useState('')
  const [loanDate, setLoanDate] = useState(todayISO())
  const [returnDate, setReturnDate] = useState('')
  const [alertDays, setAlertDays] = useState('3')
  const [notes, setNotes] = useState('')
  const [equipment, setEquipment] = useState<EquipmentState>(defaultEquipment)

  useFocusEffect(useCallback(() => {
    (async () => {
      const [b, al, returnEvents] = await Promise.all([getBikeById(id), getActiveLoan(id), getReturnEvents(id)])
      setBike(b); setActiveLoan(al)
      const lastReturn = returnEvents.at(-1)
      if (lastReturn) {
        setEquipment({
          battery: lastReturn.battery_returned, charger: lastReturn.charger_returned,
          chain: lastReturn.chain_returned, lock: lastReturn.lock_returned,
          seatLock: lastReturn.seat_lock_returned, allKeys: lastReturn.all_keys_returned,
          missingKeys: lastReturn.missing_keys ?? [], missingKeysOther: lastReturn.missing_keys_other ?? '',
          medicalReturned: lastReturn.medical_equipment_returned,
          medicalDesc: lastReturn.medical_equipment_description ?? '',
        })
      }
      setLoading(false)
    })()
  }, [id]))

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color="#1e3a8a" size="large" /></View>
  if (!bike) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: '#9ca3af' }}>אופניים לא נמצאו</Text></View>

  if (activeLoan) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f8fafc', padding: 16, gap: 12 }}>
        <View style={{ backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#fed7aa', borderRadius: 14, padding: 16, gap: 6 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#9a3412', textAlign: 'right' }}>אופניים אלו כרגע בהשאלה פעילה</Text>
          <Text style={{ fontSize: 13, color: '#92400e', textAlign: 'right' }}>שואל: {activeLoan.borrower_name}</Text>
          <Text style={{ fontSize: 13, color: '#92400e', textAlign: 'right' }}>החזרה עד: {formatDate(activeLoan.return_due_date)}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#e5e7eb', alignItems: 'center' }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#64748b' }}>חזור</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const handleSave = async () => {
    const loanId = uid()
    await saveLoan({
      id: loanId, bike_id: bike.id,
      loaned_at: loanDate || new Date().toISOString(),
      return_due_date: returnDate,
      alert_days_before: parseInt(alertDays) || 3,
      borrower_name: borrowerName.trim(),
      borrower_id_number: borrowerIdNum.trim(),
      borrower_phone: borrowerPhone.trim(),
      notes: notes.trim() || undefined,
      loaned_battery: equipment.battery, loaned_charger: equipment.charger,
      loaned_chain: equipment.chain, loaned_lock: equipment.lock,
      loaned_seat_lock: equipment.seatLock, loaned_all_keys: equipment.allKeys,
      loaned_missing_keys: equipment.missingKeys,
      loaned_missing_keys_other: equipment.missingKeysOther || undefined,
      loaned_medical: equipment.medicalReturned,
      loaned_medical_desc: equipment.medicalDesc || undefined,
    })
    navigation.replace('LoanDoc', { id: bike.id, loanId })
  }

  const canNext = borrowerName.trim() && borrowerIdNum.trim() && borrowerPhone.trim() && returnDate

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Stepper */}
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
        {STEPS.map((label, i) => {
          const n = i + 1; const done = step > n; const active = step === n
          return (
            <View key={n} style={{ flexDirection: 'row', alignItems: 'center', flex: n < STEPS.length ? 1 : 0 }}>
              <View style={{ alignItems: 'center', flexDirection: 'row', gap: 4 }}>
                <View style={{ width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: done ? '#10b981' : active ? '#f97316' : '#e5e7eb' }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: done || active ? '#fff' : '#9ca3af' }}>{done ? '✓' : n}</Text>
                </View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: active ? '#f97316' : '#9ca3af' }}>{label}</Text>
              </View>
              {n < STEPS.length && <View style={{ flex: 1, height: 2, backgroundColor: done ? '#10b981' : '#e5e7eb', marginHorizontal: 6 }} />}
            </View>
          )
        })}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <View style={{ backgroundColor: '#fff7ed', borderRadius: 12, padding: 12, marginBottom: 12 }}>
          <Text style={{ fontSize: 13, color: '#c2410c', fontWeight: '600', textAlign: 'right' }}>
            אופניים #{bike.org_number}{bike.manufacturer ? ` · ${bike.manufacturer}` : ''}
          </Text>
        </View>

        {step === 1 && (
          <View style={{ gap: 12 }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 14, borderWidth: 1, borderColor: '#f1f5f9' }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#94a3b8', textAlign: 'right' }}>פרטי שואל</Text>
              <Field label="שם מלא *" value={borrowerName} onChangeText={setBorrowerName} />
              <Field label="תעודת זהות *" value={borrowerIdNum} onChangeText={setBorrowerIdNum} keyboardType="numeric" />
              <Field label="טלפון *" value={borrowerPhone} onChangeText={setBorrowerPhone} keyboardType="phone-pad" />
            </View>
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 14, borderWidth: 1, borderColor: '#f1f5f9' }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#94a3b8', textAlign: 'right' }}>תאריכים</Text>
              <Field label="תאריך השאלה *" value={loanDate} onChangeText={setLoanDate} placeholder="YYYY-MM-DD" />
              <Field label="תאריך החזרה מבוקש *" value={returnDate} onChangeText={setReturnDate} placeholder="YYYY-MM-DD" />
              <View>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 6, textAlign: 'right' }}>התרע לפני החזרה</Text>
                <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {[['1', 'יום'], ['2', 'יומיים'], ['3', '3 ימים'], ['5', '5 ימים'], ['7', 'שבוע']].map(([val, label]) => (
                    <TouchableOpacity key={val} onPress={() => setAlertDays(val)}
                      style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 99, borderWidth: 1.5, backgroundColor: alertDays === val ? '#1e3a8a' : '#fff', borderColor: alertDays === val ? '#1e3a8a' : '#e5e7eb' }}>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: alertDays === val ? '#fff' : '#64748b' }}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 5, textAlign: 'right' }}>הערות</Text>
                <TextInput value={notes} onChangeText={setNotes} multiline numberOfLines={2} placeholderTextColor="#9ca3af" placeholder="הערות..."
                  style={{ borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, textAlign: 'right', minHeight: 56 }} />
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={{ flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#e5e7eb', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#64748b' }}>ביטול</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setStep(2)} disabled={!canNext}
                style={{ flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#f97316', alignItems: 'center', opacity: canNext ? 1 : 0.4 }}>
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>הבא ←</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={{ gap: 12 }}>
            <View style={{ backgroundColor: '#eff6ff', borderRadius: 10, padding: 10 }}>
              <Text style={{ fontSize: 12, color: '#1d4ed8', textAlign: 'right' }}>סמן את הציוד שיוצא עם הכלי — זה ישמש כבסיס לבדיקת החזרה</Text>
            </View>
            <EquipmentForm value={equipment} onChange={setEquipment} sectionTitle="ציוד שיוצא עם הכלי" />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={() => setStep(1)} style={{ flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#e5e7eb', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#64748b' }}>← חזור</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={{ flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#f97316', alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>אשר השאלה</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

function Field({ label, value, onChangeText, placeholder, keyboardType }: {
  label: string; value: string; onChangeText: (t: string) => void; placeholder?: string; keyboardType?: any
}) {
  return (
    <View>
      <Text style={{ fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 5, textAlign: 'right' }}>{label}</Text>
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#9ca3af"
        keyboardType={keyboardType}
        style={{ borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, textAlign: 'right', backgroundColor: '#fafafa' }} />
    </View>
  )
}
