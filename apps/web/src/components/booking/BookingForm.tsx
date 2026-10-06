import { useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { bookingsCreate, type Booking } from '@/lib/api'
import { apiErrorMessage } from '@/lib/errors'
import { formatSlot } from '@/lib/format'

type Props = {
  eventTypeId: string
  start: string
}

export function BookingForm({ eventTypeId, start }: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [booking, setBooking] = useState<Booking | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)

    setSubmitting(true)
    setError(null)

    const { data: created, error: requestError } = await bookingsCreate({
      body: {
        eventTypeId,
        start,
        guestName: String(data.get('guestName') ?? ''),
        guestEmail: String(data.get('guestEmail') ?? ''),
      },
    })

    setSubmitting(false)

    if (requestError || !created) {
      setError(apiErrorMessage(requestError))
      return
    }

    setBooking(created)
  }

  if (booking) {
    return (
      <section role="status" className="mt-8 rounded-2xl border bg-card p-6">
        <h2 className="text-2xl font-semibold">Вы записаны</h2>
        <p className="mt-2 text-muted-foreground">
          {formatSlot(booking.start)}
        </p>
      </section>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <div className="space-y-1">
        <label htmlFor="guest-name" className="block text-sm font-medium">
          Имя
        </label>
        <input
          id="guest-name"
          name="guestName"
          required
          className="w-full rounded-lg border bg-background px-3 py-2"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="guest-email" className="block text-sm font-medium">
          Электронная почта
        </label>
        <input
          id="guest-email"
          name="guestEmail"
          type="email"
          required
          className="w-full rounded-lg border bg-background px-3 py-2"
        />
      </div>

      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" disabled={submitting}>
        {submitting ? 'Бронируем…' : 'Забронировать'}
      </Button>
    </form>
  )
}
