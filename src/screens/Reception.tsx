import { useState, useCallback } from 'react'
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../lib/navigation'
import type { Bike } from '../types'
import { getBikeById, saveBike, saveReturnEvent, saveFaultEvent, saveCategoryChange } from '../lib/storage'
import { defaultEquipment, defaultInspection, hasFault, type EquipmentState, type InspectionState } from '../lib/forms'
import EquipmentForm from '../components/forms/EquipmentForm'
import InspectionForm from '../components/forms/InspectionForm'
import { uid } from '../lib/utils'

type Props = NativeStackScreenProps<RootStackParamList, 'Reception'>

const STEPS = ['ציוד שחזר', 'תקינות']

export default function Reception({ route, navigation }: Props) {
  const { id } = route.params
  const [bike, setBike] = useState<Bike | undefined>()
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(1)
  const [equipment, setEquipment] = useState<EquipmentState>(defaultEquipment)
  const [inspection, setInspection] = useState<InspectionState>(defaultInspection)
  const [saving, setSaving] = useState(false)

  useFocusEffect(useCallback(() => {
    getBikeById(id).then(b => { setBike(b ?? undefined); setLoading(false) })
  }, [id]))

  if (loading) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator color="#1e3a8a" size="large" />
    </View>
  )
  if (!bike) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#9ca3af' }}>אופניים לא נמצאו</Text>
    </View>
  )

  const handleSave = async () => {
    setSaving(true)
    const now = new Date().toISOString()
    const faulted = hasFault(inspection)
    const wasFixed = bike.status === 'faulty' && !faulted

    await saveReturnEvent({
      id: uid(), bike_id: id, received_at: now,
      battery_returned: equipment.battery,
      charger_returned: equipment.charger,
      chain_returned: equipment.chain,
      lock_returned: equipment.lock,
      seat_lock_returned: equipment.seatLock,
      all_keys_returned: equipment.allKeys,
      missing_keys: equipment.missingKeys,
      missing_keys_other: equipment.missingKeysOther || undefined,
      medical_equipment_returned: equipment.medicalReturned,
      medical_equipment_description: equipment.medicalDesc || undefined,
    })

    if (faulted) {
      await saveFaultEvent({
        id: uid(), bike_id: id, created_at: now,
        brake_pads_front: inspection.brakePadsFront,
        brake_pads_rear: inspection.brakePadsRear,
        brake_discs_front: inspection.brakeDiscsFront,
        brake_discs_rear: inspection.brakeDiscsRear,
        brake_oil_front: inspection.brakeOilFront,
        brake_oil_rear: inspection.brakeOilRear,
        front_tire: inspection.frontTire,
        rear_tire: inspection.rearTire,
        front_puncture: inspection.frontPuncture,
        rear_puncture: inspection.rearPuncture,
        front_light: inspection.frontLight,
        rear_light: inspection.rearLight,
        front_blinker: inspection.frontBlinker,
        rear_blinker: inspection.rearBlinker,
        horn: inspection.horn,
        motor_fault: inspection.motorFault,
        controller_fault: inspection.controllerFault,
        display_fault: inspection.displayFault,
        vehicle_mode: inspection.vehicleMode,
        ituran: inspection.ituran,
        notes: inspection.notes || undefined,
      })
    }

    await saveCategoryChange({
      id: uid(), bike_id: id, changed_at: now,
      from_category: 'out', to_category: 'returned',
    })

    await saveBike({
      ...bike,
      category: 'returned',
      status: faulted ? 'faulty' : 'ok',
      repaired_at: wasFixed ? now : bike.repaired_at,
      updated_at: now,
    })

    setSaving(false)
    navigation.replace('BikeDetail', { id })
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Stepper */}
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
        {STEPS.map((label, i) => {
          const n = i + 1; const done = step > n; const active = step === n
          return (
            <View key={n} style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ alignItems: 'center', flexDirection: 'row', gap: 4, flexShrink: 1 }}>
                <View style={{ width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: done ? '#10b981' : active ? '#1e3a8a' : '#e5e7eb' }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: done || active ? '#fff' : '#9ca3af' }}>{done ? '✓' : n}</Text>
                </View>
                <Text style={{ fontSize: 11, fontWeight: '600', color: active ? '#1e3a8a' : '#9ca3af' }} numberOfLines={1}>{label}</Text>
              </View>
              {n < STEPS.length && <View style={{ flex: 1, height: 2, backgroundColor: done ? '#10b981' : '#e5e7eb', marginHorizontal: 4, minWidth: 8 }} />}
            </View>
          )
        })}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {/* Bike info banner */}
        <View style={{ backgroundColor: '#fef9c3', borderRadius: 12, padding: 12, marginBottom: 12, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 14, color: '#92400e', fontWeight: '700' }}>
            #{bike.org_number}{bike.manufacturer ? ` · ${bike.manufacturer}` : ''}
          </Text>
          <Text style={{ fontSize: 12, color: '#78350f' }}>קליטה מרוכב</Text>
        </View>

        {step === 1 && (
          <View style={{ gap: 12 }}>
            <EquipmentForm value={equipment} onChange={setEquipment} sectionTitle="ציוד שחזר עם הכלי" />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={() => navigation.goBack()}
                style={{ flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#e5e7eb', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#64748b' }}>ביטול</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setStep(2)}
                style={{ flex: 2, paddingVertical: 14, borderRadius: 12, backgroundColor: '#1e3a8a', alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>הבא ←</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={{ gap: 12 }}>
            <InspectionForm value={inspection} onChange={setInspection} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={() => setStep(1)}
                style={{ flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#e5e7eb', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#64748b' }}>← חזור</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave}
                disabled={saving}
                style={{ flex: 2, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#d97706', opacity: saving ? 0.4 : 1 }}>
                {saving
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>שמור קליטה ✓</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  )
}
