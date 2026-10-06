import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, within } from '@testing-library/react'

import { renderApp } from '@/test/renderApp'

const eventTypesList = vi.fn()

vi.mock('@/lib/api', () => ({
  eventTypesList: (...args: unknown[]) => eventTypesList(...args),
}))

describe('страница записи: список видов встреч', () => {
  beforeEach(() => {
    eventTypesList.mockReset()
  })

  it('показывает название, описание и длительность вида', async () => {
    eventTypesList.mockResolvedValue({
      data: [
        {
          id: 'intro',
          title: 'Знакомство',
          description: 'Короткий вводный звонок',
          durationMinutes: 30,
        },
      ],
      error: undefined,
    })

    renderApp('/book')

    expect(
      await screen.findByRole('heading', { name: 'Знакомство' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Короткий вводный звонок')).toBeInTheDocument()
    expect(screen.getByText('30 мин')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Выбрать' })).toHaveAttribute(
      'href',
      '/book/intro',
    )
  })

  it('показывает пустое состояние, когда видов нет', async () => {
    eventTypesList.mockResolvedValue({ data: [], error: undefined })

    renderApp('/book')

    expect(
      await screen.findByText('Пока нет доступных видов встреч.'),
    ).toBeInTheDocument()
  })

  it('показывает ошибку, когда список не загрузился', async () => {
    eventTypesList.mockResolvedValue({
      data: undefined,
      error: {
        error: {
          code: 'internal_error',
          message: 'Сервис недоступен',
        },
      },
    })

    renderApp('/book')

    const alert = await screen.findByRole('alert')
    expect(within(alert).getByText('Сервис недоступен')).toBeInTheDocument()
  })
})
