import { randomUUID } from 'node:crypto'

import Database from 'better-sqlite3'

import { conflict, unprocessable } from '../errors.js'
import { overlaps, type Interval } from './interval.js'

export type EventType = {
  id: string
  title: string
  description?: string
  durationMinutes: number
}

export type BookingRecord = {
  id: string
  eventTypeId: string
  guestName: string
  guestEmail: string
  start: string
  createdAt: string
}

export type OwnerBookingRecord = BookingRecord & {
  eventTypeTitle: string
  durationMinutes: number
}

export interface Repository {
  listEventTypes(): EventType[]
  getEventType(id: string): EventType | undefined
  createEventType(input: EventType): EventType
  createBooking(input: BookingRecord, durationMinutes: number): BookingRecord
  listUpcomingOwnerBookings(nowIso: string): OwnerBookingRecord[]
  listBookingIntervals(): Interval[]
  close(): void
}

type EventTypeRow = {
  id: string
  title: string
  description: string | null
  duration_minutes: number
}

type BookingRow = {
  id: string
  event_type_id: string
  guest_name: string
  guest_email: string
  start: string
  created_at: string
}

type OwnerBookingRow = BookingRow & {
  event_type_title: string
  duration_minutes: number
}

type IntervalRow = {
  start: string
  duration_minutes: number
}

const toEventType = (row: EventTypeRow): EventType => ({
  id: row.id,
  title: row.title,
  description: row.description ?? undefined,
  durationMinutes: row.duration_minutes,
})

const toBooking = (row: BookingRow): BookingRecord => ({
  id: row.id,
  eventTypeId: row.event_type_id,
  guestName: row.guest_name,
  guestEmail: row.guest_email,
  start: row.start,
  createdAt: row.created_at,
})

export function createSqliteRepository(path: string): Repository {
  const db = new Database(path)
  db.pragma('journal_mode = WAL')
  db.exec(`
    CREATE TABLE IF NOT EXISTS event_types (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      duration_minutes INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      event_type_id TEXT NOT NULL,
      guest_name TEXT NOT NULL,
      guest_email TEXT NOT NULL,
      start TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (event_type_id) REFERENCES event_types(id)
    );
    CREATE INDEX IF NOT EXISTS bookings_start_idx ON bookings(start);
  `)

  const eventTypeById = db.prepare<[string], EventTypeRow>(
    `SELECT id, title, description, duration_minutes
     FROM event_types WHERE id = ?`,
  )
  const allEventTypes = db.prepare<[], EventTypeRow>(
    `SELECT id, title, description, duration_minutes
     FROM event_types ORDER BY rowid ASC`,
  )
  const insertEventType = db.prepare(
    `INSERT INTO event_types (id, title, description, duration_minutes)
     VALUES (@id, @title, @description, @durationMinutes)`,
  )
  const insertBooking = db.prepare(
    `INSERT INTO bookings
       (id, event_type_id, guest_name, guest_email, start, created_at)
     VALUES
       (@id, @eventTypeId, @guestName, @guestEmail, @start, @createdAt)`,
  )
  const bookingIntervals = db.prepare<[], IntervalRow>(
    `SELECT b.start AS start, e.duration_minutes AS duration_minutes
     FROM bookings b JOIN event_types e ON e.id = b.event_type_id`,
  )
  const upcomingOwnerBookings = db.prepare<[string], OwnerBookingRow>(
    `SELECT
       b.id, b.event_type_id, b.guest_name, b.guest_email, b.start, b.created_at,
       e.title AS event_type_title, e.duration_minutes
     FROM bookings b JOIN event_types e ON e.id = b.event_type_id
     WHERE b.start >= ?
     ORDER BY b.start ASC`,
  )

  const createBookingTransaction = db.transaction(
    (input: BookingRecord, durationMinutes: number): BookingRecord => {
      const start = new Date(input.start)
      const end = new Date(start.getTime() + durationMinutes * 60_000)

      for (const row of bookingIntervals.all()) {
        const rowStart = new Date(row.start)
        const rowEnd = new Date(
          rowStart.getTime() + row.duration_minutes * 60_000,
        )
        if (overlaps(start, end, rowStart, rowEnd)) {
          throw conflict('The slot is already booked')
        }
      }

      insertBooking.run(input)
      return input
    },
  )

  return {
    listEventTypes(): EventType[] {
      return allEventTypes.all().map(toEventType)
    },

    getEventType(id: string): EventType | undefined {
      const row = eventTypeById.get(id)
      return row ? toEventType(row) : undefined
    },

    createEventType(input: EventType): EventType {
      if (eventTypeById.get(input.id)) {
        throw unprocessable(`Event type with id "${input.id}" already exists`)
      }
      insertEventType.run({
        id: input.id,
        title: input.title,
        description: input.description ?? null,
        durationMinutes: input.durationMinutes,
      })
      return input
    },

    createBooking(input: BookingRecord, durationMinutes: number): BookingRecord {
      return createBookingTransaction(input, durationMinutes)
    },

    listUpcomingOwnerBookings(nowIso: string): OwnerBookingRecord[] {
      return upcomingOwnerBookings.all(nowIso).map((row) => ({
        ...toBooking(row),
        eventTypeTitle: row.event_type_title,
        durationMinutes: row.duration_minutes,
      }))
    },

    listBookingIntervals(): Interval[] {
      return bookingIntervals.all().map((row) => {
        const start = new Date(row.start)
        return {
          start,
          end: new Date(start.getTime() + row.duration_minutes * 60_000),
        }
      })
    },

    close(): void {
      db.close()
    },
  }
}

export function newId(): string {
  return randomUUID()
}
