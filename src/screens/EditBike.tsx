import { useState, useCallback } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, ActivityIndicator } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../lib/navigation'
import type { Bike } from '../types'
import { MANUFACTURERS } from '../types'
import { getBikeById, saveBike, deleteBike, saveIdentityChange, orgNumberActiveExists } from '../lib/storage'
import { uid } from '../lib/utils'

type Props = NativeStackScreenProps<RootStackParamList, 'EditBike'>

export default function EditBike({ route, navigation }: Props) {
  const { id } = route.params
  const [bike, setBike] = useState<Bike | undefined>()
  const [orgNumber, setOrgNumber] = useState('')
  const [frameNumber, setFrameNumber] = useState('')
  const [licensePlate, setLicensePlate] = useState('')
  const [manufacturer, setManufacturer] = useState('')
  const [manufacturerCustom, setManufacturerCustom] = useState('')
  const [orgError, setOrgError] = useState('')
  const [showDelete, setShowDelete] = useState(false)
  const [saving, setSaving] = useState(false)

  useFocusEffect(useCallback(() => {
    (async () => {
      const b = await getBikeById(id)
      if (b) {
        setBike(b)
        setOrgNumber(b.org_number)
        setFrameNumber(b.frame_number ?? '')
        setLicensePlate(b.license_plate ?? '')
        const known = (MANUFACTURERS as readonly string[]).includes(b.manufacturer ?? '')
        setManufacturer(known ? (b.manufacturer ?? '') : (b.manufacturer ? 'אחר' : ''))
        setManufacturerCustom(known ? '' : (b.manufacturer ?? ''))
      }
    })()
  }, [id]))

  if (!bike) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color="#1e3a8a" /></View>

  const handleSave = async () => {
    const trimOrg = orgNumber.trim()
    if (!trimOrg) { setOrgError('שדה חובה'); return }
    const exists = await orgNumberActiveExists(trimOrg, id)
    if (exists) { setOrgError(`מספר ארגוני ${trimOrg} כבר קיים`); return }

    setSaving(true)
    const now = new Date().toISOString()
    const resolvedMfr = manufacturer === 'אחר' ? (manufacturerCustom.trim() || 'אחר') : (manufacturer || undefined)

    const fields: Array<{ field: 'org_number' | 'frame_number' | 'license_plate' | 'manufacturer'; oldV?: string; newV?: string }> = [
      { field: 'org_number', oldV: bike.org_number, newV: trimOrg },
      { field: 'frame_number', oldV: bike.frame_number, newV: frameNumber.trim() || undefined },
      { field: 'license_plate', oldV: bike.license_plate, newV: licensePlate.trim() || undefined },
      { field: 'manufacturer', oldV: bike.manufacturer, newV: resolvedMfr },
    ]
    for (const { field, oldV, newV } of fields) {
      if (oldV !== newV) {
        await saveIdentityChange({ id: uid(), bike_id: bike.id, changed_at: now, field, old_value: oldV, new_value: newV })
      }
    }

    await saveBike({ ...bike, org_number: trimOrg, frame_number: frameNumber.trim() || undefined, license_plate: licensePlate.trim() || undefined, manufacturer: resolvedMfr, updated_at: now })
    setSaving(false)
    navigation.goBack()
  }

  const handleDelete = async () => {
    await deleteBike(bike.id)
    navigation.popToTop()
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 14, marginBottom: 12, borderWidth: 1, borderColor: '#f1f5f9' }}>
        <Field label="מספר ארגוני *" value={orgNumber}
          onChangeText={t => { setOrgNumber(t); setOrgError('') }}
          error={orgError} keyboardType="numeric" />
        <Field label="מספר שלדה" value={frameNumber} onChangeText={setFrameNumber} placeholder="אופציונלי" />
        <Field label="לוחית רישוי" value={licensePlate} onChangeText={setLicensePlate} placeholder="אופציונלי" />

        {/* Manufacturer */}
        <View>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 6, textAlign: 'right' }}>יצרן</Text>
          <View style={{ gap: 4 }}>
            {['', ...(MANUFACTURERS as readonly string[]), 'אחר'].map(m => (
              <TouchableOpacity key={m || 'none'} onPress={() => { setManufacturer(m); setManufacturerCustom('') }}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, backgroundColor: manufacturer === m ? '#eff6ff' : '#fafafa', borderWidth: 1, borderColor: manufacturer === m ? '#bfdbfe' : '#f1f5f9' }}>
                <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: manufacturer === m ? '#1e3a8a' : '#d1d5db', alignItems: 'center', justifyContent: 'center' }}>
                  {manufacturer === m && <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: '#1e3a8a' }} />}
                </View>
                <Text style={{ fontSize: 14, color: manufacturer === m ? '#1e3a8a' : '#374151', fontWeight: manufacturer === m ? '700' : '400' }}>{m || 'ללא'}</Text>
              </TouchableOpacity>
            ))}
            {manufacturer === 'אחר' && (
              <TextInput value={manufacturerCustom} onChangeText={setManufacturerCustom}
                placeholder="הקלד שם יצרן..." placeholderTextColor="#9ca3af"
                style={{ borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, textAlign: 'right', marginTop: 4 }} />
            )}
          </View>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#e5e7eb', alignItems: 'center' }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#64748b' }}>ביטול</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#1e3a8a', opacity: saving ? 0.7 : 1 }}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>שמור שינויים</Text>}
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => setShowDelete(true)}
        style={{ paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#fecaca', backgroundColor: '#fef2f2', alignItems: 'center' }}>
        <Text style={{ fontSize: 13, color: '#ef4444', fontWeight: '600' }}>מחק כלי מהמערכת</Text>
      </TouchableOpacity>

      <Modal visible={showDelete} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', padding: 16 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 20, gap: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#dc2626', textAlign: 'right' }}>מחיקת כלי</Text>
            <Text style={{ fontSize: 14, color: '#374151', textAlign: 'right' }}>
              האם למחוק אופניים <Text style={{ fontWeight: '800' }}>#{bike.org_number}</Text> לצמיתות? פעולה זו אינה הפיכה.
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={() => setShowDelete(false)} style={{ flex: 1, paddingVertical: 13, borderRadius: 12, borderWidth: 1.5, borderColor: '#e5e7eb', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#64748b' }}>ביטול</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={{ flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center', backgroundColor: '#dc2626' }}>
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>מחק לצמיתות</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
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
        style={{ borderWidth: 1.5, borderColor: error ? '#ef4444' : '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, textAlign: 'right', backgroundColor: '#fafafa' }} />
      {!!error && <Text style={{ fontSize: 11, color: '#ef4444', marginTop: 3, textAlign: 'right' }}>{error}</Text>}
    </View>
  )
}
