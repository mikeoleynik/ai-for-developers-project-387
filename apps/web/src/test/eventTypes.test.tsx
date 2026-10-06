import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, within } from '@testing-library/react'

import { renderApp } from '@/test/renderApp'

const eventTypesList = vi.fn()
const eventTypesCreate = vi.fn()

vi.mock('@/lib/api', () => ({
  eventTypesList: (...args: unknown[]) => eventTypesList(...args),
  eventTypesCreate: (...args: unknown[]) => eventTypesCreate(...args),
}))

describe('страница владельца: виды встреч', () => {
  beforeEach(() => {
    eventTypesList.mockReset()
    eventTypesCreate.mockReset()
  })

  it('показывает пустое состояние и форму создания', async () => {
    eventTypesList.mockResolvedValue({ data: [], error: undefined })

    renderApp('/event-types')

    expect(
      await screen.findByText('Видов встреч пока нет.'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Новый вид встречи' }),
    ).toBeInTheDocument()
  })

  it('создаёт вид и показывает его в списке', async () => {
    eventTypesList.mockResolvedValue({ data: [], error: undefined })
    eventTypesCreate.mockResolvedValue({
      data: {
        id: 'intro',
        title: 'Знакомство',
        description: 'Короткий звонок',
        durationMinutes: 30,
      },
      error: undefined,
    })

    renderApp('/event-types')

    fireEvent.change(await screen.findByLabelText('Идентификатор'), {
      target: { value: 'intro' },
    })
    fireEvent.change(screen.getByLabelText('Название'), {
      target: { value: 'Знакомство' },
    })
    fireEvent.change(screen.getByLabelText('Описание'), {
      target: { value: 'Короткий звонок' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Создать вид' }))

    const status = await screen.findByRole('status')
    expect(status).toHaveTextContent('Вид «Знакомство» создан.')
    expect(eventTypesCreate).toHaveBeenCalledWith({
      body: {
        id: 'intro',
        title: 'Знакомство',
        description: 'Короткий звонок',
        durationMinutes: 30,
      },
    })
    expect(await screen.findByRole('heading', { name: 'Знакомство' })).toBeInTheDocument()
  })

  it('показывает ошибку при дубликате идентификатора', async () => {
    eventTypesList.mockResolvedValue({ data: [], error: undefined })
    eventTypesCreate.mockResolvedValue({
      data: undefined,
      error: {
        error: {
          code: 'unprocessable_entity',
          message: 'Event type with id "intro" already exists',
        },
      },
    })

    renderApp('/event-types')

    fireEvent.change(await screen.findByLabelText('Идентификатор'), {
      target: { value: 'intro' },
    })
    fireEvent.change(screen.getByLabelText('Название'), {
      target: { value: 'Знакомство' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Создать вид' }))

    const alert = await screen.findByRole('alert')
    expect(
      within(alert).getByText('Event type with id "intro" already exists'),
    ).toBeInTheDocument()
    expect(eventTypesCreate).toHaveBeenCalledTimes(1)
  })
})
