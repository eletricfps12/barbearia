import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ThemeProvider } from './ThemeContext'
import { useTheme } from '../hooks/useTheme'

// Test component that uses the theme context
function TestComponent() {
  const { theme } = useTheme()
  return <div data-testid="theme-display">{theme}</div>
}

describe('ThemeProvider Integration', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    // Remove dark class from document
    document.documentElement.classList.remove('dark')
  })

  afterEach(() => {
    // Clean up after each test
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  it('should provide theme context to child components', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    const themeDisplay = screen.getByTestId('theme-display')
    expect(themeDisplay).toBeInTheDocument()
    expect(themeDisplay.textContent).toBe('light')
  })

  it('should make theme context available throughout component tree', () => {
    function NestedComponent() {
      const { theme, toggleTheme } = useTheme()
      return (
        <div>
          <span data-testid="nested-theme">{theme}</span>
          <button onClick={toggleTheme} data-testid="nested-toggle">
            Toggle
          </button>
        </div>
      )
    }

    function ParentComponent() {
      return (
        <div>
          <TestComponent />
          <NestedComponent />
        </div>
      )
    }

    render(
      <ThemeProvider>
        <ParentComponent />
      </ThemeProvider>
    )

    // Both components should have access to the same theme context
    expect(screen.getByTestId('theme-display').textContent).toBe('light')
    expect(screen.getByTestId('nested-theme').textContent).toBe('light')
  })

  it('should throw error when useTheme is used outside ThemeProvider', () => {
    // Suppress console.error for this test
    const originalError = console.error
    console.error = () => {}

    expect(() => {
      render(<TestComponent />)
    }).toThrow('useTheme must be used within a ThemeProvider')

    // Restore console.error
    console.error = originalError
  })
})
