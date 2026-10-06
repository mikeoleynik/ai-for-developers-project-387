import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-sm text-muted-foreground">
        <Link to="/" className="font-medium text-foreground">
          Calendar
        </Link>
        <span>© {new Date().getFullYear()} Calendar</span>
      </div>
    </footer>
  )
}
