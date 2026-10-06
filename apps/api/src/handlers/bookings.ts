import type { FastifyReply, FastifyRequest } from 'fastify'

import type { AppConfig } from '../config.js'
import { assertBookableStart } from '../domain/availability.js'
import { newId, type Repository } from '../domain/repository.js'
import { notFound, unprocessable } from '../errors.js'
import { asRecord, requireNonEmptyString } from './shared.js'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type BookingBody = {
  eventTypeId?: unknown
  start?: unknown
  guestName?: unknown
  guestEmail?: unknown
}

function parseBooking(body: unknown): {
  eventTypeId: string
  start: Date
  guestName: string
  guestEmail: string
} {
  const input = asRecord(body) as BookingBody
  const eventTypeId = requireNonEmptyString(input.eventTypeId, 'eventTypeId')
  const guestName = requireNonEmptyString(input.guestName, 'guestName')

  if (
    typeof input.guestEmail !== 'string' ||
    !EMAIL_PATTERN.test(input.guestEmail)
  ) {
    throw unprocessable('`guestEmail` must be a valid email address')
  }

  if (typeof input.start !== 'string') {
    throw unprocessable('`start` must be an ISO date-time string')
  }

  return {
    eventTypeId,
    start: new Date(input.start),
    guestName,
    guestEmail: input.guestEmail,
  }
}

export function createBookingsHandlers(
  repository: Repository,
  config: AppConfig,
  now: () => Date,
) {
  return {
    async Bookings_list() {
      return repository.listUpcomingOwnerBookings(now().toISOString())
    },

    async Bookings_create(
      request: FastifyRequest,
      reply: FastifyReply,
    ) {
      const booking = parseBooking(request.body)

      const eventType = repository.getEventType(booking.eventTypeId)
      if (!eventType) {
        throw notFound(`Unknown event type "${booking.eventTypeId}"`)
      }

      const instant = now()
      assertBookableStart({
        start: booking.start,
        durationMinutes: eventType.durationMinutes,
        now: instant,
        config,
      })

      const created = repository.createBooking(
        {
          id: newId(),
          eventTypeId: booking.eventTypeId,
          guestName: booking.guestName,
          guestEmail: booking.guestEmail,
          start: booking.start.toISOString(),
          createdAt: instant.toISOString(),
        },
        eventType.durationMinutes,
      )

      return reply.status(201).send(created)
    },
  }
}
