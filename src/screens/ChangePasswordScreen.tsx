import { useState, useRef } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../lib/navigation'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

type Props = NativeStackScreenProps<RootStackParamList, 'ChangePassword'>

export default function ChangePasswordScreen({ navigation }: Props) {
  const { profile } = useAuth()

  const [oldPass, setOldPass]       = useState('')
  const [newPass, setNewPass]       = useState('')
  const [confirmPass, setConfirm]   = useState('')
  const [showOld, setShowOld]       = useState(false)
  const [showNew, setShowNew]       = useState(false)
  const [showConfirm, setShowConf]  = useState(false)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [success, setSuccess]       = useState(false)

  const newRef     = useRef<TextInput>(null)
  const confirmRef = useRef<TextInput>(null)

  const validate = (): string | null => {
    if (!oldPass)                       return 'יש להזין סיסמה נוכחית'
    if (newPass.length < 6)             return 'סיסמה חדשה חייבת להכיל לפחות 6 תווים'
    if (newPass !== confirmPass)        return 'הסיסמאות החדשות אינן תואמות'
    if (newPass === oldPass)            return 'הסיסמה החדשה זהה לישנה'
    return null
  }

  const handleSubmit = async () => {
    const err = validate()
    if (err) { setError(err); return }

    setError('')
    setLoading(true)

    // אמת סיסמה ישנה על ידי כניסה מחדש
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: profile!.email,
      password: oldPass,
    })
    if (signInErr) {
      setLoading(false)
      setError('הסיסמה הנוכחית שגויה')
      return
    }

    // עדכן סיסמה
    const { error: updateErr } = await supabase.auth.updateUser({ password: newPass })
    setLoading(false)

    if (updateErr) {
      setError(updateErr.message)
      return
    }

    setSuccess(true)
  }

  if (success) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>✅</Text>
        <Text style={{ fontSize: 20, fontWeight: '800', color: '#0f172a', marginBottom: 8, textAlign: 'center' }}>
          הסיסמה שונתה בהצלחה
        </Text>
        <Text style={{ fontSize: 14, color: '#64748b', marginBottom: 32, textAlign: 'center' }}>
          בכניסה הבאה השתמש בסיסמה החדשה
        </Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ backgroundColor: '#1e3a8a', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 }}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>סגור</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }} contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">

        <View style={{ backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#f1f5f9', overflow: 'hidden', marginBottom: 20 }}>

          {/* סיסמה נוכחית */}
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
            <Text style={{ fontSize: 12, color: '#64748b', marginBottom: 8, textAlign: 'right', fontWeight: '600' }}>
              סיסמה נוכחית
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity onPress={() => setShowOld(v => !v)} style={{ padding: 4 }}>
                <Text style={{ fontSize: 18 }}>{showOld ? '🙈' : '👁'}</Text>
              </TouchableOpacity>
              <TextInput
                value={oldPass}
                onChangeText={setOldPass}
                secureTextEntry={!showOld}
                placeholder="הסיסמה הנוכחית שלך"
                placeholderTextColor="#cbd5e1"
                returnKeyType="next"
                onSubmitEditing={() => newRef.current?.focus()}
                style={{ flex: 1, textAlign: 'right', fontSize: 15, color: '#0f172a', paddingVertical: 4 }}
              />
            </View>
          </View>

          {/* סיסמה חדשה */}
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
            <Text style={{ fontSize: 12, color: '#64748b', marginBottom: 8, textAlign: 'right', fontWeight: '600' }}>
              סיסמה חדשה
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity onPress={() => setShowNew(v => !v)} style={{ padding: 4 }}>
                <Text style={{ fontSize: 18 }}>{showNew ? '🙈' : '👁'}</Text>
              </TouchableOpacity>
              <TextInput
                ref={newRef}
                value={newPass}
                onChangeText={setNewPass}
                secureTextEntry={!showNew}
                placeholder="לפחות 6 תווים"
                placeholderTextColor="#cbd5e1"
                returnKeyType="next"
                onSubmitEditing={() => confirmRef.current?.focus()}
                style={{ flex: 1, textAlign: 'right', fontSize: 15, color: '#0f172a', paddingVertical: 4 }}
              />
            </View>
          </View>

          {/* אימות סיסמה */}
          <View style={{ padding: 16 }}>
            <Text style={{ fontSize: 12, color: '#64748b', marginBottom: 8, textAlign: 'right', fontWeight: '600' }}>
              אימות סיסמה חדשה
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity onPress={() => setShowConf(v => !v)} style={{ padding: 4 }}>
                <Text style={{ fontSize: 18 }}>{showConfirm ? '🙈' : '👁'}</Text>
              </TouchableOpacity>
              <TextInput
                ref={confirmRef}
                value={confirmPass}
                onChangeText={setConfirm}
                secureTextEntry={!showConfirm}
                placeholder="הזן שוב את הסיסמה החדשה"
                placeholderTextColor="#cbd5e1"
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                style={{ flex: 1, textAlign: 'right', fontSize: 15, color: '#0f172a', paddingVertical: 4 }}
              />
            </View>
          </View>
        </View>

        {/* שגיאה */}
        {!!error && (
          <View style={{ backgroundColor: '#fef2f2', borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#fecaca' }}>
            <Text style={{ color: '#dc2626', textAlign: 'center', fontSize: 14, fontWeight: '600' }}>{error}</Text>
          </View>
        )}

        {/* כפתור */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          style={{
            backgroundColor: loading ? '#93c5fd' : '#1e3a8a',
            borderRadius: 12, paddingVertical: 16,
            alignItems: 'center',
          }}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>שנה סיסמה</Text>
          }
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  )
}
