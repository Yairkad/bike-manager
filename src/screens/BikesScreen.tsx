import { useState, useCallback } from 'react'
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, RefreshControl, Image,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../lib/navigation'
import type { Bike, BikeCategory } from '../types'
import { getBikes } from '../lib/storage'
import TabBar, { TAB_BAR_HEIGHT } from '../components/TabBar'
import { useAuth } from '../context/AuthContext'

type Props = NativeStackScreenProps<RootStackParamList, 'BikesScreen'>

const CAT_LABELS: Record<BikeCategory, string> = {
  new: 'חדשים', out: 'אצל רוכב', returned: 'חזרו מרוכב',
  for_sale: 'למכירה', sold: 'נמכר',
}

const CAT_COLORS: Record<BikeCategory, { bg: string; text: string; border: string }> = {
  new:      { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  out:      { bg: '#fff7ed', text: '#9a3412', border: '#fed7aa' },
  returned: { bg: '#fefce8', text: '#92400e', border: '#fde68a' },
  for_sale: { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
  sold:     { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' },
}

const SECTION_ORDER: BikeCategory[] = ['new', 'returned', 'for_sale', 'out', 'sold']

export default function BikesScreen({ navigation, route }: Props) {
  const { isAdmin } = useAuth()
  const insets = useSafeAreaInsets()
  const [bikes, setBikes] = useState<Bike[]>([])
  const [search, setSearch] = useState('')
  const [faultyOnly, setFaultyOnly] = useState(route.params?.initialFilter === 'faulty')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    const b = await getBikes()
    setBikes(b)
    setLoading(false)
    setRefreshing(false)
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const q = search.trim().toLowerCase()
  const isFiltered = !!q || faultyOnly

  const matchSearch = (b: Bike) => {
    if (!q) return true
    return b.org_number.toLowerCase().includes(q)
      || (b.frame_number?.toLowerCase().includes(q) ?? false)
      || (b.license_plate?.toLowerCase().includes(q) ?? false)
      || (b.manufacturer?.toLowerCase().includes(q) ?? false)
  }

  const filtered = bikes.filter(b => {
    if (!matchSearch(b)) return false
    if (faultyOnly) return b.status === 'faulty'
    return true
  })

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <View style={{ backgroundColor: '#1e3a8a', paddingHorizontal: 16, paddingTop: (insets.top || 0) + 12, paddingBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>{bikes.length}</Text>
        </View>
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800' }}>🚲 כלים</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#1e3a8a" />
        </View>
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} />}
          contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 60 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Search */}
          <View style={{ marginHorizontal: 14, marginTop: 12 }}>
            <TextInput
              value={search} onChangeText={setSearch}
              placeholder="חיפוש: מספר ארגוני, שלדה, יצרן..."
              placeholderTextColor="#9ca3af"
              style={{ backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 13, textAlign: 'right', color: '#0f172a' }}
            />
          </View>

          {/* Active filter badge */}
          {faultyOnly && (
            <TouchableOpacity onPress={() => setFaultyOnly(false)}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginHorizontal: 14, marginTop: 8 }}>
              <View style={{ backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 12, color: '#dc2626', fontWeight: '600' }}>⚠️ תקולים בלבד</Text>
                <Text style={{ fontSize: 12, color: '#dc2626', fontWeight: '700' }}>✕</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Content */}
          {isFiltered ? (
            /* Flat filtered list */
            <View style={{ marginHorizontal: 14, marginTop: 12, gap: 6 }}>
              {filtered.length === 0 ? (
                <Text style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, paddingVertical: 30 }}>
                  {bikes.length === 0 ? 'אין כלים במערכת עדיין' : 'לא נמצאו תוצאות'}
                </Text>
              ) : filtered.map(bike => (
                <BikeRow key={bike.id} bike={bike} onPress={() => navigation.navigate('BikeDetail', { id: bike.id })} />
              ))}
            </View>
          ) : (
            /* Grouped by category */
            SECTION_ORDER.map(cat => {
              const list = bikes.filter(b => b.category === cat)
              if (list.length === 0) return null
              const col = CAT_COLORS[cat]
              const faultyInSection = list.filter(b => b.status === 'faulty').length
              return (
                <View key={cat} style={{ marginHorizontal: 14, marginTop: 14 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                      <View style={{ backgroundColor: col.bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99, borderWidth: 1, borderColor: col.border }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: col.text }}>{list.length}</Text>
                      </View>
                      {faultyInSection > 0 && (
                        <View style={{ backgroundColor: '#fee2e2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 }}>
                          <Text style={{ fontSize: 10, fontWeight: '700', color: '#dc2626' }}>⚠️ {faultyInSection} תקולים</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151' }}>{CAT_LABELS[cat]}</Text>
                  </View>
                  <View style={{ gap: 6 }}>
                    {list.map(bike => (
                      <BikeRow key={bike.id} bike={bike} onPress={() => navigation.navigate('BikeDetail', { id: bike.id })} />
                    ))}
                  </View>
                </View>
              )
            })
          )}
        </ScrollView>
      )}

      {/* FAB — admin only */}
      {isAdmin && !loading && (
        <TouchableOpacity
          onPress={() => navigation.navigate('NewBike')}
          style={{
            position: 'absolute', bottom: TAB_BAR_HEIGHT + (insets.bottom || 10) + 16, alignSelf: 'center',
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
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        {isFaulty && (
          <View style={{ backgroundColor: '#fee2e2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#dc2626' }}>תקול</Text>
          </View>
        )}
        <View style={{ backgroundColor: col.bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99, borderWidth: 1, borderColor: col.border }}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: col.text }}>{CAT_LABELS[bike.category]}</Text>
        </View>
      </View>
      <View style={{ flex: 1, alignItems: 'flex-end' }}>
        <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a' }}>#{bike.org_number}</Text>
        <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{sub || 'ללא פרטים נוספים'}</Text>
      </View>
      {bike.photo_url && (
        <Image source={{ uri: bike.photo_url }} style={{ width: 40, height: 40, borderRadius: 8, marginLeft: 10 }} resizeMode="cover" />
      )}
    </TouchableOpacity>
  )
}
