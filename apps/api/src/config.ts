export type AppConfig = {
  timeZone: string
  workDayStartMinutes: number
  workDayEndMinutes: number
  windowDays: number
  slotMinutes: number
  apiPrefix: string
}

export const defaultConfig: AppConfig = {
  timeZone: process.env.CALENDAR_TIMEZONE ?? 'Europe/Moscow',
  workDayStartMinutes: 9 * 60,
  workDayEndMinutes: 18 * 60,
  windowDays: 14,
  slotMinutes: 30,
  apiPrefix: process.env.API_PREFIX ?? '',
}
