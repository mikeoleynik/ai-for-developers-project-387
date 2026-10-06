import { expect, test } from '@playwright/test'

import { createEventType, uniqueId } from './helpers'

test('гость записывается на свободный слот и владелец видит встречу', async ({
  page,
  request,
}) => {
  const id = uniqueId('intro')
  const title = `Знакомство ${id}`
  const guestName = `Тестовый Гость ${id}`
  const guestEmail = 'guest@example.com'

  await createEventType(request, {
    id,
    title,
    description: 'Короткий вводный звонок',
    durationMinutes: 30,
  })

  await page.goto('/book')
  await expect(
    page.getByRole('heading', { name: 'Запись на звонок' }),
  ).toBeVisible()

  const card = page.getByRole('listitem').filter({ hasText: title })
  await card.getByRole('link', { name: 'Выбрать' }).click()

  await expect(page).toHaveURL(new RegExp(`/book/${id}$`))
  await expect(page.getByRole('heading', { name: title })).toBeVisible()

  const slot = page.getByRole('button', { name: /^\d{2}:\d{2}$/ }).first()
  await expect(slot).toBeVisible()
  await slot.click()

  await page.getByLabel('Имя').fill(guestName)
  await page.getByLabel('Электронная почта').fill(guestEmail)
  await page.getByRole('button', { name: 'Забронировать' }).click()

  await expect(
    page.getByRole('heading', { name: 'Вы записаны' }),
  ).toBeVisible()

  await page.goto('/events')
  await expect(
    page.getByRole('heading', { name: 'Предстоящие события' }),
  ).toBeVisible()
  await expect(page.getByText(`${guestName} · ${guestEmail}`)).toBeVisible()
  await expect(page.getByRole('heading', { name: title })).toBeVisible()
})
