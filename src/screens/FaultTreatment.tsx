import { useState, useCallback } from 'react'
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../lib/navigation'
import type { Bike, FaultEvent } from '../types'
import { getBikeById, getFaultEvents, saveBike, saveFaultEvent } from '../lib/storage'
import { formatDate } from '../lib/utils'

type Props = NativeStackScreenProps<RootStackParamList, 'FaultTreatment'>

type FaultKey = keyof Omit<FaultEvent, 'id' | 'bike_id' | 'created_at' | 'resolved_at' | 'notes' | 'vehicle_mode' | 'ituran'>

const FAULT_LABELS: Partial<Record<FaultKey, string>> = {
  brake_pads_front: 'רפידות קדמי', brake_pads_rear: 'רפידות אחורי',
  brake_discs_front: 'דיסקים קדמי', brake_discs_rear: 'דיסקים אחורי',
  brake_oil_front: 'שמן בלמים קדמי', brake_oil_rear: 'שמן בלמים אחורי',
  front_tire: 'צמיג קדמי', rear_tire: 'צמיג אחורי',
  front_puncture: "פנצ'ר קדמי", rear_puncture: "פנצ'ר אחורי",
  front_light: 'פנס קדמי', rear_light: 'פנס אחורי',
  front_blinker: 'פליקר קדמי', rear_blinker: 'פליקר אחורי',
  horn: 'צופר', motor_fault: 'מנוע', controller_fault: 'בקר', display_fault: 'צג',
}

function getActiveFaults(ev: FaultEvent) {
  const items: { key: string; label: string }[] = []
  for (const [key, label] of Object.entries(FAULT_LABELS) as [FaultKey, string][]) {
    if (ev[key] === true) items.push({ key, label })
  }
  if (ev.vehicle_mode === 'unlocked') items.push({ key: 'vehicle_mode_unlocked', label: 'פרוץ' })
  if (ev.vehicle_mode === 'limited') items.push({ key: 'vehicle_mode_limited', label: 'מוגבל מהירות' })
  if (ev.ituran === 'old') items.push({ key: 'ituran_old', label: 'איתוראן ישן' })
  if (ev.notes?.trim()) {
    ev.notes.split(/[,.\n]+/).map(s => s.trim()).filter(Boolean).forEach((note, i) =>
      items.push({ key: `note_${i}`, label: note })
    )
  }
  return items
}

export default function FaultTreatment({ route, navigation }: Props) {
  const { id } = route.params
  const [bike, setBike] = useState<Bike | undefined>()
  const [lastFault, setLastFault] = useState<FaultEvent | undefined>()
  const [handled, setHandled] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useFocusEffect(useCallback(() => {
    (async () => {
      const [b, faults] = await Promise.all([getBikeById(id), getFaultEvents(id)])
      setBike(b)
      setLastFault(faults.filter(e => !e.resolved_at).at(-1))
      setLoading(false)
    })()
  }, [id]))

  const toggle = (key: string) =>
    setHandled(prev => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s })

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color="#1e3a8a" size="large" /></View>
  if (!bike) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: '#9ca3af' }}>אופניים לא נמצאו</Text></View>

  if (bike.status === 'ok' || !lastFault) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f8fafc', padding: 16, gap: 12 }}>
        <View style={{ backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#86efac', borderRadius: 14, padding: 16, alignItems: 'center' }}>
          <Text style={{ fontSize: 14, color: '#15803d', fontWeight: '700', textAlign: 'center' }}>אין תקלות פתוחות לאופניים #{bike.org_number}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#e5e7eb', alignItems: 'center' }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#64748b' }}>חזור</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const activeFaults = getActiveFaults(lastFault)
  const allHandled = activeFaults.length > 0 && activeFaults.every(f => handled.has(f.key))

  const handleMarkFixed = async () => {
    const now = new Date().toISOString()
    await saveFaultEvent({ ...lastFault, resolved_at: now })
    await saveBike({ ...bike, status: 'ok', repaired_at: now, updated_at: now })
    navigation.goBack()
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View style={{ backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 12, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ fontSize: 11, color: '#94a3b8' }}>נרשם: {formatDate(lastFault.created_at)}</Text>
        <Text style={{ fontSize: 14, color: '#dc2626', fontWeight: '700' }}>אופניים #{bike.org_number} — תקול</Text>
      </View>

      <View style={{ backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9', marginBottom: 12 }}>
        <View style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 11, color: '#94a3b8' }}>{handled.size}/{activeFaults.length} טופלו</Text>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#94a3b8' }}>תקלות שנרשמו</Text>
        </View>
        {activeFaults.map(fault => (
          <TouchableOpacity key={fault.key} onPress={() => toggle(fault.key)}
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#f8fafc' }}>
            <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: handled.has(fault.key) ? '#10b981' : '#fff', borderColor: handled.has(fault.key) ? '#10b981' : '#d1d5db' }}>
              {handled.has(fault.key) && <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>✓</Text>}
            </View>
            <Text style={{ fontSize: 14, textAlign: 'right', color: handled.has(fault.key) ? '#9ca3af' : '#374151', textDecorationLine: handled.has(fault.key) ? 'line-through' : 'none' }}>
              {fault.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {!allHandled && (
        <Text style={{ fontSize: 12, color: '#f59e0b', textAlign: 'center', marginBottom: 12 }}>
          סמן את כל התקלות כמטופלות כדי להפעיל את כפתור האישור
        </Text>
      )}

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#e5e7eb', alignItems: 'center' }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#64748b' }}>ביטול</Text>
        </TouchableOpacity>
        <TouchableOpacity disabled={!allHandled} onPress={handleMarkFixed}
          style={{ flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#10b981', alignItems: 'center', opacity: allHandled ? 1 : 0.4 }}>
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>סמן כתקין ✓</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}
