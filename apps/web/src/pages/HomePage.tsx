import { Hero } from '@/components/home/Hero'
import { WhatIsAvailable } from '@/components/home/WhatIsAvailable'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'

export function HomePage() {
  return (
    <div className="flex min-h-svh flex-col">
      <Header />
      <main className="flex-1">
        <section className="bg-gradient-to-br from-sky-100 via-background to-orange-100">
          <div className="mx-auto grid max-w-6xl items-start gap-10 px-6 py-16 md:grid-cols-2 md:py-24">
            <Hero />
            <WhatIsAvailable />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
