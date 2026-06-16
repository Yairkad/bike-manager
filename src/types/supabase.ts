// Auto-generated shape matching supabase/migrations/20260615000001_initial_schema.sql
// Run `supabase gen types typescript` to regenerate after schema changes.

export type BikeCategory = 'new' | 'out' | 'returned' | 'for_sale' | 'sold'
export type BikeStatus   = 'ok' | 'faulty'
export type VehicleMode  = 'limited' | 'unlocked'
export type IturanStatus = 'new' | 'old' | 'none'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row:    { id: string; name: string; role: 'admin' | 'viewer'; created_at: string; updated_at: string }
        Insert: { id: string; name: string; role?: 'admin' | 'viewer'; created_at?: string; updated_at?: string }
        Update: { name?: string; role?: 'admin' | 'viewer'; updated_at?: string }
      }
      bikes: {
        Row: {
          id: string; org_number: string; frame_number: string | null
          license_plate: string | null; manufacturer: string | null
          model: string | null; year: number | null; has_digital_display: boolean | null
          photo_url: string | null
          category: BikeCategory; status: BikeStatus
          created_at: string; updated_at: string; repaired_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string; org_number: string; frame_number?: string | null
          license_plate?: string | null; manufacturer?: string | null
          model?: string | null; year?: number | null; has_digital_display?: boolean | null
          photo_url?: string | null
          category?: BikeCategory; status?: BikeStatus
          created_at?: string; updated_at?: string; repaired_at?: string | null
          created_by?: string | null
        }
        Update: {
          org_number?: string; frame_number?: string | null
          license_plate?: string | null; manufacturer?: string | null
          model?: string | null; year?: number | null; has_digital_display?: boolean | null
          photo_url?: string | null
          category?: BikeCategory; status?: BikeStatus
          updated_at?: string; repaired_at?: string | null
        }
      }
      return_events: {
        Row: {
          id: string; bike_id: string; received_at: string
          battery_returned: boolean; charger_returned: boolean
          chain_returned: boolean; lock_returned: boolean
          seat_lock_returned: boolean; all_keys_returned: boolean
          missing_keys: string[]; missing_keys_other: string | null
          medical_equipment_returned: boolean
          medical_equipment_description: string | null
        }
        Insert: {
          id?: string; bike_id: string; received_at?: string
          battery_returned?: boolean; charger_returned?: boolean
          chain_returned?: boolean; lock_returned?: boolean
          seat_lock_returned?: boolean; all_keys_returned?: boolean
          missing_keys?: string[]; missing_keys_other?: string | null
          medical_equipment_returned?: boolean
          medical_equipment_description?: string | null
        }
        Update: Record<string, never>
      }
      fault_events: {
        Row: {
          id: string; bike_id: string; created_at: string
          brake_pads_front: boolean; brake_pads_rear: boolean
          brake_discs_front: boolean; brake_discs_rear: boolean
          brake_oil_front: boolean; brake_oil_rear: boolean
          front_tire: boolean; rear_tire: boolean
          front_puncture: boolean; rear_puncture: boolean
          front_light: boolean; rear_light: boolean
          front_blinker: boolean; rear_blinker: boolean
          horn: boolean; motor_fault: boolean
          controller_fault: boolean; display_fault: boolean
          vehicle_mode: VehicleMode; ituran: IturanStatus
          notes: string | null; resolved_at: string | null
        }
        Insert: {
          id?: string; bike_id: string; created_at?: string
          brake_pads_front?: boolean; brake_pads_rear?: boolean
          brake_discs_front?: boolean; brake_discs_rear?: boolean
          brake_oil_front?: boolean; brake_oil_rear?: boolean
          front_tire?: boolean; rear_tire?: boolean
          front_puncture?: boolean; rear_puncture?: boolean
          front_light?: boolean; rear_light?: boolean
          front_blinker?: boolean; rear_blinker?: boolean
          horn?: boolean; motor_fault?: boolean
          controller_fault?: boolean; display_fault?: boolean
          vehicle_mode?: VehicleMode; ituran?: IturanStatus
          notes?: string | null; resolved_at?: string | null
        }
        Update: { resolved_at?: string | null; notes?: string | null }
      }
      sales: {
        Row: {
          id: string; bike_id: string; sold_at: string; price: number
          notes: string | null; buyer_name: string
          buyer_id_number: string; buyer_phone: string
        }
        Insert: {
          id?: string; bike_id: string; sold_at?: string; price: number
          notes?: string | null; buyer_name: string
          buyer_id_number: string; buyer_phone: string
        }
        Update: Record<string, never>
      }
      loans: {
        Row: {
          id: string; bike_id: string; loaned_at: string
          return_due_date: string; returned_at: string | null
          alert_days_before: number
          borrower_name: string; borrower_id_number: string; borrower_phone: string
          notes: string | null
          loaned_battery: boolean; loaned_charger: boolean
          loaned_chain: boolean; loaned_lock: boolean
          loaned_seat_lock: boolean; loaned_all_keys: boolean
          loaned_missing_keys: string[]; loaned_missing_keys_other: string | null
          loaned_medical: boolean; loaned_medical_desc: string | null
        }
        Insert: {
          id?: string; bike_id: string; loaned_at?: string
          return_due_date: string; returned_at?: string | null
          alert_days_before?: number
          borrower_name: string; borrower_id_number: string; borrower_phone: string
          notes?: string | null
          loaned_battery?: boolean; loaned_charger?: boolean
          loaned_chain?: boolean; loaned_lock?: boolean
          loaned_seat_lock?: boolean; loaned_all_keys?: boolean
          loaned_missing_keys?: string[]; loaned_missing_keys_other?: string | null
          loaned_medical?: boolean; loaned_medical_desc?: string | null
        }
        Update: { returned_at?: string | null }
      }
      category_changes: {
        Row: {
          id: string; bike_id: string; changed_at: string
          from_category: BikeCategory | null; to_category: BikeCategory
          changed_by: string | null
        }
        Insert: {
          id?: string; bike_id: string; changed_at?: string
          from_category?: BikeCategory | null; to_category: BikeCategory
          changed_by?: string | null
        }
        Update: Record<string, never>
      }
      identity_changes: {
        Row: {
          id: string; bike_id: string; changed_at: string
          field: 'org_number' | 'frame_number' | 'license_plate' | 'manufacturer'
          old_value: string | null; new_value: string | null
          changed_by: string | null
        }
        Insert: {
          id?: string; bike_id: string; changed_at?: string
          field: 'org_number' | 'frame_number' | 'license_plate' | 'manufacturer'
          old_value?: string | null; new_value?: string | null
          changed_by?: string | null
        }
        Update: Record<string, never>
      }
    }
  }
}
