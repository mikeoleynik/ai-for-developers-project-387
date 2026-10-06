import { expect, it } from 'vitest'

import { eventTypesList } from '@/client'

it('экспортирует клиент списка видов встреч', () => {
  expect(typeof eventTypesList).toBe('function')
})
