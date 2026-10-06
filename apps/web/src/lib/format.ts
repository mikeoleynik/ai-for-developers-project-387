export const CALENDAR_TIME_ZONE =
  import.meta.env.VITE_CALENDAR_TIMEZONE ?? 'Europe/Moscow'

export function formatSlot(iso: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: CALENDAR_TIME_ZONE,
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(iso))
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: CALENDAR_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function formatDay(date: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(`${date}T00:00:00Z`))
}

export function todayInCalendarZone(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: CALENDAR_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

export function addDaysToDate(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number)
  const shifted = new Date(Date.UTC(year, month - 1, day))
  shifted.setUTCDate(shifted.getUTCDate() + days)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(
    shifted.getUTCDate(),
  )}`
}
