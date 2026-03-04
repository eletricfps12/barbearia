import { useState } from 'react'

/**
 * BarbershopHeader Component
 * 
 * Displays barbershop header with banner, circular logo, name, and contact information.
 * Features light mode styling with fallbacks for missing images.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8
 */
export default function BarbershopHeader({ barbershop }) {
  const [bannerError, setBannerError] = useState(false)
  const [logoError, setLogoError] = useState(false)

  // Handle banner image load error
  const handleBannerError = () => {
    setBannerError(true)
  }

  // Handle logo image load error
  const handleLogoError = () => {
    setLogoError(true)
  }

  // Default avatar icon for logo fallback
  const DefaultLogoIcon = () => (
    <div 
      className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-white shadow-lg"
      data-testid="default-logo"
    >
      <svg 
        className="w-16 h-16 text-gray-400" 
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
    <div className="relative">
      {/* Banner Section */}
      <div className="w-full h-48 sm:h-64 overflow-hidden">
        {barbershop.banner_url && !bannerError ? (
          <img
            src={barbershop.banner_url}
            alt="Banner da barbearia"
            className="w-full h-full object-cover"
            onError={handleBannerError}
          />
        ) : (
          <div 
            className="w-full h-full bg-gradient-to-br from-purple-600 to-indigo-600"
            data-testid="banner-fallback"
          />
        )}
      </div>

      {/* Logo and Information Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Logo - Overlapping the banner/content division */}
        <div className="relative -mt-16 mb-4">
          {barbershop.logo_url && !logoError ? (
            <img
              src={barbershop.logo_url}
              alt={`Logo ${barbershop.name}`}
              className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
              onError={handleLogoError}
            />
          ) : (
            <DefaultLogoIcon />
          )}
        </div>

        {/* Barbershop Name */}
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          {barbershop.name}
        </h1>

        {/* Contact Information (Optional) */}
        <div className="space-y-2 mb-6">
          {barbershop.contact_phone && (
            <div className="flex items-center text-gray-600">
              <svg 
                className="w-5 h-5 mr-2" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" 
                />
              </svg>
              <span>{barbershop.contact_phone}</span>
            </div>
          )}

          {barbershop.address && (
            <div className="flex items-center text-gray-600">
              <svg 
                className="w-5 h-5 mr-2" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" 
                />
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" 
                />
              </svg>
              <span>{barbershop.address}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
