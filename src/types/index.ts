export type BikeCategory =
  | 'new'        // חדש
  | 'out'        // יצא לרוכב
  | 'returned'   // חזר מרוכב
  | 'for_sale'   // למכירה
  | 'sold'       // נמכר

export type BikeStatus = 'ok' | 'faulty'

export const CATEGORY_LABELS: Record<BikeCategory, string> = {
  new: 'חדש',
  out: 'יצא לרוכב',
  returned: 'חזר מרוכב',
  for_sale: 'למכירה',
  sold: 'נמכר',
}

export const CATEGORY_COLORS: Record<BikeCategory, string> = {
  new: 'bg-blue-100 text-blue-800',
  out: 'bg-orange-100 text-orange-800',
  returned: 'bg-yellow-100 text-yellow-800',
  for_sale: 'bg-green-100 text-green-800',
  sold: 'bg-gray-100 text-gray-600',
}

export const MANUFACTURERS = [] as const

export const MISSING_KEYS_OPTIONS = [
  { value: 'battery_key', label: 'מפתח סוללה' },
  { value: 'chain_key', label: 'מפתח שרשרת' },
  { value: 'box_key', label: 'מפתח ארגז' },
  { value: 'seat_lock_key', label: 'מפתח מנעול כיסא' },
  { value: 'chip', label: "צ'יפ / שלט הפעלה" },
  { value: 'other', label: 'אחר' },
] as const

export interface Bike {
  id: string
  org_number: string
  frame_number?: string
  license_plate?: string
  manufacturer?: string
  category: BikeCategory
  status: BikeStatus
  created_at: string
  updated_at: string
  repaired_at?: string
}

export interface ReturnEvent {
  id: string
  bike_id: string
  received_at: string
  battery_returned: boolean
  charger_returned: boolean
  chain_returned: boolean
  lock_returned: boolean
  seat_lock_returned: boolean
  all_keys_returned: boolean
  missing_keys: string[]
  missing_keys_other?: string
  medical_equipment_returned: boolean
  medical_equipment_description?: string
}

export interface FaultEvent {
  id: string
  bike_id: string
  created_at: string
  brake_pads_front: boolean
  brake_pads_rear: boolean
  brake_discs_front: boolean
  brake_discs_rear: boolean
  brake_oil_front: boolean
  brake_oil_rear: boolean
  front_tire: boolean
  rear_tire: boolean
  front_puncture: boolean
  rear_puncture: boolean
  front_light: boolean
  rear_light: boolean
  front_blinker: boolean
  rear_blinker: boolean
  horn: boolean
  motor_fault: boolean
  controller_fault: boolean
  display_fault: boolean
  vehicle_mode?: 'limited' | 'unlocked'
  ituran?: 'new' | 'old' | 'none'
  notes?: string
  resolved_at?: string
}

export interface Sale {
  id: string
  bike_id: string
  sold_at: string
  price: number
  notes?: string
  buyer_name: string
  buyer_id_number: string
  buyer_phone: string
}

export interface CategoryChange {
  id: string
  bike_id: string
  changed_at: string
  from_category?: BikeCategory
  to_category: BikeCategory
  changed_by?: string
}

// השאלה — רק לאופניים בקטגוריית "למכירה"
export interface Loan {
  id: string
  bike_id: string
  loaned_at: string
  return_due_date: string        // תאריך החזרה מתוכנן
  returned_at?: string           // תאריך החזרה בפועל (null = עדיין בהשאלה)
  alert_days_before: number      // כמה ימים לפני להתריע (ברירת מחדל: 3)
  borrower_name: string
  borrower_id_number: string
  borrower_phone: string
  notes?: string
  // ציוד שיצא עם הכלי
  loaned_battery: boolean
  loaned_charger: boolean
  loaned_chain: boolean
  loaned_lock: boolean
  loaned_seat_lock: boolean
  loaned_all_keys: boolean
  loaned_missing_keys: string[]
  loaned_missing_keys_other?: string
  loaned_medical: boolean
  loaned_medical_desc?: string
}

export interface IdentityChange {
  id: string
  bike_id: string
  changed_at: string
  field: 'org_number' | 'frame_number' | 'license_plate' | 'manufacturer'
  old_value?: string
  new_value?: string
}

export interface BikeWithHistory extends Bike {
  return_events?: ReturnEvent[]
  fault_events?: FaultEvent[]
  sales?: Sale[]
  loans?: Loan[]
  category_changes?: CategoryChange[]
  identity_changes?: IdentityChange[]
}
