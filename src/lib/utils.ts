export function uid(): string {
  return crypto.randomUUID()
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('he-IL', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  })
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('he-IL', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

export function daysUntil(iso: string): number {
  const now = new Date()
  const due = new Date(iso)
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}
