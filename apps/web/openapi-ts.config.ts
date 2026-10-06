import { defineConfig } from '@hey-api/openapi-ts'

export default defineConfig({
  input: '../api/generated/openapi.yaml',
  output: 'src/client',
  plugins: ['@hey-api/client-fetch'],
})
