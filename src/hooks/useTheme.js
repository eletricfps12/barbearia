import { useContext } from 'react'
import { ThemeContext } from '../contexts/ThemeContext'

/**
 * Custom hook to access theme context
 * Must be used within a ThemeProvider
 * 
 * @returns {Object} Theme context value with theme, toggleTheme, and setTheme
 * @throws {Error} If used outside of ThemeProvider
 */
export function useTheme() {
  const context = useContext(ThemeContext)
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  
  return context
}
