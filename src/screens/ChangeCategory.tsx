import { useState, useCallback } from 'react'
import { View, Text, TouchableOpacity, ScrollView, Modal, ActivityIndicator } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../lib/navigation'
import type { Bike, BikeCategory } from '../types'
import { CATEGORY_LABELS } from '../types'
import { getBikeById, saveBike, saveCategoryChange } from '../lib/storage'
import { uid } from '../lib/utils'

type Props = NativeStackScreenProps<RootStackParamList, 'ChangeCategory'>

const ALLOWED: BikeCategory[] = ['out', 'returned', 'for_sale']

const CAT_COLORS: Record<BikeCategory, { bg: string; text: string }> = {
  new:      { bg: '#dbeafe', text: '#1d4ed8' },
  out:      { bg: '#ffedd5', text: '#9a3412' },
  returned: { bg: '#fef9c3', text: '#92400e' },
  for_sale: { bg: '#dcfce7', text: '#15803d' },
  sold:     { bg: '#f1f5f9', text: '#475569' },
}

export default function ChangeCategory({ route, navigation }: Props) {
  const { id } = route.params
  const [bike, setBike] = useState<Bike | undefined>()
  const [selected, setSelected] = useState<BikeCategory | null>(null)
  const [showConfirmSale, setShowConfirmSale] = useState(false)
  const [showConfirmOut, setShowConfirmOut] = useState(false)

  useFocusEffect(useCallback(() => {
    getBikeById(id).then(b => setBike(b ?? undefined))
  }, [id]))

  if (!bike) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color="#1e3a8a" /></View>

  if (bike.category === 'out') {
    return (
      <View style={{ flex: 1, backgroundColor: '#f8fafc', padding: 16, gap: 12 }}>
        <View style={{ backgroundColor: '#f1f5f9', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#475569', textAlign: 'center' }}>כלי יצא לרוכב — נעול</Text>
          <Text style={{ fontSize: 13, color: '#64748b', textAlign: 'center' }}>לא ניתן לשנות קטגוריה לאופניים שיצאו לרוכב.</Text>
          <Text style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center' }}>לקליטה חדשה, פתח כרטיס חדש עם אותו מספר ארגוני.</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#e5e7eb', alignItems: 'center' }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#64748b' }}>חזור</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const isBlocked = (cat: BikeCategory): string | null => {
    if (cat === 'out' && bike.status === 'faulty') return 'כלי תקול לא יכול לצאת לרוכב'
    return null
  }

  const handleSelect = (cat: BikeCategory) => {
    if (isBlocked(cat)) return
    if (cat === 'for_sale') { setSelected(cat); setShowConfirmSale(true); return }
    if (cat === 'out') { setSelected(cat); setShowConfirmOut(true); return }
    setSelected(cat)
  }

  const doSave = async (cat: BikeCategory) => {
    const now = new Date().toISOString()
    await saveCategoryChange({ id: uid(), bike_id: bike.id, changed_at: now, from_category: bike.category, to_category: cat })
    await saveBike({ ...bike, category: cat, updated_at: now })
    navigation.goBack()
  }

  const catColor = CAT_COLORS[bike.category]

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View style={{ backgroundColor: '#f5f3ff', borderRadius: 12, padding: 12, marginBottom: 12, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: catColor.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: catColor.text }}>{CATEGORY_LABELS[bike.category]}</Text>
        </View>
        <Text style={{ fontSize: 13, color: '#5b21b6' }}>אופניים #{bike.org_number} · קטגוריה נוכחית:</Text>
      </View>

      <View style={{ backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9', marginBottom: 12 }}>
        <View style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#94a3b8', textAlign: 'right' }}>בחר קטגוריה</Text>
        </View>
        <View style={{ padding: 12, gap: 8 }}>
          {ALLOWED.map(cat => {
            const isCurrent = cat === bike.category
            const isSelected = cat === selected
            const blockMsg = isBlocked(cat)
            return (
              <TouchableOpacity key={cat} disabled={isCurrent || !!blockMsg}
                onPress={() => handleSelect(cat)}
                style={{
                  paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1.5,
                  backgroundColor: isCurrent ? '#f8fafc' : isSelected ? '#1e3a8a' : '#fff',
                  borderColor: isCurrent ? '#e5e7eb' : isSelected ? '#1e3a8a' : '#e5e7eb',
                  opacity: (isCurrent || !!blockMsg) ? 0.5 : 1,
                }}>
                <Text style={{ fontSize: 14, fontWeight: '600', textAlign: 'right', color: isSelected ? '#fff' : isCurrent ? '#94a3b8' : '#374151' }}>
                  {CATEGORY_LABELS[cat]}
                  {isCurrent ? ' (נוכחית)' : ''}
                  {blockMsg ? `  — ${blockMsg}` : ''}
                </Text>
              </TouchableOpacity>
            )
          })}

          <View style={{ borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10, marginTop: 4, gap: 6 }}>
            <Text style={{ fontSize: 11, color: '#94a3b8', textAlign: 'right' }}>לא זמין בשינוי קטגוריה:</Text>
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {[{ label: 'חדש — רק בקליטה ראשונית' }, { label: 'נמכר — דרך טופס מכירה בלבד' }].map(x => (
                <View key={x.label} style={{ backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                  <Text style={{ fontSize: 11, color: '#9ca3af' }}>{x.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#e5e7eb', alignItems: 'center' }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#64748b' }}>ביטול</Text>
        </TouchableOpacity>
        <TouchableOpacity disabled={!selected || selected === bike.category}
          onPress={() => selected && doSave(selected)}
          style={{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#7c3aed', opacity: (!selected || selected === bike.category) ? 0.4 : 1 }}>
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>שמור</Text>
        </TouchableOpacity>
      </View>

      {/* Confirm for_sale */}
      <Modal visible={showConfirmSale} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', padding: 16 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 20, gap: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a', textAlign: 'right' }}>אישור מעבר למכירה</Text>
            <Text style={{ fontSize: 14, color: '#374151', textAlign: 'right' }}>האם לסמן אופניים #{bike.org_number} כ"למכירה"?</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={() => { setShowConfirmSale(false); setSelected(null) }}
                style={{ flex: 1, paddingVertical: 13, borderRadius: 12, borderWidth: 1.5, borderColor: '#e5e7eb', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#64748b' }}>ביטול</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setShowConfirmSale(false); doSave('for_sale') }}
                style={{ flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: '#15803d', alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>אשר</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirm out */}
      <Modal visible={showConfirmOut} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', padding: 16 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 20, gap: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a', textAlign: 'right' }}>אישור יציאה לרוכב</Text>
            <Text style={{ fontSize: 14, color: '#374151', textAlign: 'right' }}>האם להוציא אופניים #{bike.org_number} לרוכב?</Text>
            <View style={{ backgroundColor: '#fef2f2', borderRadius: 10, padding: 10 }}>
              <Text style={{ fontSize: 12, color: '#dc2626', textAlign: 'right' }}>שים לב: לאחר היציאה לא ניתן יהיה לשנות קטגוריה לכלי זה. קליטה חדשה תפתח כרטיס נפרד.</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={() => { setShowConfirmOut(false); setSelected(null) }}
                style={{ flex: 1, paddingVertical: 13, borderRadius: 12, borderWidth: 1.5, borderColor: '#e5e7eb', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#64748b' }}>ביטול</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setShowConfirmOut(false); doSave('out') }}
                style={{ flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: '#374151', alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>אשר יציאה</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}
