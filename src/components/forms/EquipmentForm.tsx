import { View, Text, TouchableOpacity, TextInput } from 'react-native'
import type { EquipmentState } from '../../lib/forms'
import { MISSING_KEYS_OPTIONS } from '../../types'

interface Props {
  value: EquipmentState
  onChange: (v: EquipmentState) => void
  sectionTitle?: string
}

export default function EquipmentForm({ value: eq, onChange, sectionTitle = 'ציוד שהוחזר' }: Props) {
  const set = (patch: Partial<EquipmentState>) => onChange({ ...eq, ...patch })

  return (
    <View style={{ gap: 12 }}>
      <Card title={sectionTitle}>
        {([
          ['battery', 'סוללה'], ['charger', 'מטען'], ['chain', 'שרשרת'],
          ['lock', 'מנעול'], ['seatLock', 'מנעול כיסא'],
        ] as const).map(([key, label]) => (
          <CheckRow key={key} label={label} checked={eq[key]}
            onChange={v => set({ [key]: v })} />
        ))}
      </Card>

      <Card title="מפתחות">
        <RadioRow label="כל המפתחות" checked={eq.allKeys}
          onPress={() => set({ allKeys: true, missingKeys: [] })} />
        <RadioRow label="חסרים מפתחות" checked={!eq.allKeys}
          onPress={() => set({ allKeys: false })} />
        {!eq.allKeys && (
          <View style={{ marginTop: 8, gap: 8, paddingRight: 16 }}>
            {MISSING_KEYS_OPTIONS.map(opt => (
              <View key={opt.value}>
                <CheckRow
                  label={opt.label}
                  checked={eq.missingKeys.includes(opt.value)}
                  onChange={checked => set({
                    missingKeys: checked
                      ? [...eq.missingKeys, opt.value]
                      : eq.missingKeys.filter(k => k !== opt.value),
                    ...(opt.value === 'other' && !checked ? { missingKeysOther: '' } : {}),
                  })}
                />
                {opt.value === 'other' && eq.missingKeys.includes('other') && (
                  <TextInput
                    value={eq.missingKeysOther}
                    onChangeText={t => set({ missingKeysOther: t })}
                    placeholder="פרט מה חסר..."
                    placeholderTextColor="#9ca3af"
                    style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, fontSize: 13, textAlign: 'right', marginTop: 4 }}
                  />
                )}
              </View>
            ))}
          </View>
        )}
      </Card>

      <Card title="ציוד רפואי">
        <CheckRow label="הוחזר ציוד רפואי" checked={eq.medicalReturned}
          onChange={v => set({ medicalReturned: v })} />
        {eq.medicalReturned && (
          <TextInput
            value={eq.medicalDesc}
            onChangeText={t => set({ medicalDesc: t })}
            placeholder="תאר את הציוד שהוחזר..."
            placeholderTextColor="#9ca3af"
            multiline numberOfLines={2}
            style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, textAlign: 'right', marginTop: 8, minHeight: 56 }}
          />
        )}
      </Card>
    </View>
  )
}

export function Card({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#f1f5f9' }}>
      <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 10, textAlign: 'right' }}>{title}</Text>
      <View style={{ gap: 4 }}>{children}</View>
    </View>
  )
}

export function CheckRow({ label, checked, onChange, danger }: {
  label: string; checked: boolean; onChange: (v: boolean) => void; danger?: boolean
}) {
  return (
    <TouchableOpacity onPress={() => onChange(!checked)}
      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f8fafc' }}>
      <View style={{
        width: 22, height: 22, borderRadius: 6, borderWidth: 2,
        borderColor: checked ? (danger ? '#ef4444' : '#1e3a8a') : '#d1d5db',
        backgroundColor: checked ? (danger ? '#ef4444' : '#1e3a8a') : '#fff',
        alignItems: 'center', justifyContent: 'center',
      }}>
        {checked && <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>{danger ? '✗' : '✓'}</Text>}
      </View>
      <Text style={{ fontSize: 14, color: danger && checked ? '#ef4444' : '#374151', flex: 1, textAlign: 'right', paddingRight: 10 }}>{label}</Text>
    </TouchableOpacity>
  )
}

function RadioRow({ label, checked, onPress }: { label: string; checked: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 }}>
      <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: checked ? '#1e3a8a' : '#d1d5db', alignItems: 'center', justifyContent: 'center' }}>
        {checked && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#1e3a8a' }} />}
      </View>
      <Text style={{ fontSize: 14, color: '#374151', flex: 1, textAlign: 'right', paddingRight: 10 }}>{label}</Text>
    </TouchableOpacity>
  )
}
