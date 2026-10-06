import { expect, test } from '@playwright/test'

import {
  API_URL,
  bookSlot,
  createEventType,
  firstFreeSlot,
  moscowTime,
  uniqueId,
} from './helpers'

test('занятый слот не предлагается и повторная запись отклоняется', async ({
  page,
  request,
}) => {
  const shortId = uniqueId('short')
  const longId = uniqueId('long')

  await createEventType(request, {
    id: shortId,
    title: 'Короткая встреча',
    durationMinutes: 30,
  })
  await createEventType(request, {
    id: longId,
    title: 'Длинная встреча',
    durationMinutes: 60,
  })

  const { date, start } = await firstFreeSlot(request, shortId)

  const first = await bookSlot(request, {
    eventTypeId: shortId,
    start,
    guestName: 'Первый гость',
    guestEmail: 'first@example.com',
  })
  expect(first.status()).toBe(201)

  const availability = await request.get(`${API_URL}/availability`, {
    params: { eventTypeId: shortId, from: date, to: date },
  })
  const day = (
    (await availability.json()) as { date: string; startTimes: string[] }[]
  )[0]
  expect(day.startTimes).not.toContain(start)

  const repeat = await bookSlot(request, {
    eventTypeId: shortId,
    start,
    guestName: 'Второй гость',
    guestEmail: 'second@example.com',
  })
  expect(repeat.status()).toBe(409)

  const overlapping = await bookSlot(request, {
    eventTypeId: longId,
    start,
    guestName: 'Третий гость',
    guestEmail: 'third@example.com',
  })
  expect(overlapping.status()).toBe(409)

  await page.goto(`/book/${shortId}`)
  await expect(
    page.getByRole('heading', { name: 'Короткая встреча' }),
  ).toBeVisible()

  const daySection = page.locator(`[data-date="${date}"]`)
  await expect(daySection).toBeVisible()
  await expect(
    daySection.getByRole('button', { name: moscowTime(start), exact: true }),
  ).toHaveCount(0)
})
