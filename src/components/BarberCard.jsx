import { useState } from 'react'

/**
 * BarberCard Component
 * 
 * Displays a barber card with circular avatar, name, and bio.
 * The entire card is clickable with hover effects.
 * Features light mode styling (bg-white, shadow-sm, border-gray-200).
 * 
 * Requirements: 6.3, 6.4, 6.5, 7.3
 */
export default function BarberCard({ barber, onClick }) {
  const [avatarError, setAvatarError] = useState(false)

  // Handle avatar image load error
  const handleAvatarError = () => {
    setAvatarError(true)
  }

  // Default avatar icon for fallback
  const DefaultAvatarIcon = () => (
    <div 
      className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center"
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
    <div
      onClick={() => onClick(barber.id)}
      className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 cursor-pointer transition-all hover:shadow-md hover:border-gray-300"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick(barber.id)
        }
      }}
    >
      {/* Avatar Section */}
      <div className="flex justify-center mb-4">
        {barber.avatar_url && !avatarError ? (
          <img
            src={barber.avatar_url}
            alt={`Avatar de ${barber.name}`}
            className="w-20 h-20 rounded-full object-cover"
            onError={handleAvatarError}
          />
        ) : (
          <DefaultAvatarIcon />
        )}
      </div>

      {/* Barber Name */}
      <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
        {barber.name}
      </h3>

      {/* Barber Bio (Optional) */}
      {barber.bio && (
        <p className="text-gray-600 text-sm text-center line-clamp-3">
          {barber.bio}
        </p>
      )}
    </div>
  )
}
