import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { NotFoundPage } from '@/pages/not-found'

describe('NotFoundPage', () => {
  it('renders the fallback navigation', () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: /back to dashboard/i })).toBeInTheDocument()
  })
})
