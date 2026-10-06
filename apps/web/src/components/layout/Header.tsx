import { CalendarDays } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'

export function Header() {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <CalendarDays className="size-5 text-primary" aria-hidden="true" />
          Calendar
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <NavLink to="/book" className={navLinkClass}>
            Записаться
          </NavLink>
          <NavLink to="/events" className={navLinkClass}>
            Предстоящие события
          </NavLink>
          <NavLink to="/event-types" className={navLinkClass}>
            Виды встреч
          </NavLink>
        </nav>
      </div>
    </header>
  )
}
