import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'

/**
 * ThemeToggle Component
 * 
 * A glassmorphism pill-shaped toggle button for switching between light and dark themes.
 * Features smooth animations, keyboard accessibility, and screen reader support.
 * 
 * Visual Specifications:
 * - Dimensions: 52px × 28px
 * - Glassmorphism effect with backdrop-blur
 * - Animated slider with theme-specific icons
 * - Light mode: Sun icon on indigo background
 * - Dark mode: Moon icon on golden background
 */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  const handleKeyDown = (event) => {
    // Support Enter and Space keys for keyboard navigation
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      toggleTheme()
    }
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={theme === 'dark'}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      onClick={toggleTheme}
      onKeyDown={handleKeyDown}
      className="relative w-[52px] h-7 rounded-full backdrop-blur-md transition-colors
                 bg-black/5 dark:bg-white/10
                 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    >
      {/* Slider circle with icon */}
      <div
        className="absolute top-0.5 left-0.5 w-6 h-6 rounded-full transition-transform duration-150 ease-in-out
                   bg-indigo-600 dark:bg-[#C8B682]
                   dark:translate-x-6
                   flex items-center justify-center"
      >
        {theme === 'light' ? (
          <Sun className="w-4 h-4 text-white" />
        ) : (
          <Moon className="w-4 h-4 text-gray-900" />
        )}
      </div>

      {/* Screen reader announcement for theme changes */}
      <span className="sr-only">
        Current theme: {theme} mode
      </span>
    </button>
  )
}
