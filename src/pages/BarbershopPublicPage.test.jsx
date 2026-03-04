import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import BarbershopPublicPage from './BarbershopPublicPage'
import { supabase } from '../lib/supabase'

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn()
  }
}))

// Mock useParams and useNavigate
let mockNavigate = vi.fn()
let mockSlug = 'test-barbershop'

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: () => ({ slug: mockSlug }),
    useNavigate: () => mockNavigate
  }
})

describe('BarbershopPublicPage - Empty Barbers List', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should display message when no barbers are available', async () => {
    // Arrange - Mock barbershop data with empty barbers list
    const mockBarbershop = {
      id: '123',
      name: 'Test Barbershop',
      logo_url: null,
      banner_url: null,
      contact_phone: null,
      address: null
    }

    // Mock Supabase responses
    supabase.from.mockImplementation((table) => {
      if (table === 'barbershops') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockBarbershop,
                error: null
              })
            })
          })
        }
      }
      if (table === 'barbers') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [], // Empty array
              error: null
            })
          })
        }
      }
    })

    // Act
    render(
      <BrowserRouter>
        <BarbershopPublicPage />
      </BrowserRouter>
    )

    // Assert - Wait for loading to complete and check for empty state message
    await waitFor(() => {
      expect(screen.queryByText('Carregando...')).not.toBeInTheDocument()
    })

    expect(screen.getByText('Nenhum profissional disponível no momento.')).toBeInTheDocument()
  })

  it('should not display empty message when barbers are available', async () => {
    // Arrange - Mock barbershop data with barbers
    const mockBarbershop = {
      id: '123',
      name: 'Test Barbershop',
      logo_url: null,
      banner_url: null,
      contact_phone: null,
      address: null
    }

    const mockBarbers = [
      {
        id: '1',
        name: 'João Silva',
        avatar_url: null,
        bio: 'Barbeiro experiente'
      }
    ]

    // Mock Supabase responses
    supabase.from.mockImplementation((table) => {
      if (table === 'barbershops') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockBarbershop,
                error: null
              })
            })
          })
        }
      }
      if (table === 'barbers') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockBarbers,
              error: null
            })
          })
        }
      }
    })

    // Act
    render(
      <BrowserRouter>
        <BarbershopPublicPage />
      </BrowserRouter>
    )

    // Assert - Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Carregando...')).not.toBeInTheDocument()
    })

    // Empty message should not be displayed
    expect(screen.queryByText('Nenhum profissional disponível no momento.')).not.toBeInTheDocument()
  })
})

