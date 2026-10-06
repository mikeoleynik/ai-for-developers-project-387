import { client } from '@/client/client.gen'

client.setConfig({ baseUrl: '/api' })

export {
  availabilityList,
  bookingsCreate,
  bookingsList,
  eventTypesCreate,
  eventTypesList,
} from '@/client'
export type {
  Booking,
  CreateBooking,
  DayAvailability,
  EventType,
  ErrorBody,
  OwnerBooking,
} from '@/client'
