import { useEffect, useState } from 'react'

import { apiErrorMessage } from '@/lib/errors'
import { bookingsList, type OwnerBooking } from '@/lib/api'
import { formatSlot } from '@/lib/format'

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; bookings: OwnerBooking[] }

export function EventsPage() {
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    let active = true

    bookingsList()
      .then(({ data, error }) => {
        if (!active) return
        if (error) {
          setState({ status: 'error', message: apiErrorMessage(error) })
          return
        }
        setState({ status: 'ready', bookings: data ?? [] })
      })
      .catch((error: unknown) => {
        if (active) {
          setState({ status: 'error', message: apiErrorMessage(error) })
        }
      })

    return () => {
      active = false
    }
  }, [])

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Предстоящие события</h1>
      <p className="mt-2 text-muted-foreground">
        Звонки по всем видам встреч, которые ещё впереди.
      </p>

      {state.status === 'loading' && (
        <p className="mt-8 text-muted-foreground">Загружаем встречи…</p>
      )}

      {state.status === 'error' && (
        <p role="alert" className="mt-8 text-destructive">
          {state.message}
        </p>
      )}

      {state.status === 'ready' && state.bookings.length === 0 && (
        <p className="mt-8 text-muted-foreground">Пока нет предстоящих встреч.</p>
      )}

      {state.status === 'ready' && state.bookings.length > 0 && (
        <ul className="mt-8 space-y-4">
          {state.bookings.map((booking) => (
            <li key={booking.id} className="rounded-2xl border bg-card p-6">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-xl font-semibold">
                  {booking.eventTypeTitle}
                </h2>
                <span className="text-sm text-muted-foreground">
                  {booking.durationMinutes} мин
                </span>
              </div>
              <p className="mt-2 text-muted-foreground">
                {formatSlot(booking.start)}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {booking.guestName} · {booking.guestEmail}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Создано: {formatSlot(booking.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
