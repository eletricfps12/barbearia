/**
 * Utility functions for generating and managing available time slots
 * for the booking system.
 */

/**
 * Converts a time string (HH:mm) to total minutes since midnight
 * @param {string} timeStr - Time in format "HH:mm"
 * @returns {number} Total minutes since midnight
 */
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Adds minutes to a time string and returns new time string
 * @param {string} timeStr - Time in format "HH:mm"
 * @param {number} minutesToAdd - Minutes to add
 * @returns {string} New time in format "HH:mm"
 */
function addMinutes(timeStr, minutesToAdd) {
  const totalMinutes = timeToMinutes(timeStr) + minutesToAdd
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

/**
 * Checks if two time ranges overlap
 * @param {string} start1 - Start time of first range (HH:mm)
 * @param {string} end1 - End time of first range (HH:mm)
 * @param {string} start2 - Start time of second range (HH:mm)
 * @param {string} end2 - End time of second range (HH:mm)
 * @returns {boolean} True if ranges overlap
 */
function timesOverlap(start1, end1, start2, end2) {
  const start1Minutes = timeToMinutes(start1)
  const end1Minutes = timeToMinutes(end1)
  const start2Minutes = timeToMinutes(start2)
  const end2Minutes = timeToMinutes(end2)
  
  // Two ranges overlap if one starts before the other ends
  return start1Minutes < end2Minutes && start2Minutes < end1Minutes
}

/**
 * Generates available time slots for a given date, considering service duration
 * and existing appointments.
 * 
 * MISSÃO 1: Oculta horários antigos no dia atual (timezone America/Sao_Paulo)
 * MISSÃO 2: Respeita horários de funcionamento configurados
 * 
 * @param {string} date - Date in format "YYYY-MM-DD"
 * @param {number} serviceDuration - Duration of service in minutes
 * @param {Array} existingAppointments - Array of existing appointments with start_time and end_time
 * @param {string} openTime - Business opening time in format "HH:mm" (default: "09:00")
 * @param {string} closeTime - Business closing time in format "HH:mm" (default: "18:00")
 * @returns {Array} Array of available time slot objects { time: "HH:mm", available: true }
 * 
 * Requirements: 5.1, 5.4
 */
export function generateAvailableSlots(date, serviceDuration, existingAppointments = [], openTime = '09:00', closeTime = '18:00') {
  const slots = []
  const slotInterval = 30 // minutes
  
  // Parse business hours
  const startHourMinutes = timeToMinutes(openTime)
  const endHourMinutes = timeToMinutes(closeTime)
  
  // MISSÃO 1: Verificar se a data escolhida é HOJE (timezone Brasil)
  const selectedDate = new Date(date + 'T00:00:00')
  const now = new Date()
  
  // Obter data atual no timezone de São Paulo
  const nowInBrazil = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  const todayInBrazil = new Date(nowInBrazil.getFullYear(), nowInBrazil.getMonth(), nowInBrazil.getDate())
  
  const isToday = selectedDate.getTime() === todayInBrazil.getTime()
  const currentTimeMinutes = isToday ? (nowInBrazil.getHours() * 60 + nowInBrazil.getMinutes()) : 0
  
  // Generate slots from opening to closing time
  for (let slotMinutes = startHourMinutes; slotMinutes < endHourMinutes; slotMinutes += slotInterval) {
    const hour = Math.floor(slotMinutes / 60)
    const minute = slotMinutes % 60
    const slotTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
    const slotEnd = addMinutes(slotTime, serviceDuration)
    
    // Check if the complete service fits within business hours
    if (timeToMinutes(slotEnd) > endHourMinutes) {
      continue
    }
    
    // MISSÃO 1: Bloquear horários passados se for hoje
    if (isToday && slotMinutes <= currentTimeMinutes) {
      continue // Pula horários que já passaram
    }
    
    // Check for conflicts with existing appointments
    const hasConflict = existingAppointments.some(apt => 
      timesOverlap(slotTime, slotEnd, apt.start_time, apt.end_time)
    )
    
    if (!hasConflict) {
      slots.push({ time: slotTime, available: true })
    }
  }
  
  return slots
}

// Export helper functions for testing purposes
export { timeToMinutes, addMinutes, timesOverlap }
