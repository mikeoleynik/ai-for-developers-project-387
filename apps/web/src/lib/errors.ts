import type { ErrorBody } from '@/lib/api'

const MESSAGES_BY_CODE: Record<string, string> = {
  conflict: 'Это время уже занято. Выберите, пожалуйста, другое время.',
}

export function apiErrorMessage(error: unknown): string {
  const body = error as ErrorBody | undefined
  const code = body?.error?.code

  if (code && MESSAGES_BY_CODE[code]) {
    return MESSAGES_BY_CODE[code]
  }

  return (
    body?.error?.message ??
    'Не удалось выполнить запрос. Попробуйте ещё раз.'
  )
}
