import { useLoading } from '../contexts/LoadingContext'
import { supabase } from '../lib/supabase'

/**
 * useSupabaseWithLoading Hook
 * 
 * Wrapper around Supabase client that automatically shows/hides global loader
 * during async operations.
 * 
 * Usage:
 * const supabaseWithLoading = useSupabaseWithLoading()
 * 
 * // Automatically shows loader during query
 * const { data, error } = await supabaseWithLoading
 *   .from('barbers')
 *   .select('*')
 * 
 * @param {boolean} autoLoading - Whether to show loader automatically (default: true)
 * @returns {Object} Supabase client with loading wrapper
 */
export function useSupabaseWithLoading(autoLoading = true) {
  const { showLoading, hideLoading } = useLoading()

  if (!autoLoading) {
    return supabase
  }

  // Create a proxy to intercept Supabase calls
  const createQueryProxy = (query) => {
    return new Proxy(query, {
      get(target, prop) {
        const value = target[prop]
        
        // If it's a function, wrap it
        if (typeof value === 'function') {
          return function (...args) {
            const result = value.apply(target, args)
            
            // If result is a Promise (async operation), wrap with loading
            if (result && typeof result.then === 'function') {
              showLoading()
              return result.finally(() => {
                hideLoading()
              })
            }
            
            // If result is another query builder, wrap it too
            if (result && typeof result === 'object') {
              return createQueryProxy(result)
            }
            
            return result
          }
        }
        
        return value
      }
    })
  }

  return createQueryProxy(supabase)
}
