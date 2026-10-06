import { useEffect, useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { apiErrorMessage } from '@/lib/errors'
import { eventTypesCreate, eventTypesList, type EventType } from '@/lib/api'

type ListState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; eventTypes: EventType[] }

export function EventTypesPage() {
  const [list, setList] = useState<ListState>({ status: 'loading' })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true

    eventTypesList()
      .then(({ data, error: requestError }) => {
        if (!active) return
        if (requestError) {
          setList({ status: 'error', message: apiErrorMessage(requestError) })
          return
        }
        setList({ status: 'ready', eventTypes: data ?? [] })
      })
      .catch((requestError: unknown) => {
        if (active) {
          setList({ status: 'error', message: apiErrorMessage(requestError) })
        }
      })

    return () => {
      active = false
    }
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)

    setSubmitting(true)
    setError(null)
    setSuccess(null)

    const { data: created, error: requestError } = await eventTypesCreate({
      body: {
        id: String(data.get('id') ?? ''),
        title: String(data.get('title') ?? ''),
        description: String(data.get('description') ?? '') || undefined,
        durationMinutes: Number(data.get('durationMinutes') ?? 0),
      },
    })

    setSubmitting(false)

    if (requestError || !created) {
      setError(apiErrorMessage(requestError))
      return
    }

    form.reset()
    setSuccess(`Вид «${created.title}» создан.`)
    setList((current) =>
      current.status === 'ready'
        ? { status: 'ready', eventTypes: [...current.eventTypes, created] }
        : current,
    )
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Виды встреч</h1>
      <p className="mt-2 text-muted-foreground">
        Создавайте виды встреч, на которые смогут записываться гости.
      </p>

      {list.status === 'loading' && (
        <p className="mt-8 text-muted-foreground">Загружаем виды встреч…</p>
      )}

      {list.status === 'error' && (
        <p role="alert" className="mt-8 text-destructive">
          {list.message}
        </p>
      )}

      {list.status === 'ready' && list.eventTypes.length === 0 && (
        <p className="mt-8 text-muted-foreground">Видов встреч пока нет.</p>
      )}

      {list.status === 'ready' && list.eventTypes.length > 0 && (
        <ul className="mt-8 space-y-4">
          {list.eventTypes.map((eventType) => (
            <li key={eventType.id} className="rounded-2xl border bg-card p-6">
              <h2 className="text-xl font-semibold">{eventType.title}</h2>
              {eventType.description && (
                <p className="mt-1 text-muted-foreground">
                  {eventType.description}
                </p>
              )}
              <p className="mt-2 text-sm text-muted-foreground">
                {eventType.durationMinutes} мин · id: {eventType.id}
              </p>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold">Новый вид встречи</h2>

        <div className="space-y-1">
          <label htmlFor="event-type-id" className="block text-sm font-medium">
            Идентификатор
          </label>
          <input
            id="event-type-id"
            name="id"
            required
            className="w-full rounded-lg border bg-background px-3 py-2"
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="event-type-title"
            className="block text-sm font-medium"
          >
            Название
          </label>
          <input
            id="event-type-title"
            name="title"
            required
            className="w-full rounded-lg border bg-background px-3 py-2"
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="event-type-description"
            className="block text-sm font-medium"
          >
            Описание
          </label>
          <textarea
            id="event-type-description"
            name="description"
            className="w-full rounded-lg border bg-background px-3 py-2"
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="event-type-duration"
            className="block text-sm font-medium"
          >
            Длительность, минут
          </label>
          <input
            id="event-type-duration"
            name="durationMinutes"
            type="number"
            min={30}
            step={30}
            defaultValue={30}
            required
            className="w-full rounded-lg border bg-background px-3 py-2"
          />
        </div>

        {error && (
          <p role="alert" className="text-destructive">
            {error}
          </p>
        )}

        {success && (
          <p role="status" className="text-muted-foreground">
            {success}
          </p>
        )}

        <Button type="submit" disabled={submitting}>
          {submitting ? 'Создаём…' : 'Создать вид'}
        </Button>
      </form>
    </main>
  )
}
