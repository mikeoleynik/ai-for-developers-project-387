import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'

import { renderApp } from '@/test/renderApp'

const eventTypesList = vi.fn()
const availabilityList = vi.fn()
const bookingsCreate = vi.fn()

vi.mock('@/lib/api', () => ({
  eventTypesList: (...args: unknown[]) => eventTypesList(...args),
  availabilityList: (...args: unknown[]) => availabilityList(...args),
  bookingsCreate: (...args: unknown[]) => bookingsCreate(...args),
}))

const intro = {
  id: 'intro',
  title: 'Знакомство',
  description: 'Короткий вводный звонок',
  durationMinutes: 30,
}

const freeSlot = '2026-06-01T07:00:00.000Z'

async function openBookingForm() {
  eventTypesList.mockResolvedValue({ data: [intro], error: undefined })
  availabilityList.mockResolvedValue({
    data: [{ date: '2026-06-01', startTimes: [freeSlot] }],
    error: undefined,
  })
  renderApp('/book/intro')

  fireEvent.click(await screen.findByRole('button', { name: '10:00' }))

  return screen.findByLabelText('Имя')
}

function fillGuest() {
  fireEvent.change(screen.getByLabelText('Имя'), {
    target: { value: 'Анна' },
  })
  fireEvent.change(screen.getByLabelText('Электронная почта'), {
    target: { value: 'anna@example.com' },
  })
}

describe('страница бронирования', () => {
  beforeEach(() => {
    eventTypesList.mockReset()
    availabilityList.mockReset()
    bookingsCreate.mockReset()
  })

  it('показывает свободные слоты выбранного вида', async () => {
    eventTypesList.mockResolvedValue({ data: [intro], error: undefined })
    availabilityList.mockResolvedValue({
      data: [{ date: '2026-06-01', startTimes: [freeSlot] }],
      error: undefined,
    })

    renderApp('/book/intro')

    expect(
      await screen.findByRole('heading', { name: 'Знакомство' }),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('button', { name: '10:00' }),
    ).toBeInTheDocument()
    expect(availabilityList).toHaveBeenCalledWith({
      query: {
        eventTypeId: 'intro',
        from: expect.any(String),
        to: expect.any(String),
      },
    })
  })

  it('бронирует слот и показывает подтверждение', async () => {
    bookingsCreate.mockResolvedValue({
      data: {
        id: 'booking-1',
        eventTypeId: 'intro',
        guestName: 'Анна',
        guestEmail: 'anna@example.com',
        start: freeSlot,
        createdAt: '2026-06-01T05:30:00.000Z',
      },
      error: undefined,
    })

    await openBookingForm()
    fillGuest()
    fireEvent.click(screen.getByRole('button', { name: 'Забронировать' }))

    const status = await screen.findByRole('status')
    expect(
      within(status).getByRole('heading', { name: 'Вы записаны' }),
    ).toBeInTheDocument()
    expect(bookingsCreate).toHaveBeenCalledWith({
      body: {
        eventTypeId: 'intro',
        start: freeSlot,
        guestName: 'Анна',
        guestEmail: 'anna@example.com',
      },
    })
  })

  it('показывает ошибку, когда слот занят', async () => {
    bookingsCreate.mockResolvedValue({
      data: undefined,
      error: {
        error: {
          code: 'conflict',
          message: 'The slot is already booked',
        },
      },
    })

    await openBookingForm()
    fillGuest()
    fireEvent.click(screen.getByRole('button', { name: 'Забронировать' }))

    const alert = await screen.findByRole('alert')
    expect(
      within(alert).getByText(
        'Это время уже занято. Выберите, пожалуйста, другое время.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Вы записаны' }),
    ).not.toBeInTheDocument()
  })

  it('перезапрашивает слоты и убирает занятое время после записи', async () => {
    eventTypesList.mockResolvedValue({ data: [intro], error: undefined })
    availabilityList
      .mockResolvedValueOnce({
        data: [{ date: '2026-06-01', startTimes: [freeSlot] }],
        error: undefined,
      })
      .mockResolvedValueOnce({
        data: [{ date: '2026-06-01', startTimes: [] }],
        error: undefined,
      })
    bookingsCreate.mockResolvedValue({
      data: {
        id: 'booking-1',
        eventTypeId: 'intro',
        guestName: 'Анна',
        guestEmail: 'anna@example.com',
        start: freeSlot,
        createdAt: '2026-06-01T05:30:00.000Z',
      },
      error: undefined,
    })

    renderApp('/book/intro')
    fireEvent.click(await screen.findByRole('button', { name: '10:00' }))
    fillGuest()
    fireEvent.click(screen.getByRole('button', { name: 'Забронировать' }))

    expect(
      await screen.findByRole('heading', { name: 'Вы записаны' }),
    ).toBeInTheDocument()
    await waitFor(() => expect(availabilityList).toHaveBeenCalledTimes(2))
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: '10:00' }),
      ).not.toBeInTheDocument(),
    )
  })

  it('обновляет слоты и сообщает, когда время только что заняли', async () => {
    eventTypesList.mockResolvedValue({ data: [intro], error: undefined })
    availabilityList
      .mockResolvedValueOnce({
        data: [{ date: '2026-06-01', startTimes: [freeSlot] }],
        error: undefined,
      })
      .mockResolvedValueOnce({
        data: [{ date: '2026-06-01', startTimes: [] }],
        error: undefined,
      })
    bookingsCreate.mockResolvedValue({
      data: undefined,
      error: {
        error: {
          code: 'conflict',
          message: 'The slot is already booked',
        },
      },
    })

    renderApp('/book/intro')
    fireEvent.click(await screen.findByRole('button', { name: '10:00' }))
    fillGuest()
    fireEvent.click(screen.getByRole('button', { name: 'Забронировать' }))

    const alert = await screen.findByRole('alert')
    expect(
      within(alert).getByText(
        'Это время уже занято. Выберите, пожалуйста, другое время.',
      ),
    ).toBeInTheDocument()
    await waitFor(() => expect(availabilityList).toHaveBeenCalledTimes(2))
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: '10:00' }),
      ).not.toBeInTheDocument(),
    )
  })

  it('обновляет слоты при возврате фокуса на окно', async () => {
    eventTypesList.mockResolvedValue({ data: [intro], error: undefined })
    availabilityList
      .mockResolvedValueOnce({
        data: [{ date: '2026-06-01', startTimes: [freeSlot] }],
        error: undefined,
      })
      .mockResolvedValueOnce({
        data: [{ date: '2026-06-01', startTimes: [] }],
        error: undefined,
      })

    renderApp('/book/intro')
    await screen.findByRole('button', { name: '10:00' })

    fireEvent(window, new Event('focus'))

    await waitFor(() => expect(availabilityList).toHaveBeenCalledTimes(2))
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: '10:00' }),
      ).not.toBeInTheDocument(),
    )
  })
})
