import type { ErrorBody } from '@/lib/api'

const CONFLICT_CODE = 'conflict'

const MESSAGES_BY_CODE: Record<string, string> = {
  [CONFLICT_CODE]: 'Это время уже занято. Выберите, пожалуйста, другое время.',
}

function errorCode(error: unknown): string | undefined {
  return (error as ErrorBody | undefined)?.error?.code
}

export function isConflict(error: unknown): boolean {
  return errorCode(error) === CONFLICT_CODE
}

export function apiErrorMessage(error: unknown): string {
  const code = errorCode(error)

  if (code && MESSAGES_BY_CODE[code]) {
    return MESSAGES_BY_CODE[code]
  }

  return (
    (error as ErrorBody | undefined)?.error?.message ??
    'Не удалось выполнить запрос. Попробуйте ещё раз.'
  )
}
