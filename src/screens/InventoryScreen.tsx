import { useState, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../lib/navigation'
import type { Bike, BikeCategory } from '../types'
import { getBikes } from '../lib/storage'
import TabBar, { TAB_BAR_HEIGHT } from '../components/TabBar'

type Props = NativeStackScreenProps<RootStackParamList, 'InventoryScreen'>

const IN_STOCK: BikeCategory[] = ['new', 'returned', 'for_sale']

const SECTIONS: { cat: BikeCategory; label: string; bg: string; text: string; border: string }[] = [
  { cat: 'new',      label: 'חדשים',        bg: '#eff6ff', text: '#1e3a8a', border: '#bfdbfe' },
  { cat: 'returned', label: 'חזרו מרוכב',   bg: '#fefce8', text: '#92400e', border: '#fde68a' },
  { cat: 'for_sale', label: 'למכירה',        bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
]

export default function InventoryScreen({ navigation }: Props) {
  const [bikes, setBikes] = useState<Bike[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    const b = await getBikes()
    setBikes(b)
    setLoading(false)
    setRefreshing(false)
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  if (loading) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
      <ActivityIndicator size="large" color="#1e3a8a" />
    </View>
  )

  const inStock = bikes.filter(b => IN_STOCK.includes(b.category))
  const faultyInStock = inStock.filter(b => b.status === 'faulty')

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} />}
        contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 30 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary row */}
        <View style={{ flexDirection: 'row', gap: 8, marginHorizontal: 14, marginTop: 12 }}>
          <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1.5, borderColor: '#bfdbfe' }}>
            <Text style={{ fontSize: 24, fontWeight: '900', color: '#1e3a8a' }}>{inStock.length}</Text>
            <Text style={{ fontSize: 10, color: '#3b82f6', marginTop: 3, fontWeight: '600' }}>במלאי</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1.5, borderColor: '#fecaca' }}>
            <Text style={{ fontSize: 24, fontWeight: '900', color: '#dc2626' }}>{faultyInStock.length}</Text>
            <Text style={{ fontSize: 10, color: '#ef4444', marginTop: 3, fontWeight: '600' }}>תקולים</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1.5, borderColor: '#e2e8f0' }}>
            <Text style={{ fontSize: 24, fontWeight: '900', color: '#475569' }}>{bikes.filter(b => b.category === 'out').length}</Text>
            <Text style={{ fontSize: 10, color: '#64748b', marginTop: 3, fontWeight: '600' }}>אצל רוכבים</Text>
          </View>
        </View>

        {/* Faulty alert */}
        {faultyInStock.length > 0 && (
          <View style={{ marginHorizontal: 14, marginTop: 12, backgroundColor: '#fff7ed', borderRightWidth: 4, borderRightColor: '#f97316', borderRadius: 12, overflow: 'hidden' }}>
            <View style={{ paddingHorizontal: 14, paddingVertical: 8, backgroundColor: 'rgba(249,115,22,0.08)' }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#9a3412' }}>⚠️ {faultyInStock.length} כלים תקולים במלאי</Text>
            </View>
            {faultyInStock.map(bike => (
              <TouchableOpacity key={bike.id}
                onPress={() => navigation.navigate('BikeDetail', { id: bike.id })}
                style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: 'rgba(249,115,22,0.1)' }}>
                <Text style={{ fontSize: 11, color: '#dc2626', fontWeight: '700' }}>לטיפול ←</Text>
                <Text style={{ fontSize: 13, color: '#92400e', fontWeight: '700' }}>#{bike.org_number}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Sections by category */}
        {SECTIONS.map(sec => {
          const list = bikes.filter(b => b.category === sec.cat)
          if (list.length === 0) return null
          return (
            <View key={sec.cat} style={{ marginHorizontal: 14, marginTop: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <View style={{ backgroundColor: sec.bg, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 99, borderWidth: 1, borderColor: sec.border }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: sec.text }}>{list.length}</Text>
                </View>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151' }}>{sec.label}</Text>
              </View>
              <View style={{ gap: 6 }}>
                {list.map(bike => {
                  const isFaulty = bike.status === 'faulty'
                  const sub = [bike.manufacturer, bike.license_plate].filter(Boolean).join(' · ')
                  return (
                    <TouchableOpacity key={bike.id}
                      onPress={() => navigation.navigate('BikeDetail', { id: bike.id })}
                      style={{
                        backgroundColor: isFaulty ? '#fff8f8' : '#fff',
                        borderRadius: 12, padding: 12,
                        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                        borderWidth: 1, borderColor: isFaulty ? '#fecaca' : '#f1f5f9',
                      }}>
                      <View style={{ alignItems: 'flex-end', gap: 3 }}>
                        {isFaulty && (
                          <View style={{ backgroundColor: '#fee2e2', paddingHorizontal: 7, paddingVertical: 1, borderRadius: 99 }}>
                            <Text style={{ fontSize: 9, fontWeight: '700', color: '#dc2626' }}>תקול</Text>
                          </View>
                        )}
                        <View style={{ backgroundColor: sec.bg, paddingHorizontal: 7, paddingVertical: 1, borderRadius: 99, borderWidth: 1, borderColor: sec.border }}>
                          <Text style={{ fontSize: 9, fontWeight: '700', color: sec.text }}>{sec.label}</Text>
                        </View>
                      </View>
                      <View style={{ flex: 1, alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 15, fontWeight: '800', color: '#0f172a' }}>#{bike.org_number}</Text>
                        {sub ? <Text style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>{sub}</Text> : null}
                      </View>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>
          )
        })}

        {inStock.length === 0 && (
          <View style={{ marginTop: 60, alignItems: 'center' }}>
            <Text style={{ fontSize: 32 }}>📦</Text>
            <Text style={{ fontSize: 14, color: '#94a3b8', marginTop: 12 }}>המלאי ריק כרגע</Text>
          </View>
        )}
      </ScrollView>

      <TabBar navigation={navigation} active="InventoryScreen" />
    </View>
  )
}
