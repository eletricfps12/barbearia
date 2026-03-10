import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Zap, TrendingUp, AlertCircle } from 'lucide-react'

/**
 * AgendaPage Component - Daily Timeline Schedule Management with Capacity View
 * 
 * Permite ao dono da barbearia:
 * - Visualizar agenda diária de todos os barbeiros ou filtrar por profissional
 * - Navegar entre dias (anterior, hoje, próximo)
 * - Atualizar status dos agendamentos (concluir, marcar falta, etc)
 * - Ver informações completas: cliente, serviço, horário, valor
 * - Visualizar ocupação diária e horários ociosos
 * - Identificar oportunidades de encaixe
 */
export default function AgendaPage() {
  // Filter states
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedBarber, setSelectedBarber] = useState('all')
  
  // Data states
  const [appointments, setAppointments] = useState([])
  const [barbers, setBarbers] = useState([])
  const [barbershopId, setBarbershopId] = useState(null)
  const [businessHours, setBusinessHours] = useState(null)
  const [timeBlocks, setTimeBlocks] = useState([]) // Bloqueios de horário
  
  // Capacity states
  const [occupationRate, setOccupationRate] = useState(0)
  const [idleSlots, setIdleSlots] = useState([])
  const [fitSlots, setFitSlots] = useState([])
  const [showCapacityDetails, setShowCapacityDetails] = useState(false)
  
  // View states
  const [viewMode, setViewMode] = useState(() => {
    // Carregar preferência salva ou usar 'list' como padrão
    return localStorage.getItem('agendaViewMode') || 'list'
  })
  const [currentTime, setCurrentTime] = useState(new Date())
  
  // UI states
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updatingStatus, setUpdatingStatus] = useState(null)
  
  // Modal states
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [selectedBlock, setSelectedBlock] = useState(null)
  const [showAppointmentModal, setShowAppointmentModal] = useState(false)
  const [showBlockModal, setShowBlockModal] = useState(false)
  
  // Update current time every minute for "now" line
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute
    
    return () => clearInterval(interval)
  }, [])

  // Fetch barbershop ID on mount
  useEffect(() => {
    fetchBarbershopId()
  }, [])

  // Fetch barbers and business hours when barbershop ID is available
  useEffect(() => {
    if (barbershopId) {
      fetchBarbers()
      fetchBusinessHours()
    }
  }, [barbershopId])

  // Fetch appointments and business hours when filters change
  useEffect(() => {
    if (barbershopId) {
      fetchAppointments()
      fetchBusinessHours()
      fetchTimeBlocks() // Buscar bloqueios
    }
  }, [barbershopId, selectedDate, selectedBarber])

  // Calculate capacity metrics when appointments or business hours change
  useEffect(() => {
    if (appointments.length > 0 && businessHours && !businessHours.is_closed) {
      calculateCapacityMetrics()
    } else {
      setOccupationRate(0)
      setIdleSlots([])
      setFitSlots([])
    }
  }, [appointments, businessHours])
  
  // Save view mode preference
  useEffect(() => {
    localStorage.setItem('agendaViewMode', viewMode)
  }, [viewMode])

  // Setup Supabase Realtime subscription
  useEffect(() => {
    if (!barbershopId) return

    const channel = supabase
      .channel('appointments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `barbershop_id=eq.${barbershopId}`
        },
        () => {
          // Reload appointments when any change occurs
          fetchAppointments()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [barbershopId, selectedDate, selectedBarber])

  /**
   * Get barbershop ID from logged user
   */
  const fetchBarbershopId = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('Usuário não autenticado')
        setIsLoading(false)
        return
      }

      // Get barber data to find barbershop_id
      const { data: barberData, error: barberError } = await supabase
        .from('barbers')
        .select('barbershop_id')
        .eq('profile_id', user.id)
        .single()

      if (barberError) throw barberError

      setBarbershopId(barberData.barbershop_id)
    } catch (err) {
      console.error('Error fetching barbershop ID:', err)
      setError('Erro ao carregar dados da barbearia')
      setIsLoading(false)
    }
  }

  /**
   * Fetch all barbers from barbershop
   */
  const fetchBarbers = async () => {
    try {
      const { data, error: barbersError } = await supabase
        .from('barbers')
        .select('id, name, color')
        .eq('barbershop_id', barbershopId)
        .order('name', { ascending: true })

      if (barbersError) throw barbersError

      setBarbers(data || [])
    } catch (err) {
      console.error('Error fetching barbers:', err)
      setError('Erro ao carregar barbeiros')
    }
  }

  /**
   * Fetch business hours for the selected date
   */
  const fetchBusinessHours = async () => {
    try {
      const dayOfWeek = selectedDate.getDay()
      
      const { data, error: hoursError } = await supabase
        .from('business_hours')
        .select('*')
        .eq('barbershop_id', barbershopId)
        .eq('day_of_week', dayOfWeek)
        .maybeSingle()

      if (hoursError) throw hoursError

      setBusinessHours(data)
    } catch (err) {
      console.error('Error fetching business hours:', err)
    }
  }

  /**
   * Fetch time blocks (bloqueios) for the selected date
   */
  const fetchTimeBlocks = async () => {
    try {
      const startOfDay = new Date(selectedDate)
      startOfDay.setHours(0, 0, 0, 0)
      
      const endOfDay = new Date(selectedDate)
      endOfDay.setHours(23, 59, 59, 999)

      // Buscar bloqueios pontuais do dia
      const { data: oneTimeBlocks, error: oneTimeError } = await supabase
        .from('time_blocks')
        .select('*')
        .eq('barbershop_id', barbershopId)
        .gte('start_time', startOfDay.toISOString())
        .lte('start_time', endOfDay.toISOString())

      if (oneTimeError) throw oneTimeError

      // Buscar bloqueios fixos (recorrentes)
      const { data: fixedBlocks, error: fixedError } = await supabase
        .from('fixed_time_blocks')
        .select('*')
        .eq('barbershop_id', barbershopId)

      if (fixedError) throw fixedError

      // Combinar bloqueios
      const allBlocks = [
        ...(oneTimeBlocks || []).map(block => ({
          ...block,
          type: 'one-time',
          start_time: new Date(block.start_time),
          end_time: new Date(block.end_time)
        })),
        ...(fixedBlocks || []).map(block => {
          // Converter TIME para timestamp do dia selecionado
          const [startHour, startMin] = block.start_time.split(':').map(Number)
          const [endHour, endMin] = block.end_time.split(':').map(Number)
          
          const startTime = new Date(selectedDate)
          startTime.setHours(startHour, startMin, 0, 0)
          
          const endTime = new Date(selectedDate)
          endTime.setHours(endHour, endMin, 0, 0)
          
          return {
            ...block,
            type: 'fixed',
            start_time: startTime,
            end_time: endTime
          }
        })
      ]

      setTimeBlocks(allBlocks)
    } catch (err) {
      console.error('Error fetching time blocks:', err)
    }
  }

  /**
   * Fetch appointments for selected date and barber
   */
  const fetchAppointments = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Create date range for the selected day
      const startOfDay = new Date(selectedDate)
      startOfDay.setHours(0, 0, 0, 0)
      
      const endOfDay = new Date(selectedDate)
      endOfDay.setHours(23, 59, 59, 999)

      // Build query
      let query = supabase
        .from('appointments')
        .select(`
          *,
          barbers(name, color)
        `)
        .eq('barbershop_id', barbershopId)
        .gte('start_time', startOfDay.toISOString())
        .lte('start_time', endOfDay.toISOString())
        .order('start_time', { ascending: true })

      // Filter by barber if not 'all'
      if (selectedBarber !== 'all') {
        query = query.eq('barber_id', selectedBarber)
      }

      const { data, error: appointmentsError } = await query

      if (appointmentsError) throw appointmentsError

      setAppointments(data || [])
      setIsLoading(false)
    } catch (err) {
      console.error('Error fetching appointments:', err)
      setError('Erro ao carregar agendamentos')
      setIsLoading(false)
    }
  }

  /**
   * Calculate capacity metrics: occupation rate, idle slots, and fit opportunities
   */
  const calculateCapacityMetrics = () => {
    if (!businessHours || businessHours.is_closed) return

    // Parse business hours
    const [openHour, openMin] = businessHours.open_time.split(':').map(Number)
    const [closeHour, closeMin] = businessHours.close_time.split(':').map(Number)
    
    const openMinutes = openHour * 60 + openMin
    const closeMinutes = closeHour * 60 + closeMin
    const totalAvailableMinutes = closeMinutes - openMinutes

    // Calculate total booked minutes
    const confirmedAppointments = appointments.filter(apt => 
      apt.status === 'confirmed' || apt.status === 'completed'
    )
    
    const totalBookedMinutes = confirmedAppointments.reduce((sum, apt) => {
      const startTime = new Date(apt.start_time)
      const endTime = new Date(apt.end_time)
      const durationMinutes = Math.round((endTime - startTime) / (1000 * 60))
      return sum + durationMinutes
    }, 0)

    // Calculate occupation rate
    const rate = totalAvailableMinutes > 0 
      ? Math.round((totalBookedMinutes / totalAvailableMinutes) * 100)
      : 0
    
    setOccupationRate(rate)

    // Find idle slots (gaps > 90 minutes)
    const sortedAppointments = [...confirmedAppointments].sort((a, b) => 
      new Date(a.start_time) - new Date(b.start_time)
    )

    const idleGaps = []
    const fitOpportunities = []

    // Check gap from opening to first appointment
    if (sortedAppointments.length > 0) {
      const firstApt = sortedAppointments[0]
      const firstAptTime = new Date(firstApt.start_time)
      const firstAptMinutes = firstAptTime.getHours() * 60 + firstAptTime.getMinutes()
      
      const gapBeforeFirst = firstAptMinutes - openMinutes
      
      if (gapBeforeFirst >= 90) {
        idleGaps.push({
          start: businessHours.open_time,
          end: `${String(firstAptTime.getHours()).padStart(2, '0')}:${String(firstAptTime.getMinutes()).padStart(2, '0')}`,
          duration: gapBeforeFirst
        })
      } else if (gapBeforeFirst >= 30 && gapBeforeFirst < 90) {
        fitOpportunities.push({
          start: businessHours.open_time,
          end: `${String(firstAptTime.getHours()).padStart(2, '0')}:${String(firstAptTime.getMinutes()).padStart(2, '0')}`,
          duration: gapBeforeFirst
        })
      }
    }

    // Check gaps between appointments
    for (let i = 0; i < sortedAppointments.length - 1; i++) {
      const current = sortedAppointments[i]
      const next = sortedAppointments[i + 1]
      
      const currentEnd = new Date(current.start_time)
      currentEnd.setMinutes(currentEnd.getMinutes() + (current.services?.duration_minutes || 0))
      
      const nextStart = new Date(next.start_time)
      
      const gapMinutes = (nextStart - currentEnd) / (1000 * 60)
      
      if (gapMinutes >= 90) {
        idleGaps.push({
          start: `${String(currentEnd.getHours()).padStart(2, '0')}:${String(currentEnd.getMinutes()).padStart(2, '0')}`,
          end: `${String(nextStart.getHours()).padStart(2, '0')}:${String(nextStart.getMinutes()).padStart(2, '0')}`,
          duration: Math.floor(gapMinutes)
        })
      } else if (gapMinutes >= 30 && gapMinutes < 90) {
        fitOpportunities.push({
          start: `${String(currentEnd.getHours()).padStart(2, '0')}:${String(currentEnd.getMinutes()).padStart(2, '0')}`,
          end: `${String(nextStart.getHours()).padStart(2, '0')}:${String(nextStart.getMinutes()).padStart(2, '0')}`,
          duration: Math.floor(gapMinutes)
        })
      }
    }

    // Check gap from last appointment to closing
    if (sortedAppointments.length > 0) {
      const lastApt = sortedAppointments[sortedAppointments.length - 1]
      const lastAptEnd = new Date(lastApt.start_time)
      lastAptEnd.setMinutes(lastAptEnd.getMinutes() + (lastApt.services?.duration_minutes || 0))
      
      const lastAptEndMinutes = lastAptEnd.getHours() * 60 + lastAptEnd.getMinutes()
      const gapAfterLast = closeMinutes - lastAptEndMinutes
      
      if (gapAfterLast >= 90) {
        idleGaps.push({
          start: `${String(lastAptEnd.getHours()).padStart(2, '0')}:${String(lastAptEnd.getMinutes()).padStart(2, '0')}`,
          end: businessHours.close_time,
          duration: gapAfterLast
        })
      } else if (gapAfterLast >= 30 && gapAfterLast < 90) {
        fitOpportunities.push({
          start: `${String(lastAptEnd.getHours()).padStart(2, '0')}:${String(lastAptEnd.getMinutes()).padStart(2, '0')}`,
          end: businessHours.close_time,
          duration: gapAfterLast
        })
      }
    }

    setIdleSlots(idleGaps)
    setFitSlots(fitOpportunities)
  }

  /**
   * Get occupation color based on rate
   */
  const getOccupationColor = () => {
    if (occupationRate >= 70) return { bg: 'from-green-500 to-emerald-600', text: 'text-green-600 dark:text-green-400' }
    if (occupationRate >= 40) return { bg: 'from-yellow-500 to-orange-500', text: 'text-yellow-600 dark:text-yellow-400' }
    return { bg: 'from-red-500 to-pink-600', text: 'text-red-600 dark:text-red-400' }
  }

  /**
   * Update appointment status
   */
  const updateAppointmentStatus = async (appointmentId, newStatus) => {
    try {
      setUpdatingStatus(appointmentId)

      const { error: updateError } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId)

      if (updateError) throw updateError

      // Reload appointments
      await fetchAppointments()
    } catch (err) {
      console.error('Error updating status:', err)
      setError('Erro ao atualizar status')
    } finally {
      setUpdatingStatus(null)
    }
  }

  /**
   * Mark appointment as subscriber visit (no revenue counted)
   */
  const markAsSubscriber = async (appointmentId) => {
    try {
      setUpdatingStatus(appointmentId)

      const { error: updateError } = await supabase
        .from('appointments')
        .update({ 
          is_subscriber: true,
          status: 'completed'
        })
        .eq('id', appointmentId)

      if (updateError) throw updateError

      // Reload appointments
      await fetchAppointments()
    } catch (err) {
      console.error('Error marking as subscriber:', err)
      setError('Erro ao marcar como assinante')
    } finally {
      setUpdatingStatus(null)
    }
  }

  /**
   * Open appointment details modal
   */
  const openAppointmentModal = (appointment) => {
    setSelectedAppointment(appointment)
    setShowAppointmentModal(true)
  }

  /**
   * Close appointment modal
   */
  const closeAppointmentModal = () => {
    setShowAppointmentModal(false)
    setTimeout(() => setSelectedAppointment(null), 300)
  }

  /**
   * Open block details modal
   */
  const openBlockModal = (block) => {
    setSelectedBlock(block)
    setShowBlockModal(true)
  }

  /**
   * Close block modal
   */
  const closeBlockModal = () => {
    setShowBlockModal(false)
    setTimeout(() => setSelectedBlock(null), 300)
  }

  /**
   * Update appointment status from modal
   */
  const updateAppointmentStatusFromModal = async (appointmentId, newStatus) => {
    await updateAppointmentStatus(appointmentId, newStatus)
    closeAppointmentModal()
  }

  /**
   * Remove time block
   */
  const removeTimeBlock = async (block) => {
    try {
      setUpdatingStatus(block.id)

      const tableName = block.type === 'fixed' ? 'fixed_time_blocks' : 'time_blocks'
      
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .eq('id', block.id)

      if (deleteError) throw deleteError

      // Reload time blocks
      await fetchTimeBlocks()
      closeBlockModal()
    } catch (err) {
      console.error('Error removing time block:', err)
      setError('Erro ao remover bloqueio')
    } finally {
      setUpdatingStatus(null)
    }
  }

  /**
   * Navigate to previous day
   */
  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() - 1)
    setSelectedDate(newDate)
  }

  /**
   * Navigate to today
   */
  const goToToday = () => {
    setSelectedDate(new Date())
  }

  /**
   * Navigate to next day
   */
  const goToNextDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + 1)
    setSelectedDate(newDate)
  }

  /**
   * Generate date range for agenda (5 days ago to 30 days ahead)
   */
  const generateAgendaDates = () => {
    const dates = []
    const today = new Date()
    
    // Start from 5 days ago
    for (let i = -5; i <= 30; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() + i)
      dates.push(date)
    }
    
    return dates
  }

  /**
   * Get status badge styling (Glassmorphism)
   */
  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
      confirmed: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
      completed: 'bg-green-500/10 text-green-400 border border-green-500/20',
      cancelled: 'bg-gray-500/10 text-gray-400 border border-gray-500/20',
      no_show: 'bg-red-500/10 text-red-400 border border-red-500/20'
    }

    const labels = {
      pending: 'Pendente',
      confirmed: 'Confirmado',
      completed: 'Concluído',
      cancelled: 'Cancelado',
      no_show: 'Faltou'
    }

    return {
      className: badges[status] || badges.pending,
      label: labels[status] || status
    }
  }

  /**
   * Format time from ISO string
   */
  const formatTime = (isoString) => {
    const date = new Date(isoString)
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })
  }

  /**
   * Format date for display
   */
  const formatDisplayDate = (date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const compareDate = new Date(date)
    compareDate.setHours(0, 0, 0, 0)
    
    if (compareDate.getTime() === today.getTime()) {
      return 'Hoje'
    }
    
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (compareDate.getTime() === tomorrow.getTime()) {
      return 'Amanhã'
    }
    
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (compareDate.getTime() === yesterday.getTime()) {
      return 'Ontem'
    }
    
    return date.toLocaleDateString('pt-BR', { 
      weekday: 'long',
      day: '2-digit', 
      month: 'long',
      year: 'numeric'
    })
  }

  /**
   * Generate time slots for calendar view (07:00 to 22:00)
   */
  const generateTimeSlots = () => {
    const slots = []
    for (let hour = 7; hour <= 22; hour++) {
      slots.push(`${String(hour).padStart(2, '0')}:00`)
    }
    return slots
  }

  /**
   * Group appointments by time slot and organize in columns (no overlap)
   */
  const organizeAppointmentsInColumns = (slotTime) => {
    const [slotHour] = slotTime.split(':').map(Number)
    
    // Get all appointments that overlap with this hour
    const overlappingAppointments = appointments.filter(apt => {
      const aptStart = new Date(apt.start_time)
      const aptEnd = new Date(apt.end_time)
      const aptStartHour = aptStart.getHours()
      const aptEndHour = aptEnd.getHours()
      const aptEndMinutes = aptEnd.getMinutes()
      
      // Check if appointment overlaps with this hour slot
      return (aptStartHour <= slotHour && (aptEndHour > slotHour || (aptEndHour === slotHour && aptEndMinutes > 0)))
    })
    
    // Group by barber to avoid overlap
    const columns = []
    overlappingAppointments.forEach(apt => {
      // Find if there's already a column for this barber
      let columnIndex = columns.findIndex(col => 
        col.some(a => a.barber_id === apt.barber_id)
      )
      
      if (columnIndex === -1) {
        // Create new column
        columns.push([apt])
      } else {
        // Add to existing column
        columns[columnIndex].push(apt)
      }
    })
    
    return columns
  }

  /**
   * Get time blocks for a specific time slot
   */
  const getBlocksForSlot = (slotTime) => {
    const [slotHour] = slotTime.split(':').map(Number)
    
    return timeBlocks.filter(block => {
      const blockHour = block.start_time.getHours()
      const blockEndHour = block.end_time.getHours()
      return blockHour <= slotHour && blockEndHour > slotHour
    })
  }

  /**
   * Calculate appointment position and height in calendar
   * FIXED: Prevents card overlap by only showing card in slots it actually occupies
   */
  const getAppointmentStyle = (appointment, slotHour) => {
    const startTime = new Date(appointment.start_time)
    const endTime = new Date(appointment.end_time)
    
    const startHour = startTime.getHours()
    const startMinutes = startTime.getMinutes()
    const endHour = endTime.getHours()
    const endMinutes = endTime.getMinutes()
    
    // Calculate top position relative to the slot
    let top = 0
    if (startHour === slotHour) {
      top = (startMinutes / 60) * 100
    }
    
    // Calculate height - ONLY for the portion in THIS slot
    let height = 0
    if (startHour === slotHour && endHour === slotHour) {
      // Starts and ends in same hour
      height = ((endMinutes - startMinutes) / 60) * 100
    } else if (startHour === slotHour) {
      // Starts in this hour, continues to next
      height = ((60 - startMinutes) / 60) * 100
    } else if (endHour === slotHour) {
      // Started in previous hour, ends in this hour
      height = (endMinutes / 60) * 100
    } else if (startHour < slotHour && endHour > slotHour) {
      // Spans through this entire hour
      height = 100
    }
    
    return {
      top: `${top}%`,
      height: `${Math.max(height, 15)}%` // Minimum 15% for visibility
    }
  }

  /**
   * Get barber color for calendar card
   */
  const getBarberColor = (barberColor, status) => {
    if (status === 'no_show') {
      return { bg: '#8B0000', text: 'white' }
    }
    if (status === 'cancelled') {
      return { bg: '#6B7280', text: 'white' }
    }
    
    const color = barberColor || '#3b82f6'
    
    // Completed: darker version
    if (status === 'completed') {
      return { bg: `${color}CC`, text: 'white' }
    }
    
    // Confirmed: normal color
    return { bg: `${color}E6`, text: 'white' }
  }

  /**
   * Check if current time is within this slot (for "now" line)
   */
  const isCurrentTimeInSlot = (slotTime) => {
    const today = new Date()
    const selectedDay = new Date(selectedDate)
    
    // Only show "now" line if viewing today
    if (today.toDateString() !== selectedDay.toDateString()) {
      return { show: false, position: 0 }
    }
    
    const [slotHour] = slotTime.split(':').map(Number)
    const currentHour = currentTime.getHours()
    const currentMinutes = currentTime.getMinutes()
    
    if (currentHour === slotHour) {
      return {
        show: true,
        position: (currentMinutes / 60) * 100
      }
    }
    
    return { show: false, position: 0 }
  }

  /**
   * Format time from ISO string
   */
  const formatTimeShort = (isoString) => {
    const date = new Date(isoString)
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })
  }

  /**
   * Check if slot is outside business hours
   */
  const isOutsideBusinessHours = (slotTime) => {
    if (!businessHours || businessHours.is_closed) return true
    
    const [slotHour] = slotTime.split(':').map(Number)
    const [openHour] = businessHours.open_time.split(':').map(Number)
    const [closeHour] = businessHours.close_time.split(':').map(Number)
    
    return slotHour < openHour || slotHour >= closeHour
  }

  // Loading state
  if (isLoading && !appointments.length) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-400 dark:text-gray-500">Carregando agenda...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Agenda</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 capitalize">
            {formatDisplayDate(selectedDate)}
          </p>
        </div>

        {/* View Toggle, Barber Filter and Today Button */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-[#1A1A1A] rounded-xl p-1 border border-gray-200 dark:border-[#2A2A2A]">
            <button
              onClick={() => setViewMode('list')}
              type="button"
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-[#2A2A2A] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Lista
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              type="button"
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                viewMode === 'calendar'
                  ? 'bg-white dark:bg-[#2A2A2A] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Calendário
            </button>
          </div>
          
          <button
            onClick={goToToday}
            type="button"
            className="px-4 py-2 rounded-xl text-sm font-bold transition-all text-blue-600 bg-blue-100 hover:bg-blue-200 dark:text-blue-400 dark:bg-blue-500/10 dark:hover:bg-blue-500/20"
          >
            Hoje
          </button>
          
          <div className="flex items-center gap-2">
            <label htmlFor="barber-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Profissional:
            </label>
            <select
              id="barber-filter"
              value={selectedBarber}
              onChange={(e) => setSelectedBarber(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos</option>
              {barbers.map((barber) => (
                <option key={barber.id} value={barber.id}>
                  {barber.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-500">{error}</p>
          </div>
        </div>
      )}

      {/* Closed Day Warning */}
      {businessHours?.is_closed && (
        <div className="bg-gray-500/10 border border-gray-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 justify-center">
            <svg className="w-6 h-6 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">Barbearia Fechada neste dia</p>
          </div>
        </div>
      )}

      {/* Business Hours Info */}
      {businessHours && !businessHours.is_closed && (
        <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-blue-800 dark:text-blue-400">
                Horário de funcionamento: {businessHours.open_time} às {businessHours.close_time}
              </p>
            </div>
            {viewMode === 'calendar' && (
              <div className="text-sm font-semibold text-blue-800 dark:text-blue-400">
                {appointments.length} agendamento{appointments.length !== 1 ? 's' : ''} hoje
              </div>
            )}
          </div>
        </div>
      )}

      {/* Horizontal Date Picker */}
      <div className="relative">
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
          {generateAgendaDates().map((date, index) => {
            const isSelected = selectedDate.toDateString() === date.toDateString()
            const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase()
            const dayNumber = date.getDate()
            
            return (
              <button
                key={index}
                type="button"
                onClick={() => setSelectedDate(date)}
                className={`flex-shrink-0 w-16 h-20 rounded-xl flex flex-col items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105'
                    : 'bg-white dark:bg-[#1A1A1A] text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-[#2A2A2A] hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <span className="text-xs font-medium">{dayName}</span>
                <span className="text-2xl font-bold mt-1">{dayNumber}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* CALENDAR VIEW - MOBILE OPTIMIZED */}
      {viewMode === 'calendar' && !businessHours?.is_closed && (
        <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl overflow-hidden">
          {/* Legend - Fixed at top */}
          <div className="border-b border-gray-200 dark:border-[#2A2A2A] p-3 sm:p-4 bg-gray-50 dark:bg-[#0A0A0A]">
            <div className="flex flex-wrap items-center justify-between gap-x-4 sm:gap-x-6 gap-y-2">
              {/* Date Display */}
              <div className="text-sm font-bold text-gray-900 dark:text-white">
                {selectedDate.toLocaleDateString('pt-BR', { 
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                })}
              </div>
              
              {/* Legend */}
              <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-6 gap-y-2 text-xs">
                <span className="text-gray-600 dark:text-gray-400 font-semibold">Legenda:</span>
                {barbers.map(barber => (
                  <div key={barber.id} className="flex items-center gap-1.5">
                    <div 
                      className="w-3 h-3 sm:w-4 sm:h-4 rounded border-2"
                      style={{ 
                        backgroundColor: `${barber.color}E6`,
                        borderColor: barber.color
                      }}
                    />
                    <span className="text-gray-700 dark:text-gray-300 text-xs">{barber.name}</span>
                  </div>
                ))}
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-gray-700 border-2 border-gray-800" />
                  <span className="text-gray-700 dark:text-gray-300 text-xs">Bloqueado</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 rounded border-2" style={{ backgroundColor: '#8B0000', borderColor: '#8B0000' }} />
                  <span className="text-gray-700 dark:text-gray-300 text-xs">Faltou</span>
                </div>
              </div>
            </div>
          </div>

          {/* Calendar Grid - Mobile Optimized */}
          <div className="overflow-x-auto">
            <div className="min-w-full">
              {/* Time Slots */}
              {generateTimeSlots().map((slotTime, index) => {
                const [slotHour] = slotTime.split(':').map(Number)
                const appointmentColumns = organizeAppointmentsInColumns(slotTime)
                const slotsBlocks = getBlocksForSlot(slotTime)
                const nowLine = isCurrentTimeInSlot(slotTime)
                const isOutside = isOutsideBusinessHours(slotTime)
                const totalColumns = Math.max(appointmentColumns.length, 1)
                
                return (
                  <div
                    key={slotTime}
                    className={`flex border-b border-gray-100 dark:border-[#2A2A2A] ${
                      index === 0 ? 'border-t' : ''
                    } ${isOutside ? 'bg-gray-50/50 dark:bg-[#0A0A0A]/50' : ''}`}
                  >
                    {/* Time Label - Mobile: 40px, Desktop: 80px */}
                    <div className="w-10 sm:w-20 flex-shrink-0 p-2 sm:p-4 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-[#2A2A2A] bg-gray-50 dark:bg-[#0A0A0A] sticky left-0 z-30">
                      {slotTime}
                    </div>

                    {/* Appointments Area */}
                    <div className="flex-1 relative min-h-[80px] sm:min-h-[100px]">
                      {/* Dashed line for empty slots */}
                      {appointmentColumns.length === 0 && slotsBlocks.length === 0 && !isOutside && (
                        <div className="absolute inset-0 border-b border-dashed border-gray-200 dark:border-gray-700" style={{ top: '50%' }} />
                      )}

                      {/* Now Line */}
                      {nowLine.show && (
                        <div 
                          className="absolute left-0 right-0 z-40 pointer-events-none"
                          style={{ top: `${nowLine.position}%` }}
                        >
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-red-500 -ml-1.5" />
                            <div className="flex-1 h-0.5 bg-red-500" />
                          </div>
                        </div>
                      )}

                      {/* Time Blocks (Bloqueios) */}
                      {slotsBlocks.map((block, blockIndex) => {
                        const style = getAppointmentStyle(block, slotHour)
                        const durationMinutes = (block.end_time - block.start_time) / (1000 * 60)
                        const isSmallCard = durationMinutes < 30
                        
                        return (
                          <div
                            key={`block-${blockIndex}`}
                            className="absolute left-0 right-0 bg-gray-700 p-1.5 sm:p-2 cursor-pointer z-10 shadow-md rounded-lg"
                            style={{
                              top: style.top,
                              height: style.height
                            }}
                            onClick={() => openBlockModal(block)}
                          >
                            <div className="flex items-center gap-1.5 text-white h-full overflow-hidden">
                              <span className="text-sm flex-shrink-0">🔒</span>
                              <div className="flex-1 min-w-0">
                                {isSmallCard ? (
                                  // Small card: only start time + reason
                                  <span className="font-semibold text-[10px] sm:text-xs truncate block">
                                    {formatTimeShort(block.start_time.toISOString())} • {block.reason || 'Bloqueado'}
                                  </span>
                                ) : (
                                  // Normal card: start - end + reason
                                  <span className="font-semibold text-[11px] sm:text-sm truncate block">
                                    {formatTimeShort(block.start_time.toISOString())} - {formatTimeShort(block.end_time.toISOString())} • {block.reason || 'Bloqueado'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}

                      {/* Appointment Columns (No Overlap) - Mobile Optimized */}
                      <div className="flex h-full" style={{ minWidth: totalColumns > 2 ? `${totalColumns * 150}px` : '100%' }}>
                        {appointmentColumns.length > 0 ? (
                          appointmentColumns.map((column, colIndex) => (
                            <div 
                              key={colIndex}
                              className="relative"
                              style={{ width: `${100 / totalColumns}%`, minWidth: totalColumns > 2 ? '150px' : 'auto' }}
                            >
                              {column.map((appointment) => {
                                const style = getAppointmentStyle(appointment, slotHour)
                                const colors = getBarberColor(appointment.barbers?.color, appointment.status)
                                const durationMinutes = (new Date(appointment.end_time) - new Date(appointment.start_time)) / (1000 * 60)
                                const isSmallCard = durationMinutes < 30
                                
                                // Get barber initials
                                const getBarberInitials = (name) => {
                                  if (!name) return '?'
                                  const parts = name.trim().split(' ')
                                  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
                                  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
                                }
                                
                                return (
                                  <div
                                    key={appointment.id}
                                    className="absolute inset-x-0.5 sm:inset-x-1 rounded-lg p-1.5 sm:p-2 cursor-pointer hover:shadow-xl transition-all z-20 shadow-md overflow-hidden"
                                    style={{
                                      top: style.top,
                                      height: style.height,
                                      backgroundColor: colors.bg,
                                      color: colors.text
                                    }}
                                    onClick={() => {
                                      openAppointmentModal(appointment)
                                    }}
                                  >
                                    <div className="h-full flex items-start justify-between text-white overflow-hidden gap-1">
                                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        {isSmallCard ? (
                                          // Small card: time + name in one line
                                          <div className="text-[10px] sm:text-xs font-semibold truncate leading-tight">
                                            {formatTimeShort(appointment.start_time)} • {appointment.client_name || appointment.customer_name || 'Cliente'}
                                          </div>
                                        ) : (
                                          // Normal card: time on top, name below
                                          <>
                                            <div className="text-[9px] sm:text-xs opacity-75 mb-0.5">
                                              {formatTimeShort(appointment.start_time)}
                                            </div>
                                            <div className="font-bold text-[11px] sm:text-sm truncate leading-tight">
                                              {appointment.client_name || appointment.customer_name || 'Cliente'}
                                            </div>
                                          </>
                                        )}
                                      </div>
                                      
                                      {/* Barber Avatar - Always visible */}
                                      {appointment.barbers?.name && (
                                        <div 
                                          className="flex-shrink-0 rounded-full flex items-center justify-center font-bold text-white shadow-sm"
                                          style={{
                                            width: isSmallCard ? '16px' : '24px',
                                            height: isSmallCard ? '16px' : '24px',
                                            fontSize: isSmallCard ? '7px' : '9px',
                                            backgroundColor: `${appointment.barbers.color}99`
                                          }}
                                        >
                                          {getBarberInitials(appointment.barbers.name)}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          ))
                        ) : (
                          // Empty slot
                          <div className="flex-1 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            {!isOutside && (
                              <button
                                type="button"
                                className="text-xs sm:text-sm text-gray-400 dark:text-gray-600 hover:text-blue-500 dark:hover:text-blue-400 font-medium px-2 sm:px-4 py-1 sm:py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all"
                                onClick={() => {
                                  console.log('Create appointment at:', slotTime)
                                }}
                              >
                                + Adicionar
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Capacity View - Occupation Bar - ONLY IN LIST VIEW */}
      {viewMode === 'list' && businessHours && !businessHours.is_closed && appointments.length > 0 && (
        <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-[2rem] p-6 shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${getOccupationColor().bg}`}>
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Ocupação do Dia</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Capacidade utilizada</p>
              </div>
            </div>
            <button
              onClick={() => setShowCapacityDetails(!showCapacityDetails)}
              className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              {showCapacityDetails ? 'Ocultar' : 'Ver detalhes'}
            </button>
          </div>

          {/* Progress Bar */}
          <div className="relative">
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden backdrop-blur-xl">
              <div
                className={`h-full bg-gradient-to-r ${getOccupationColor().bg} rounded-full transition-all duration-1000 ease-out`}
                style={{ width: `${occupationRate}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className={`text-2xl font-bold ${getOccupationColor().text}`}>
                {occupationRate}%
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {appointments.filter(apt => apt.status === 'confirmed' || apt.status === 'completed').length} agendamentos
              </span>
            </div>
          </div>

          {/* Capacity Details (Expandable) */}
          {showCapacityDetails && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-[#2A2A2A] space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              {/* Idle Slots */}
              {idleSlots.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-4 h-4 text-orange-500" />
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Horários Ociosos ({idleSlots.length})
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {idleSlots.map((slot, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                            <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {slot.start} - {slot.end}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {slot.duration} minutos livres
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-medium text-orange-600 dark:text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full">
                          Sugestão de Promoção
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fit Opportunities */}
              {fitSlots.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-4 h-4 text-blue-500" />
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Oportunidades de Encaixe ({fitSlots.length})
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {fitSlots.map((slot, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                            <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {slot.start} - {slot.end}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {slot.duration} minutos disponíveis
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full">
                          Espaço Ideal
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No gaps message */}
              {idleSlots.length === 0 && fitSlots.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    ✨ Agenda otimizada! Sem horários ociosos significativos.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Appointments Timeline - ONLY IN LIST VIEW */}
      {viewMode === 'list' && (
      <div className="space-y-4">
        {appointments.length === 0 && !businessHours?.is_closed ? (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Nenhum agendamento
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Não há agendamentos para este dia.
            </p>
          </div>
        ) : (
          <>
            {/* Render appointments with gap indicators */}
            {appointments.map((appointment, index) => {
              const statusBadge = getStatusBadge(appointment.status)
              const isUpdating = updatingStatus === appointment.id
              const barberColor = appointment.barbers?.color || '#3b82f6'

              // Calculate gap before this appointment
              let gapIndicator = null
              if (index === 0 && businessHours && !businessHours.is_closed) {
                // Gap from opening to first appointment
                const firstAptTime = new Date(appointment.start_time)
                const [openHour, openMin] = businessHours.open_time.split(':').map(Number)
                const openMinutes = openHour * 60 + openMin
                const firstAptMinutes = firstAptTime.getHours() * 60 + firstAptTime.getMinutes()
                const gapMinutes = firstAptMinutes - openMinutes

                if (gapMinutes >= 90) {
                  gapIndicator = (
                    <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                          <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            Horário Ocioso - {businessHours.open_time} às {formatTime(appointment.start_time)}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {gapMinutes} minutos livres • Sugestão de Promoção
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                } else if (gapMinutes >= 30) {
                  gapIndicator = (
                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                          <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            Espaço de Encaixe Ideal - {businessHours.open_time} às {formatTime(appointment.start_time)}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {gapMinutes} minutos disponíveis
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                }
              } else if (index > 0) {
                // Gap between appointments
                const prevAppointment = appointments[index - 1]
                const prevEnd = new Date(prevAppointment.start_time)
                prevEnd.setMinutes(prevEnd.getMinutes() + (prevAppointment.services?.duration_minutes || 0))
                
                const currentStart = new Date(appointment.start_time)
                const gapMinutes = Math.floor((currentStart - prevEnd) / (1000 * 60))

                if (gapMinutes >= 90) {
                  gapIndicator = (
                    <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                          <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            Horário Ocioso - {formatTime(prevEnd.toISOString())} às {formatTime(appointment.start_time)}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {gapMinutes} minutos livres • Sugestão de Promoção
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                } else if (gapMinutes >= 30) {
                  gapIndicator = (
                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                          <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            Espaço de Encaixe Ideal - {formatTime(prevEnd.toISOString())} às {formatTime(appointment.start_time)}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {gapMinutes} minutos disponíveis
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                }
              }

              return (
                <div key={appointment.id}>
                  {/* Gap Indicator */}
                  {gapIndicator}

                  {/* Appointment Card */}
                  <div
                    className="bg-white dark:bg-[#1A1A1A] border border-gray-100 dark:border-[#2A2A2A] shadow-sm dark:shadow-none rounded-2xl overflow-hidden hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                  >
                    {/* Colored left border - 4px for premium look */}
                    <div className="flex">
                      <div 
                        className="w-1 flex-shrink-0" 
                        style={{ 
                          width: '4px',
                          backgroundColor: barberColor 
                        }}
                      />
                      
                      <div className="flex-1 p-5">
                        <div className="flex flex-col gap-4">
                          {/* Top Row: Time, Client Info, Price, Status */}
                          <div className="flex flex-col sm:flex-row items-start gap-4">
                            {/* Left: Time and Client Info */}
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              {/* Time Badge */}
                              <div className="flex-shrink-0 text-center">
                                <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white whitespace-nowrap">
                                  {formatTime(appointment.start_time)}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-500 whitespace-nowrap">
                                  {Math.round((new Date(appointment.end_time) - new Date(appointment.start_time)) / (1000 * 60))} min
                                </div>
                              </div>

                              {/* Client and Service Info */}
                              <div className="flex-1 min-w-0">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white break-words">
                                  {appointment.client_name}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 break-words">
                                  {appointment.service_name || appointment.services?.name || 'Serviço não especificado'}
                                </p>
                                
                                {/* Barber Badge with Color */}
                                {appointment.barbers?.name && (
                                  <div className="mt-2">
                                    <span 
                                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border"
                                      style={{
                                        color: barberColor,
                                        backgroundColor: `${barberColor}1A`,
                                        borderColor: `${barberColor}33`
                                      }}
                                    >
                                      {appointment.barbers.name}
                                    </span>
                                  </div>
                                )}
                                
                                {appointment.client_phone && (
                                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2 break-all">
                                    📱 {appointment.client_phone}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Right: Price and Status */}
                            <div className="flex flex-col items-end gap-2 flex-shrink-0 w-full sm:w-auto">
                              {/* Price */}
                              <div className="text-lg sm:text-xl font-bold text-green-400 whitespace-nowrap">
                                {new Intl.NumberFormat('pt-BR', { 
                                  style: 'currency', 
                                  currency: 'BRL' 
                                }).format(appointment.price || appointment.services?.price || 0)}
                              </div>

                              {/* Status Badge */}
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge.className} whitespace-nowrap`}>
                                {statusBadge.label}
                              </span>

                              {/* Subscriber Badge */}
                              {appointment.is_subscriber && (
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 whitespace-nowrap">
                                  ⭐ Assinante
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Bottom Row: Action Buttons */}
                          {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3 border-t border-gray-100 dark:border-[#2A2A2A]">
                              {appointment.status !== 'no_show' && (
                                <>
                                  <button
                                    onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                                    disabled={isUpdating}
                                    type="button"
                                    className="w-full sm:w-auto text-green-400 bg-green-400/10 hover:bg-green-400/20 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-xl text-sm font-bold transition-all"
                                  >
                                    {isUpdating ? '...' : 'Concluir'}
                                  </button>
                                  <button
                                    onClick={() => updateAppointmentStatus(appointment.id, 'no_show')}
                                    disabled={isUpdating}
                                    type="button"
                                    className="w-full sm:w-auto text-red-400 bg-red-400/10 hover:bg-red-400/20 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-xl text-sm font-bold transition-all"
                                  >
                                    {isUpdating ? '...' : 'Faltou'}
                                  </button>
                                </>
                              )}
                              {appointment.status === 'no_show' && (
                                <button
                                  onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                                  disabled={isUpdating}
                                  type="button"
                                  className="w-full sm:w-auto text-blue-400 bg-blue-400/10 hover:bg-blue-400/20 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-xl text-sm font-bold transition-all"
                                >
                                  {isUpdating ? '...' : 'Restaurar'}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>
      )}

      {/* Summary Footer */}
      {appointments.length > 0 && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-semibold">{appointments.length}</span> agendamento(s) no dia
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Total: <span className="font-bold text-lg">
                {new Intl.NumberFormat('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL' 
                }).format(
                  appointments
                    .filter(apt => apt.status === 'completed' && !apt.is_subscriber)
                    .reduce((sum, apt) => sum + (apt.services?.price || 0), 0)
                )}
              </span> (concluídos)
              {appointments.some(apt => apt.is_subscriber) && (
                <span className="ml-2 text-xs text-indigo-400">
                  • Assinantes não contabilizados
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Appointment Details Modal */}
      {showAppointmentModal && selectedAppointment && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3"
          onClick={closeAppointmentModal}
        >
          <div 
            className="bg-white dark:bg-[#1A1A1A] rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-[#2A2A2A] overflow-hidden max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-[#2A2A2A]">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Detalhes do Agendamento
              </h3>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              {/* Client Name */}
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Cliente</label>
                <p className="text-base font-bold text-gray-900 dark:text-white mt-0.5">
                  {selectedAppointment.client_name || selectedAppointment.customer_name || 'Cliente'}
                </p>
              </div>

              {/* Phone */}
              {selectedAppointment.client_phone && (
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Telefone</label>
                  <div className="flex gap-2 mt-1">
                    <a
                      href={`tel:${selectedAppointment.client_phone}`}
                      className="flex-1 px-3 py-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-semibold hover:bg-blue-500/20 transition-all text-center"
                    >
                      📞 Ligar
                    </a>
                    <a
                      href={`https://wa.me/55${selectedAppointment.client_phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-3 py-2 bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg text-sm font-semibold hover:bg-green-500/20 transition-all text-center"
                    >
                      💬 WhatsApp
                    </a>
                  </div>
                </div>
              )}

              {/* Service */}
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Serviço</label>
                <p className="text-sm text-gray-900 dark:text-white mt-0.5">
                  {selectedAppointment.service_name || selectedAppointment.services?.name || 'Serviço não especificado'}
                </p>
              </div>

              {/* Time and Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Horário</label>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">
                    {formatTime(selectedAppointment.start_time)}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Duração</label>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">
                    {Math.round((new Date(selectedAppointment.end_time) - new Date(selectedAppointment.start_time)) / (1000 * 60))} min
                  </p>
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Valor</label>
                <p className="text-xl font-bold text-green-500 dark:text-green-400 mt-0.5">
                  {new Intl.NumberFormat('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL' 
                  }).format(selectedAppointment.price || selectedAppointment.services?.price || 0)}
                </p>
              </div>

              {/* Barber */}
              {selectedAppointment.barbers?.name && (
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Barbeiro</label>
                  <div className="flex items-center gap-2 mt-1">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-md"
                      style={{ backgroundColor: selectedAppointment.barbers.color }}
                    >
                      {selectedAppointment.barbers.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {selectedAppointment.barbers.name}
                    </span>
                  </div>
                </div>
              )}

              {/* Status */}
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</label>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-1 ${getStatusBadge(selectedAppointment.status).className}`}>
                  {getStatusBadge(selectedAppointment.status).label}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-gray-200 dark:border-[#2A2A2A] flex flex-col gap-2">
              {selectedAppointment.status !== 'completed' && selectedAppointment.status !== 'cancelled' && (
                <>
                  {selectedAppointment.status !== 'no_show' && (
                    <>
                      <button
                        onClick={() => updateAppointmentStatusFromModal(selectedAppointment.id, 'completed')}
                        disabled={updatingStatus === selectedAppointment.id}
                        type="button"
                        className="w-full px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold transition-all disabled:opacity-50 text-sm"
                      >
                        {updatingStatus === selectedAppointment.id ? 'Atualizando...' : '✓ Concluir'}
                      </button>
                      <button
                        onClick={() => updateAppointmentStatusFromModal(selectedAppointment.id, 'no_show')}
                        disabled={updatingStatus === selectedAppointment.id}
                        type="button"
                        className="w-full px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-all disabled:opacity-50 text-sm"
                      >
                        {updatingStatus === selectedAppointment.id ? 'Atualizando...' : '✗ Faltou'}
                      </button>
                    </>
                  )}
                </>
              )}
              <button
                onClick={closeAppointmentModal}
                type="button"
                className="w-full px-4 py-2.5 bg-gray-200 dark:bg-[#2A2A2A] hover:bg-gray-300 dark:hover:bg-[#3A3A3A] text-gray-900 dark:text-white rounded-xl font-bold transition-all text-sm"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block Details Modal */}
      {showBlockModal && selectedBlock && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3"
          onClick={closeBlockModal}
        >
          <div 
            className="bg-white dark:bg-[#1A1A1A] rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-[#2A2A2A] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-[#2A2A2A]">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                🔒 Bloqueio de Horário
              </h3>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              {/* Time Range */}
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Horário</label>
                <p className="text-base font-bold text-gray-900 dark:text-white mt-0.5">
                  {formatTime(selectedBlock.start_time.toISOString())} - {formatTime(selectedBlock.end_time.toISOString())}
                </p>
              </div>

              {/* Reason */}
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Motivo</label>
                <p className="text-sm text-gray-900 dark:text-white mt-0.5">
                  {selectedBlock.reason || 'Sem motivo especificado'}
                </p>
              </div>

              {/* Barber */}
              {selectedBlock.barber_id && (
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Barbeiro</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-0.5">
                    {barbers.find(b => b.id === selectedBlock.barber_id)?.name || 'Barbeiro não encontrado'}
                  </p>
                </div>
              )}

              {/* Type */}
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Tipo</label>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-1 ${
                  selectedBlock.type === 'fixed' 
                    ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20'
                    : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                }`}>
                  {selectedBlock.type === 'fixed' ? 'Bloqueio Fixo (Recorrente)' : 'Bloqueio Pontual'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-gray-200 dark:border-[#2A2A2A] flex flex-col gap-2">
              <button
                onClick={() => removeTimeBlock(selectedBlock)}
                disabled={updatingStatus === selectedBlock.id}
                type="button"
                className="w-full px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-all disabled:opacity-50 text-sm"
              >
                {updatingStatus === selectedBlock.id ? 'Removendo...' : '🗑️ Remover Bloqueio'}
              </button>
              <button
                onClick={closeBlockModal}
                type="button"
                className="w-full px-4 py-2.5 bg-gray-200 dark:bg-[#2A2A2A] hover:bg-gray-300 dark:hover:bg-[#3A3A3A] text-gray-900 dark:text-white rounded-xl font-bold transition-all text-sm"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
