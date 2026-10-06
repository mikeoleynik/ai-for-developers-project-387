import { describe, expect, it } from 'vitest'

import { buildApp } from '../src/app.js'

const NOW = new Date('2026-06-01T05:30:00.000Z')

function makeApp(now: () => Date = () => NOW) {
  return buildApp({ databasePath: ':memory:', now })
}

const validEventType = {
  id: 'intro',
  title: 'Знакомство',
  description: 'Короткий вводный звонок',
  durationMinutes: 30,
}

async function createEventType(
  app: Awaited<ReturnType<typeof buildApp>>,
  payload: Record<string, unknown> = validEventType,
) {
  return app.inject({
    method: 'POST',
    url: '/event-types',
    payload,
  })
}

describe('GET /ping', () => {
  it('responds with 200 and pong', async () => {
    const app = await makeApp()
    const response = await app.inject({ method: 'GET', url: '/ping' })
    expect(response.statusCode).toBe(200)
    expect(response.body).toBe('pong')
    await app.close()
  })
})

describe('event types', () => {
  it('starts with an empty list', async () => {
    const app = await makeApp()
    const response = await app.inject({ method: 'GET', url: '/event-types' })
    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual([])
    await app.close()
  })

  it('creates an event type and returns it in the list', async () => {
    const app = await makeApp()

    const created = await createEventType(app)
    expect(created.statusCode).toBe(201)
    expect(created.json()).toEqual(validEventType)

    const listed = await app.inject({ method: 'GET', url: '/event-types' })
    expect(listed.json()).toEqual([validEventType])

    await app.close()
  })

  it('rejects a duplicate id with 422', async () => {
    const app = await makeApp()
    await createEventType(app)

    const duplicate = await createEventType(app)
    expect(duplicate.statusCode).toBe(422)
    expect(duplicate.json().error.code).toBe('unprocessable_entity')

    await app.close()
  })

  it('rejects a duration that is not a positive multiple of 30', async () => {
    const app = await makeApp()

    const response = await createEventType(app, {
      ...validEventType,
      durationMinutes: 45,
    })
    expect(response.statusCode).toBe(422)

    await app.close()
  })

  it('rejects a body that does not match the contract with 400', async () => {
    const app = await makeApp()

    const response = await app.inject({
      method: 'POST',
      url: '/event-types',
      payload: { id: 'intro' },
    })
    expect(response.statusCode).toBe(400)
    expect(response.json().error.code).toBe('validation_error')

    await app.close()
  })
})

const validBooking = {
  eventTypeId: 'intro',
  start: '2026-06-01T07:00:00.000Z',
  guestName: 'Анна',
  guestEmail: 'anna@example.com',
}

async function book(
  app: Awaited<ReturnType<typeof buildApp>>,
  payload: Record<string, unknown> = validBooking,
) {
  return app.inject({
    method: 'POST',
    url: '/bookings',
    payload,
  })
}

describe('bookings', () => {
  it('creates a booking and lists it for the owner', async () => {
    const app = await makeApp()
    await createEventType(app)

    const created = await book(app)
    expect(created.statusCode).toBe(201)
    expect(created.json()).toMatchObject({
      eventTypeId: 'intro',
      guestName: 'Анна',
      guestEmail: 'anna@example.com',
      start: '2026-06-01T07:00:00.000Z',
    })

    const listed = await app.inject({ method: 'GET', url: '/bookings' })
    expect(listed.statusCode).toBe(200)
    expect(listed.json()).toHaveLength(1)
    expect(listed.json()[0]).toMatchObject({
      eventTypeTitle: 'Знакомство',
      durationMinutes: 30,
    })

    await app.close()
  })

  it('rejects an overlapping booking of another event type with 409', async () => {
    const app = await makeApp()
    await createEventType(app)
    await createEventType(app, {
      id: 'deep-dive',
      title: 'Разбор',
      durationMinutes: 60,
    })
    await book(app)

    const overlapping = await book(app, {
      ...validBooking,
      eventTypeId: 'deep-dive',
      start: '2026-06-01T06:30:00.000Z',
    })
    expect(overlapping.statusCode).toBe(409)
    expect(overlapping.json().error.code).toBe('conflict')

    await app.close()
  })

  it('rejects an unknown event type with 404', async () => {
    const app = await makeApp()

    const response = await book(app, {
      ...validBooking,
      eventTypeId: 'missing',
    })
    expect(response.statusCode).toBe(404)
    expect(response.json().error.code).toBe('not_found')

    await app.close()
  })

  it('rejects an invalid email with 422', async () => {
    const app = await makeApp()
    await createEventType(app)

    const response = await book(app, { ...validBooking, guestEmail: 'bad' })
    expect(response.statusCode).toBe(422)

    await app.close()
  })

  it('rejects an empty guest name with 422', async () => {
    const app = await makeApp()
    await createEventType(app)

    const response = await book(app, { ...validBooking, guestName: '   ' })
    expect(response.statusCode).toBe(422)

    await app.close()
  })

  it('rejects a start in the past with 422', async () => {
    const app = await makeApp()
    await createEventType(app)

    const response = await book(app, {
      ...validBooking,
      start: '2026-05-31T07:00:00.000Z',
    })
    expect(response.statusCode).toBe(422)

    await app.close()
  })

  it('rejects a start outside the booking window with 422', async () => {
    const app = await makeApp()
    await createEventType(app)

    const response = await book(app, {
      ...validBooking,
      start: '2026-06-20T07:00:00.000Z',
    })
    expect(response.statusCode).toBe(422)

    await app.close()
  })

  it('rejects a start that is not aligned to the 30-minute grid', async () => {
    const app = await makeApp()
    await createEventType(app)

    const response = await book(app, {
      ...validBooking,
      start: '2026-06-01T07:15:00.000Z',
    })
    expect(response.statusCode).toBe(422)

    await app.close()
  })

  it('rejects a start with sub-second precision', async () => {
    const app = await makeApp()
    await createEventType(app)

    const response = await book(app, {
      ...validBooking,
      start: '2026-06-01T07:00:00.500Z',
    })
    expect(response.statusCode).toBe(422)

    await app.close()
  })

  it('rejects a meeting that does not fit into working hours', async () => {
    const app = await makeApp()
    await createEventType(app)

    const response = await book(app, {
      ...validBooking,
      start: '2026-06-01T14:45:00.000Z',
    })
    expect(response.statusCode).toBe(422)

    await app.close()
  })
})

