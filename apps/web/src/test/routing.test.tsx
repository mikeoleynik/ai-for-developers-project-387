import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderApp } from '@/test/renderApp'

vi.mock('@/lib/api', () => ({
  eventTypesList: vi.fn().mockResolvedValue({ data: [], error: undefined }),
  bookingsList: vi.fn().mockResolvedValue({ data: [], error: undefined }),
}))

describe('маршруты приложения', () => {
  it('открывает страницу записи по /book', async () => {
    renderApp('/book')

    expect(
      await screen.findByRole('heading', { name: 'Запись на звонок' }),
    ).toBeInTheDocument()
  })

  it('открывает страницу видов встреч по /event-types', async () => {
    renderApp('/event-types')

    expect(
      await screen.findByRole('heading', { name: 'Виды встреч' }),
    ).toBeInTheDocument()
  })

  it('открывает заглушку предстоящих событий по /events', () => {
    renderApp('/events')

    expect(
      screen.getByRole('heading', { name: 'Предстоящие события' }),
    ).toBeInTheDocument()
  })
})
