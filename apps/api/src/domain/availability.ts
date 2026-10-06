import { unprocessable } from '../errors.js'
import type { AppConfig } from '../config.js'
import { overlaps, type Interval } from './interval.js'
import {
  addDays,
  compareDateStrings,
  isValidDateString,
  localDateTime,
  localDateString,
  localMinutesOfDay,
  zonedDateTimeToUtc,
} from './time.js'

export type DayAvailability = {
  date: string
  startTimes: string[]
}

export function bookingWindow(
  now: Date,
  config: AppConfig,
): { start: string; end: string } {
  const today = localDateString(now, config.timeZone)
  return { start: today, end: addDays(today, config.windowDays - 1) }
}

export function assertRangeInWindow(
  from: string,
  to: string,
  now: Date,
  config: AppConfig,
): void {
  if (!isValidDateString(from) || !isValidDateString(to)) {
    throw unprocessable('`from` and `to` must be dates in YYYY-MM-DD format')
  }
  if (compareDateStrings(from, to) > 0) {
    throw unprocessable('`from` must not be after `to`')
  }
  const window = bookingWindow(now, config)
  if (
    compareDateStrings(from, window.start) < 0 ||
    compareDateStrings(to, window.end) > 0
  ) {
    throw unprocessable(
      `Range must stay inside the booking window ${window.start}..${window.end}`,
    )
  }
}

export function buildAvailability(params: {
  durationMinutes: number
  from: string
  to: string
  now: Date
  config: AppConfig
  bookings: Interval[]
}): DayAvailability[] {
  const { durationMinutes, from, to, now, config, bookings } = params
  const days: DayAvailability[] = []

  for (
    let date = from;
    compareDateStrings(date, to) <= 0;
    date = addDays(date, 1)
  ) {
    const startTimes: string[] = []

    for (
      let minutes = config.workDayStartMinutes;
      minutes + durationMinutes <= config.workDayEndMinutes;
      minutes += config.slotMinutes
    ) {
      const start = zonedDateTimeToUtc(date, minutes, config.timeZone)
      if (start.getTime() <= now.getTime()) {
        continue
      }
      const end = new Date(start.getTime() + durationMinutes * 60_000)
      const busy = bookings.some((booking) =>
        overlaps(start, end, booking.start, booking.end),
      )
      if (!busy) {
        startTimes.push(start.toISOString())
      }
    }

    days.push({ date, startTimes })
  }

  return days
}

export function assertBookableStart(params: {
  start: Date
  durationMinutes: number
  now: Date
  config: AppConfig
}): void {
  const { start, durationMinutes, now, config } = params

  if (Number.isNaN(start.getTime())) {
    throw unprocessable('`start` must be a valid ISO date-time')
  }
  if (start.getTime() <= now.getTime()) {
    throw unprocessable('`start` must be in the future')
  }

  const window = bookingWindow(now, config)
  const date = localDateString(start, config.timeZone)
  if (
    compareDateStrings(date, window.start) < 0 ||
    compareDateStrings(date, window.end) > 0
  ) {
    throw unprocessable('`start` must fall inside the booking window')
  }

  const { second } = localDateTime(start, config.timeZone)
  const minutesOfDay = localMinutesOfDay(start, config.timeZone)
  if (
    start.getUTCMilliseconds() !== 0 ||
    second !== 0 ||
    !Number.isInteger(minutesOfDay) ||
    minutesOfDay % config.slotMinutes !== 0
  ) {
    throw unprocessable(
      `\`start\` must be aligned to the ${config.slotMinutes}-minute grid`,
    )
  }

  if (
    minutesOfDay < config.workDayStartMinutes ||
    minutesOfDay + durationMinutes > config.workDayEndMinutes
  ) {
    throw unprocessable(
      `The meeting must fit inside working hours ${Math.floor(
        config.workDayStartMinutes / 60,
      )}:00-${Math.floor(config.workDayEndMinutes / 60)}:00`,
    )
  }
}
