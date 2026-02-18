import { jest } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { LoginPage } from '@/pages/login'
import { useAuth } from '@/hooks/use-auth'

jest.mock('@/hooks/use-auth')

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

describe('LoginPage', () => {
  it('renders the sign-in CTA', () => {
    mockedUseAuth.mockReturnValue({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
    })

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('button', { name: /sign in to continue/i })).toBeInTheDocument()
  })

  it('invokes login on click', async () => {
    const login = jest.fn()
    mockedUseAuth.mockReturnValue({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login,
      logout: jest.fn(),
    })

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    await userEvent.click(screen.getByRole('button', { name: /sign in to continue/i }))
    expect(login).toHaveBeenCalledTimes(1)
  })
})
