import * as ImagePicker from 'expo-image-picker'
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator'

type PickedPhoto = { uri: string; base64: string }

async function compress(uri: string): Promise<PickedPhoto> {
  const result = await manipulateAsync(uri, [{ resize: { width: 1024 } }], {
    compress: 0.6, format: SaveFormat.JPEG, base64: true,
  })
  return { uri: result.uri, base64: result.base64! }
}

export async function pickBikePhotoFromLibrary(): Promise<PickedPhoto | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
  if (!perm.granted) return null
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.8,
  })
  if (res.canceled || !res.assets[0]) return null
  return compress(res.assets[0].uri)
}

export async function takeBikePhoto(): Promise<PickedPhoto | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync()
  if (!perm.granted) return null
  const res = await ImagePicker.launchCameraAsync({
    allowsEditing: true, aspect: [4, 3], quality: 0.8,
  })
  if (res.canceled || !res.assets[0]) return null
  return compress(res.assets[0].uri)
}
