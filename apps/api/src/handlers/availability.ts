import type { AppConfig } from '../config.js'
import {
  assertRangeInWindow,
  buildAvailability,
} from '../domain/availability.js'
import type { Repository } from '../domain/repository.js'
import { notFound } from '../errors.js'
import { asRecord, requireNonEmptyString } from './shared.js'

import type { FastifyRequest } from 'fastify'

export function createAvailabilityHandlers(
  repository: Repository,
  config: AppConfig,
  now: () => Date,
) {
  return {
    async Availability_list(request: FastifyRequest) {
      const query = asRecord(request.query)
      const eventTypeId = requireNonEmptyString(
        query.eventTypeId,
        'eventTypeId',
      )
      const from = requireNonEmptyString(query.from, 'from')
      const to = requireNonEmptyString(query.to, 'to')

      const eventType = repository.getEventType(eventTypeId)
      if (!eventType) {
        throw notFound(`Unknown event type "${eventTypeId}"`)
      }

      const instant = now()
      assertRangeInWindow(from, to, instant, config)

      return buildAvailability({
        durationMinutes: eventType.durationMinutes,
        from,
        to,
        now: instant,
        config,
        bookings: repository.listBookingIntervals(),
      })
    },
  }
}
