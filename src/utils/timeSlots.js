/**
 * Gera slots de horário disponíveis para agendamento
 * @param {string} dateStr - Data no formato YYYY-MM-DD
 * @param {number} serviceDuration - Duração do serviço em minutos
 * @param {Array} existingAppointments - Agendamentos já existentes
 * @param {string} openTime - Horário de abertura (HH:MM)
 * @param {string} closeTime - Horário de fechamento (HH:MM)
 * @returns {Array} Array de slots disponíveis
 */
export function generateAvailableSlots(
  dateStr,
  serviceDuration,
  existingAppointments = [],
  openTime = '09:00',
  closeTime = '18:00'
) {
  const slots = []
  
  // Parse open and close times
  const [openHour, openMinute] = openTime.split(':').map(Number)
  const [closeHour, closeMinute] = closeTime.split(':').map(Number)
  
  // Create date objects for start and end of day
  const startTime = new Date(`${dateStr}T${openTime}:00`)
  const endTime = new Date(`${dateStr}T${closeTime}:00`)
  
  // Generate all possible slots
  let currentTime = new Date(startTime)
  
  while (currentTime < endTime) {
    const slotEndTime = new Date(currentTime.getTime() + serviceDuration * 60000)
    
    // Check if slot end time is within working hours
    if (slotEndTime <= endTime) {
      const timeString = currentTime.toTimeString().slice(0, 5) // HH:MM format
      
      // Check if slot conflicts with existing appointments
      const hasConflict = existingAppointments.some(appointment => {
        const appointmentStart = new Date(appointment.start_time)
        const appointmentEnd = new Date(appointment.end_time)
        
        return (
          (currentTime >= appointmentStart && currentTime < appointmentEnd) ||
          (slotEndTime > appointmentStart && slotEndTime <= appointmentEnd) ||
          (currentTime <= appointmentStart && slotEndTime >= appointmentEnd)
        )
      })
      
      if (!hasConflict) {
        slots.push({
          time: timeString,
          available: true,
          startTime: currentTime.toISOString(),
          endTime: slotEndTime.toISOString()
        })
      }
    }
    
    // Move to next slot (30 minute intervals)
    currentTime = new Date(currentTime.getTime() + 30 * 60000)
  }
  
  return slots
}

/**
 * Formata horário para exibição
 * @param {string} time - Horário no formato HH:MM
 * @returns {string} Horário formatado
 */
export function formatTime(time) {
  return time
}

/**
 * Verifica se uma data é hoje
 * @param {Date} date - Data para verificar
 * @returns {boolean}
 */
export function isToday(date) {
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

/**
 * Verifica se um horário já passou (para hoje)
 * @param {string} time - Horário no formato HH:MM
 * @param {Date} date - Data do slot
 * @returns {boolean}
 */
export function isPastTime(time, date) {
  if (!isToday(date)) return false
  
  const now = new Date()
  const [hours, minutes] = time.split(':').map(Number)
  const slotTime = new Date(date)
  slotTime.setHours(hours, minutes, 0, 0)
  
  return slotTime < now
}
