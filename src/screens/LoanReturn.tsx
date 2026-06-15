import { useState, useCallback } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../lib/navigation'
import type { Bike, Loan } from '../types'
import { MISSING_KEYS_OPTIONS } from '../types'
import { getBikeById, getActiveLoan, saveLoan, saveBike, saveReturnEvent, saveFaultEvent } from '../lib/storage'
import { defaultInspection, hasFault, type InspectionState } from '../lib/forms'
import InspectionForm from '../components/forms/InspectionForm'
import { uid } from '../lib/utils'

type Props = NativeStackScreenProps<RootStackParamList, 'LoanReturn'>

const STEPS = ['ציוד שחזר', 'תקינות']

type ReturnedState = {
  battery: boolean; charger: boolean; chain: boolean; lock: boolean; seatLock: boolean
  allKeys: boolean; missingKeys: string[]; missingKeysOther: string
  medical: boolean; medicalDesc: string
}

export default function LoanReturn({ route, navigation }: Props) {
  const { id } = route.params
  const [bike, setBike] = useState<Bike | undefined>()
  const [loan, setLoan] = useState<Loan | undefined>()
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(1)
  const [inspection, setInspection] = useState<InspectionState>(defaultInspection)
  const [returned, setReturned] = useState<ReturnedState>({
    battery: false, charger: false, chain: false, lock: false, seatLock: false,
    allKeys: true, missingKeys: [], missingKeysOther: '', medical: false, medicalDesc: '',
  })

  useFocusEffect(useCallback(() => {
    (async () => {
      const [b, l] = await Promise.all([getBikeById(id), getActiveLoan(id)])
      setBike(b); setLoan(l)
      if (l) {
        setReturned(prev => ({
          ...prev,
          battery: l.loaned_battery ?? false, charger: l.loaned_charger ?? false,
          chain: l.loaned_chain ?? false, lock: l.loaned_lock ?? false,
          seatLock: l.loaned_seat_lock ?? false, allKeys: l.loaned_all_keys ?? true,
          missingKeys: l.loaned_missing_keys ?? [], missingKeysOther: l.loaned_missing_keys_other ?? '',
        }))
      }
      setLoading(false)
    })()
  }, [id]))

  const set = (patch: Partial<ReturnedState>) => setReturned(p => ({ ...p, ...patch }))

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color="#1e3a8a" size="large" /></View>

  if (!bike || !loan) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f8fafc', padding: 16, gap: 12 }}>
        <Text style={{ textAlign: 'center', color: '#9ca3af', paddingVertical: 32 }}>לא נמצאה השאלה פעילה</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#e5e7eb', alignItems: 'center' }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#64748b' }}>חזור</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const handleSave = async () => {
    const now = new Date().toISOString()
    const faulted = hasFault(inspection)
    const wasFixed = bike.status === 'faulty' && !faulted

    await saveReturnEvent({
      id: uid(), bike_id: bike.id, received_at: now,
      battery_returned: loan.loaned_battery ? returned.battery : false,
      charger_returned: loan.loaned_charger ? returned.charger : false,
      chain_returned: loan.loaned_chain ? returned.chain : false,
      lock_returned: loan.loaned_lock ? returned.lock : false,
      seat_lock_returned: loan.loaned_seat_lock ? returned.seatLock : false,
      all_keys_returned: loan.loaned_all_keys ? returned.allKeys : false,
      missing_keys: returned.missingKeys, missing_keys_other: returned.missingKeysOther || undefined,
      medical_equipment_returned: returned.medical, medical_equipment_description: returned.medicalDesc || undefined,
    })

    if (faulted) {
      await saveFaultEvent({
        id: uid(), bike_id: bike.id, created_at: now,
        brake_pads_front: inspection.brakePadsFront, brake_pads_rear: inspection.brakePadsRear,
        brake_discs_front: inspection.brakeDiscsFront, brake_discs_rear: inspection.brakeDiscsRear,
        brake_oil_front: inspection.brakeOilFront, brake_oil_rear: inspection.brakeOilRear,
        front_tire: inspection.frontTire, rear_tire: inspection.rearTire,
        front_puncture: inspection.frontPuncture, rear_puncture: inspection.rearPuncture,
        front_light: inspection.frontLight, rear_light: inspection.rearLight,
        front_blinker: inspection.frontBlinker, rear_blinker: inspection.rearBlinker,
        horn: inspection.horn, motor_fault: inspection.motorFault,
        controller_fault: inspection.controllerFault, display_fault: inspection.displayFault,
        vehicle_mode: inspection.vehicleMode, ituran: inspection.ituran,
        notes: inspection.notes || undefined,
      })
    }

    await saveLoan({ ...loan, returned_at: now })
    await saveBike({ ...bike, status: faulted ? 'faulty' : 'ok', repaired_at: wasFixed ? now : bike.repaired_at, updated_at: now })
    navigation.goBack()
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Stepper */}
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
        {STEPS.map((label, i) => {
          const n = i + 1; const done = step > n; const active = step === n
          return (
            <View key={n} style={{ flexDirection: 'row', alignItems: 'center', flex: n < STEPS.length ? 1 : 0 }}>
              <View style={{ alignItems: 'center', flexDirection: 'row', gap: 4 }}>
                <View style={{ width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: done ? '#10b981' : active ? '#1e3a8a' : '#e5e7eb' }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: done || active ? '#fff' : '#9ca3af' }}>{done ? '✓' : n}</Text>
                </View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: active ? '#1e3a8a' : '#9ca3af' }}>{label}</Text>
              </View>
              {n < STEPS.length && <View style={{ flex: 1, height: 2, backgroundColor: done ? '#10b981' : '#e5e7eb', marginHorizontal: 6 }} />}
            </View>
          )
        })}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <View style={{ backgroundColor: '#eff6ff', borderRadius: 12, padding: 12, marginBottom: 12 }}>
          <Text style={{ fontSize: 13, color: '#1d4ed8', fontWeight: '600', textAlign: 'right' }}>
            אופניים #{bike.org_number} · החזרה מ-{loan.borrower_name}
          </Text>
        </View>

        {step === 1 && (
          <View style={{ gap: 12 }}>
            {/* Equipment */}
            <View style={{ backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9' }}>
              <View style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#94a3b8', textAlign: 'right' }}>ציוד שחזר</Text>
              </View>
              <View style={{ paddingHorizontal: 16 }}>
                {[
                  ['loaned_battery', 'battery', 'סוללה'],
                  ['loaned_charger', 'charger', 'מטען'],
                  ['loaned_chain', 'chain', 'שרשרת'],
                  ['loaned_lock', 'lock', 'מנעול'],
                  ['loaned_seat_lock', 'seatLock', 'מנעול כיסא'],
                ].map(([loanKey, retKey, label]) => (
                  loan[loanKey as keyof Loan]
                    ? <ReturnRow key={retKey} label={label} checked={returned[retKey as keyof ReturnedState] as boolean} onChange={v => set({ [retKey]: v })} />
                    : <GrayRow key={retKey} label={label} />
                ))}
              </View>
            </View>

            {/* Keys */}
            <View style={{ backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9' }}>
              <View style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#94a3b8', textAlign: 'right' }}>מפתחות</Text>
              </View>
              <View style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
                {loan.loaned_all_keys ? (
                  <View style={{ gap: 10 }}>
                    <RadioRow label="כל המפתחות הוחזרו" checked={returned.allKeys} onPress={() => set({ allKeys: true, missingKeys: [] })} />
                    <RadioRow label="חסרים מפתחות" checked={!returned.allKeys} onPress={() => set({ allKeys: false })} />
                    {!returned.allKeys && (
                      <View style={{ paddingRight: 16, gap: 8 }}>
                        {MISSING_KEYS_OPTIONS.map(opt => (
                          <View key={opt.value}>
                            <ReturnRow label={opt.label}
                              checked={returned.missingKeys.includes(opt.value)}
                              onChange={checked => set({ missingKeys: checked ? [...returned.missingKeys, opt.value] : returned.missingKeys.filter(k => k !== opt.value) })} />
                            {opt.value === 'other' && returned.missingKeys.includes('other') && (
                              <TextInput value={returned.missingKeysOther} onChangeText={t => set({ missingKeysOther: t })}
                                placeholder="פרט מה חסר..." placeholderTextColor="#9ca3af"
                                style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, fontSize: 13, textAlign: 'right', marginTop: 4 }} />
                            )}
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ) : <Text style={{ fontSize: 13, color: '#9ca3af', opacity: 0.6, textAlign: 'right' }}>לא יצאו מפתחות עם הכלי</Text>}
              </View>
            </View>

            {/* Medical */}
            <View style={{ backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9' }}>
              <View style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#94a3b8', textAlign: 'right' }}>ציוד רפואי</Text>
              </View>
              <View style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
                {loan.loaned_medical ? (
                  <View style={{ gap: 8 }}>
                    <ReturnRow label="ציוד רפואי הוחזר" checked={returned.medical} onChange={v => set({ medical: v })} />
                    {returned.medical && (
                      <TextInput value={returned.medicalDesc} onChangeText={t => set({ medicalDesc: t })} multiline numberOfLines={2}
                        placeholder="תאר את הציוד שהוחזר..." placeholderTextColor="#9ca3af"
                        style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, textAlign: 'right', minHeight: 56 }} />
                    )}
                  </View>
                ) : <Text style={{ fontSize: 13, color: '#9ca3af', opacity: 0.6, textAlign: 'right' }}>לא יצא ציוד רפואי עם הכלי</Text>}
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={{ flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#e5e7eb', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#64748b' }}>ביטול</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setStep(2)} style={{ flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#1e3a8a', alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>הבא ←</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={{ gap: 12 }}>
            <InspectionForm value={inspection} onChange={setInspection} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={() => setStep(1)} style={{ flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#e5e7eb', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#64748b' }}>← חזור</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave}
                style={{ flex: 2, paddingVertical: 14, borderRadius: 12, backgroundColor: '#1e3a8a', alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>שמור החזרה</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

function ReturnRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <TouchableOpacity onPress={() => onChange(!checked)}
      style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#f8fafc' }}>
      <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: checked ? '#1e3a8a' : '#d1d5db', backgroundColor: checked ? '#1e3a8a' : '#fff', alignItems: 'center', justifyContent: 'center' }}>
        {checked && <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>✓</Text>}
      </View>
      <Text style={{ fontSize: 14, color: checked ? '#374151' : '#dc2626', fontWeight: checked ? '400' : '600', flex: 1, textAlign: 'right', paddingRight: 10 }}>{label}</Text>
    </TouchableOpacity>
  )
}

function GrayRow({ label }: { label: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#f8fafc', opacity: 0.4 }}>
      <View style={{ backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 }}>
        <Text style={{ fontSize: 10, color: '#94a3b8' }}>לא היה</Text>
      </View>
      <Text style={{ fontSize: 14, color: '#9ca3af', textDecorationLine: 'line-through', textAlign: 'right' }}>{label}</Text>
    </View>
  )
}

function RadioRow({ label, checked, onPress }: { label: string; checked: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 }}>
      <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: checked ? '#1e3a8a' : '#d1d5db', alignItems: 'center', justifyContent: 'center' }}>
        {checked && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#1e3a8a' }} />}
      </View>
      <Text style={{ fontSize: 14, color: '#374151', flex: 1, textAlign: 'right', paddingRight: 10 }}>{label}</Text>
    </TouchableOpacity>
  )
}