async function availability(
  app: Awaited<ReturnType<typeof buildApp>>,
  query: Record<string, string>,
) {
  const search = new URLSearchParams(query).toString()
  return app.inject({
    method: 'GET',
    url: `/availability?${search}`,
  })
}

describe('availability', () => {
  it('returns aligned free starts inside working hours', async () => {
    const app = await makeApp()
    await createEventType(app)

    const response = await availability(app, {
      eventTypeId: 'intro',
      from: '2026-06-01',
      to: '2026-06-01',
    })

    expect(response.statusCode).toBe(200)
    const days = response.json()
    expect(days).toHaveLength(1)
    expect(days[0].date).toBe('2026-06-01')
    expect(days[0].startTimes[0]).toBe('2026-06-01T06:00:00.000Z')
    expect(days[0].startTimes).toContain('2026-06-01T14:30:00.000Z')
    expect(days[0].startTimes).not.toContain('2026-06-01T15:00:00.000Z')

    await app.close()
  })

  it('accounts for the event type duration', async () => {
    const app = await makeApp()
    await createEventType(app, {
      id: 'deep-dive',
      title: 'Разбор',
      durationMinutes: 60,
    })

    const response = await availability(app, {
      eventTypeId: 'deep-dive',
      from: '2026-06-01',
      to: '2026-06-01',
    })

    const startTimes = response.json()[0].startTimes
    expect(startTimes).toContain('2026-06-01T14:00:00.000Z')
    expect(startTimes).not.toContain('2026-06-01T14:30:00.000Z')

    await app.close()
  })

  it('excludes a booked slot', async () => {
    const app = await makeApp()
    await createEventType(app)
    await book(app)

    const response = await availability(app, {
      eventTypeId: 'intro',
      from: '2026-06-01',
      to: '2026-06-01',
    })

    expect(response.json()[0].startTimes).not.toContain(
      '2026-06-01T07:00:00.000Z',
    )

    await app.close()
  })

  it('excludes a slot overlapped by another event type', async () => {
    const app = await makeApp()
    await createEventType(app)
    await createEventType(app, {
      id: 'deep-dive',
      title: 'Разбор',
      durationMinutes: 60,
    })
    await book(app, {
      ...validBooking,
      eventTypeId: 'deep-dive',
      start: '2026-06-01T06:30:00.000Z',
    })

    const response = await availability(app, {
      eventTypeId: 'intro',
      from: '2026-06-01',
      to: '2026-06-01',
    })

    const startTimes = response.json()[0].startTimes
    expect(startTimes).not.toContain('2026-06-01T06:30:00.000Z')
    expect(startTimes).not.toContain('2026-06-01T07:00:00.000Z')

    await app.close()
  })

  it('rejects a range outside the booking window with 422', async () => {
    const app = await makeApp()
    await createEventType(app)

    const response = await availability(app, {
      eventTypeId: 'intro',
      from: '2026-05-31',
      to: '2026-06-01',
    })
    expect(response.statusCode).toBe(422)

    await app.close()
  })

  it('rejects an unknown event type with 404', async () => {
    const app = await makeApp()

    const response = await availability(app, {
      eventTypeId: 'missing',
      from: '2026-06-01',
      to: '2026-06-01',
    })
    expect(response.statusCode).toBe(404)

    await app.close()
  })
})

describe('owner upcoming list', () => {
  it('returns only future bookings ordered by start', async () => {
    const clock = { instant: new Date('2026-06-01T05:30:00.000Z') }
    const app = await makeApp(() => clock.instant)
    await createEventType(app)
    await book(app, {
      ...validBooking,
      start: '2026-06-01T07:00:00.000Z',
      guestName: 'Первый',
    })
    await book(app, {
      ...validBooking,
      start: '2026-06-01T08:00:00.000Z',
      guestName: 'Второй',
    })

    const before = await app.inject({ method: 'GET', url: '/bookings' })
    expect(before.json().map((booking: { start: string }) => booking.start))
      .toEqual(['2026-06-01T07:00:00.000Z', '2026-06-01T08:00:00.000Z'])

    clock.instant = new Date('2026-06-01T07:30:00.000Z')

    const after = await app.inject({ method: 'GET', url: '/bookings' })
    expect(after.json().map((booking: { guestName: string }) => booking.guestName))
      .toEqual(['Второй'])

    await app.close()
  })
})
