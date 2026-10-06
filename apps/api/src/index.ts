import { fileURLToPath } from 'node:url'

import fastifyStatic from '@fastify/static'

import { buildApp } from './app.js'

const port = Number(process.env.PORT ?? 8080)
const host = process.env.HOST ?? '0.0.0.0'
const serveWeb = process.env.SERVE_WEB === 'true'

try {
  const server = await buildApp()

  if (serveWeb) {
    const webRoot = fileURLToPath(new URL('../../web/dist', import.meta.url))
    await server.register(fastifyStatic, { root: webRoot })

    server.setNotFoundHandler((request, reply) => {
      if (request.method === 'GET' && !request.url.startsWith('/api')) {
        return reply.sendFile('index.html')
      }
      return reply
        .status(404)
        .send({ error: { code: 'not_found', message: 'Not found' } })
    })
  }

  const address = await server.listen({ port, host })
  console.log(`Server listening at ${address}`)
} catch (err) {
  console.error(err)
  process.exit(1)
}
