import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { BookingForm } from '@/components/booking/BookingForm'
import { buttonVariants } from '@/components/ui/button'
import {
  availabilityList,
  eventTypesList,
  type DayAvailability,
  type EventType,
} from '@/lib/api'
import { apiErrorMessage } from '@/lib/errors'
import {
  addDaysToDate,
  formatDay,
  formatTime,
  todayInCalendarZone,
} from '@/lib/format'
import { cn } from '@/lib/utils'

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'not-found' }
  | { status: 'ready'; eventType: EventType }

type AvailabilityState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; days: DayAvailability[] }

export function BookingPage() {
  const { eventTypeId = '' } = useParams()
  const [state, setState] = useState<State>({ status: 'loading' })
  const [availability, setAvailability] = useState<AvailabilityState>({
    status: 'loading',
  })
  const [start, setStart] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    eventTypesList()
      .then(({ data, error }) => {
        if (!active) return
        if (error) {
          setState({ status: 'error', message: apiErrorMessage(error) })
          return
        }
        const eventType = (data ?? []).find((item) => item.id === eventTypeId)
        setState(
          eventType ? { status: 'ready', eventType } : { status: 'not-found' },
        )
      })
      .catch((error: unknown) => {
        if (active) {
          setState({ status: 'error', message: apiErrorMessage(error) })
        }
      })

    return () => {
      active = false
    }
  }, [eventTypeId])

  useEffect(() => {
    if (state.status !== 'ready') return
    let active = true

    const from = todayInCalendarZone()
    const to = addDaysToDate(from, 13)

    availabilityList({
      query: { eventTypeId: state.eventType.id, from, to },
    })
      .then(({ data, error }) => {
        if (!active) return
        if (error) {
          setAvailability({
            status: 'error',
            message: apiErrorMessage(error),
          })
          return
        }
        setAvailability({ status: 'ready', days: data ?? [] })
      })
      .catch((error: unknown) => {
        if (active) {
          setAvailability({
            status: 'error',
            message: apiErrorMessage(error),
          })
        }
      })

    return () => {
      active = false
    }
  }, [state])

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link
        to="/book"
        className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'mb-4')}
      >
        Назад
      </Link>

      {state.status === 'loading' && (
        <p className="text-muted-foreground">Загружаем вид встречи…</p>
      )}

      {state.status === 'error' && (
        <p role="alert" className="text-destructive">
          {state.message}
        </p>
      )}

      {state.status === 'not-found' && (
        <p role="alert" className="text-destructive">
          Вид встречи не найден.
        </p>
      )}

      {state.status === 'ready' && (
        <>
          <h1 className="text-3xl font-semibold">{state.eventType.title}</h1>
          {state.eventType.description && (
            <p className="mt-2 text-muted-foreground">
              {state.eventType.description}
            </p>
          )}
          <p className="mt-1 text-sm text-muted-foreground">
            {state.eventType.durationMinutes} мин
          </p>

          <h2 className="mt-8 text-xl font-semibold">Свободное время</h2>

          {availability.status === 'loading' && (
            <p className="mt-4 text-muted-foreground">Загружаем слоты…</p>
          )}

          {availability.status === 'error' && (
            <p role="alert" className="mt-4 text-destructive">
              {availability.message}
            </p>
          )}

          {availability.status === 'ready' && (
            <div className="mt-4 space-y-5">
              {availability.days.map((day) => (
                <div key={day.date} data-date={day.date}>
                  <h3 className="text-sm font-medium capitalize">
                    {formatDay(day.date)}
                  </h3>
                  {day.startTimes.length === 0 ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Нет свободного времени
                    </p>
                  ) : (
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {day.startTimes.map((slot) => (
                        <li key={slot}>
                          <button
                            type="button"
                            aria-pressed={start === slot}
                            onClick={() => setStart(slot)}
                            className={cn(
                              buttonVariants({
                                variant:
                                  start === slot ? 'default' : 'outline',
                                size: 'sm',
                              }),
                            )}
                          >
                            {formatTime(slot)}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}

          {start && (
            <BookingForm eventTypeId={state.eventType.id} start={start} />
          )}
        </>
      )}
    </main>
  )
}
