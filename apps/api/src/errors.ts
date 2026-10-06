export class ApiError extends Error {
  readonly statusCode: number
  readonly code: string

  constructor(statusCode: number, code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.code = code
  }
}

export const notFound = (message: string) =>
  new ApiError(404, 'not_found', message)

export const conflict = (message: string) =>
  new ApiError(409, 'conflict', message)

export const unprocessable = (message: string) =>
  new ApiError(422, 'unprocessable_entity', message)
