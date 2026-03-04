import { useLoading } from '../contexts/LoadingContext'
import './GlobalLoader.css'

/**
 * GlobalLoader Component
 * 
 * Premium loading overlay that appears during route transitions and async operations.
 * Automatically adapts to light/dark mode with glassmorphism effect.
 * 
 * Usage:
 * - Automatically shown during route changes
 * - Manually triggered via useLoading() hook:
 *   const { showLoading, hideLoading } = useLoading()
 *   showLoading('Carregando dados...')
 *   // ... async operation
 *   hideLoading()
 */
export default function GlobalLoader() {
  const { isLoading, loadingMessage } = useLoading()

  if (!isLoading) return null

  return (
    <div className="loader-overlay">
      <div className="loader">
        <div className="text"><span>{loadingMessage}</span></div>
        <div className="text"><span>{loadingMessage}</span></div>
        <div className="text"><span>{loadingMessage}</span></div>
        <div className="text"><span>{loadingMessage}</span></div>
        <div className="text"><span>{loadingMessage}</span></div>
        <div className="text"><span>{loadingMessage}</span></div>
        <div className="text"><span>{loadingMessage}</span></div>
        <div className="text"><span>{loadingMessage}</span></div>
        <div className="text"><span>{loadingMessage}</span></div>
        <div className="line"></div>
      </div>
    </div>
  )
}
