import { unprocessable } from '../errors.js'

export function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : {}
}

export function requireNonEmptyString(
  value: unknown,
  field: string,
): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw unprocessable(`\`${field}\` must be a non-empty string`)
  }
  return value.trim()
}
