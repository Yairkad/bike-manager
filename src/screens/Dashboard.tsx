import { useState, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  RefreshControl, Alert,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../lib/navigation'
import type { Bike } from '../types'
import { getBikes, getOverdueLoans } from '../lib/storage'
import { daysUntil } from '../lib/utils'
import TabBar, { TAB_BAR_HEIGHT } from '../components/TabBar'
import { useAuth } from '../context/AuthContext'
import { getInitials } from '../lib/auth'

const ALL_CARDS = [
  { id: 'bikes',    icon: '🚲', title: 'כלים',      bg: '#eff6ff', iconBg: '#dbeafe', screen: 'BikesScreen',   adminOnly: false },
  { id: 'parts',    icon: '🔧', title: 'חלפים',     bg: '#f0fdf4', iconBg: '#dcfce7', screen: null,             adminOnly: false },
  { id: 'history',  icon: '📋', title: 'היסטוריה',  bg: '#fffbeb', iconBg: '#fef3c7', screen: null,             adminOnly: false },
  { id: 'settings', icon: '⚙️', title: 'הגדרות',    bg: '#f8fafc', iconBg: '#e2e8f0', screen: 'SettingsScreen', adminOnly: true  },
] as const

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>
type OverdueLoan = { id: string; borrower_name: string; return_due_date: string; bike?: Bike }


export default function Dashboard({ navigation }: Props) {
  const { profile, isAdmin, logout } = useAuth()
  const CARDS = ALL_CARDS.filter(c => isAdmin || !c.adminOnly)
  const [bikes, setBikes] = useState<Bike[]>([])
  const [overdueLoans, setOverdueLoans] = useState<OverdueLoan[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const handleAvatarPress = () => {
    Alert.alert(
      profile?.name ?? 'משתמש',
      'בחר פעולה',
      [
        { text: 'יציאה מהחשבון', style: 'destructive', onPress: logout },
        { text: 'ביטול', style: 'cancel' },
      ]
    )
  }

  const load = useCallback(async () => {
    const [b, loans] = await Promise.all([getBikes(), getOverdueLoans()])
    setBikes(b)
    setOverdueLoans(loans)
    setRefreshing(false)
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const inStock = bikes.filter(b => b.category !== 'sold' && b.category !== 'out')
  const faultyCount = inStock.filter(b => b.status === 'faulty').length

  const pressCard = (screen: string | null) => {
    if (!screen) { Alert.alert('בקרוב', 'תכונה זו תהיה זמינה בגרסה הבאה 🔜'); return }
    navigation.navigate(screen as any)
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} />}
        contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 30 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ backgroundColor: '#1e3a8a', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 30 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <TouchableOpacity
              onPress={handleAvatarPress}
              activeOpacity={0.8}
              style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)' }}
            >
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13, letterSpacing: 0.5 }}>
                {profile ? getInitials(profile.name) : '?'}
              </Text>
            </TouchableOpacity>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800' }}>🚲 מחסן אופניים</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                {!isAdmin && (
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 }}>
                    <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 9, fontWeight: '700' }}>מצב צפיה</Text>
                  </View>
                )}
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>איחוד הצלה ישראל</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stats pulled up */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: -18, marginHorizontal: 14 }}>
          {[
            { n: inStock.length, l: 'במלאי',  color: '#2563eb', filter: '' },
            { n: faultyCount,    l: 'תקולים', color: '#ef4444', filter: 'faulty' },
            { n: overdueLoans.length, l: 'השאלות', color: '#f59e0b', filter: '' },
          ].map(s => (
            <TouchableOpacity key={s.l}
              onPress={() => navigation.navigate('BikesScreen', s.filter ? { initialFilter: s.filter } : undefined)}
              activeOpacity={0.8}
              style={{ flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 12, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 }}>
              <Text style={{ fontSize: 26, fontWeight: '900', color: s.color, lineHeight: 30 }}>{s.n}</Text>
              <Text style={{ fontSize: 10, color: '#6b7280', marginTop: 3 }}>{s.l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Overdue loans */}
        {overdueLoans.length > 0 && (
          <View style={{ marginHorizontal: 14, marginTop: 14, backgroundColor: '#fff7ed', borderRightWidth: 4, borderRightColor: '#f97316', borderRadius: 12, overflow: 'hidden' }}>
            <View style={{ paddingHorizontal: 14, paddingVertical: 8, backgroundColor: 'rgba(249,115,22,0.08)' }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#9a3412' }}>⏰ השאלות מתקרבות לסיום</Text>
            </View>
            {overdueLoans.map(loan => {
              const days = daysUntil(loan.return_due_date)
              return (
                <TouchableOpacity key={loan.id}
                  onPress={() => loan.bike && navigation.navigate('BikeDetail', { id: loan.bike.id })}
                  style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: 'rgba(249,115,22,0.1)' }}>
                  <Text style={{ fontSize: 13, color: '#92400e' }}>#{loan.bike?.org_number} — {loan.borrower_name}</Text>
                  <View style={{ backgroundColor: days < 0 ? '#ef4444' : '#f97316', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 }}>
                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>
                      {days < 0 ? `איחור ${Math.abs(days)}י` : days === 0 ? 'היום' : `${days} ימים`}
                    </Text>
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>
        )}

        {/* Quick nav label */}
        <View style={{ paddingHorizontal: 16, paddingTop: 18, paddingBottom: 10 }}>
          <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: '700', textAlign: 'right', letterSpacing: 0.4 }}>ניווט מהיר</Text>
        </View>

        {/* 2×2 card grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 14 }}>
          {CARDS.map(card => (
            <TouchableOpacity key={card.id} onPress={() => pressCard(card.screen)} activeOpacity={0.82}
              style={{ width: '47.5%', backgroundColor: card.bg, borderRadius: 20, padding: 16, minHeight: 128, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
              <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: card.iconBg, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end' }}>
                <Text style={{ fontSize: 24 }}>{card.icon}</Text>
              </View>
              <View style={{ marginTop: 'auto' as any, paddingTop: 14 }}>
                <Text style={{ fontSize: 17, fontWeight: '800', color: '#0f172a', textAlign: 'right' }}>{card.title}</Text>
                {card.id === 'bikes' && (
                  <Text style={{ fontSize: 11, color: '#3b82f6', marginTop: 3, textAlign: 'right', fontWeight: '600' }}>{bikes.length} כלים</Text>
                )}
                {(card.id === 'parts' || card.id === 'history') && (
                  <Text style={{ fontSize: 10, color: '#94a3b8', marginTop: 3, textAlign: 'right' }}>בקרוב</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <TabBar navigation={navigation} active="Dashboard" />
    </View>
  )
}
