import { View, Text } from 'react-native'

export default function PlaceholderScreen({ route }: any) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 16, color: '#64748b' }}>בפיתוח — {route.name}</Text>
    </View>
  )
}
