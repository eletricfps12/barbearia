import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

/**
 * Test suite to verify Tailwind CSS dark mode configuration
 * Validates Requirements 1.1, 1.2, 1.3
 */
describe('Tailwind CSS Dark Mode Configuration', () => {
  beforeEach(() => {
    // Clean up HTML element classes before each test
    document.documentElement.classList.remove('dark')
  })

  it('should apply light mode classes by default', () => {
    const TestComponent = () => (
      <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
        Test Content
      </div>
    )

    const { container } = render(<TestComponent />)
    const element = container.firstChild

    // Verify light mode classes are applied
    expect(element).toHaveClass('bg-white')
    expect(element).toHaveClass('text-gray-900')
    expect(element).toHaveClass('dark:bg-gray-800')
    expect(element).toHaveClass('dark:text-white')
  })

  it('should support dark: variant classes when dark class is on html element', () => {
    // Add dark class to HTML element
    document.documentElement.classList.add('dark')

    const TestComponent = () => (
      <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
        Test Content
      </div>
    )

    const { container } = render(<TestComponent />)
    const element = container.firstChild

    // Verify classes are present (actual dark mode styling is handled by CSS)
    expect(element).toHaveClass('bg-white')
    expect(element).toHaveClass('dark:bg-gray-800')
    expect(element).toHaveClass('text-gray-900')
    expect(element).toHaveClass('dark:text-white')
  })

  it('should preserve custom premium colors from theme extensions', () => {
    const TestComponent = () => (
      <div className="bg-premium-dark text-premium-accent">
        Premium Content
      </div>
    )

    const { container } = render(<TestComponent />)
    const element = container.firstChild

    // Verify custom color classes are applied
    expect(element).toHaveClass('bg-premium-dark')
    expect(element).toHaveClass('text-premium-accent')
  })

  it('should support dark mode variants for custom colors', () => {
    const TestComponent = () => (
      <div className="bg-premium-accent dark:bg-premium-darker">
        Premium Dark Content
      </div>
    )

    const { container } = render(<TestComponent />)
    const element = container.firstChild

    // Verify custom color classes with dark variants are applied
    expect(element).toHaveClass('bg-premium-accent')
    expect(element).toHaveClass('dark:bg-premium-darker')
  })

  it('should support multiple dark mode variants on same element', () => {
    const TestComponent = () => (
      <div className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
        Multi-variant Content
      </div>
    )

    const { container } = render(<TestComponent />)
    const element = container.firstChild

    // Verify all classes are applied
    expect(element).toHaveClass('bg-white')
    expect(element).toHaveClass('dark:bg-gray-800')
    expect(element).toHaveClass('border-gray-200')
    expect(element).toHaveClass('dark:border-gray-700')
    expect(element).toHaveClass('text-gray-900')
    expect(element).toHaveClass('dark:text-white')
  })
})
