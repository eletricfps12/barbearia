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
  
  // Capacity states
  const [occupationRate, setOccupationRate] = useState(0)
  const [idleSlots, setIdleSlots] = useState([])
  const [fitSlots, setFitSlots] = useState([])
  const [showCapacityDetails, setShowCapacityDetails] = useState(false)
  
  // UI states
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updatingStatus, setUpdatingStatus] = useState(null)

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
          barbers(name, color),
          services(name, price, duration_minutes)
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
      return sum + (apt.services?.duration_minutes || 0)
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

        {/* Barber Filter and Today Button */}
        <div className="flex items-center gap-3 flex-wrap">
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
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-blue-800 dark:text-blue-400">
              Horário de funcionamento: {businessHours.open_time} às {businessHours.close_time}
            </p>
          </div>
        </div>
      )}

      {/* Capacity View - Occupation Bar */}
      {businessHours && !businessHours.is_closed && appointments.length > 0 && (
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

      {/* Appointments Timeline */}
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
                          <div className="flex items-start justify-between gap-4">
                            {/* Left: Time and Client Info */}
                            <div className="flex items-start gap-4 flex-1 min-w-0">
                              {/* Time Badge */}
                              <div className="flex-shrink-0 text-center">
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                  {formatTime(appointment.start_time)}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-500">
                                  {appointment.services?.duration_minutes || 0} min
                                </div>
                              </div>

                              {/* Client and Service Info */}
                              <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                                  {appointment.client_name}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                  {appointment.services?.name || 'Serviço não especificado'}
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
                                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                                    📱 {appointment.client_phone}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Right: Price and Status */}
                            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                              {/* Price */}
                              <div className="text-xl font-bold text-gray-900 dark:text-white">
                                {new Intl.NumberFormat('pt-BR', { 
                                  style: 'currency', 
                                  currency: 'BRL' 
                                }).format(appointment.services?.price || 0)}
                              </div>

                              {/* Status Badge */}
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge.className}`}>
                                {statusBadge.label}
                              </span>
                            </div>
                          </div>

                          {/* Bottom Row: Action Buttons */}
                          {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-[#2A2A2A]">
                              {appointment.status !== 'no_show' && (
                                <>
                                  <button
                                    onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                                    disabled={isUpdating}
                                    type="button"
                                    className="text-green-400 bg-green-400/10 hover:bg-green-400/20 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-xl text-sm font-bold transition-all"
                                  >
                                    {isUpdating ? '...' : 'Concluir'}
                                  </button>
                                  <button
                                    onClick={() => updateAppointmentStatus(appointment.id, 'no_show')}
                                    disabled={isUpdating}
                                    type="button"
                                    className="text-red-400 bg-red-400/10 hover:bg-red-400/20 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-xl text-sm font-bold transition-all"
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
                                  className="text-blue-400 bg-blue-400/10 hover:bg-blue-400/20 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-xl text-sm font-bold transition-all"
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
                    .filter(apt => apt.status === 'completed')
                    .reduce((sum, apt) => sum + (apt.services?.price || 0), 0)
                )}
              </span> (concluídos)
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
