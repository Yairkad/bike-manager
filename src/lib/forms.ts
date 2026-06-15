export interface EquipmentState {
  battery: boolean
  charger: boolean
  chain: boolean
  lock: boolean
  seatLock: boolean
  allKeys: boolean
  missingKeys: string[]
  missingKeysOther: string
  medicalReturned: boolean
  medicalDesc: string
}

export interface InspectionState {
  brakePadsFront: boolean
  brakePadsRear: boolean
  brakeDiscsFront: boolean
  brakeDiscsRear: boolean
  brakeOilFront: boolean
  brakeOilRear: boolean
  frontTire: boolean
  rearTire: boolean
  frontPuncture: boolean
  rearPuncture: boolean
  frontLight: boolean
  rearLight: boolean
  frontBlinker: boolean
  rearBlinker: boolean
  horn: boolean
  motorFault: boolean
  controllerFault: boolean
  displayFault: boolean
  vehicleMode: 'limited' | 'unlocked'
  ituran: 'new' | 'old' | 'none'
  notes: string
}

export const defaultEquipment = (): EquipmentState => ({
  battery: true, charger: true, chain: true, lock: true, seatLock: true,
  allKeys: true, missingKeys: [], missingKeysOther: '',
  medicalReturned: false, medicalDesc: '',
})

export const defaultInspection = (): InspectionState => ({
  brakePadsFront: false, brakePadsRear: false,
  brakeDiscsFront: false, brakeDiscsRear: false, brakeOilFront: false, brakeOilRear: false,
  frontTire: false, rearTire: false, frontPuncture: false, rearPuncture: false,
  frontLight: false, rearLight: false, frontBlinker: false, rearBlinker: false,
  horn: false,
  motorFault: false, controllerFault: false, displayFault: false,
  vehicleMode: 'limited' as const,
  ituran: 'none' as const,
  notes: '',
})

export function hasFault(ins: InspectionState): boolean {
  const { notes, ituran, vehicleMode, ...flags } = ins
  return Object.values(flags).some(Boolean) ||
    ituran === 'old' ||
    vehicleMode === 'unlocked' ||
    notes.trim().length > 0
}
