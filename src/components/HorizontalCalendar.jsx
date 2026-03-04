/**
 * HorizontalCalendar Component
 * 
 * Displays a horizontal scrollable calendar for date selection.
 * Features mobile-first design with touch-friendly tap targets (44x44px minimum).
 * Shows day of week and day number for each date.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 7.1, 7.2, 7.3, 8.2, 8.5
 */
export default function HorizontalCalendar({ 
  selectedDate, 
  onDateSelect, 
  daysToShow = 14 
}) {
  // Generate array of dates starting from current date
  const generateDates = () => {
    const dates = []
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Reset time to start of day
    
    for (let i = 0; i < daysToShow; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      dates.push(date)
    }
    
    return dates
  }

  const dates = generateDates()

  // Format day of week (short format: Dom, Seg, Ter, etc.)
  const formatDayOfWeek = (date) => {
    return date.toLocaleDateString('pt-BR', { weekday: 'short' })
  }

  // Get day number
  const getDayNumber = (date) => {
    return date.getDate()
  }

  // Check if date is selected
  const isDateSelected = (date) => {
    if (!selectedDate) return false
    
    const selected = new Date(selectedDate)
    selected.setHours(0, 0, 0, 0)
    
    const current = new Date(date)
    current.setHours(0, 0, 0, 0)
    
    return selected.getTime() === current.getTime()
  }

  // Check if date is today
  const isToday = (date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const current = new Date(date)
    current.setHours(0, 0, 0, 0)
    
    return today.getTime() === current.getTime()
  }

  return (
    <div className="w-full">
      {/* Horizontal scrollable container */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-3 min-w-min">
          {dates.map((date, index) => {
            const selected = isDateSelected(date)
            const today = isToday(date)
            
            return (
              <button
                key={index}
                onClick={() => onDateSelect(date)}
                className={`
                  flex-shrink-0 flex flex-col items-center justify-center
                  min-w-[60px] min-h-[72px] px-3 py-2
                  rounded-lg transition-all duration-200
                  ${selected 
                    ? 'bg-indigo-600 border-2 border-indigo-400 shadow-lg shadow-indigo-500/50' 
                    : today
                      ? 'bg-gray-200 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                      : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
              >
                {/* Day of week */}
                <span 
                  className={`
                    text-xs font-medium uppercase mb-1
                    ${selected ? 'text-indigo-100' : 'text-gray-500 dark:text-gray-400'}
                  `}
                >
                  {formatDayOfWeek(date)}
                </span>
                
                {/* Day number */}
                <span 
                  className={`
                    text-2xl font-bold
                    ${selected ? 'text-white' : 'text-gray-900 dark:text-white'}
                  `}
                >
                  {getDayNumber(date)}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
