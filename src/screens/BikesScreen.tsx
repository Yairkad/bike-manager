import { useState, useCallback } from 'react'
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../lib/navigation'
import type { Bike, BikeCategory } from '../types'
import { getBikes } from '../lib/storage'
import TabBar, { TAB_BAR_HEIGHT } from '../components/TabBar'
import { useAuth } from '../context/AuthContext'

type Props = NativeStackScreenProps<RootStackParamList, 'BikesScreen'>

const CAT_LABELS: Record<BikeCategory, string> = {
  new: 'חדש', out: 'יצא לרוכב', returned: 'חזר מרוכב',
  for_sale: 'למכירה', sold: 'נמכר',
}

const CAT_COLORS: Record<BikeCategory, { bg: string; text: string }> = {
  new:      { bg: '#dbeafe', text: '#1d4ed8' },
  out:      { bg: '#ffedd5', text: '#9a3412' },
  returned: { bg: '#fef9c3', text: '#92400e' },
  for_sale: { bg: '#dcfce7', text: '#15803d' },
  sold:     { bg: '#f1f5f9', text: '#475569' },
}

export default function BikesScreen({ navigation, route }: Props) {
  const { isAdmin } = useAuth()
  const [bikes, setBikes] = useState<Bike[]>([])
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState<string>(route.params?.initialFilter ?? '')
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

  const catCounts = bikes.reduce((acc, b) => {
    acc[b.category] = (acc[b.category] ?? 0) + 1; return acc
  }, {} as Record<string, number>)

  const faultyCount = bikes.filter(b => b.status === 'faulty').length

  const filtered = bikes.filter(b => {
    const q = search.trim().toLowerCase()
    if (q && !b.org_number.toLowerCase().includes(q) &&
        !(b.frame_number?.toLowerCase().includes(q)) &&
        !(b.license_plate?.toLowerCase().includes(q)) &&
        !(b.manufacturer?.toLowerCase().includes(q))) return false
    if (filterCat === 'faulty') return b.status === 'faulty'
    if (filterCat && b.category !== filterCat) return false
    return true
  })

  const chipFilters = [
    { key: '',      label: `הכל ${bikes.length}` },
    { key: 'faulty', label: `תקולים ${faultyCount}` },
    ...(['new', 'returned', 'for_sale', 'out', 'sold'] as BikeCategory[]).map(cat => ({
      key: cat, label: `${CAT_LABELS[cat]} ${catCounts[cat] ?? 0}`,
    })),
  ]

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} />}
        contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 50 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Search */}
        <View style={{ marginHorizontal: 14, marginTop: 10 }}>
          <TextInput
            value={search} onChangeText={setSearch}
            placeholder="חיפוש: מספר ארגוני, שלדה, יצרן..."
            placeholderTextColor="#9ca3af"
            style={{ backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 13, textAlign: 'right', color: '#0f172a' }}
          />
        </View>

        {/* Category chips */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, paddingTop: 8, paddingBottom: 4, gap: 6 }}>
          {chipFilters.map(item => {
            const isOn = filterCat === item.key
            return (
              <TouchableOpacity key={item.key} onPress={() => setFilterCat(item.key)}
                style={{ backgroundColor: isOn ? '#1e3a8a' : '#fff', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: isOn ? '#1e3a8a' : '#e5e7eb' }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: isOn ? '#fff' : '#64748b' }}>{item.label}</Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Faulty section (only when no filter active) */}
        {!filterCat && filtered.some(b => b.status === 'faulty') && (
          <ListSection title="⚠️ תקולים — דורשים טיפול" count={filtered.filter(b => b.status === 'faulty').length}>
            {filtered.filter(b => b.status === 'faulty').map(bike => (
              <BikeRow key={bike.id} bike={bike} onPress={() => navigation.navigate('BikeDetail', { id: bike.id })} />
            ))}
          </ListSection>
        )}

        {/* Main list */}
        <ListSection
          title={filterCat
            ? filterCat === 'faulty' ? 'תקולים' : CAT_LABELS[filterCat as BikeCategory]
            : '📋 כל הכלים'}
          count={filterCat ? filtered.length : filtered.filter(b => b.status !== 'faulty').length}
        >
          {(filterCat ? filtered : filtered.filter(b => b.status !== 'faulty')).length === 0
            ? <Text style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, paddingVertical: 20 }}>
                {bikes.length === 0 ? 'אין אופניים במערכת עדיין' : 'לא נמצאו תוצאות'}
              </Text>
            : (filterCat ? filtered : filtered.filter(b => b.status !== 'faulty')).map(bike => (
                <BikeRow key={bike.id} bike={bike} onPress={() => navigation.navigate('BikeDetail', { id: bike.id })} />
              ))
          }
        </ListSection>
      </ScrollView>

      {/* FAB — admin only */}
      {isAdmin && (
        <TouchableOpacity
          onPress={() => navigation.navigate('NewBike')}
          style={{
            position: 'absolute', bottom: TAB_BAR_HEIGHT + 16, alignSelf: 'center',
            backgroundColor: '#1e3a8a', borderRadius: 14,
            paddingVertical: 15, paddingHorizontal: 32,
            flexDirection: 'row', alignItems: 'center', gap: 8,
            shadowColor: '#1e3a8a', shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
          }}>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '300', lineHeight: 22 }}>+</Text>
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>קליטת כלי חדש</Text>
        </TouchableOpacity>
      )}

      <TabBar navigation={navigation} active="BikesScreen" />
    </View>
  )
}

function ListSection({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <View style={{ marginHorizontal: 14, marginTop: 12, marginBottom: 6 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <View style={{ backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 }}>
          <Text style={{ fontSize: 11, color: '#64748b', fontWeight: '600' }}>{count}</Text>
        </View>
        <Text style={{ fontSize: 12, fontWeight: '700', color: '#374151' }}>{title}</Text>
      </View>
      <View style={{ gap: 6 }}>{children}</View>
    </View>
  )
}

function BikeRow({ bike, onPress }: { bike: Bike; onPress: () => void }) {
  const isFaulty = bike.status === 'faulty'
  const col = CAT_COLORS[bike.category]
  const sub = [bike.manufacturer, bike.frame_number, bike.license_plate].filter(Boolean).join(' · ')
  return (
    <TouchableOpacity onPress={onPress}
      style={{
        backgroundColor: isFaulty ? '#fff8f8' : '#fff',
        borderRadius: 14, padding: 13,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        borderWidth: 1, borderColor: isFaulty ? '#fecaca' : '#f1f5f9',
        shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
      }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a' }}>#{bike.org_number}</Text>
        <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{sub || 'ללא פרטים נוספים'}</Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        {isFaulty && (
          <View style={{ backgroundColor: '#fee2e2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#dc2626' }}>תקול</Text>
          </View>
        )}
        <View style={{ backgroundColor: col.bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 }}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: col.text }}>{CAT_LABELS[bike.category]}</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}
