import { View, Text } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../lib/navigation'
import TabBar, { TAB_BAR_HEIGHT } from '../components/TabBar'

type Props = NativeStackScreenProps<RootStackParamList, 'InventoryScreen'>

export default function InventoryScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets()
  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <View style={{ backgroundColor: '#1e3a8a', paddingHorizontal: 16, paddingTop: (insets.top || 0) + 12, paddingBottom: 14, alignItems: 'flex-end' }}>
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800' }}>🔧 חלפים</Text>
      </View>

      {/* Coming soon */}
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: TAB_BAR_HEIGHT + 20 }}>
        <Text style={{ fontSize: 52, marginBottom: 16 }}>🔧</Text>
        <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 8 }}>ניהול חלפים</Text>
        <Text style={{ fontSize: 14, color: '#94a3b8', textAlign: 'center', paddingHorizontal: 40, lineHeight: 22 }}>
          מודול ניהול מלאי חלפים וציוד{'\n'}יהיה זמין בגרסה הבאה
        </Text>
      </View>

      <TabBar navigation={navigation} active="InventoryScreen" />
    </View>
  )
}
