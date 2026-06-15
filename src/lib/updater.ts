import { Linking } from 'react-native'
import appJson from '../../app.json'

// TODO: replace with your actual GitHub raw URL after pushing apps.json to the repo
// e.g. https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/apps.json
const APPS_JSON_URL = 'https://raw.githubusercontent.com/Yairkad/bike-manager/main/apps.json'
const APP_ID = 'bike-manager'

const CURRENT_VERSION_CODE: number = (appJson as any).expo.android.versionCode ?? 1

export type UpdateInfo = {
  versionName: string
  versionCode: number
  apkUrl: string
  releaseNotes: string
  forceUpdate: boolean
}

export async function checkForUpdate(): Promise<UpdateInfo | null> {
  try {
    const res = await fetch(APPS_JSON_URL, { cache: 'no-store' })
    if (!res.ok) return null
    const data = await res.json()
    const app = data.apps?.find((a: any) => a.id === APP_ID)
    if (!app || app.versionCode <= CURRENT_VERSION_CODE) return null
    return app as UpdateInfo
  } catch {
    return null
  }
}

export function openApkUrl(url: string) {
  Linking.openURL(url)
}
