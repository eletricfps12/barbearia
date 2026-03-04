/**
 * ServiceCard Component
 * 
 * Displays a service card with name, duration, and price.
 * Features visual highlighting when selected and dark mode styling.
 * Touch-friendly with minimum 44x44px tap target.
 * 
 * Requirements: 3.2, 3.3, 3.4, 7.1, 7.2, 7.3
 */
export default function ServiceCard({ service, isSelected, onSelect }) {
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
        w-full min-h-[44px] p-4 rounded-lg transition-all duration-200
        ${isSelected 
          ? 'bg-indigo-600 border-2 border-indigo-400 shadow-lg shadow-indigo-500/50' 
          : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        }
      `}
    >
      <div className="flex items-center justify-between">
        {/* Service Name and Duration */}
        <div className="text-left">
          <h3 className={`text-lg font-semibold ${isSelected ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
            {service.name}
          </h3>
          <p className={`text-sm ${isSelected ? 'text-indigo-100' : 'text-gray-500 dark:text-gray-400'}`}>
            {formatDuration(service.duration)}
          </p>
        </div>

        {/* Service Price */}
        <div className={`text-right font-bold text-lg ${isSelected ? 'text-white' : 'text-indigo-600'}`}>
          {formatPrice(service.price)}
        </div>
      </div>
    </button>
  )
}
