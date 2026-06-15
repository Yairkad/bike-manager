import { useState, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../lib/navigation'
import type { Bike, Sale } from '../types'
import { getBikeById, getSales } from '../lib/storage'
import { formatDate } from '../lib/utils'

type Props = NativeStackScreenProps<RootStackParamList, 'BillOfSale'>

export default function BillOfSale({ route, navigation }: Props) {
  const { id, saleId } = route.params
  const [bike, setBike] = useState<Bike | undefined>()
  const [sale, setSale] = useState<Sale | undefined>()
  const [loading, setLoading] = useState(true)

  useFocusEffect(useCallback(() => {
    (async () => {
      const [b, sales] = await Promise.all([getBikeById(id), getSales(id)])
      setBike(b)
      setSale(sales.find(s => s.id === saleId))
      setLoading(false)
    })()
  }, [id, saleId]))

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color="#1e3a8a" size="large" /></View>
  if (!bike || !sale) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: '#9ca3af' }}>לא נמצא שטר מכר</Text></View>

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Document */}
      <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 16 }}>
        <View style={{ alignItems: 'center', marginBottom: 20, paddingBottom: 16, borderBottomWidth: 2, borderBottomColor: '#1e3a8a' }}>
          <Text style={{ fontSize: 20, fontWeight: '900', color: '#1e3a8a' }}>שטר מכר</Text>
          <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>איחוד הצלה ישראל</Text>
        </View>

        <Row label="תאריך מכירה" value={formatDate(sale.sold_at)} />
        <Divider />

        <Text style={{ fontSize: 13, fontWeight: '800', color: '#374151', marginBottom: 8, textAlign: 'right' }}>פרטי האופניים</Text>
        <Row label="מספר ארגוני" value={`#${bike.org_number}`} />
        {bike.frame_number && <Row label="מספר שלדה" value={bike.frame_number} />}
        {bike.license_plate && <Row label="לוחית רישוי" value={bike.license_plate} />}
        {bike.manufacturer && <Row label="יצרן" value={bike.manufacturer} />}
        <Divider />

        <Text style={{ fontSize: 13, fontWeight: '800', color: '#374151', marginBottom: 8, textAlign: 'right' }}>פרטי הקונה</Text>
        <Row label="שם מלא" value={sale.buyer_name} />
        <Row label="תעודת זהות" value={sale.buyer_id_number} />
        <Row label="טלפון" value={sale.buyer_phone} />
        <Divider />

        <Row label="מחיר" value={`₪${sale.price.toLocaleString()}`} highlight />
        {sale.notes && <Row label="הערות" value={sale.notes} />}

        <View style={{ marginTop: 32, flexDirection: 'row', justifyContent: 'space-between', paddingTop: 16, borderTopWidth: 1, borderTopColor: '#e5e7eb' }}>
          <View style={{ alignItems: 'center', gap: 4 }}>
            <View style={{ width: 120, height: 1, backgroundColor: '#374151' }} />
            <Text style={{ fontSize: 11, color: '#6b7280' }}>חתימת הקונה</Text>
          </View>
          <View style={{ alignItems: 'center', gap: 4 }}>
            <View style={{ width: 120, height: 1, backgroundColor: '#374151' }} />
            <Text style={{ fontSize: 11, color: '#6b7280' }}>חתימת המוכר</Text>
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
      <Text style={{ fontSize: highlight ? 16 : 14, fontWeight: highlight ? '900' : '600', color: highlight ? '#1e3a8a' : '#0f172a' }}>{value}</Text>
      <Text style={{ fontSize: 13, color: '#6b7280' }}>{label}</Text>
    </View>
  )
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: '#f1f5f9', marginVertical: 12 }} />
}
