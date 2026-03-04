/**
 * TimeSlotButton Component
 * 
 * Displays a time slot button for booking selection.
 * Features visual highlighting when selected and dark mode styling.
 * Touch-friendly with minimum 44x44px tap target.
 * 
 * Requirements: 5.2, 5.3, 8.2, 8.5
 */
export default function TimeSlotButton({ slot, isSelected, onSelect }) {
  // Format time to HH:mm format
  const formatTime = (time) => {
    // If time is already in HH:mm format, return as is
    if (typeof time === 'string' && time.match(/^\d{2}:\d{2}$/)) {
      return time
    }
    
    // Handle other potential formats if needed
    return time
  }

  return (
    <button
      onClick={() => onSelect(slot)}
      disabled={!slot.available}
      className={`
        min-w-[88px] min-h-[44px] px-4 py-2 rounded-lg 
        transition-all duration-200 font-semibold
        ${isSelected 
          ? 'bg-indigo-600 border-2 border-indigo-400 shadow-lg shadow-indigo-500/50 text-white' 
          : slot.available
            ? 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-900 dark:text-white'
            : 'bg-gray-100 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
        }
      `}
    >
      {formatTime(slot.time)}
    </button>
  )
}
