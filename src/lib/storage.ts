import { supabase } from './supabase'
import type {
  Bike, ReturnEvent, FaultEvent, Sale, Loan,
  CategoryChange, IdentityChange,
} from '../types'

// ── helpers ────────────────────────────────────────────────

function row(res: { data: unknown; error: unknown }): unknown {
  if (res.error) throw res.error
  return res.data
}

// ── Bikes ──────────────────────────────────────────────────

export async function getBikes(): Promise<Bike[]> {
  const { data, error } = await supabase.from('bikes').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Bike[]
}

export async function getBikeById(id: string): Promise<Bike | undefined> {
  const { data, error } = await supabase.from('bikes').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return (data ?? undefined) as Bike | undefined
}

export async function getBikeByOrgNumber(num: string): Promise<Bike | undefined> {
  const { data, error } = await supabase.from('bikes').select('*').eq('org_number', num).maybeSingle()
  if (error) throw error
  return (data ?? undefined) as Bike | undefined
}

export async function saveBike(bike: Bike): Promise<void> {
  row(await supabase.from('bikes').upsert(bike as any))
}

export async function deleteBike(id: string): Promise<void> {
  row(await supabase.from('bikes').delete().eq('id', id))
}

export async function orgNumberActiveExists(num: string, excludeId?: string): Promise<boolean> {
  let q = supabase
    .from('bikes')
    .select('id', { count: 'exact', head: true })
    .eq('org_number', num)
    .not('category', 'in', '(out,sold)')
  if (excludeId) q = q.neq('id', excludeId)
  const { count, error } = await q
  if (error) throw error
  return (count ?? 0) > 0
}

export async function getOutBikeByOrgNumber(num: string): Promise<Bike | undefined> {
  const { data, error } = await supabase
    .from('bikes')
    .select('*')
    .eq('org_number', num)
    .eq('category', 'out')
    .maybeSingle()
  if (error) throw error
  return (data ?? undefined) as Bike | undefined
}

// ── Return events ──────────────────────────────────────────

export async function getReturnEvents(bikeId?: string): Promise<ReturnEvent[]> {
  let q = supabase.from('return_events').select('*').order('received_at', { ascending: false })
  if (bikeId) q = q.eq('bike_id', bikeId)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as ReturnEvent[]
}

export async function saveReturnEvent(e: ReturnEvent): Promise<void> {
  row(await supabase.from('return_events').upsert(e as any))
}

// ── Fault events ───────────────────────────────────────────

export async function getFaultEvents(bikeId?: string): Promise<FaultEvent[]> {
  let q = supabase.from('fault_events').select('*').order('created_at', { ascending: false })
  if (bikeId) q = q.eq('bike_id', bikeId)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as FaultEvent[]
}

export async function saveFaultEvent(e: FaultEvent): Promise<void> {
  row(await supabase.from('fault_events').upsert(e as any))
}

// ── Sales ──────────────────────────────────────────────────

export async function getSales(bikeId?: string): Promise<Sale[]> {
  let q = supabase.from('sales').select('*').order('sold_at', { ascending: false })
  if (bikeId) q = q.eq('bike_id', bikeId)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as Sale[]
}

export async function saveSale(s: Sale): Promise<void> {
  row(await supabase.from('sales').upsert(s as any))
}

// ── Loans ──────────────────────────────────────────────────

export async function getLoans(bikeId?: string): Promise<Loan[]> {
  let q = supabase.from('loans').select('*').order('loaned_at', { ascending: false })
  if (bikeId) q = q.eq('bike_id', bikeId)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as Loan[]
}

export async function saveLoan(l: Loan): Promise<void> {
  row(await supabase.from('loans').upsert(l as any))
}

export async function getActiveLoan(bikeId: string): Promise<Loan | undefined> {
  const { data, error } = await supabase
    .from('loans')
    .select('*')
    .eq('bike_id', bikeId)
    .is('returned_at', null)
    .maybeSingle()
  if (error) throw error
  return (data ?? undefined) as Loan | undefined
}

export async function getOverdueLoans(): Promise<Array<Loan & { bike: Bike | undefined }>> {
  const { data, error } = await supabase
    .from('loans')
    .select('*, bike:bikes(*)')
    .is('returned_at', null)
  if (error) throw error
  const now = new Date()
  return ((data ?? []) as Array<Loan & { bike: Bike }>)
    .filter(l => {
      const due = new Date(l.return_due_date)
      const daysLeft = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      return daysLeft <= l.alert_days_before
    })
}

// ── Category changes ────────────────────────────────────────

export async function getCategoryChanges(bikeId?: string): Promise<CategoryChange[]> {
  let q = supabase.from('category_changes').select('*').order('changed_at', { ascending: false })
  if (bikeId) q = q.eq('bike_id', bikeId)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as CategoryChange[]
}

export async function saveCategoryChange(c: CategoryChange): Promise<void> {
  row(await supabase.from('category_changes').upsert(c as any))
}

// ── Identity changes ────────────────────────────────────────

export async function getIdentityChanges(bikeId?: string): Promise<IdentityChange[]> {
  let q = supabase.from('identity_changes').select('*').order('changed_at', { ascending: false })
  if (bikeId) q = q.eq('bike_id', bikeId)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as IdentityChange[]
}

export async function saveIdentityChange(c: IdentityChange): Promise<void> {
  row(await supabase.from('identity_changes').upsert(c as any))
}
