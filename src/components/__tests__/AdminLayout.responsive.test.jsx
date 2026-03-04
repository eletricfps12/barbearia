import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import AdminLayout from '../AdminLayout'

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
              full_name: 'Test User'
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

describe('AdminLayout - Responsive Behavior', () => {
  let originalInnerWidth

  beforeEach(() => {
    // Store original window.innerWidth
    originalInnerWidth = window.innerWidth
    
    // Reset body overflow
    document.body.style.overflow = ''
    
    // Clear all mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Restore original window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth
    })
    
    // Reset body overflow
    document.body.style.overflow = ''
  })

  describe('Mobile viewport (< 768px)', () => {
    beforeEach(() => {
      // Set mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      })
    })

    it('should render sidebar as overlay (not visible by default)', () => {
      const { container } = render(
        <BrowserRouter>
          <AdminLayout />
        </BrowserRouter>
      )

      // Desktop sidebar should be hidden (has 'hidden md:block' classes)
      const desktopSidebar = container.querySelector('aside.hidden.md\\:block')
      expect(desktopSidebar).toBeTruthy()

      // Mobile overlay sidebar should not be rendered initially
      const mobileOverlay = container.querySelector('.fixed.inset-0.bg-black\\/50')
      expect(mobileOverlay).toBeFalsy()
    })

    it('should show menu button', () => {
      render(
        <BrowserRouter>
          <AdminLayout />
        </BrowserRouter>
      )

      // Menu button should be visible (has 'md:hidden' class)
      const menuButton = screen.getByLabelText(/abrir menu/i)
      expect(menuButton).toBeTruthy()
      expect(menuButton.className).toContain('md:hidden')
    })

    it('should open sidebar overlay when menu button is clicked', async () => {
      const { container } = render(
        <BrowserRouter>
          <AdminLayout />
        </BrowserRouter>
      )

      const menuButton = screen.getByLabelText(/abrir menu/i)
      fireEvent.click(menuButton)

      // Backdrop should be visible
      await waitFor(() => {
        const backdrop = container.querySelector('.fixed.inset-0.bg-black\\/50')
        expect(backdrop).toBeTruthy()
      })

      // Mobile sidebar should be visible
      const mobileSidebar = container.querySelector('aside.fixed.inset-y-0.left-0')
      expect(mobileSidebar).toBeTruthy()
    })

    it('should close sidebar when backdrop is clicked', async () => {
      const { container } = render(
        <BrowserRouter>
          <AdminLayout />
        </BrowserRouter>
      )

      // Open sidebar
      const menuButton = screen.getByLabelText(/abrir menu/i)
      fireEvent.click(menuButton)

      // Verify sidebar is open
      await waitFor(() => {
        const backdrop = container.querySelector('.fixed.inset-0.bg-black\\/50')
        expect(backdrop).toBeTruthy()
      })

      // Click backdrop
      const backdrop = container.querySelector('.fixed.inset-0.bg-black\\/50')
      fireEvent.click(backdrop)

      // Wait for sidebar to close
      await waitFor(() => {
        const closedBackdrop = container.querySelector('.fixed.inset-0.bg-black\\/50')
        expect(closedBackdrop).toBeFalsy()
      })
    })

    it('should prevent body scroll when sidebar is open', async () => {
      render(
        <BrowserRouter>
          <AdminLayout />
        </BrowserRouter>
      )

      // Initially, body should be scrollable
      expect(document.body.style.overflow).toBe('')

      // Open sidebar
      const menuButton = screen.getByLabelText(/abrir menu/i)
      fireEvent.click(menuButton)

      // Body scroll should be prevented
      await waitFor(() => {
        expect(document.body.style.overflow).toBe('hidden')
      })

      // Close sidebar by clicking backdrop
      const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/50')
      fireEvent.click(backdrop)

      // Body scroll should be restored
      await waitFor(() => {
        expect(document.body.style.overflow).toBe('')
      })
    })
  })

  describe('Desktop viewport (≥ 768px)', () => {
    beforeEach(() => {
      // Set desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024
      })
    })

    it('should render sidebar as fixed (visible by default)', () => {
      const { container } = render(
        <BrowserRouter>
          <AdminLayout />
        </BrowserRouter>
      )

      // Desktop sidebar should be present with correct classes
      const desktopSidebar = container.querySelector('aside.hidden.md\\:block.w-64')
      expect(desktopSidebar).toBeTruthy()
      expect(desktopSidebar.className).toContain('bg-gray-800')
      expect(desktopSidebar.className).toContain('border-r')
      expect(desktopSidebar.className).toContain('border-gray-700')
    })

    it('should hide menu button', () => {
      render(
        <BrowserRouter>
          <AdminLayout />
        </BrowserRouter>
      )

      // Menu button should have 'md:hidden' class (hidden on desktop)
      const menuButton = screen.getByLabelText(/abrir menu/i)
      expect(menuButton.className).toContain('md:hidden')
    })

    it('should not render mobile overlay', () => {
      const { container } = render(
        <BrowserRouter>
          <AdminLayout />
        </BrowserRouter>
      )

      // Mobile overlay should not be present
      const mobileOverlay = container.querySelector('.fixed.inset-0.bg-black\\/50')
      expect(mobileOverlay).toBeFalsy()

      const mobileSidebar = container.querySelector('aside.fixed.inset-y-0.left-0')
      expect(mobileSidebar).toBeFalsy()
    })
  })

  describe('Viewport transitions (window resize)', () => {
    it('should handle transition from desktop to mobile', async () => {
      // Start with desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024
      })

      const { container, rerender } = render(
        <BrowserRouter>
          <AdminLayout />
        </BrowserRouter>
      )

      // Verify desktop layout
      let desktopSidebar = container.querySelector('aside.hidden.md\\:block')
      expect(desktopSidebar).toBeTruthy()

      // Resize to mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      })

      // Trigger resize event
      window.dispatchEvent(new Event('resize'))

      // Rerender to apply changes
      rerender(
        <BrowserRouter>
          <AdminLayout />
        </BrowserRouter>
      )

      // Sidebar should still be present (CSS handles visibility)
      desktopSidebar = container.querySelector('aside.hidden.md\\:block')
      expect(desktopSidebar).toBeTruthy()

      // Menu button should be visible
      const menuButton = screen.getByLabelText(/abrir menu/i)
      expect(menuButton).toBeTruthy()
    })

    it('should handle transition from mobile to desktop', async () => {
      // Start with mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      })

      const { container, rerender } = render(
        <BrowserRouter>
          <AdminLayout />
        </BrowserRouter>
      )

      // Open sidebar on mobile
      const menuButton = screen.getByLabelText(/abrir menu/i)
      fireEvent.click(menuButton)

      // Verify mobile overlay is open
      await waitFor(() => {
        const backdrop = container.querySelector('.fixed.inset-0.bg-black\\/50')
        expect(backdrop).toBeTruthy()
      })

      // Resize to desktop
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024
      })

      // Trigger resize event
      window.dispatchEvent(new Event('resize'))

      // Rerender
      rerender(
        <BrowserRouter>
          <AdminLayout />
        </BrowserRouter>
      )

      // Mobile overlay should still be present (state doesn't auto-close)
      // This is expected behavior - user needs to close it manually
      const backdrop = container.querySelector('.fixed.inset-0.bg-black\\/50')
      expect(backdrop).toBeTruthy()
    })
  })

  describe('Sidebar width and positioning', () => {
    it('should have fixed width of 256px (w-64)', () => {
      const { container } = render(
        <BrowserRouter>
          <AdminLayout />
        </BrowserRouter>
      )

      const desktopSidebar = container.querySelector('aside.w-64')
      expect(desktopSidebar).toBeTruthy()
      expect(desktopSidebar.className).toContain('w-64')
    })

    it('should have correct z-index for mobile overlay', async () => {
      const { container } = render(
        <BrowserRouter>
          <AdminLayout />
        </BrowserRouter>
      )

      // Open sidebar
      const menuButton = screen.getByLabelText(/abrir menu/i)
      fireEvent.click(menuButton)

      await waitFor(() => {
        // Backdrop should have z-40
        const backdrop = container.querySelector('.z-40')
        expect(backdrop).toBeTruthy()
        expect(backdrop.className).toContain('bg-black/50')

        // Sidebar should have z-50 (above backdrop)
        const mobileSidebar = container.querySelector('aside.z-50')
        expect(mobileSidebar).toBeTruthy()
      })
    })
  })
})
