import { View, Text, TouchableOpacity, TextInput } from 'react-native'
import type { InspectionState } from '../../lib/forms'
import { hasFault } from '../../lib/forms'
import { Card, CheckRow } from './EquipmentForm'

interface Props {
  value: InspectionState
  onChange: (v: InspectionState) => void
}

export default function InspectionForm({ value: ins, onChange }: Props) {
  const set = (patch: Partial<InspectionState>) => onChange({ ...ins, ...patch })

  return (
    <View style={{ gap: 12 }}>
      <View style={{ backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fcd34d', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}>
        <Text style={{ fontSize: 12, color: '#92400e', fontWeight: '600', textAlign: 'right' }}>סימון ✗ = תקלה / ליקוי</Text>
      </View>

      <Card title="מערכת בלימה">
        <CheckRow danger label="רפידות קדמי"     checked={ins.brakePadsFront}  onChange={v => set({ brakePadsFront: v })} />
        <CheckRow danger label="רפידות אחורי"    checked={ins.brakePadsRear}   onChange={v => set({ brakePadsRear: v })} />
        <CheckRow danger label="דיסקים קדמי"     checked={ins.brakeDiscsFront} onChange={v => set({ brakeDiscsFront: v })} />
        <CheckRow danger label="דיסקים אחורי"    checked={ins.brakeDiscsRear}  onChange={v => set({ brakeDiscsRear: v })} />
        <CheckRow danger label="שמן בלמים קדמי"  checked={ins.brakeOilFront}   onChange={v => set({ brakeOilFront: v })} />
        <CheckRow danger label="שמן בלמים אחורי" checked={ins.brakeOilRear}    onChange={v => set({ brakeOilRear: v })} />
      </Card>

      <Card title="גלגלים">
        <CheckRow danger label="צמיג קדמי"   checked={ins.frontTire}     onChange={v => set({ frontTire: v })} />
        <CheckRow danger label="צמיג אחורי"  checked={ins.rearTire}      onChange={v => set({ rearTire: v })} />
        <CheckRow danger label="פנצ'ר קדמי"  checked={ins.frontPuncture} onChange={v => set({ frontPuncture: v })} />
        <CheckRow danger label="פנצ'ר אחורי" checked={ins.rearPuncture}  onChange={v => set({ rearPuncture: v })} />
      </Card>

      <Card title="תאורה ואבזור">
        <CheckRow danger label="פנס קדמי"    checked={ins.frontLight}   onChange={v => set({ frontLight: v })} />
        <CheckRow danger label="פנס אחורי"   checked={ins.rearLight}    onChange={v => set({ rearLight: v })} />
        <CheckRow danger label="פליקר קדמי"  checked={ins.frontBlinker} onChange={v => set({ frontBlinker: v })} />
        <CheckRow danger label="פליקר אחורי" checked={ins.rearBlinker}  onChange={v => set({ rearBlinker: v })} />
        <CheckRow danger label="צופר"        checked={ins.horn}         onChange={v => set({ horn: v })} />
      </Card>

      <Card title="מערכת חשמל">
        <CheckRow danger label="מנוע" checked={ins.motorFault}      onChange={v => set({ motorFault: v })} />
        <CheckRow danger label="בקר"  checked={ins.controllerFault} onChange={v => set({ controllerFault: v })} />
        <CheckRow danger label="צג"   checked={ins.displayFault}    onChange={v => set({ displayFault: v })} />
      </Card>

      {/* Vehicle mode — required */}
      <Card title="הגדרות כלי">
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
          {(['limited', 'unlocked'] as const).map(mode => {
            const isOn = ins.vehicleMode === mode
            const isUnlocked = mode === 'unlocked'
            return (
              <TouchableOpacity key={mode}
                onPress={() => set({ vehicleMode: mode })}
                style={{
                  flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center',
                  borderWidth: 1.5,
                  backgroundColor: isOn ? (isUnlocked ? '#ef4444' : '#1e3a8a') : '#f8fafc',
                  borderColor: isOn ? (isUnlocked ? '#ef4444' : '#1e3a8a') : '#e5e7eb',
                }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: isOn ? '#fff' : (isUnlocked ? '#ef4444' : '#64748b') }}>
                  {mode === 'limited' ? 'מוגבל' : 'פרוץ ⚠️'}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </Card>

      {/* Ituran */}
      <Card title="איתוראן">
        {([
          { val: 'none', label: 'אין איתוראן', color: '#6b7280' },
          { val: 'new', label: 'חדש (תקין)', color: '#059669' },
          { val: 'old', label: 'ישן (תקול)', color: '#ef4444' },
        ] as const).map(opt => (
          <TouchableOpacity key={opt.val} onPress={() => set({ ituran: opt.val })}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 }}>
            <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: ins.ituran === opt.val ? '#1e3a8a' : '#d1d5db', alignItems: 'center', justifyContent: 'center' }}>
              {ins.ituran === opt.val && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#1e3a8a' }} />}
            </View>
            <Text style={{ fontSize: 14, color: opt.color, flex: 1, textAlign: 'right', paddingRight: 10 }}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </Card>

      {/* Notes */}
      <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#f1f5f9' }}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8, textAlign: 'right' }}>הערות תקלה</Text>
        <TextInput
          value={ins.notes}
          onChangeText={t => set({ notes: t })}
          placeholder="תקלות נוספות שאינן ברשימה..."
          placeholderTextColor="#9ca3af"
          multiline numberOfLines={3}
          style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, textAlign: 'right', minHeight: 70 }}
        />
      </View>

      {/* Status summary */}
      <View style={{ borderRadius: 12, padding: 12, alignItems: 'center', backgroundColor: hasFault(ins) ? '#fef2f2' : '#f0fdf4' }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: hasFault(ins) ? '#dc2626' : '#15803d' }}>
          סטטוס: {hasFault(ins) ? 'תקול' : 'תקין'}
        </Text>
      </View>
    </View>
  )
}
