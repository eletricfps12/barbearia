import { createContext, useState, useEffect } from 'react'

// Create the Theme Context
export const ThemeContext = createContext(undefined)

/**
 * ThemeProvider component that manages theme state and persistence
 * Provides theme context to all child components
 */
export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState('light')

  // Initialize theme from localStorage on mount
  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem('theme')
      if (storedTheme === 'dark' || storedTheme === 'light') {
        setThemeState(storedTheme)
        // Sync with HTML element
        if (storedTheme === 'dark') {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      } else {
        // Default to light mode and ensure no dark class
        document.documentElement.classList.remove('dark')
      }
    } catch (error) {
      console.error('Failed to read theme from localStorage:', error)
      // Default to light mode on error
      document.documentElement.classList.remove('dark')
    }
  }, [])

  // Toggle between light and dark themes
  const toggleTheme = () => {
    setThemeState((prevTheme) => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light'
      
      // Save to localStorage
      try {
        localStorage.setItem('theme', newTheme)
      } catch (error) {
        console.error('Failed to save theme to localStorage:', error)
      }
      
      // Update HTML element class
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      
      return newTheme
    })
  }

  // Set specific theme programmatically
  const setTheme = (newTheme) => {
    if (newTheme !== 'light' && newTheme !== 'dark') {
      console.error('Invalid theme value. Must be "light" or "dark"')
      return
    }
    
    setThemeState(newTheme)
    
    // Save to localStorage
    try {
      localStorage.setItem('theme', newTheme)
    } catch (error) {
      console.error('Failed to save theme to localStorage:', error)
    }
    
    // Update HTML element class
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const value = {
    theme,
    toggleTheme,
    setTheme
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}