describe('BarbershopPublicPage - Complete Navigation Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate = vi.fn()
  })

  it('should complete full flow: load barbershop → display barbers → navigate on click', async () => {
    // Arrange - Mock complete barbershop data
    const mockBarbershop = {
      id: 'barbershop-123',
      name: 'Barbearia Kiro',
      slug: 'barbearia-kiro',
      logo_url: 'https://example.com/logo.jpg',
      banner_url: 'https://example.com/banner.jpg',
      contact_phone: '(11) 98765-4321',
      address: 'Rua Exemplo, 123 - São Paulo'
    }

    const mockBarbers = [
      {
        id: 'barber-1',
        name: 'João Silva',
        avatar_url: 'https://example.com/joao.jpg',
        bio: 'Barbeiro com 10 anos de experiência'
      },
      {
        id: 'barber-2',
        name: 'Pedro Santos',
        avatar_url: 'https://example.com/pedro.jpg',
        bio: 'Especialista em cortes modernos'
      }
    ]

    // Mock Supabase responses
    supabase.from.mockImplementation((table) => {
      if (table === 'barbershops') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockBarbershop,
                error: null
              })
            })
          })
        }
      }
      if (table === 'barbers') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockBarbers,
              error: null
            })
          })
        }
      }
    })

    // Act - Render component
    render(
      <BrowserRouter>
        <BarbershopPublicPage />
      </BrowserRouter>
    )

    // Assert 1 - Loading state should be visible initially
    expect(screen.getByText('Carregando...')).toBeInTheDocument()

    // Assert 2 - Wait for barbershop data to load and be displayed
    await waitFor(() => {
      expect(screen.queryByText('Carregando...')).not.toBeInTheDocument()
    })

    // Assert 3 - Barbershop information should be displayed
    expect(screen.getByText('Barbearia Kiro')).toBeInTheDocument()
    expect(screen.getByText('(11) 98765-4321')).toBeInTheDocument()
    expect(screen.getByText('Rua Exemplo, 123 - São Paulo')).toBeInTheDocument()

    // Assert 4 - Section title should be displayed
    expect(screen.getByText('Escolha seu Profissional')).toBeInTheDocument()

    // Assert 5 - All barbers should be displayed
    expect(screen.getByText('João Silva')).toBeInTheDocument()
    expect(screen.getByText('Barbeiro com 10 anos de experiência')).toBeInTheDocument()
    expect(screen.getByText('Pedro Santos')).toBeInTheDocument()
    expect(screen.getByText('Especialista em cortes modernos')).toBeInTheDocument()

    // Act - Click on first barber
    const joaoCard = screen.getByText('João Silva').closest('div[role="button"]')
    fireEvent.click(joaoCard)

    // Assert 6 - Navigation should be called with correct route
    expect(mockNavigate).toHaveBeenCalledWith('/booking/barber-1')
  })

  it('should handle barbershop not found error', async () => {
    // Arrange - Mock barbershop not found
    supabase.from.mockImplementation((table) => {
      if (table === 'barbershops') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: null
              })
            })
          })
        }
      }
    })

    // Act
    render(
      <BrowserRouter>
        <BarbershopPublicPage />
      </BrowserRouter>
    )

    // Assert - Error message should be displayed
    await waitFor(() => {
      expect(screen.getByText('Barbearia não encontrada. Verifique o link.')).toBeInTheDocument()
    })

    // Assert - Retry button should be present
    expect(screen.getByText('Tentar Novamente')).toBeInTheDocument()
  })

  it('should handle network error gracefully', async () => {
    // Arrange - Mock network error
    supabase.from.mockImplementation(() => {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockRejectedValue(new Error('Network error'))
          })
        })
      }
    })

    // Act
    render(
      <BrowserRouter>
        <BarbershopPublicPage />
      </BrowserRouter>
    )

    // Assert - Error message should be displayed
    await waitFor(() => {
      expect(screen.getByText('Não foi possível conectar. Verifique sua conexão.')).toBeInTheDocument()
    })

    // Assert - Retry button should be present
    expect(screen.getByText('Tentar Novamente')).toBeInTheDocument()
  })

  it('should not render content until barbershop data is loaded', async () => {
    // Arrange - Mock delayed response
    let resolveBarbershop
    const barbershopPromise = new Promise((resolve) => {
      resolveBarbershop = resolve
    })

    supabase.from.mockImplementation((table) => {
      if (table === 'barbershops') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockReturnValue(barbershopPromise)
            })
          })
        }
      }
    })

    // Act
    render(
      <BrowserRouter>
        <BarbershopPublicPage />
      </BrowserRouter>
    )

    // Assert - Loading should be visible
    expect(screen.getByText('Carregando...')).toBeInTheDocument()

    // Assert - Content should not be visible yet
    expect(screen.queryByText('Escolha seu Profissional')).not.toBeInTheDocument()

    // Complete loading
    resolveBarbershop({
      data: {
        id: '123',
        name: 'Test Barbershop',
        logo_url: null,
        banner_url: null,
        contact_phone: null,
        address: null
      },
      error: null
    })

    // Wait for content to appear
    await waitFor(() => {
      expect(screen.queryByText('Carregando...')).not.toBeInTheDocument()
    })
  })

  it('should navigate to correct booking page for any barber clicked', async () => {
    // Arrange - Mock multiple barbers
    const mockBarbershop = {
      id: 'barbershop-123',
      name: 'Test Barbershop',
      logo_url: null,
      banner_url: null,
      contact_phone: null,
      address: null
    }

    const mockBarbers = [
      { id: 'barber-a', name: 'Barber A', avatar_url: null, bio: null },
      { id: 'barber-b', name: 'Barber B', avatar_url: null, bio: null },
      { id: 'barber-c', name: 'Barber C', avatar_url: null, bio: null }
    ]

    supabase.from.mockImplementation((table) => {
      if (table === 'barbershops') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockBarbershop,
                error: null
              })
            })
          })
        }
      }
      if (table === 'barbers') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockBarbers,
              error: null
            })
          })
        }
      }
    })

    // Act
    render(
      <BrowserRouter>
        <BarbershopPublicPage />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.queryByText('Carregando...')).not.toBeInTheDocument()
    })

    // Test clicking each barber
    const barberACard = screen.getByText('Barber A').closest('div[role="button"]')
    fireEvent.click(barberACard)
    expect(mockNavigate).toHaveBeenCalledWith('/booking/barber-a')

    mockNavigate.mockClear()

    const barberBCard = screen.getByText('Barber B').closest('div[role="button"]')
    fireEvent.click(barberBCard)
    expect(mockNavigate).toHaveBeenCalledWith('/booking/barber-b')

    mockNavigate.mockClear()

    const barberCCard = screen.getByText('Barber C').closest('div[role="button"]')
    fireEvent.click(barberCCard)
    expect(mockNavigate).toHaveBeenCalledWith('/booking/barber-c')
  })
})
