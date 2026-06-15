import { View, Text, TouchableOpacity } from 'react-native'
import { CommonActions } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export const TAB_BAR_HEIGHT = 58

const TABS = [
  { screen: 'InventoryScreen', label: 'מלאי', icon: '📦' },
  { screen: 'Dashboard',       label: 'דשבורד', icon: '🏠' },
  { screen: 'BikesScreen',     label: 'כלים',   icon: '🚲' },
] as const

type TabScreen = (typeof TABS)[number]['screen']

export default function TabBar({ navigation, active }: { navigation: any; active: TabScreen }) {
  const insets = useSafeAreaInsets()

  const go = (screen: TabScreen) => {
    if (screen === active) return
    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: screen }] }))
  }

  return (
    <View style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      backgroundColor: '#ffffff',
      borderTopWidth: 1, borderTopColor: '#f1f5f9',
      // LTR so מלאי is physically left and כלים is physically right
      flexDirection: 'row',
      direction: 'ltr' as any,
      paddingBottom: insets.bottom || 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -3 },
      shadowOpacity: 0.07,
      shadowRadius: 12,
      elevation: 16,
    }}>
      {TABS.map(tab => {
        const isActive = tab.screen === active
        return (
          <TouchableOpacity
            key={tab.screen}
            onPress={() => go(tab.screen)}
            activeOpacity={0.65}
            style={{ flex: 1, alignItems: 'center', paddingTop: 10, paddingBottom: 4 }}
          >
            {isActive && (
              <View style={{
                position: 'absolute', top: 0, left: 20, right: 20,
                height: 3, backgroundColor: '#1e3a8a', borderRadius: 99,
              }} />
            )}
            <Text style={{ fontSize: 22, lineHeight: 26 }}>{tab.icon}</Text>
            <Text style={{
              fontSize: 10, marginTop: 3,
              fontWeight: isActive ? '700' : '500',
              color: isActive ? '#1e3a8a' : '#94a3b8',
            }}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}
