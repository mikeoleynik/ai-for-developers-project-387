import type { APIRequestContext } from '@playwright/test'

export const API_URL = 'http://localhost:8080'

const CALENDAR_TIME_ZONE = process.env.CALENDAR_TIMEZONE ?? 'Europe/Moscow'

export function uniqueId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`
}

export function moscowToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: CALENDAR_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

export function moscowTime(iso: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: CALENDAR_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function addDays(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number)
  const shifted = new Date(Date.UTC(year, month - 1, day))
  shifted.setUTCDate(shifted.getUTCDate() + days)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(
    shifted.getUTCDate(),
  )}`
}

export type EventTypeInput = {
  id: string
  title: string
  description?: string
  durationMinutes: number
}

export async function createEventType(
  request: APIRequestContext,
  input: EventTypeInput,
): Promise<void> {
  const response = await request.post(`${API_URL}/event-types`, { data: input })
  if (response.status() !== 201) {
    throw new Error(
      `Failed to create event type: ${response.status()} ${await response.text()}`,
    )
  }
}

export async function bookSlot(
  request: APIRequestContext,
  input: {
    eventTypeId: string
    start: string
    guestName: string
    guestEmail: string
  },
) {
  return request.post(`${API_URL}/bookings`, {
    data: input,
    failOnStatusCode: false,
  })
}

export async function firstFreeSlot(
  request: APIRequestContext,
  eventTypeId: string,
): Promise<{ date: string; start: string }> {
  const from = moscowToday()
  const to = addDays(from, 13)
  const response = await request.get(`${API_URL}/availability`, {
    params: { eventTypeId, from, to },
    failOnStatusCode: true,
  })
  const days = (await response.json()) as {
    date: string
    startTimes: string[]
  }[]

  for (const day of days) {
    const start = day.startTimes[0]
    if (start) {
      return { date: day.date, start }
    }
  }

  throw new Error('No free slot found in the booking window')
}
