import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import fastify from 'fastify'
import openapiGlue from 'fastify-openapi-glue'

import { defaultConfig, type AppConfig } from './config.js'
import { createServiceHandlers } from './handlers/index.js'
import { createSqliteRepository } from './domain/repository.js'
import { ApiError } from './errors.js'

const specification = fileURLToPath(
  new URL('../generated/openapi.yaml', import.meta.url),
)

export type BuildAppOptions = {
  databasePath?: string
  config?: AppConfig
  now?: () => Date
}

export async function buildApp(options: BuildAppOptions = {}) {
  const databasePath =
    options.databasePath ?? process.env.DATABASE_PATH ?? 'data/calendar.sqlite'
  if (databasePath !== ':memory:') {
    mkdirSync(dirname(databasePath), { recursive: true })
  }

  const config = options.config ?? defaultConfig
  const now = options.now ?? (() => new Date())
  const repository = createSqliteRepository(databasePath)
  const serviceHandlers = createServiceHandlers(repository, config, now)

  const server = fastify()

  server.setErrorHandler((error: unknown, _request, reply) => {
    if (error instanceof ApiError) {
      reply.status(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message,
        },
      })
      return
    }

    const err = error as {
      statusCode?: number
      message: string
      validation?: unknown
    }
    const statusCode = err.statusCode ?? 500
    const code = err.validation ? 'validation_error' : 'internal_error'

    reply.status(statusCode).send({
      error: {
        code,
        message: err.message,
      },
    })
  })

  server.addHook('onClose', async () => {
    repository.close()
  })

  server.get('/ping', async () => {
    return 'pong'
  })

  await server.register(openapiGlue, {
    specification,
    serviceHandlers,
    ...(config.apiPrefix ? { prefix: config.apiPrefix } : {}),
  })

  return server
}
