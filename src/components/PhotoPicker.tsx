import { useState } from 'react'
import { View, Text, TouchableOpacity, Image, Modal } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { pickBikePhotoFromLibrary, takeBikePhoto } from '../lib/photo'

export default function PhotoPicker({ uri, onPick }: {
  uri?: string
  onPick: (photo: { uri: string; base64: string }) => void
}) {
  const [showOptions, setShowOptions] = useState(false)

  const handle = async (fn: () => Promise<{ uri: string; base64: string } | null>) => {
    setShowOptions(false)
    const photo = await fn()
    if (photo) onPick(photo)
  }

  return (
    <View style={{ alignItems: 'center' }}>
      <TouchableOpacity onPress={() => setShowOptions(true)}
        style={{ width: 120, height: 90, borderRadius: 14, backgroundColor: '#f1f5f9', borderWidth: 1.5, borderColor: '#e5e7eb', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
        {uri
          ? <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          : <View style={{ alignItems: 'center', gap: 4 }}>
              <Ionicons name="camera-outline" size={26} color="#94a3b8" />
              <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: '600' }}>הוסף תמונה</Text>
            </View>}
      </TouchableOpacity>

      <Modal visible={showOptions} transparent animationType="fade" onRequestClose={() => setShowOptions(false)}>
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}>
          <TouchableOpacity style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' }} activeOpacity={1} onPress={() => setShowOptions(false)} />
          <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 12, gap: 8 }}>
            <TouchableOpacity onPress={() => handle(takeBikePhoto)}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 10, paddingVertical: 14, paddingHorizontal: 12 }}>
              <Text style={{ fontSize: 15, color: '#0f172a', fontWeight: '600' }}>צלם תמונה</Text>
              <Ionicons name="camera-outline" size={20} color="#1e3a8a" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handle(pickBikePhotoFromLibrary)}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 10, paddingVertical: 14, paddingHorizontal: 12 }}>
              <Text style={{ fontSize: 15, color: '#0f172a', fontWeight: '600' }}>בחר מהגלריה</Text>
              <Ionicons name="image-outline" size={20} color="#1e3a8a" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowOptions(false)}
              style={{ paddingVertical: 12, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9', marginTop: 4 }}>
              <Text style={{ fontSize: 14, color: '#94a3b8', fontWeight: '600' }}>ביטול</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}
