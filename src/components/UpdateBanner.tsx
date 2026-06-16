import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator, AppState } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Updates from 'expo-updates'

type Status = 'idle' | 'available' | 'downloading' | 'error'

export default function UpdateBanner() {
  const insets = useSafeAreaInsets()
  const [status, setStatus] = useState<Status>('idle')

  const check = async () => {
    if (!Updates.isEnabled) return
    try {
      const result = await Updates.checkForUpdateAsync()
      if (result.isAvailable) setStatus('available')
    } catch {}
  }

  useEffect(() => {
    check()
    const sub = AppState.addEventListener('change', state => { if (state === 'active') check() })
    return () => sub.remove()
  }, [])

  const install = async () => {
    setStatus('downloading')
    try {
      await Updates.fetchUpdateAsync()
      await Updates.reloadAsync()
    } catch {
      setStatus('error')
    }
  }

  if (status === 'idle') return null

  return (
    <TouchableOpacity
      onPress={status !== 'downloading' ? install : undefined}
      disabled={status === 'downloading'}
      activeOpacity={0.85}
      style={{
        paddingTop: insets.top + 8, paddingBottom: 10, paddingHorizontal: 16,
        backgroundColor: status === 'error' ? '#dc2626' : '#1e3a8a',
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
      {status === 'downloading' && <ActivityIndicator color="#fff" size="small" />}
      <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>
        {status === 'downloading' ? 'מתקין עדכון...'
          : status === 'error' ? 'התקנת העדכון נכשלה — הקש לנסות שוב'
          : 'עדכון חדש זמין — הקש כדי להתקין'}
      </Text>
    </TouchableOpacity>
  )
}
