import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Modal,
} from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../lib/navigation'
import type { Bike, BikeCategory } from '../types'
import { MANUFACTURERS } from '../types'
import { saveBike, orgNumberActiveExists, getOutBikeByOrgNumber, saveReturnEvent, saveFaultEvent, saveCategoryChange } from '../lib/storage'
import { defaultEquipment, defaultInspection, hasFault, type EquipmentState, type InspectionState } from '../lib/forms'
import EquipmentForm from '../components/forms/EquipmentForm'
import InspectionForm from '../components/forms/InspectionForm'
import { uid } from '../lib/utils'

type Props = NativeStackScreenProps<RootStackParamList, 'NewBike'>

const CATEGORIES: { value: BikeCategory; label: string; color: string }[] = [
  { value: 'new',      label: 'חדש',         color: '#2563eb' },
  { value: 'returned', label: 'חזר מרוכב',   color: '#d97706' },
  { value: 'for_sale', label: 'למכירה',       color: '#15803d' },
]

const STEPS = ['פרטים', 'ציוד', 'תקינות']
const MFR_OPTIONS = [...(MANUFACTURERS as readonly string[]), 'אחר']

export default function NewBike({ navigation }: Props) {
  const [step, setStep] = useState(1)
  const [bikeId] = useState(uid)

  const [orgNumber, setOrgNumber] = useState('')
  const [frameNumber, setFrameNumber] = useState('')
  const [licensePlate, setLicensePlate] = useState('')
  const [manufacturer, setManufacturer] = useState('')
  const [manufacturerCustom, setManufacturerCustom] = useState('')
  const [showMfrPicker, setShowMfrPicker] = useState(false)
  const [category, setCategory] = useState<BikeCategory>('new')
  const [orgError, setOrgError] = useState('')
  const [frameError, setFrameError] = useState('')
  const [duplicateId, setDuplicateId] = useState<string | null>(null)

  const [equipment, setEquipment] = useState<EquipmentState>(defaultEquipment)
  const [inspection, setInspection] = useState<InspectionState>(defaultInspection)
  const [saving, setSaving] = useState(false)

  const mfrDisplay = manufacturer === 'אחר'
    ? (manufacturerCustom.trim() || 'אחר')
    : manufacturer || ''

  const goStep2 = async () => {
    const trimmed = orgNumber.trim()
    if (!trimmed) { setOrgError('שדה חובה'); return }
    if (category === 'for_sale' && !frameNumber.trim()) { setFrameError('מספר שלדה חובה לכלי למכירה'); return }

    const exists = await orgNumberActiveExists(trimmed)
    if (exists) {
      setOrgError(`מספר ארגוני ${trimmed} כבר קיים במערכת`)
      setDuplicateId(null)
      return
    }

    // Bike is 'out' — route to reception instead of creating a new record
    const outBike = await getOutBikeByOrgNumber(trimmed)
    if (outBike) {
      navigation.replace('Reception', { id: outBike.id })
      return
    }

    setStep(2)
  }

  const handleSave = async () => {
    setSaving(true)
    const now = new Date().toISOString()
    const faulted = hasFault(inspection)
    const mfr = manufacturer === 'אחר'
      ? (manufacturerCustom.trim() || 'אחר')
      : manufacturer || undefined

    const bike: Bike = {
      id: bikeId, org_number: orgNumber.trim(),
      frame_number: frameNumber.trim() || undefined,
      license_plate: licensePlate.trim() || undefined,
      manufacturer: mfr, category,
      status: faulted ? 'faulty' : 'ok',
      created_at: now, updated_at: now,
      repaired_at: faulted ? undefined : now,
    }

    await saveBike(bike)
    await saveCategoryChange({ id: uid(), bike_id: bikeId, changed_at: now, to_category: category })
    await saveReturnEvent({
      id: uid(), bike_id: bikeId, received_at: now,
      battery_returned: equipment.battery, charger_returned: equipment.charger,
      chain_returned: equipment.chain, lock_returned: equipment.lock,
      seat_lock_returned: equipment.seatLock, all_keys_returned: equipment.allKeys,
      missing_keys: equipment.missingKeys, missing_keys_other: equipment.missingKeysOther || undefined,
      medical_equipment_returned: equipment.medicalReturned,
      medical_equipment_description: equipment.medicalDesc || undefined,
    })

    if (faulted) {
      await saveFaultEvent({
        id: uid(), bike_id: bikeId, created_at: now,
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

    setSaving(false)
    navigation.replace('BikeDetail', { id: bikeId })
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Stepper */}
      {(() => {
        const nodes: React.ReactNode[] = []
        STEPS.forEach((label, i) => {
          const n = i + 1; const done = step > n; const active = step === n
          if (i > 0) nodes.push(
            <View key={`l${i}`} style={{ flex: 1, height: 2, backgroundColor: step > i ? '#10b981' : '#e5e7eb', alignSelf: 'flex-start', marginTop: 14, marginHorizontal: 4 }} />
          )
          nodes.push(
            <View key={`s${n}`} style={{ alignItems: 'center', minWidth: 52 }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: done ? '#10b981' : active ? '#1e3a8a' : '#e5e7eb' }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: done || active ? '#fff' : '#9ca3af' }}>{done ? '✓' : n}</Text>
              </View>
              <Text style={{ fontSize: 11, fontWeight: '600', color: active ? '#1e3a8a' : '#9ca3af', marginTop: 4 }}>{label}</Text>
            </View>
          )
        })
        return (
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
            {nodes}
          </View>
        )
      })()}

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">

        {/* ── Step 1 ── */}
        {step === 1 && (
          <View style={{ gap: 12 }}>

            {/* Category toggle — at the top */}
            <View style={{ flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 14, padding: 4, gap: 2 }}>
              {CATEGORIES.map(c => (
                <TouchableOpacity key={c.value} onPress={() => setCategory(c.value)}
                  style={{ flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: 'center',
                    backgroundColor: category === c.value ? '#fff' : 'transparent',
                    shadowColor: category === c.value ? '#000' : 'transparent',
                    shadowOpacity: category === c.value ? 0.08 : 0,
                    shadowRadius: 4, elevation: category === c.value ? 2 : 0,
                  }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: category === c.value ? c.color : '#94a3b8' }}>
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Fields */}
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 14, borderWidth: 1, borderColor: '#f1f5f9' }}>
              <Field label="מספר ארגוני *" value={orgNumber}
                onChangeText={t => { setOrgNumber(t); setOrgError(''); setDuplicateId(null) }}
                placeholder="לדוגמה: 007" keyboardType="numeric" error={orgError} />
              {duplicateId && (
                <TouchableOpacity onPress={() => navigation.replace('BikeDetail', { id: duplicateId })}>
                  <Text style={{ fontSize: 12, color: '#2563eb', textAlign: 'right', textDecorationLine: 'underline' }}>צפה באופניים הקיים</Text>
                </TouchableOpacity>
              )}
              <Field label={category === 'for_sale' ? 'מספר שלדה *' : 'מספר שלדה'} value={frameNumber}
                onChangeText={t => { setFrameNumber(t); setFrameError('') }}
                placeholder={category === 'for_sale' ? 'חובה לכלי למכירה' : 'אופציונלי'} error={frameError} />
              <Field label="לוחית רישוי" value={licensePlate} onChangeText={setLicensePlate} placeholder="אופציונלי" />

              {/* Manufacturer — single-line dropdown */}
              <View>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 5, textAlign: 'right' }}>יצרן</Text>
                <TouchableOpacity onPress={() => setShowMfrPicker(true)}
                  style={{ borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fafafa' }}>
                  <Text style={{ fontSize: 13, color: '#94a3b8' }}>▾</Text>
                  <Text style={{ fontSize: 14, color: mfrDisplay ? '#0f172a' : '#9ca3af' }}>
                    {mfrDisplay || 'בחר יצרן...'}
                  </Text>
                </TouchableOpacity>
                {manufacturer === 'אחר' && (
                  <TextInput value={manufacturerCustom} onChangeText={setManufacturerCustom}
                    placeholder="הקלד שם יצרן..." placeholderTextColor="#9ca3af"
                    style={{ borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, textAlign: 'right', marginTop: 6 }} />
                )}
              </View>
            </View>

            <TouchableOpacity onPress={goStep2}
              style={{ backgroundColor: '#1e3a8a', borderRadius: 14, paddingVertical: 16, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>הבא ←</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Step 2 ── */}
        {step === 2 && (
          <View style={{ gap: 12 }}>
            <EquipmentForm value={equipment} onChange={setEquipment} sectionTitle="ציוד שהגיע עם הכלי" />
            <NavButtons onBack={() => setStep(1)} onNext={() => setStep(3)} />
          </View>
        )}

        {/* ── Step 3 ── */}
        {step === 3 && (
          <View style={{ gap: 12 }}>
            <InspectionForm value={inspection} onChange={setInspection} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={() => setStep(2)}
                style={{ flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#e5e7eb', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#64748b' }}>← חזור</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave}
                disabled={saving}
                style={{ flex: 2, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#1e3a8a', opacity: saving ? 0.4 : 1 }}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>שמור ✓</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Manufacturer picker modal */}
      <Modal visible={showMfrPicker} transparent animationType="slide" statusBarTranslucent>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowMfrPicker(false)} />
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 40, width: '100%' }}>
          <View style={{ paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => setShowMfrPicker(false)}>
              <Text style={{ fontSize: 14, color: '#64748b' }}>סגור</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#0f172a' }}>בחר יצרן</Text>
          </View>
          {['', ...MFR_OPTIONS].map(m => (
            <TouchableOpacity key={m || 'none'}
              onPress={() => { setManufacturer(m); setManufacturerCustom(''); setShowMfrPicker(false) }}
              style={{ paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f8fafc', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 14, color: manufacturer === m ? '#1e3a8a' : '#94a3b8' }}>
                {manufacturer === m ? '✓' : ''}
              </Text>
              <Text style={{ fontSize: 15, color: manufacturer === m ? '#1e3a8a' : '#374151', fontWeight: manufacturer === m ? '700' : '400' }}>
                {m || 'ללא יצרן'}
              </Text>
            </TouchableOpacity>
          ))}
          </View>
        </View>
      </Modal>
    </View>
  )
}

function Field({ label, value, onChangeText, placeholder, keyboardType, error }: {
  label: string; value: string; onChangeText: (t: string) => void
  placeholder?: string; keyboardType?: any; error?: string
}) {
  return (
    <View>
      <Text style={{ fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 5, textAlign: 'right' }}>{label}</Text>
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder}
        placeholderTextColor="#9ca3af" keyboardType={keyboardType}
        style={{ borderWidth: 1.5, borderColor: error ? '#ef4444' : '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, textAlign: 'right', color: '#0f172a', backgroundColor: '#fafafa' }} />
      {!!error && <Text style={{ fontSize: 11, color: '#ef4444', marginTop: 3, textAlign: 'right' }}>{error}</Text>}
    </View>
  )
}

function NavButtons({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      <TouchableOpacity onPress={onBack} style={{ flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#e5e7eb', alignItems: 'center' }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#64748b' }}>← חזור</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onNext} style={{ flex: 2, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#1e3a8a' }}>
        <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>הבא ←</Text>
      </TouchableOpacity>
    </View>
  )
}
