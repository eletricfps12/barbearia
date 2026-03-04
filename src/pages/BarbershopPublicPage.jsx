import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { generateAvailableSlots } from '../utils/timeSlots'

/**
 * BarbershopPublicPage Component - Premium Mobile-First Design
 * 
 * Single Page Application para agendamento completo:
 * 1. Escolha do Profissional
 * 2. Escolha do Serviço (filtrado por barbeiro)
 * 3. Escolha da Data
 * 4. Escolha do Horário
 * 5. Confirmação com dados do cliente
 */
export default function BarbershopPublicPage() {
  const { slug } = useParams()

  // Data states
  const [barbershop, setBarbershop] = useState(null)
  const [barbers, setBarbers] = useState([])
  const [allServices, setAllServices] = useState([])
  
  // Selection states
  const [selectedBarber, setSelectedBarber] = useState(null)
  const [selectedService, setSelectedService] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [businessHours, setBusinessHours] = useState(null)
  
  // Form states
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  
  // UI states
  const [availableSlots, setAvailableSlots] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [confirmedBooking, setConfirmedBooking] = useState(null)

  // Fetch barbershop data on mount
  useEffect(() => {
    if (slug) {
      fetchBarbershopData()
    }
  }, [slug])

  // Fetch available slots when dependencies change
  useEffect(() => {
    if (selectedBarber && selectedService && selectedDate) {
      fetchAvailableSlots()
    } else {
      setAvailableSlots([])
      setSelectedSlot(null)
    }
  }, [selectedBarber, selectedService, selectedDate])

  // Body scroll lock (Compatível com iOS)
  useEffect(() => {
    if (selectedSlot) {
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }
  }, [selectedSlot])

  /**
   * Fetch barbershop, barbers, and services
   */
  const fetchBarbershopData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // 1. Fetch barbershop by slug
      const { data: barbershopData, error: barbershopError } = await supabase
        .from('barbershops')
        .select('id, name, logo_url, banner_url, contact_phone, address')
        .eq('slug', slug)
        .single()

      if (barbershopError) throw barbershopError

      if (!barbershopData) {
        setError('Barbearia não encontrada')
        setIsLoading(false)
        return
      }

      setBarbershop(barbershopData)

      // 2. Fetch all barbers
      const { data: barbersData, error: barbersError } = await supabase
        .from('barbers')
        .select('id, name, avatar_url, bio')
        .eq('barbershop_id', barbershopData.id)
        .order('name', { ascending: true })

      if (barbersError) throw barbersError

      setBarbers(barbersData || [])

      // 3. Fetch all services
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('barbershop_id', barbershopData.id)
        .order('price', { ascending: true })

      if (servicesError) throw servicesError

      setAllServices(servicesData || [])
      setIsLoading(false)
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Não foi possível carregar os dados')
      setIsLoading(false)
    }
  }

  /**
   * Fetch available time slots
   */
  const fetchAvailableSlots = async () => {
    if (!selectedDate || !selectedService || !selectedBarber) {
      setAvailableSlots([])
      return
    }

    try {
      // 1. Buscar horários de funcionamento do banco
      const dayOfWeek = selectedDate.getDay()
      
      const { data: businessHours, error: hoursError } = await supabase
        .from('business_hours')
        .select('*')
        .eq('barbershop_id', barbershop.id)
        .eq('day_of_week', dayOfWeek)
        .maybeSingle()

      if (hoursError) throw hoursError

      // 2. Verificar se a barbearia está fechada neste dia
      if (!businessHours || businessHours.is_closed) {
        setBusinessHours(businessHours)
        setAvailableSlots([])
        return
      }

      // Salvar business hours no estado
      setBusinessHours(businessHours)

      // 3. Buscar appointments existentes
      const startOfDay = new Date(selectedDate)
      startOfDay.setHours(0, 0, 0, 0)
      
      const endOfDay = new Date(selectedDate)
      endOfDay.setHours(23, 59, 59, 999)

      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('start_time, end_time')
        .eq('barber_id', selectedBarber.id)
        .gte('start_time', startOfDay.toISOString())
        .lte('start_time', endOfDay.toISOString())
        .in('status', ['pending', 'confirmed', 'completed', 'no_show'])

      if (appointmentsError) throw appointmentsError

      // 4. Transformar appointments para formato de hora
      const transformedAppointments = (appointments || []).map(apt => {
        const startDate = new Date(apt.start_time)
        const endDate = new Date(apt.end_time)
        
        return {
          start_time: startDate.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: false,
            timeZone: 'America/Sao_Paulo'
          }),
          end_time: endDate.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: false,
            timeZone: 'America/Sao_Paulo'
          })
        }
      })

      // 5. Extrair open_time e close_time do banco (formato: "HH:mm:ss" ou "HH:mm")
      const openTime = businessHours.open_time.substring(0, 5) // "09:00:00" -> "09:00"
      const closeTime = businessHours.close_time.substring(0, 5) // "18:00:00" -> "18:00"

      console.log('Gerando slots com horários do banco:', {
        dayOfWeek,
        openTime,
        closeTime,
        isClosed: businessHours.is_closed
      })

      // 6. Gerar slots disponíveis usando horários reais do banco
      const dateStr = selectedDate.toISOString().split('T')[0]
      const slots = generateAvailableSlots(
        dateStr,
        selectedService.duration_minutes,
        transformedAppointments,
        openTime,
        closeTime
      )

      console.log('Slots gerados:', slots.length, slots)

      setAvailableSlots(slots)
      setSelectedSlot(null)
    } catch (err) {
      console.error('Error fetching slots:', err)
      setError('Erro ao carregar horários')
    }
  }

  /**
   * Handle barber selection
   */
  const handleBarberSelect = (barber) => {
    setSelectedBarber(barber)
    setSelectedService(null)
    setSelectedDate(null)
    setSelectedSlot(null)
  }

  /**
   * Handle service selection
   */
  const handleServiceSelect = (service) => {
    setSelectedService(service)
    setSelectedDate(null)
    setSelectedSlot(null)
  }

  /**
   * Handle date selection
   */
  const handleDateSelect = (date) => {
    setSelectedDate(date)
    setSelectedSlot(null)
  }

  /**
   * Handle slot selection
   */
  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot)
  }

  /**
   * Handle booking submission
   */
  const handleSubmit = async () => {
    if (!canSubmit() || isSubmitting) return

    if (clientName.trim().length < 3) {
      setError('Digite seu nome completo')
      return
    }

    if (clientPhone.trim().length < 10) {
      setError('Digite um telefone válido')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      // Create timestamps
      const [hours, minutes] = selectedSlot.time.split(':').map(Number)
      const startTime = new Date(selectedDate)
      startTime.setHours(hours, minutes, 0, 0)

      const endTime = new Date(startTime)
      endTime.setMinutes(endTime.getMinutes() + selectedService.duration_minutes)

      // Check availability
      const { data: existingAppointments } = await supabase
        .from('appointments')
        .select('id')
        .eq('barber_id', selectedBarber.id)
        .gte('start_time', startTime.toISOString())
        .lt('start_time', endTime.toISOString())
        .in('status', ['pending', 'confirmed'])

      if (existingAppointments && existingAppointments.length > 0) {
        setError('Horário não disponível. Escolha outro.')
        setSelectedSlot(null)
        setIsSubmitting(false)
        return
      }

      // Create appointment
      const { error: createError } = await supabase
        .from('appointments')
        .insert({
          barbershop_id: barbershop.id,
          barber_id: selectedBarber.id,
          service_id: selectedService.id,
          client_name: clientName.trim(),
          client_phone: clientPhone.trim(),
          client_email: clientEmail.trim() || null,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          status: 'confirmed'
        })

      if (createError) throw createError

      // Success! Save booking data for thank you page
      setConfirmedBooking({
        barber: selectedBarber,
        service: selectedService,
        date: selectedDate,
        time: selectedSlot.time,
        clientName: clientName.trim()
      })
      
      setIsSubmitting(false)

      // Reload slots
      await fetchAvailableSlots()
    } catch (err) {
      console.error('Error creating appointment:', err)
      setError('Erro ao confirmar agendamento')
      setIsSubmitting(false)
    }
  }

  /**
   * Check if form can be submitted
   */
  const canSubmit = () => {
    return (
      selectedBarber &&
      selectedService &&
      selectedDate &&
      selectedSlot &&
      clientName.trim().length >= 3 &&
      clientPhone.trim().length >= 10
    )
  }

  /**
   * Get filtered services for selected barber
   */
  const getFilteredServices = () => {
    if (!selectedBarber) return []
    return allServices.filter(service => service.barber_id === selectedBarber.id)
  }

  /**
   * Generate date options (next 14 days)
   */
  const generateDateOptions = () => {
    const dates = []
    const today = new Date()
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() + i)
      dates.push(date)
    }
    
    return dates
  }

  /**
   * Handle new booking - reset all states
   */
  const handleNewBooking = () => {
    setConfirmedBooking(null)
    setSelectedBarber(null)
    setSelectedService(null)
    setSelectedDate(null)
    setSelectedSlot(null)
    setClientName('')
    setClientPhone('')
    setClientEmail('')
    setError(null)
  }

  /**
   * Get initials from name
   */
  const getInitials = (name) => {
    if (!name) return '?'
    const parts = name.trim().split(' ')
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          <p className="mt-4 text-white">Carregando...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !barbershop) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-white text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-white mb-2">Ops!</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            type="button"
            className="px-6 py-3 bg-white text-black rounded-xl font-semibold"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  const filteredServices = getFilteredServices()
  const dateOptions = generateDateOptions()

  // Thank You Page - Success Screen
  if (confirmedBooking) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-6 text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 animate-fade-in">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
          Agendamento Confirmado!
        </h1>
        <p className="text-xl text-gray-400 mb-8">
          Tudo certo, {confirmedBooking.clientName}.
        </p>

        {/* Receipt Card */}
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6 w-full max-w-md mt-8 text-left space-y-4">
          {/* Barber */}
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Profissional:</span>
            <span className="text-white font-semibold">{confirmedBooking.barber.name}</span>
          </div>

          {/* Service */}
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Serviço:</span>
            <span className="text-white font-semibold">{confirmedBooking.service.name}</span>
          </div>

          {/* Date */}
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Data:</span>
            <span className="text-white font-semibold">
              {confirmedBooking.date.toLocaleDateString('pt-BR', { 
                day: '2-digit', 
                month: 'long',
                year: 'numeric'
              })}
            </span>
          </div>

          {/* Time */}
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Horário:</span>
            <span className="text-white font-semibold">{confirmedBooking.time}</span>
          </div>

          {/* Divider */}
          <div className="border-t border-[#2A2A2A] pt-4">
            {/* Total */}
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-lg">Valor Total:</span>
              <span className="text-white font-bold text-2xl">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(confirmedBooking.service.price)}
              </span>
            </div>
          </div>
        </div>

        {/* New Booking Button */}
        <button
          onClick={handleNewBooking}
          type="button"
          className="mt-8 w-full max-w-md bg-white text-black rounded-xl py-4 font-bold hover:bg-gray-100 transition-colors"
        >
          Fazer Novo Agendamento
        </button>

        {/* Footer Info */}
        <p className="text-gray-500 text-sm mt-8">
          Você receberá uma confirmação em breve
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col overscroll-none">
      {/* Header with Banner */}
      <div className="relative">
        {barbershop?.banner_url ? (
          <div className="relative h-48 sm:h-64">
            <img
              src={barbershop.banner_url}
              alt={barbershop.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0A0A0A]"></div>
          </div>
        ) : (
          <div className="h-32 bg-gradient-to-b from-[#1A1A1A] to-[#0A0A0A]"></div>
        )}
        
        {/* Barbershop Info */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-center gap-4">
            {barbershop?.logo_url && (
              <img
                src={barbershop.logo_url}
                alt={barbershop.name}
                className="w-16 h-16 rounded-full border-2 border-white object-cover"
              />
            )}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                {barbershop?.name}
              </h1>
              {barbershop?.address && (
                <p className="text-gray-400 text-sm mt-1">{barbershop.address}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && barbershop && (
        <div className="fixed top-4 left-4 right-4 bg-red-600 text-white p-4 rounded-xl shadow-lg z-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-white hover:text-gray-200" type="button">
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 px-4 sm:px-6 py-6 space-y-8">
        {/* Step 1: Choose Barber */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Escolha o Profissional</h2>
          <div className="flex gap-4 overflow-x-auto py-4 px-2 scrollbar-hide">
            {barbers.map((barber) => (
              <button
                key={barber.id}
                type="button"
                onClick={() => handleBarberSelect(barber)}
                className={`flex flex-col items-center gap-2 w-24 flex-shrink-0 focus:outline-none [-webkit-tap-highlight-color:transparent] ${
                  selectedBarber?.id === barber.id ? 'relative z-10' : ''
                }`}
              >
                <div className={`w-20 h-20 flex-shrink-0 aspect-square transition-all ${
                  selectedBarber?.id === barber.id
                    ? 'rounded-full ring-2 ring-white ring-offset-2 ring-offset-[#0A0A0A] scale-105'
                    : 'rounded-full'
                }`}>
                  {barber.avatar_url ? (
                    <img
                      src={barber.avatar_url}
                      alt={barber.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-[#1A1A1A] flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">
                        {getInitials(barber.name)}
                      </span>
                    </div>
                  )}
                </div>
                <p className={`text-sm font-medium transition-colors text-center leading-tight ${
                  selectedBarber?.id === barber.id ? 'text-white' : 'text-gray-400'
                }`}>
                  {barber.name}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Choose Service */}
        {selectedBarber && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Escolha o Serviço</h2>
            {filteredServices.length === 0 ? (
              <p className="text-gray-400 text-center py-8">Nenhum serviço disponível para este profissional</p>
            ) : (
              <div className="space-y-3">
                {filteredServices.map((service) => (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => handleServiceSelect(service)}
                    className={`w-full p-4 rounded-xl transition-all ${
                      selectedService?.id === service.id
                        ? 'bg-white text-black'
                        : 'bg-[#1A1A1A] text-white border border-[#2A2A2A]'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="text-left">
                        <h3 className={`font-semibold ${
                          selectedService?.id === service.id ? 'text-black' : 'text-white'
                        }`}>
                          {service.name}
                        </h3>
                        <p className={`text-sm ${
                          selectedService?.id === service.id ? 'text-gray-700' : 'text-gray-400'
                        }`}>
                          {service.duration_minutes} min
                        </p>
                      </div>
                      <div className={`text-lg font-bold ${
                        selectedService?.id === service.id ? 'text-black' : 'text-white'
                      }`}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(service.price)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Choose Date */}
        {selectedService && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Escolha a Data</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {dateOptions.map((date, index) => {
                const isSelected = selectedDate?.toDateString() === date.toDateString()
                const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase()
                const dayNumber = date.getDate()
                
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleDateSelect(date)}
                    className={`flex-shrink-0 w-16 h-20 rounded-xl flex flex-col items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-white text-black'
                        : 'bg-[#1A1A1A] text-gray-400 border border-[#2A2A2A]'
                    }`}
                  >
                    <span className="text-xs font-medium">{dayName}</span>
                    <span className="text-2xl font-bold mt-1">{dayNumber}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 4: Choose Time */}
        {selectedDate && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Escolha o Horário</h2>
            
            {/* Closed Day Message */}
            {businessHours?.is_closed ? (
              <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-8 text-center">
                <svg className="w-12 h-12 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Barbearia Fechada
                </h3>
                <p className="text-gray-400">
                  A barbearia não funciona neste dia. Por favor, escolha outra data.
                </p>
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-8 text-center">
                <p className="text-gray-400">Nenhum horário disponível</p>
                {businessHours && (
                  <p className="text-gray-500 text-sm mt-2">
                    Horário de funcionamento: {businessHours.open_time.substring(0, 5)} às {businessHours.close_time.substring(0, 5)}
                  </p>
                )}
              </div>
            ) : (
              <>
                {businessHours && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mb-4">
                    <p className="text-sm text-blue-400 text-center">
                      Horário de funcionamento: {businessHours.open_time.substring(0, 5)} às {businessHours.close_time.substring(0, 5)}
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {availableSlots.map((slot, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSlotSelect(slot)}
                      className={`py-3 px-4 rounded-xl font-semibold transition-all ${
                        selectedSlot?.time === slot.time
                          ? 'bg-white text-black'
                          : 'bg-[#1A1A1A] text-gray-400 border border-[#2A2A2A]'
                      }`}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Overlay/Backdrop - Blocks background interaction */}
      {selectedSlot && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 transition-opacity touch-none"
          onClick={() => setSelectedSlot(null)}
        />
      )}

      {/* Bottom Sheet - Confirmation */}
      {selectedSlot && (
        <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 shadow-2xl z-40 animate-slide-up overscroll-contain">
          <div className="max-w-2xl mx-auto">
            {/* Header with Close Button */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-black">Confirmar Agendamento</h3>
              <button
                onClick={() => setSelectedSlot(null)}
                type="button"
                className="text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors"
                aria-label="Fechar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Summary */}
            <div className="mb-6">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Profissional:</span>
                  <span className="font-semibold text-black">{selectedBarber.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Serviço:</span>
                  <span className="font-semibold text-black">{selectedService.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Data:</span>
                  <span className="font-semibold text-black">
                    {selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Horário:</span>
                  <span className="font-semibold text-black">{selectedSlot.time}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="text-gray-600">Total:</span>
                  <span className="text-lg font-bold text-black">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedService.price)}
                  </span>
                </div>
              </div>
            </div>

            {/* Client Form */}
            <div className="space-y-4 mb-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nome completo
                </label>
                <input
                  id="name"
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Digite seu nome"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  E-mail <span className="text-gray-400 text-xs">(opcional)</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-gray-500 mt-1">
                  📧 Receba confirmação por e-mail
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              type="button"
              disabled={isSubmitting || !canSubmit()}
              className={`w-full py-4 rounded-xl font-bold text-white transition-all ${
                isSubmitting || !canSubmit()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-black hover:bg-gray-900 active:scale-[0.98]'
              }`}
            >
              {isSubmitting ? 'Confirmando...' : 'Confirmar Agendamento'}
            </button>
          </div>
        </div>
      )}

      {/* Footer - Brio App & Black Sheep Branding */}
      <div className="mt-auto pb-8 flex flex-col items-center justify-center space-y-1 opacity-60 hover:opacity-100 transition-opacity">
        <span className="text-xs font-medium text-gray-400">
          ⚡ Powered by <strong className="text-indigo-500">Brio App</strong>
        </span>
        <span className="text-[10px] text-gray-500">
          Desenvolvido por Black Sheep
        </span>
      </div>
    </div>
  )
}
