const MS_PER_MINUTE = 60_000

export type LocalDateTime = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
}

const pad = (value: number): string => String(value).padStart(2, '0')

export function localDateTime(instant: Date, timeZone: string): LocalDateTime {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  const parts: Partial<Record<string, number>> = {}
  for (const part of formatter.formatToParts(instant)) {
    if (part.type !== 'literal') {
      parts[part.type] = Number(part.value)
    }
  }

  return {
    year: parts.year ?? 0,
    month: parts.month ?? 0,
    day: parts.day ?? 0,
    hour: parts.hour ?? 0,
    minute: parts.minute ?? 0,
    second: parts.second ?? 0,
  }
}

export function localDateString(instant: Date, timeZone: string): string {
  const { year, month, day } = localDateTime(instant, timeZone)
  return `${year}-${pad(month)}-${pad(day)}`
}

export function localMinutesOfDay(instant: Date, timeZone: string): number {
  const { hour, minute, second } = localDateTime(instant, timeZone)
  return hour * 60 + minute + second / 60
}

function zoneOffsetMs(instant: Date, timeZone: string): number {
  const { year, month, day, hour, minute, second } = localDateTime(
    instant,
    timeZone,
  )
  const asUtc = Date.UTC(year, month - 1, day, hour, minute, second)
  return asUtc - instant.getTime()
}

export function zonedDateTimeToUtc(
  date: string,
  minutesOfDay: number,
  timeZone: string,
): Date {
  const [year, month, day] = date.split('-').map(Number)
  const wallClock = Date.UTC(year, month - 1, day, 0, 0, 0) +
    minutesOfDay * MS_PER_MINUTE

  let offset = zoneOffsetMs(new Date(wallClock), timeZone)
  let timestamp = wallClock - offset
  offset = zoneOffsetMs(new Date(timestamp), timeZone)
  timestamp = wallClock - offset

  return new Date(timestamp)
}

export function addDays(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number)
  const shifted = new Date(Date.UTC(year, month - 1, day))
  shifted.setUTCDate(shifted.getUTCDate() + days)
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(
    shifted.getUTCDate(),
  )}`
}

export function isValidDateString(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return false
  }
  const [year, month, day] = date.split('-').map(Number)
  const parsed = new Date(Date.UTC(year, month - 1, day))
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  )
}

export function compareDateStrings(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}
