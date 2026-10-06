export function WhatIsAvailable() {
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Что доступно прямо сейчас</h2>
      <ul className="mt-4 list-disc space-y-3 pl-5 text-muted-foreground">
        <li>Фиксированные 30-минутные слоты с 09:00 до 18:00.</li>
        <li>Проверка конфликта при бронировании.</li>
        <li>Просмотр предстоящих событий в отдельном разделе.</li>
      </ul>
    </div>
  )
}
