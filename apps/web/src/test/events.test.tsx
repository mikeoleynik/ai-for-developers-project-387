import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'

import { renderApp } from '@/test/renderApp'

const bookingsList = vi.fn()

vi.mock('@/lib/api', () => ({
  bookingsList: (...args: unknown[]) => bookingsList(...args),
}))

describe('страница предстоящих встреч', () => {
  beforeEach(() => {
    bookingsList.mockReset()
  })

  it('показывает пустое состояние, когда встреч нет', async () => {
    bookingsList.mockResolvedValue({ data: [], error: undefined })

    renderApp('/events')

    expect(
      await screen.findByText('Пока нет предстоящих встреч.'),
    ).toBeInTheDocument()
  })

  it('показывает гостя, вид и время встречи', async () => {
    bookingsList.mockResolvedValue({
      data: [
        {
          id: 'booking-1',
          eventTypeId: 'intro',
          eventTypeTitle: 'Знакомство',
          durationMinutes: 30,
          guestName: 'Анна',
          guestEmail: 'anna@example.com',
          start: '2026-06-01T07:00:00.000Z',
          createdAt: '2026-06-01T05:30:00.000Z',
        },
      ],
      error: undefined,
    })

    renderApp('/events')

    expect(
      await screen.findByRole('heading', { name: 'Знакомство' }),
    ).toBeInTheDocument()
    expect(screen.getByText('30 мин')).toBeInTheDocument()
    expect(screen.getByText(/Анна · anna@example\.com/)).toBeInTheDocument()
    expect(screen.getByText(/10:00/)).toBeInTheDocument()
  })

  it('показывает ошибку, когда список не загрузился', async () => {
    bookingsList.mockResolvedValue({
      data: undefined,
      error: {
        error: { code: 'internal_error', message: 'Сервис недоступен' },
      },
    })

    renderApp('/events')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Сервис недоступен',
    )
  })
})
