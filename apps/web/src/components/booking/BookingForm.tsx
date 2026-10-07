import { useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { bookingsCreate, type Booking } from '@/lib/api'
import { apiErrorMessage, isConflict } from '@/lib/errors'

type Props = {
  eventTypeId: string
  start: string
  onBooked: (booking: Booking) => void
  onConflict: () => void
}

export function BookingForm({
  eventTypeId,
  start,
  onBooked,
  onConflict,
}: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      if (isConflict(requestError)) {
        onConflict()
      }
      return
    }

    onBooked(created)
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
