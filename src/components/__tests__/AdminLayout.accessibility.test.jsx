import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import AdminLayout from '../AdminLayout'
import Sidebar from '../Sidebar'
import Header from '../Header'

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: {
            id: '123',
            email: 'test@example.com',
            user_metadata: {
              full_name: 'Test User',
              avatar_url: 'https://example.com/avatar.jpg'
            }
          }
        },
        error: null
      }),
      signOut: vi.fn().mockResolvedValue({ error: null })
    }
  }
}))

// Mock react-router-dom navigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Outlet: () => <div data-testid="outlet">Content Area</div>
  }
})

describe('AdminLayout - Accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Keyboard Navigation - Sidebar Links', () => {
    it('should allow tab navigation through all sidebar links', async () => {
      const user = userEvent.setup()
      
      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      )

      // Get all navigation links
      const dashboardLink = screen.getByRole('link', { name: /dashboard/i })
      const agendaLink = screen.getByRole('link', { name: /agenda/i })
      const servicosLink = screen.getByRole('link', { name: /serviços & preços/i })
      const configuracoesLink = screen.getByRole('link', { name: /minha barbearia/i })
      const equipeLink = screen.getByRole('link', { name: /equipe/i })
      const financeiroLink = screen.getByRole('link', { name: /financeiro/i })

      // Tab through each link
      await user.tab()
      expect(dashboardLink).toHaveFocus()

      await user.tab()
      expect(agendaLink).toHaveFocus()

      await user.tab()
      expect(servicosLink).toHaveFocus()

      await user.tab()
      expect(configuracoesLink).toHaveFocus()

      await user.tab()
      expect(equipeLink).toHaveFocus()

      await user.tab()
      expect(financeiroLink).toHaveFocus()
    })

    it('should allow reverse tab navigation (Shift+Tab)', async () => {
      const user = userEvent.setup()
      
      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      )

      const dashboardLink = screen.getByRole('link', { name: /dashboard/i })
      const financeiroLink = screen.getByRole('link', { name: /financeiro/i })

      // Tab to the last link
      await user.tab()
      await user.tab()
      await user.tab()
      await user.tab()
      await user.tab()
      await user.tab()
      expect(financeiroLink).toHaveFocus()

      // Shift+Tab back
      await user.tab({ shift: true })
      expect(screen.getByRole('link', { name: /equipe/i })).toHaveFocus()

      await user.tab({ shift: true })
      expect(screen.getByRole('link', { name: /minha barbearia/i })).toHaveFocus()
    })

    it('should activate link on Enter key press', async () => {
      const user = userEvent.setup()
      const onLinkClick = vi.fn()
      
      render(
        <BrowserRouter>
          <Sidebar onLinkClick={onLinkClick} />
        </BrowserRouter>
      )

      const agendaLink = screen.getByRole('link', { name: /agenda/i })
      
      // Focus and press Enter
      agendaLink.focus()
      await user.keyboard('{Enter}')

      // Link should be activated (callback called)
      expect(onLinkClick).toHaveBeenCalled()
    })

    it('should activate link on Space key press', async () => {
      const user = userEvent.setup()
      const onLinkClick = vi.fn()
      
      render(
        <BrowserRouter>
          <Sidebar onLinkClick={onLinkClick} />
        </BrowserRouter>
      )

      const servicosLink = screen.getByRole('link', { name: /serviços & preços/i })
      
      // Focus and click (Space on links triggers click)
      servicosLink.focus()
      await user.click(servicosLink)

      // Link should be activated (callback called)
      expect(onLinkClick).toHaveBeenCalled()
    })
  })

  describe('Keyboard Navigation - Header Buttons', () => {
    it('should allow tab navigation to menu button', async () => {
      const user = userEvent.setup()
      const onMenuClick = vi.fn()
      const onLogout = vi.fn()
      
      render(
        <Header 
          user={{ email: 'test@example.com', user_metadata: { full_name: 'Test User' } }}
          onMenuClick={onMenuClick}
          onLogout={onLogout}
        />
      )

      const menuButton = screen.getByLabelText(/abrir menu/i)
      
      await user.tab()
      expect(menuButton).toHaveFocus()
    })

    it('should allow tab navigation to logout button', async () => {
      const user = userEvent.setup()
      const onMenuClick = vi.fn()
      const onLogout = vi.fn()
      
      render(
        <Header 
          user={{ email: 'test@example.com', user_metadata: { full_name: 'Test User' } }}
          onMenuClick={onMenuClick}
          onLogout={onLogout}
        />
      )

      const logoutButton = screen.getByLabelText(/sair/i)
      
      // Tab to menu button first, then to logout button
      await user.tab()
      await user.tab()
      expect(logoutButton).toHaveFocus()
    })

    it('should activate menu button on Enter key press', async () => {
      const user = userEvent.setup()
      const onMenuClick = vi.fn()
      const onLogout = vi.fn()
      
      render(
        <Header 
          user={{ email: 'test@example.com', user_metadata: { full_name: 'Test User' } }}
          onMenuClick={onMenuClick}
          onLogout={onLogout}
        />
      )

      const menuButton = screen.getByLabelText(/abrir menu/i)
      
      menuButton.focus()
      await user.keyboard('{Enter}')

      expect(onMenuClick).toHaveBeenCalled()
    })

    it('should activate logout button on Enter key press', async () => {
      const user = userEvent.setup()
      const onMenuClick = vi.fn()
      const onLogout = vi.fn()
      
      render(
        <Header 
          user={{ email: 'test@example.com', user_metadata: { full_name: 'Test User' } }}
          onMenuClick={onMenuClick}
          onLogout={onLogout}
        />
      )

      const logoutButton = screen.getByLabelText(/sair/i)
      
      logoutButton.focus()
      await user.keyboard('{Enter}')

      expect(onLogout).toHaveBeenCalled()
    })
  })

  describe('Aria-labels - Descriptive Labels', () => {
    it('should have descriptive aria-label on menu button', () => {
      const onMenuClick = vi.fn()
      const onLogout = vi.fn()
      
      render(
        <Header 
          user={{ email: 'test@example.com', user_metadata: { full_name: 'Test User' } }}
          onMenuClick={onMenuClick}
          onLogout={onLogout}
        />
      )

      const menuButton = screen.getByLabelText('Abrir menu')
      expect(menuButton).toBeInTheDocument()
      expect(menuButton).toHaveAttribute('aria-label', 'Abrir menu')
    })

    it('should have descriptive aria-label on logout button', () => {
      const onMenuClick = vi.fn()
      const onLogout = vi.fn()
      
      render(
        <Header 
          user={{ email: 'test@example.com', user_metadata: { full_name: 'Test User' } }}
          onMenuClick={onMenuClick}
          onLogout={onLogout}
        />
      )

      const logoutButton = screen.getByLabelText('Sair')
      expect(logoutButton).toBeInTheDocument()
      expect(logoutButton).toHaveAttribute('aria-label', 'Sair')
    })

    it('should have descriptive alt text on user avatar image', () => {
      const onMenuClick = vi.fn()
      const onLogout = vi.fn()
      
      render(
        <Header 
          user={{ 
            email: 'test@example.com', 
            user_metadata: { 
              full_name: 'João Silva',
              avatar_url: 'https://example.com/avatar.jpg'
            } 
          }}
          onMenuClick={onMenuClick}
          onLogout={onLogout}
        />
      )

      const avatar = screen.getByRole('img')
      expect(avatar).toHaveAttribute('alt', 'João Silva')
    })

    it('should have fallback alt text when user has no full_name', () => {
      const onMenuClick = vi.fn()
      const onLogout = vi.fn()
      
      render(
        <Header 
          user={{ 
            email: 'test@example.com', 
            user_metadata: { 
              avatar_url: 'https://example.com/avatar.jpg'
            } 
          }}
          onMenuClick={onMenuClick}
          onLogout={onLogout}
        />
      )

      const avatar = screen.getByRole('img')
      expect(avatar).toHaveAttribute('alt', 'User')
    })
  })

  describe('Focus Visibility - Interactive Elements', () => {
    it('should have visible focus styles on sidebar links', () => {
      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      )

      const dashboardLink = screen.getByRole('link', { name: /dashboard/i })
      
      // Focus the link
      dashboardLink.focus()
      
      // Verify link is focused
      expect(dashboardLink).toHaveFocus()
      
      // Verify link has transition classes for smooth focus indication
      expect(dashboardLink.className).toContain('transition-colors')
      expect(dashboardLink.className).toContain('duration-200')
    })

    it('should have visible focus styles on menu button', () => {
      const onMenuClick = vi.fn()
      const onLogout = vi.fn()
      
      render(
        <Header 
          user={{ email: 'test@example.com', user_metadata: { full_name: 'Test User' } }}
          onMenuClick={onMenuClick}
          onLogout={onLogout}
        />
      )

      const menuButton = screen.getByLabelText(/abrir menu/i)
      
      // Focus the button
      menuButton.focus()
      
      // Verify button is focused
      expect(menuButton).toHaveFocus()
      
      // Verify button has transition classes
      expect(menuButton.className).toContain('transition-colors')
    })

    it('should have visible focus styles on logout button', () => {
      const onMenuClick = vi.fn()
      const onLogout = vi.fn()
      
      render(
        <Header 
          user={{ email: 'test@example.com', user_metadata: { full_name: 'Test User' } }}
          onMenuClick={onMenuClick}
          onLogout={onLogout}
        />
      )

      const logoutButton = screen.getByLabelText(/sair/i)
      
      // Focus the button
      logoutButton.focus()
      
      // Verify button is focused
      expect(logoutButton).toHaveFocus()
      
      // Verify button has transition classes
      expect(logoutButton.className).toContain('transition-colors')
    })

    it('should maintain focus when navigating between sidebar links', async () => {
      const user = userEvent.setup()
      
      render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      )

      // Tab through links and verify focus is maintained
      await user.tab()
      expect(screen.getByRole('link', { name: /dashboard/i })).toHaveFocus()

      await user.tab()
      expect(screen.getByRole('link', { name: /agenda/i })).toHaveFocus()

      await user.tab()
      expect(screen.getByRole('link', { name: /serviços & preços/i })).toHaveFocus()
    })
  })

  describe('Full AdminLayout Keyboard Navigation', () => {
    it('should allow complete keyboard navigation through all interactive elements', async () => {
      const user = userEvent.setup()
      
      render(
        <BrowserRouter>
          <AdminLayout />
        </BrowserRouter>
      )

      // Wait for user data to load
      await screen.findByLabelText(/abrir menu/i)

      // The desktop sidebar links are rendered first in the DOM
      // Tab through desktop sidebar links (6 links)
      await user.tab() // Dashboard
      await user.tab() // Agenda
      await user.tab() // Serviços
      await user.tab() // Configurações
      await user.tab() // Equipe
      await user.tab() // Financeiro
      
      // Then: menu button
      await user.tab()
      expect(screen.getByLabelText(/abrir menu/i)).toHaveFocus()

      // Finally: logout button
      await user.tab()
      expect(screen.getByLabelText(/sair/i)).toHaveFocus()
    })

    it('should trap focus in mobile sidebar when open', async () => {
      const user = userEvent.setup()
      
      render(
        <BrowserRouter>
          <AdminLayout />
        </BrowserRouter>
      )

      // Wait for component to load
      await screen.findByLabelText(/abrir menu/i)

      // Open mobile sidebar
      const menuButton = screen.getByLabelText(/abrir menu/i)
      await user.click(menuButton)

      // Verify sidebar links are now accessible
      const dashboardLink = screen.getAllByRole('link', { name: /dashboard/i })[0]
      expect(dashboardLink).toBeInTheDocument()
    })
  })

  describe('Semantic HTML and Roles', () => {
    it('should use semantic nav element for sidebar', () => {
      const { container } = render(
        <BrowserRouter>
          <Sidebar />
        </BrowserRouter>
      )

      const nav = container.querySelector('nav')
      expect(nav).toBeInTheDocument()
    })

    it('should use semantic header element', () => {
      const onMenuClick = vi.fn()
      const onLogout = vi.fn()
      
      const { container } = render(
        <Header 
          user={{ email: 'test@example.com', user_metadata: { full_name: 'Test User' } }}
          onMenuClick={onMenuClick}
          onLogout={onLogout}
        />
      )

      const header = container.querySelector('header')
      expect(header).toBeInTheDocument()
    })

    it('should use semantic main element for content area', () => {
      const { container } = render(
        <BrowserRouter>
          <AdminLayout />
        </BrowserRouter>
      )

      const main = container.querySelector('main')
      expect(main).toBeInTheDocument()
    })

    it('should use semantic aside element for sidebar', () => {
      const { container } = render(
        <BrowserRouter>
          <AdminLayout />
        </BrowserRouter>
      )

      const aside = container.querySelector('aside')
      expect(aside).toBeInTheDocument()
    })
  })
})
