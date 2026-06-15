import { View, Text } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { I18nManager } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import type { RootStackParamList } from './src/lib/navigation'
import { AuthProvider, useAuth } from './src/context/AuthContext'

import LoginScreen from './src/screens/LoginScreen'
import SetupViewerScreen from './src/screens/SetupViewerScreen'
import Dashboard from './src/screens/Dashboard'
import BikesScreen from './src/screens/BikesScreen'
import InventoryScreen from './src/screens/InventoryScreen'
import SettingsScreen from './src/screens/SettingsScreen'
import NewBike from './src/screens/NewBike'
import BikeDetail from './src/screens/BikeDetail'
import EditBike from './src/screens/EditBike'
import ChangeCategory from './src/screens/ChangeCategory'
import Reception from './src/screens/Reception'
import Sale from './src/screens/Sale'
import Loan from './src/screens/Loan'
import LoanReturn from './src/screens/LoanReturn'
import FaultTreatment from './src/screens/FaultTreatment'
import BillOfSale from './src/screens/BillOfSale'
import LoanDoc from './src/screens/LoanDoc'

I18nManager.forceRTL(true)

const Stack = createNativeStackNavigator<RootStackParamList>()

function Splash() {
  return (
    <View style={{ flex: 1, backgroundColor: '#1e3a8a', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 64, marginBottom: 14 }}>🚲</Text>
      <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800' }}>מחסן אופניים</Text>
      <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, marginTop: 6 }}>איחוד הצלה ישראל</Text>
    </View>
  )
}

function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return <Splash />

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#1e3a8a' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700', fontSize: 17 },
          contentStyle: { backgroundColor: '#f8fafc' },
          animation: 'slide_from_left',
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false, animation: 'fade' }}
          />
        ) : (
          <>
            {/* ── Tab-root screens (no header, no back) ── */}
            <Stack.Screen name="Dashboard"       component={Dashboard}       options={{ headerShown: false }} />
            <Stack.Screen name="BikesScreen"     component={BikesScreen}     options={{ headerShown: false }} />
            <Stack.Screen name="InventoryScreen" component={InventoryScreen} options={{ title: 'מלאי' }} />

            {/* ── Detail / flow screens ── */}
            <Stack.Screen name="SettingsScreen"  component={SettingsScreen}  options={{ title: 'הגדרות' }} />
            <Stack.Screen name="SetupViewer"     component={SetupViewerScreen} options={{ title: 'משתמש צפיה' }} />
            <Stack.Screen name="NewBike"         component={NewBike}         options={{ title: 'קליטת כלי חדש' }} />
            <Stack.Screen name="BikeDetail"      component={BikeDetail}      options={{ title: 'פרטי כלי' }} />
            <Stack.Screen name="EditBike"        component={EditBike}        options={{ title: 'עריכת כלי' }} />
            <Stack.Screen name="ChangeCategory"  component={ChangeCategory}  options={{ title: 'שינוי קטגוריה' }} />
            <Stack.Screen name="Reception"       component={Reception}       options={{ title: 'קליטה מרוכב' }} />
            <Stack.Screen name="Sale"            component={Sale}            options={{ title: 'מכירה' }} />
            <Stack.Screen name="Loan"            component={Loan}            options={{ title: 'השאלה' }} />
            <Stack.Screen name="LoanReturn"      component={LoanReturn}      options={{ title: 'החזרת השאלה' }} />
            <Stack.Screen name="FaultTreatment"  component={FaultTreatment}  options={{ title: 'טיפול בתקלות' }} />
            <Stack.Screen name="BillOfSale"      component={BillOfSale}      options={{ title: 'שטר מכר' }} />
            <Stack.Screen name="LoanDoc"         component={LoanDoc}         options={{ title: 'נוסח השאלה' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  )
}
