import type { FastifyReply, FastifyRequest } from 'fastify'

import type { EventType, Repository } from '../domain/repository.js'
import { unprocessable } from '../errors.js'
import { asRecord, requireNonEmptyString } from './shared.js'

type EventTypeBody = {
  id?: unknown
  title?: unknown
  description?: unknown
  durationMinutes?: unknown
}

function parseEventType(body: unknown): EventType {
  const input = asRecord(body) as EventTypeBody
  const id = requireNonEmptyString(input.id, 'id')
  const title = requireNonEmptyString(input.title, 'title')

  if (
    typeof input.durationMinutes !== 'number' ||
    !Number.isInteger(input.durationMinutes) ||
    input.durationMinutes <= 0 ||
    input.durationMinutes % 30 !== 0
  ) {
    throw unprocessable('`durationMinutes` must be a positive multiple of 30')
  }

  if (
    input.description !== undefined &&
    typeof input.description !== 'string'
  ) {
    throw unprocessable('`description` must be a string when provided')
  }

  return {
    id,
    title,
    description: input.description,
    durationMinutes: input.durationMinutes,
  }
}

export function createEventTypesHandlers(repository: Repository) {
  return {
    async EventTypes_list(): Promise<EventType[]> {
      return repository.listEventTypes()
    },

    async EventTypes_create(
      request: FastifyRequest,
      reply: FastifyReply,
    ) {
      const eventType = parseEventType(request.body)
      repository.createEventType(eventType)
      return reply.status(201).send(eventType)
    },
  }
}
