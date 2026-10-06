import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { buttonVariants } from '@/components/ui/button'
import { apiErrorMessage } from '@/lib/errors'
import { eventTypesList, type EventType } from '@/lib/api'
import { cn } from '@/lib/utils'

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; eventTypes: EventType[] }

export function BookPage() {
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    let active = true

    eventTypesList()
      .then(({ data, error }) => {
        if (!active) return
        if (error) {
          setState({ status: 'error', message: apiErrorMessage(error) })
          return
        }
        setState({ status: 'ready', eventTypes: data ?? [] })
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
      <h1 className="text-3xl font-semibold">Запись на звонок</h1>
      <p className="mt-2 text-muted-foreground">
        Выберите вид встречи и свободное время.
      </p>

      {state.status === 'loading' && (
        <p className="mt-8 text-muted-foreground">Загружаем виды встреч…</p>
      )}

      {state.status === 'error' && (
        <p role="alert" className="mt-8 text-destructive">
          {state.message}
        </p>
      )}

      {state.status === 'ready' && state.eventTypes.length === 0 && (
        <p className="mt-8 text-muted-foreground">
          Пока нет доступных видов встреч.
        </p>
      )}

      {state.status === 'ready' && state.eventTypes.length > 0 && (
        <ul className="mt-8 space-y-4">
          {state.eventTypes.map((eventType) => (
            <li
              key={eventType.id}
              className="flex items-start justify-between gap-4 rounded-2xl border bg-card p-6 shadow-sm"
            >
              <div>
                <h2 className="text-xl font-semibold">{eventType.title}</h2>
                {eventType.description && (
                  <p className="mt-1 text-muted-foreground">
                    {eventType.description}
                  </p>
                )}
                <p className="mt-2 text-sm text-muted-foreground">
                  {eventType.durationMinutes} мин
                </p>
              </div>
              <Link
                to={`/book/${eventType.id}`}
                className={cn(buttonVariants({ variant: 'outline' }), 'shrink-0')}
              >
                Выбрать
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
