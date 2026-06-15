import { useCallback, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Modal } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../lib/navigation'
import type { Bike, ReturnEvent, FaultEvent, Sale, Loan, CategoryChange } from '../types'
import { CATEGORY_LABELS, MISSING_KEYS_OPTIONS } from '../types'
import {
  getBikeById, getReturnEvents, getFaultEvents,
  getSales, getLoans, getCategoryChanges, getActiveLoan,
  saveBike, saveCategoryChange,
} from '../lib/storage'
import { formatDate, formatDateTime, daysUntil, uid } from '../lib/utils'
import { useAuth } from '../context/AuthContext'

type Props = NativeStackScreenProps<RootStackParamList, 'BikeDetail'>

const CAT_COLORS: Record<string, { bg: string; text: string }> = {
  new:      { bg: '#dbeafe', text: '#1d4ed8' },
  out:      { bg: '#ffedd5', text: '#9a3412' },
  returned: { bg: '#fef9c3', text: '#92400e' },
  for_sale: { bg: '#dcfce7', text: '#15803d' },
  sold:     { bg: '#f1f5f9', text: '#475569' },
}

export default function BikeDetail({ route, navigation }: Props) {
  const { isAdmin } = useAuth()
  const { id } = route.params
  const [bike, setBike] = useState<Bike | undefined>()
  const [returnEvents, setReturnEvents] = useState<ReturnEvent[]>([])
  const [faultEvents, setFaultEvents] = useState<FaultEvent[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [loans, setLoans] = useState<Loan[]>([])
  const [catChanges, setCatChanges] = useState<CategoryChange[]>([])
  const [activeLoan, setActiveLoan] = useState<Loan | undefined>()
  const [loading, setLoading] = useState(true)
  const [showOutConfirm, setShowOutConfirm] = useState(false)
  const [showSaleConfirm, setShowSaleConfirm] = useState(false)

  const loadData = useCallback(async () => {
    const [b, re, fe, sa, lo, cc, al] = await Promise.all([
      getBikeById(id), getReturnEvents(id), getFaultEvents(id),
      getSales(id), getLoans(id), getCategoryChanges(id), getActiveLoan(id),
    ])
    setBike(b); setReturnEvents(re); setFaultEvents(fe)
    setSales(sa); setLoans(lo); setCatChanges(cc); setActiveLoan(al)
    setLoading(false)
  }, [id])

  useFocusEffect(useCallback(() => { loadData() }, [loadData]))

  if (loading) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator color="#1e3a8a" size="large" />
    </View>
  )
  if (!bike) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#9ca3af' }}>אופניים לא נמצאו</Text>
    </View>
  )

  const catColor = CAT_COLORS[bike.category]
  const isFaulty = bike.status === 'faulty'

  // Action visibility per category
  const showSendOut       = (bike.category === 'new' || bike.category === 'returned') && !isFaulty
  const showFaultBtn      = isFaulty && (bike.category === 'new' || bike.category === 'returned')
  const showTransferSale  = bike.category === 'returned'
  const canSell           = bike.category === 'for_sale'
  const canLoan           = bike.category === 'for_sale' && !activeLoan

  const doSendOut = async () => {
    const now = new Date().toISOString()
    await saveCategoryChange({ id: uid(), bike_id: id, changed_at: now, from_category: bike.category, to_category: 'out' })
    await saveBike({ ...bike, category: 'out', updated_at: now })
    setShowOutConfirm(false)
    navigation.goBack()
  }

  const doTransferToSale = async () => {
    const now = new Date().toISOString()
    await saveCategoryChange({ id: uid(), bike_id: id, changed_at: now, from_category: bike.category, to_category: 'for_sale' })
    await saveBike({ ...bike, category: 'for_sale', updated_at: now })
    setShowSaleConfirm(false)
    await loadData()
  }

  type TimelineEvent =
    | { type: 'category'; date: string; data: CategoryChange }
    | { type: 'return'; date: string; data: ReturnEvent }
    | { type: 'fault'; date: string; data: FaultEvent }
    | { type: 'sale'; date: string; data: Sale }
    | { type: 'loan'; date: string; data: Loan }

  const timeline: TimelineEvent[] = [
    ...catChanges.map(d => ({ type: 'category' as const, date: d.changed_at, data: d })),
    ...returnEvents.map(d => ({ type: 'return' as const, date: d.received_at, data: d })),
    ...faultEvents.map(d => ({ type: 'fault' as const, date: d.created_at, data: d })),
    ...sales.map(d => ({ type: 'sale' as const, date: d.sold_at, data: d })),
    ...loans.map(d => ({ type: 'loan' as const, date: d.loaned_at, data: d })),
  ].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

      {/* Header card */}
      <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#f1f5f9' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 26, fontWeight: '900', color: '#0f172a' }}>#{bike.org_number}</Text>
            {bike.manufacturer && <Text style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>{bike.manufacturer}</Text>}
          </View>
          <View style={{ alignItems: 'flex-end', gap: 6 }}>
            {isAdmin && (
              <TouchableOpacity onPress={() => navigation.navigate('EditBike', { id })} style={{ padding: 6 }}>
                <Text style={{ fontSize: 18, color: '#9ca3af' }}>⚙</Text>
              </TouchableOpacity>
            )}
            <View style={{ backgroundColor: catColor.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: catColor.text }}>{CATEGORY_LABELS[bike.category]}</Text>
            </View>
            <View style={{ backgroundColor: isFaulty ? '#fee2e2' : '#dcfce7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: isFaulty ? '#dc2626' : '#15803d' }}>
                {isFaulty ? 'תקול' : 'תקין'}
              </Text>
            </View>
          </View>
        </View>

        {(bike.frame_number || bike.license_plate) && (
          <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f8fafc', gap: 3 }}>
            {bike.frame_number && <Text style={{ fontSize: 13, color: '#6b7280' }}>שלדה: <Text style={{ fontWeight: '600', color: '#374151' }}>{bike.frame_number}</Text></Text>}
            {bike.license_plate && <Text style={{ fontSize: 13, color: '#6b7280' }}>לוחית: <Text style={{ fontWeight: '600', color: '#374151' }}>{bike.license_plate}</Text></Text>}
          </View>
        )}

        {bike.repaired_at && <Text style={{ fontSize: 11, color: '#059669', marginTop: 6 }}>תוקן: {formatDate(bike.repaired_at)}</Text>}

        {activeLoan && (
          <View style={{ marginTop: 10, backgroundColor: '#fff7ed', borderRadius: 10, padding: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ fontSize: 13, color: '#92400e' }}>בהשאלה ל-{activeLoan.borrower_name}</Text>
              <Text style={{ fontSize: 11, color: '#6b7280' }}>עד {formatDate(activeLoan.return_due_date)}
                {daysUntil(activeLoan.return_due_date) < 0 && <Text style={{ color: '#dc2626', fontWeight: '700' }}> (באיחור!)</Text>}
              </Text>
            </View>
            {isAdmin && (
              <TouchableOpacity onPress={() => navigation.navigate('LoanReturn', { id })}
                style={{ backgroundColor: '#10b981', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 }}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>הוחזר ✓</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Actions — admin only */}
      {isAdmin && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {showSendOut && (
            <ActionBtn label="הוצאה לרוכב" bg="#fff7ed" text="#c2410c" border="#fed7aa"
              onPress={() => setShowOutConfirm(true)} />
          )}
          {showFaultBtn && (
            <ActionBtn label="תיקון תקלות" bg="#fef2f2" text="#dc2626" border="#fecaca"
              onPress={() => navigation.navigate('FaultTreatment', { id })} />
          )}
          {showTransferSale && (
            <ActionBtn label="העברה למכירה" bg="#f0fdf4" text="#15803d" border="#bbf7d0"
              onPress={() => setShowSaleConfirm(true)} />
          )}
          {canSell && (
            <ActionBtn label="מכירה" bg="#f0fdf4" text="#15803d" border="#bbf7d0"
              onPress={() => navigation.navigate('Sale', { id })} />
          )}
          {canLoan && (
            <ActionBtn label="השאלה" bg="#fff7ed" text="#c2410c" border="#fed7aa"
              onPress={() => navigation.navigate('Loan', { id })} />
          )}
        </View>
      )}

      {/* Timeline */}
      <View style={{ backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9' }}>
        <View style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#94a3b8', textAlign: 'right' }}>היסטוריה</Text>
        </View>
        {timeline.length === 0
          ? <Text style={{ textAlign: 'center', color: '#9ca3af', padding: 24, fontSize: 13 }}>אין רשומות עדיין</Text>
          : timeline.map((ev, i) => (
            <View key={i} style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: i < timeline.length - 1 ? 1 : 0, borderBottomColor: '#f8fafc' }}>
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                <Text style={{ fontSize: 18 }}>
                  {ev.type === 'category' ? '🔄' : ev.type === 'return' ? '📥' : ev.type === 'fault' ? '⚠️' : ev.type === 'sale' ? '💰' : '🤝'}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, color: '#94a3b8', marginBottom: 3, textAlign: 'right' }}>{formatDateTime(ev.date)}</Text>

                  {ev.type === 'category' && (
                    <Text style={{ fontSize: 13, color: '#374151', textAlign: 'right' }}>
                      שינוי קטגוריה{ev.data.from_category ? ` מ-${CATEGORY_LABELS[ev.data.from_category]}` : ''} ← {CATEGORY_LABELS[ev.data.to_category]}
                    </Text>
                  )}

                  {ev.type === 'return' && (
                    <View style={{ gap: 3 }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', textAlign: 'right' }}>קליטה</Text>
                      <Text style={{ fontSize: 11, color: '#6b7280', textAlign: 'right' }}>
                        {[
                          `סוללה ${ev.data.battery_returned ? '✓' : '✗'}`,
                          `מטען ${ev.data.charger_returned ? '✓' : '✗'}`,
                          `שרשרת ${ev.data.chain_returned ? '✓' : '✗'}`,
                          `מנעול ${ev.data.lock_returned ? '✓' : '✗'}`,
                          `מנעול כיסא ${ev.data.seat_lock_returned ? '✓' : '✗'}`,
                        ].join(' · ')}
                      </Text>
                      <Text style={{ fontSize: 11, color: ev.data.all_keys_returned ? '#6b7280' : '#dc2626', textAlign: 'right' }}>
                        {ev.data.all_keys_returned
                          ? 'מפתחות: הכל הוחזר ✓'
                          : `מפתחות חסרים: ${ev.data.missing_keys.map(k => MISSING_KEYS_OPTIONS.find(o => o.value === k)?.label ?? k).join(', ')}`}
                      </Text>
                      {ev.data.medical_equipment_returned && (
                        <Text style={{ fontSize: 11, color: '#2563eb', textAlign: 'right' }}>
                          ציוד רפואי הוחזר{ev.data.medical_equipment_description ? `: ${ev.data.medical_equipment_description}` : ''}
                        </Text>
                      )}
                    </View>
                  )}

                  {ev.type === 'fault' && (
                    <View style={{ gap: 3 }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: ev.data.resolved_at ? '#6b7280' : '#dc2626', textAlign: 'right' }}>
                        {ev.data.resolved_at ? 'בדיקה (תוקנה)' : 'תקלה'}
                      </Text>
                      {[
                        ev.data.brake_pads_front && 'רפידות קדמי',
                        ev.data.brake_pads_rear && 'רפידות אחורי',
                        ev.data.brake_discs_front && 'דיסקים קדמי',
                        ev.data.brake_discs_rear && 'דיסקים אחורי',
                        ev.data.brake_oil_front && 'שמן בלמים קדמי',
                        ev.data.brake_oil_rear && 'שמן בלמים אחורי',
                        ev.data.front_tire && 'צמיג קדמי',
                        ev.data.rear_tire && 'צמיג אחורי',
                        ev.data.front_puncture && "פנצ'ר קדמי",
                        ev.data.rear_puncture && "פנצ'ר אחורי",
                        ev.data.front_light && 'פנס קדמי',
                        ev.data.rear_light && 'פנס אחורי',
                        ev.data.front_blinker && 'פליקר קדמי',
                        ev.data.rear_blinker && 'פליקר אחורי',
                        ev.data.horn && 'צופר',
                        ev.data.motor_fault && 'מנוע',
                        ev.data.controller_fault && 'בקר',
                        ev.data.display_fault && 'צג',
                      ].filter(Boolean).length > 0 && (
                        <Text style={{ fontSize: 11, color: '#dc2626', textAlign: 'right' }}>
                          {[
                            ev.data.brake_pads_front && 'רפידות קדמי',
                            ev.data.brake_pads_rear && 'רפידות אחורי',
                            ev.data.brake_discs_front && 'דיסקים קדמי',
                            ev.data.brake_discs_rear && 'דיסקים אחורי',
                            ev.data.brake_oil_front && 'שמן בלמים קדמי',
                            ev.data.brake_oil_rear && 'שמן בלמים אחורי',
                            ev.data.front_tire && 'צמיג קדמי',
                            ev.data.rear_tire && 'צמיג אחורי',
                            ev.data.front_puncture && "פנצ'ר קדמי",
                            ev.data.rear_puncture && "פנצ'ר אחורי",
                            ev.data.front_light && 'פנס קדמי',
                            ev.data.rear_light && 'פנס אחורי',
                            ev.data.front_blinker && 'פליקר קדמי',
                            ev.data.rear_blinker && 'פליקר אחורי',
                            ev.data.horn && 'צופר',
                            ev.data.motor_fault && 'מנוע',
                            ev.data.controller_fault && 'בקר',
                            ev.data.display_fault && 'צג',
                          ].filter(Boolean).join(' · ')}
                        </Text>
                      )}
                      <Text style={{ fontSize: 11, color: '#6b7280', textAlign: 'right' }}>
                        {'מצב רכב: '}
                        {ev.data.vehicle_mode === 'unlocked' ? 'פרוץ' : 'מוגבל מהירות'}
                        {' · איתוראן: '}
                        {ev.data.ituran === 'new' ? 'חדש'
                          : ev.data.ituran === 'old' ? 'ישן'
                          : 'ללא'}
                      </Text>
                      {ev.data.notes?.trim() && (
                        <Text style={{ fontSize: 11, color: '#6b7280', textAlign: 'right' }}>הערות: {ev.data.notes.trim()}</Text>
                      )}
                      {ev.data.resolved_at && (
                        <Text style={{ fontSize: 11, color: '#059669', textAlign: 'right' }}>תוקן: {formatDate(ev.data.resolved_at)}</Text>
                      )}
                    </View>
                  )}

                  {ev.type === 'sale' && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <TouchableOpacity onPress={() => navigation.navigate('BillOfSale', { id, saleId: ev.data.id })}>
                        <Text style={{ fontSize: 12, color: '#2563eb', textDecorationLine: 'underline' }}>שטר מכר</Text>
                      </TouchableOpacity>
                      <View>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: '#15803d', textAlign: 'right' }}>נמכר</Text>
                        <Text style={{ fontSize: 11, color: '#6b7280', textAlign: 'right' }}>{ev.data.buyer_name} · ₪{ev.data.price.toLocaleString()}</Text>
                      </View>
                    </View>
                  )}

                  {ev.type === 'loan' && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <TouchableOpacity onPress={() => navigation.navigate('LoanDoc', { id, loanId: ev.data.id })}>
                        <Text style={{ fontSize: 12, color: '#2563eb', textDecorationLine: 'underline' }}>טופס השאלה</Text>
                      </TouchableOpacity>
                      <View>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: '#c2410c', textAlign: 'right' }}>
                          השאלה {ev.data.returned_at ? '(הוחזר)' : '(פעיל)'}
                        </Text>
                        <Text style={{ fontSize: 11, color: '#6b7280', textAlign: 'right' }}>{ev.data.borrower_name} · עד {formatDate(ev.data.return_due_date)}</Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            </View>
          ))
        }
      </View>

      {/* Confirm send out */}
      <Modal visible={showOutConfirm} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', padding: 16 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 20, gap: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a', textAlign: 'right' }}>אישור הוצאה לרוכב</Text>
            <Text style={{ fontSize: 14, color: '#374151', textAlign: 'right' }}>להוציא אופניים #{bike.org_number} לרוכב?</Text>
            <View style={{ backgroundColor: '#fff7ed', borderRadius: 10, padding: 10 }}>
              <Text style={{ fontSize: 12, color: '#c2410c', textAlign: 'right' }}>
                לאחר היציאה הכרטיס ייעול. קליטה חדשה תרשם בעת חזרתו.
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={() => setShowOutConfirm(false)}
                style={{ flex: 1, paddingVertical: 13, borderRadius: 12, borderWidth: 1.5, borderColor: '#e5e7eb', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#64748b' }}>ביטול</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={doSendOut}
                style={{ flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: '#c2410c', alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>אשר יציאה</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirm transfer to sale */}
      <Modal visible={showSaleConfirm} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', padding: 16 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 20, gap: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a', textAlign: 'right' }}>אישור העברה למכירה</Text>
            <Text style={{ fontSize: 14, color: '#374151', textAlign: 'right' }}>
              להעביר אופניים #{bike.org_number} למכירה?
              {isFaulty && '\n\nשים לב: הכלי מסומן כתקול.'}
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={() => setShowSaleConfirm(false)}
                style={{ flex: 1, paddingVertical: 13, borderRadius: 12, borderWidth: 1.5, borderColor: '#e5e7eb', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#64748b' }}>ביטול</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={doTransferToSale}
                style={{ flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: '#15803d', alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>אשר</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </ScrollView>
  )
}

function ActionBtn({ label, bg, text, border, onPress }: { label: string; bg: string; text: string; border: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress}
      style={{ flex: 1, minWidth: '45%', backgroundColor: bg, borderWidth: 1, borderColor: border, borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}>
      <Text style={{ fontSize: 13, fontWeight: '600', color: text }}>{label}</Text>
    </TouchableOpacity>
  )
}
