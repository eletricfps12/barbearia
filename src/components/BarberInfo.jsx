import { useState } from 'react'

/**
 * BarberInfo Component
 * 
 * Displays barber information including photo, name, and barbershop name.
 * Features dark mode styling with rounded corners and fallback avatar.
 * Now includes barbershop logo and optional banner.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 7.1, 7.2, 7.3
 */
export default function BarberInfo({ barber }) {
  const [imageError, setImageError] = useState(false)
  const [logoError, setLogoError] = useState(false)

  // Handle image load error to show fallback avatar
  const handleImageError = () => {
    setImageError(true)
  }

  // Handle logo load error
  const handleLogoError = () => {
    setLogoError(true)
  }

  // Default avatar SVG for fallback
  const DefaultAvatar = () => (
    <div 
      className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center"
      data-testid="default-avatar"
    >
      <svg 
        className="w-12 h-12 text-gray-400" 
        fill="currentColor" 
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path 
          fillRule="evenodd" 
          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" 
          clipRule="evenodd"
        />
      </svg>
    </div>
  )

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
      {/* Banner (opcional) */}
      {barber.barbershop_banner && (
        <div className="w-full h-32 sm:h-40 bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <img
            src={barber.barbershop_banner}
            alt="Banner da barbearia"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-6">
        <div className="flex items-center gap-4">
          {/* Logo da Barbearia ou Avatar do Barbeiro */}
          {barber.barbershop_logo && !logoError ? (
            <img
              src={barber.barbershop_logo}
              alt={barber.barbershop_name}
              className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
              onError={handleLogoError}
            />
          ) : barber.avatar_url && !imageError ? (
            <img
              src={barber.avatar_url}
              alt={barber.name}
              className="w-20 h-20 rounded-full object-contain bg-gray-100 dark:bg-gray-700"
              onError={handleImageError}
            />
          ) : (
            <DefaultAvatar />
          )}

          {/* Barber Information */}
          <div className="flex-1">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
              {barber.name}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {barber.barbershop_name}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
