import { useState, useCallback } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../lib/navigation'
import type { Bike } from '../types'
import { getBikeById, saveBike, saveSale, saveCategoryChange } from '../lib/storage'
import { todayISO, uid } from '../lib/utils'

type Props = NativeStackScreenProps<RootStackParamList, 'Sale'>

export default function Sale({ route, navigation }: Props) {
  const { id } = route.params
  const [bike, setBike] = useState<Bike | undefined>()
  const [loading, setLoading] = useState(true)

  const [buyerName, setBuyerName] = useState('')
  const [buyerIdNum, setBuyerIdNum] = useState('')
  const [buyerPhone, setBuyerPhone] = useState('')
  const [saleDate, setSaleDate] = useState(todayISO())
  const [price, setPrice] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useFocusEffect(useCallback(() => {
    getBikeById(id).then(b => { setBike(b); setLoading(false) })
  }, [id]))

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color="#1e3a8a" size="large" /></View>

  if (!bike || bike.category !== 'for_sale') {
    return (
      <View style={{ flex: 1, backgroundColor: '#f8fafc', padding: 16, gap: 12 }}>
        <View style={{ backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 14, padding: 16 }}>
          <Text style={{ fontSize: 14, color: '#dc2626', textAlign: 'right' }}>ניתן למכור רק אופניים בקטגוריה "למכירה".</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#e5e7eb', alignItems: 'center' }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#64748b' }}>חזור</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const handleSave = async () => {
    if (!buyerName.trim() || !buyerIdNum.trim() || !buyerPhone.trim() || !saleDate) return
    setSaving(true)
    const now = new Date().toISOString()
    const saleId = uid()

    await saveSale({ id: saleId, bike_id: bike.id, sold_at: saleDate || now, price: parseFloat(price) || 0, notes: notes.trim() || undefined, buyer_name: buyerName.trim(), buyer_id_number: buyerIdNum.trim(), buyer_phone: buyerPhone.trim() })
    await saveCategoryChange({ id: uid(), bike_id: bike.id, changed_at: now, from_category: bike.category, to_category: 'sold' })
    await saveBike({ ...bike, category: 'sold', updated_at: now })
    setSaving(false)
    navigation.replace('BillOfSale', { id: bike.id, saleId })
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <View style={{ backgroundColor: '#eff6ff', borderRadius: 12, padding: 12, marginBottom: 12, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 6 }}>
        {bike.status === 'faulty' && <Text style={{ fontSize: 12, color: '#dc2626', fontWeight: '700' }}>· תקול</Text>}
        <Text style={{ fontSize: 14, color: '#1d4ed8', fontWeight: '600' }}>אופניים #{bike.org_number}{bike.manufacturer ? ` · ${bike.manufacturer}` : ''}</Text>
      </View>

      <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 14, marginBottom: 12, borderWidth: 1, borderColor: '#f1f5f9' }}>
        <Text style={{ fontSize: 12, fontWeight: '800', color: '#94a3b8', textAlign: 'right' }}>פרטי קונה</Text>
        <Field label="שם מלא *" value={buyerName} onChangeText={setBuyerName} />
        <Field label="תעודת זהות *" value={buyerIdNum} onChangeText={setBuyerIdNum} keyboardType="numeric" />
        <Field label="טלפון *" value={buyerPhone} onChangeText={setBuyerPhone} keyboardType="phone-pad" />
      </View>

      <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 14, marginBottom: 20, borderWidth: 1, borderColor: '#f1f5f9' }}>
        <Text style={{ fontSize: 12, fontWeight: '800', color: '#94a3b8', textAlign: 'right' }}>פרטי עסקה</Text>
        <Field label="תאריך מכירה *" value={saleDate} onChangeText={setSaleDate} placeholder="YYYY-MM-DD" />
        <Field label="מחיר (₪) *" value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="0" />
        <View>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 5, textAlign: 'right' }}>הערות</Text>
          <TextInput value={notes} onChangeText={setNotes} multiline numberOfLines={2} placeholder="הערות נוספות..."
            placeholderTextColor="#9ca3af"
            style={{ borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, textAlign: 'right', minHeight: 60 }} />
        </View>
      </View>

      <TouchableOpacity onPress={handleSave} disabled={saving || !buyerName.trim() || !buyerIdNum.trim() || !buyerPhone.trim()}
        style={{ backgroundColor: '#15803d', borderRadius: 14, paddingVertical: 16, alignItems: 'center', opacity: (saving || !buyerName.trim() || !buyerIdNum.trim() || !buyerPhone.trim()) ? 0.5 : 1 }}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>אשר מכירה</Text>}
      </TouchableOpacity>
    </ScrollView>
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
