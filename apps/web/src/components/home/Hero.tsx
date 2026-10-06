import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/button'
import { cn } from 'cn'

export function Hero() {
  return (
    <div>
      <span className="inline-block rounded-full border bg-background/80 px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Быстрая запись на звонок
      </span>
      <h1 className="mt-6 text-5xl font-semibold tracking-tight">Calendar</h1>
      <p className="mt-4 max-w-md text-lg text-muted-foreground">
        Один экран, понятные слоты, быстрая бронь. Выберите время и запишитесь на
        звонок без лишних шагов.
      </p>
      <Link
        to="/book"
        className={cn(buttonVariants({ size: 'lg' }), 'mt-8 h-11 px-5')}
      >
        Записаться
        <ArrowRight aria-hidden="true" />
      </Link>
    </div>
  )
}
