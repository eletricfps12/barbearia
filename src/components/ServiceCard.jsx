/**
 * ServiceCard Component
 * 
 * Displays a service card with name, duration, and price.
 * Features visual highlighting when selected and dark mode styling.
 * Touch-friendly with minimum 44x44px tap target.
 * Supports multiple selection with checkbox.
 * 
 * Requirements: 3.2, 3.3, 3.4, 7.1, 7.2, 7.3
 */
export default function ServiceCard({ service, isSelected, onSelect }) {
  // Debug: verificar se description está chegando
  console.log('ServiceCard recebeu:', { 
    name: service.name, 
    description: service.description,
    hasDescription: !!service.description 
  })
  
  // Format duration from minutes to readable format
  const formatDuration = (minutes) => {
    if (minutes < 60) {
      return `${minutes} min`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    if (remainingMinutes === 0) {
      return `${hours}h`
    }
    return `${hours}h ${remainingMinutes}min`
  }

  // Format price to Brazilian currency
  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  return (
    <button
      onClick={() => onSelect(service)}
      className={`
        w-full min-h-[44px] p-4 rounded-lg transition-all duration-200 relative
        ${isSelected 
          ? 'bg-indigo-600 border-2 border-indigo-400 shadow-lg shadow-indigo-500/50' 
          : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        }
      `}
    >
      <div className="flex items-center gap-3">
        {/* Checkbox */}
        <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
          isSelected 
            ? 'bg-white border-white' 
            : 'border-gray-300 dark:border-gray-600'
        }`}>
          {isSelected && (
            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>

        {/* Service Name, Description and Duration */}
        <div className="text-left flex-1">
          <h3 className={`text-lg font-semibold ${isSelected ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
            {service.name}
          </h3>
          {service.description && (
            <p className={`text-xs mt-0.5 mb-1 ${isSelected ? 'text-indigo-200' : 'text-gray-500 dark:text-gray-500'}`}>
              {service.description}
            </p>
          )}
          <p className={`text-sm ${isSelected ? 'text-indigo-100' : 'text-gray-500 dark:text-gray-400'}`}>
            {formatDuration(service.duration)}
          </p>
        </div>

        {/* Service Price */}
        <div className={`text-right font-bold text-lg flex-shrink-0 ${isSelected ? 'text-white' : 'text-indigo-600'}`}>
          {formatPrice(service.price)}
        </div>
      </div>
    </button>
  )
}
