import { describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import { renderApp } from '@/test/renderApp'

describe('шапка и футер лендинга', () => {
  it('показывает в шапке название продукта и ссылки на разделы', () => {
    renderApp('/')

    const header = screen.getByRole('banner')

    expect(within(header).getByRole('link', { name: /Calendar/ })).toHaveAttribute(
      'href',
      '/',
    )
    expect(within(header).getByRole('link', { name: 'Записаться' })).toHaveAttribute(
      'href',
      '/book',
    )
    expect(
      within(header).getByRole('link', { name: 'Предстоящие события' }),
    ).toHaveAttribute('href', '/events')
  })

  it('показывает в футере название продукта и копирайт', () => {
    renderApp('/')

    const footer = screen.getByRole('contentinfo')

    expect(within(footer).getByRole('link', { name: /Calendar/ })).toBeInTheDocument()
    expect(within(footer).getByText(/© \d{4} Calendar/)).toBeInTheDocument()
  })
})

describe('hero лендинга', () => {
  it('рассказывает про сервис и ведёт кнопкой на запись', () => {
    renderApp('/')

    const main = screen.getByRole('main')

    expect(within(main).getByText(/быстрая запись на звонок/i)).toBeInTheDocument()
    expect(
      within(main).getByRole('heading', { level: 1, name: 'Calendar' }),
    ).toBeInTheDocument()
    expect(
      within(main).getByText(/Один экран, понятные слоты, быстрая бронь/),
    ).toBeInTheDocument()
    expect(within(main).getByRole('link', { name: /Записаться/ })).toHaveAttribute(
      'href',
      '/book',
    )
  })

  it('показывает карточку «Что доступно прямо сейчас» с тремя обещаниями', () => {
    renderApp('/')

    const main = screen.getByRole('main')

    expect(
      within(main).getByRole('heading', { name: 'Что доступно прямо сейчас' }),
    ).toBeInTheDocument()
    expect(
      within(main).getByText('Фиксированные 30-минутные слоты с 09:00 до 18:00.'),
    ).toBeInTheDocument()
    expect(
      within(main).getByText('Проверка конфликта при бронировании.'),
    ).toBeInTheDocument()
    expect(
      within(main).getByText('Просмотр предстоящих событий в отдельном разделе.'),
    ).toBeInTheDocument()
  })
})
