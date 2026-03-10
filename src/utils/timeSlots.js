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
 * Generates available time slots for a given date, considering service duration,
 * existing appointments, and time blocks (fixed and one-time).
 * 
 * MISSÃO 1: Oculta horários antigos no dia atual (timezone America/Sao_Paulo)
 * MISSÃO 2: Respeita horários de funcionamento configurados
 * MISSÃO 3: Respeita bloqueios fixos (recorrentes todos os dias)
 * MISSÃO 4: Respeita bloqueios pontuais (data específica)
 * 
 * @param {string} date - Date in format "YYYY-MM-DD"
 * @param {number} serviceDuration - Duration of service in minutes
 * @param {Array} existingAppointments - Array of existing appointments with start_time and end_time
 * @param {string} openTime - Business opening time in format "HH:mm" (default: "09:00")
 * @param {string} closeTime - Business closing time in format "HH:mm" (default: "18:00")
 * @param {Array} fixedBlocks - Array of fixed time blocks (recurrent) with start_time and end_time
 * @param {Array} oneTimeBlocks - Array of one-time blocks for specific date with start_time and end_time
 * @param {string} barberId - ID of the barber to check blocks for (null = all barbers)
 * @returns {Array} Array of available time slot objects { time: "HH:mm", available: true }
 * 
 * Requirements: 5.1, 5.4
 */
export function generateAvailableSlots(date, serviceDuration, existingAppointments = [], openTime = '09:00', closeTime = '18:00', fixedBlocks = [], oneTimeBlocks = [], barberId = null) {
  const slots = []
  const slotInterval = 30 // minutes
  
  // Parse business hours
  const startHourMinutes = timeToMinutes(openTime)
  const endHourMinutes = timeToMinutes(closeTime)
  
  // MISSÃO 1: Verificar se a data escolhida é HOJE (timezone Brasil)
  // Criar data selecionada sem timezone para comparação
  const [year, month, day] = date.split('-').map(Number)
  const selectedDate = new Date(year, month - 1, day)
  
  // Obter data e hora atual no timezone de São Paulo
  const now = new Date()
  const nowInBrazil = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  const todayInBrazil = new Date(nowInBrazil.getFullYear(), nowInBrazil.getMonth(), nowInBrazil.getDate())
  
  const isToday = selectedDate.getTime() === todayInBrazil.getTime()
  
  // Hora atual em minutos (com margem de segurança de 30 minutos para preparação)
  const currentHour = nowInBrazil.getHours()
  const currentMinute = nowInBrazil.getMinutes()
  const currentTimeMinutes = isToday ? (currentHour * 60 + currentMinute + 30) : 0
  
  console.log('🕐 Gerando slots:', {
    date,
    selectedDate: selectedDate.toLocaleDateString('pt-BR'),
    todayInBrazil: todayInBrazil.toLocaleDateString('pt-BR'),
    isToday,
    nowInBrazil: nowInBrazil.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
    currentTime: `${currentHour}:${currentMinute}`,
    currentTimeMinutes,
    currentTimeWithMargin: `${Math.floor(currentTimeMinutes / 60)}:${(currentTimeMinutes % 60).toString().padStart(2, '0')}`,
    openTime,
    closeTime,
    startHourMinutes,
    endHourMinutes
  })
  
  // Generate slots from opening to closing time
  for (let slotMinutes = startHourMinutes; slotMinutes < endHourMinutes; slotMinutes += slotInterval) {
    const hour = Math.floor(slotMinutes / 60)
    const minute = slotMinutes % 60
    const slotTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
    const slotEnd = addMinutes(slotTime, serviceDuration)
    
    // Check if the complete service fits within business hours
    if (timeToMinutes(slotEnd) > endHourMinutes) {
      console.log(`⏭️ Slot ${slotTime} ultrapassa horário de fechamento`)
      continue
    }
    
    // MISSÃO 1: Bloquear horários passados se for hoje
    // Bloqueia se o horário do slot já passou OU se está muito próximo (menos de 30 min)
    if (isToday && slotMinutes <= currentTimeMinutes) {
      console.log(`⏭️ Bloqueando horário passado: ${slotTime} (slot: ${slotMinutes} <= atual+30min: ${currentTimeMinutes})`)
      continue // Pula horários que já passaram ou estão muito próximos
    }
    
    // Check for conflicts with existing appointments
    const hasConflict = existingAppointments.some(apt => 
      timesOverlap(slotTime, slotEnd, apt.start_time, apt.end_time)
    )
    
    if (hasConflict) {
      console.log(`❌ Slot ${slotTime} tem conflito com agendamento existente`)
    }
    
    // MISSÃO 3: Check for conflicts with fixed blocks (recurrent)
    const hasFixedBlockConflict = fixedBlocks.some(block => {
      // Se o bloco tem barber_id null, bloqueia para todos
      // Se o bloco tem barber_id específico, só bloqueia se for o mesmo barbeiro
      const appliesToBarber = !block.barber_id || block.barber_id === barberId
      
      if (!appliesToBarber) return false
      
      return timesOverlap(slotTime, slotEnd, block.start_time, block.end_time)
    })
    
    if (hasFixedBlockConflict) {
      console.log(`🔒 Slot ${slotTime} bloqueado por bloqueio fixo`)
    }
    
    // MISSÃO 4: Check for conflicts with one-time blocks (specific date)
    const hasOneTimeBlockConflict = oneTimeBlocks.some(block => {
      // Se o bloco tem barber_id null, bloqueia para todos
      // Se o bloco tem barber_id específico, só bloqueia se for o mesmo barbeiro
      const appliesToBarber = !block.barber_id || block.barber_id === barberId
      
      if (!appliesToBarber) return false
      
      // Extrair apenas o horário do timestamp (formato: "HH:mm")
      const blockStartTime = new Date(block.start_time).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'America/Sao_Paulo'
      })
      const blockEndTime = new Date(block.end_time).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'America/Sao_Paulo'
      })
      
      return timesOverlap(slotTime, slotEnd, blockStartTime, blockEndTime)
    })
    
    if (hasOneTimeBlockConflict) {
      console.log(`📅 Slot ${slotTime} bloqueado por bloqueio pontual`)
    }
    
    if (!hasConflict && !hasFixedBlockConflict && !hasOneTimeBlockConflict) {
      slots.push({ time: slotTime, available: true })
    }
  }
  
  console.log(`✅ Total de slots disponíveis: ${slots.length}`)
  if (slots.length > 0) {
    console.log(`   Primeiro slot: ${slots[0].time}`)
    console.log(`   Último slot: ${slots[slots.length - 1].time}`)
  }
  
  return slots
}

// Export helper functions for testing purposes
export { timeToMinutes, addMinutes, timesOverlap }
