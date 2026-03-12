import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { generateAvailableSlots } from '../utils/timeSlots'
import { useHaptic } from '../hooks/useHaptic'
import BarberInfo from '../components/BarberInfo'
import ServiceCard from '../components/ServiceCard'
import HorizontalCalendar from '../components/HorizontalCalendar'
import TimeSlotButton from '../components/TimeSlotButton'

/**
 * BookingPage Component
 * 
 * Main orchestrator for the booking flow. Manages all state and coordinates
 * sub-components for barber info, service selection, date/time selection,
 * and booking confirmation.
 * 
 * Requirements: 2.1, 3.1, 4.1, 5.1, 6.1
 */
export default function BookingPage() {
  const { barberId } = useParams()
  const haptic = useHaptic()

  // State management
  const [barber, setBarber] = useState(null)
  const [services, setServices] = useState([])
  const [selectedServices, setSelectedServices] = useState([]) // Mudado para array
  const [selectedDate, setSelectedDate] = useState(null)
  const [availableSlots, setAvailableSlots] = useState([])
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [businessHours, setBusinessHours] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  // Fetch barber and services on mount
  useEffect(() => {
    const fetchBarberAndServices = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Fetch barber data - usando apenas colunas que existem
        const { data: barberData, error: barberError } = await supabase
          .from('barbers')
          .select('*')
          .eq('id', barberId)
          .single()

        if (barberError) {
          console.error('Erro ao buscar barbeiro:', barberError)
          throw barberError
        }

        if (!barberData) {
          setError('Barbeiro não encontrado. Verifique o link.')
          setIsLoading(false)
          return
        }

        console.log('Dados do barbeiro:', barberData)

        // Fetch profile (user) data for name and avatar
        let profileName = 'Barbeiro'
        let profileAvatar = null
        if (barberData.profile_id) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', barberData.profile_id)
            .single()
          
          console.log('Dados do profile:', profileData, profileError)
          
          if (profileData) {
            profileName = profileData.name || profileData.full_name || 'Barbeiro'
            profileAvatar = profileData.avatar_url
          }
        }

        // Fetch barbershop name if barbershop_id exists
        let barbershopName = 'Barbearia'
        let barbershopLogo = null
        let barbershopBanner = null
        if (barberData.barbershop_id) {
          const { data: barbershopData } = await supabase
            .from('barbershops')
            .select('name, logo_url, banner_url')
            .eq('id', barberData.barbershop_id)
            .single()
          
          if (barbershopData) {
            barbershopName = barbershopData.name
            barbershopLogo = barbershopData.logo_url
            barbershopBanner = barbershopData.banner_url
          }
        }

        // Transform barber data to match component interface
        const transformedBarber = {
          id: barberData.id,
          name: profileName,
          avatar_url: profileAvatar,
          barbershop_name: barbershopName,
          barbershop_id: barberData.barbershop_id,
          barbershop_logo: barbershopLogo,
          barbershop_banner: barbershopBanner
        }

        console.log('Barbeiro transformado:', transformedBarber)

        setBarber(transformedBarber)

        // Fetch services for this barbershop
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('*')
          .eq('barbershop_id', barberData.barbershop_id)
          .order('price', { ascending: true })

        console.log('🔍 Serviços encontrados RAW:', servicesData, servicesError)

        if (servicesError) throw servicesError

        // Transformar serviços para o formato esperado
        const transformedServices = (servicesData || []).map(service => {
          console.log('🔍 Serviço individual:', {
            id: service.id,
            name: service.name,
            description: service.description,
            hasDescription: !!service.description
          })
          
          return {
            id: service.id,
            name: service.name,
            duration: service.duration_minutes,
            price: service.price,
            description: service.description
          }
        })

        console.log('✅ Serviços transformados FINAL:', transformedServices)

        setServices(transformedServices)
        setIsLoading(false)
      } catch (err) {
        console.error('Error fetching barber and services:', err)
        setError('Não foi possível conectar. Verifique sua conexão.')
        setIsLoading(false)
      }
    }

    if (barberId) {
      fetchBarberAndServices()
    }
  }, [barberId])

  // Fetch business hours and available slots when date and service change
  useEffect(() => {
    const loadData = async () => {
      if (selectedDate && barber?.barbershop_id) {
        // Busca os horários e recebe o valor de retorno real
        const hours = await fetchBusinessHours()
        
        // Passa esse valor diretamente para a busca de slots
        if (selectedServices.length > 0 && hours) {
          await fetchAvailableSlots(hours)
        }
      } else {
        // Limpa slots se não houver data ou barbershop
        setAvailableSlots([])
        setBusinessHours(null)
      }
    }
    
    loadData()
  }, [selectedDate, selectedServices, barberId, barber?.barbershop_id])

  // Function to fetch business hours for selected date
  const fetchBusinessHours = async () => {
    if (!selectedDate || !barber?.barbershop_id) {
      setBusinessHours(null)
      return null
    }

    try {
      const dayOfWeek = selectedDate.getDay()
      
      console.log('Buscando horários para:', {
        barbershop_id: barber.barbershop_id,
        day_of_week: dayOfWeek,
        date: selectedDate
      })
      
      const { data, error: hoursError } = await supabase
        .from('business_hours')
        .select('*')
        .eq('barbershop_id', barber.barbershop_id)
        .eq('day_of_week', dayOfWeek)
        .maybeSingle()

      if (hoursError) throw hoursError

      console.log('Horários encontrados:', data)
      
      setBusinessHours(data)

      // If day is closed, clear slots
      if (data?.is_closed) {
        console.log('Dia fechado! Limpando slots.')
        setAvailableSlots([])
        setSelectedSlot(null)
      }
      
      // IMPORTANTE: Retorna o dado para uso imediato
      return data
    } catch (err) {
      console.error('Error fetching business hours:', err)
      return null
    }
  }

  // Function to fetch available slots (extracted for reuse)
  const fetchAvailableSlots = async (currentHours) => {
    // Se o parâmetro não veio, tenta usar o estado (fallback)
    const hoursToUse = currentHours || businessHours
    
    if (!selectedDate || selectedServices.length === 0) {
      setAvailableSlots([])
      setIsLoadingSlots(false)
      return
    }

    // Check if day is closed before fetching slots
    if (hoursToUse?.is_closed) {
      console.log('Dia fechado (via parâmetro)! Não gerando slots.')
      setAvailableSlots([])
      setIsLoadingSlots(false)
      return
    }

    try {
      setIsLoadingSlots(true)
      
      // Calcular duração total dos serviços selecionados
      const totalDuration = getTotalDuration()
      
      // Format date range for the selected day
      const startOfDay = new Date(selectedDate)
      startOfDay.setHours(0, 0, 0, 0)
      
      const endOfDay = new Date(selectedDate)
      endOfDay.setHours(23, 59, 59, 999)

      // MISSÃO 2: Fetch existing appointments for this date
      // Incluir completed e no_show para bloquear horários que já foram usados
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('start_time, end_time')
        .eq('barber_id', barberId)
        .gte('start_time', startOfDay.toISOString())
        .lte('start_time', endOfDay.toISOString())
        .in('status', ['pending', 'confirmed', 'completed', 'no_show'])

      if (appointmentsError) throw appointmentsError

      // Transform appointments to time format (HH:mm) - CORRIGIDO para timezone local
      const transformedAppointments = (appointments || []).map(apt => {
        const startDate = new Date(apt.start_time)
        const endDate = new Date(apt.end_time)
        
        return {
          start_time: startDate.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: false,
            timeZone: 'America/Sao_Paulo' // Força timezone do Brasil
          }),
          end_time: endDate.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: false,
            timeZone: 'America/Sao_Paulo' // Força timezone do Brasil
          })
        }
      })

      console.log('Appointments encontrados:', transformedAppointments)

      // MISSÃO 3: Buscar bloqueios fixos (recorrentes)
      const { data: fixedBlocks, error: fixedBlocksError } = await supabase
        .from('fixed_time_blocks')
        .select('barber_id, start_time, end_time')
        .eq('barbershop_id', barber.barbershop_id)
        .or(`barber_id.is.null,barber_id.eq.${barberId}`)

      if (fixedBlocksError) throw fixedBlocksError

      console.log('🔒 Bloqueios fixos encontrados:', fixedBlocks)

      // MISSÃO 4: Buscar bloqueios pontuais (data específica)
      const { data: oneTimeBlocks, error: oneTimeBlocksError } = await supabase
        .from('time_blocks')
        .select('barber_id, start_time, end_time')
        .eq('barbershop_id', barber.barbershop_id)
        .gte('start_time', startOfDay.toISOString())
        .lte('start_time', endOfDay.toISOString())
        .or(`barber_id.is.null,barber_id.eq.${barberId}`)

      if (oneTimeBlocksError) throw oneTimeBlocksError

      console.log('📅 Bloqueios pontuais encontrados:', oneTimeBlocks)

      // USA OS HORÁRIOS VINDOS DO BANCO, NÃO OS HARDCODED
      const openTime = hoursToUse?.open_time || '09:00'
      const closeTime = hoursToUse?.close_time || '18:00'
      
      console.log('Gerando slots com horários:', {
        openTime,
        closeTime,
        totalDuration,
        hoursToUse,
        isClosed: hoursToUse?.is_closed,
        fixedBlocksCount: fixedBlocks?.length || 0,
        oneTimeBlocksCount: oneTimeBlocks?.length || 0
      })
      
      const dateStr = selectedDate.toISOString().split('T')[0]
      const slots = generateAvailableSlots(
        dateStr,
        totalDuration, // Usa duração total dos serviços
        transformedAppointments,
        openTime,
        closeTime,
        fixedBlocks || [], // Bloqueios fixos
        oneTimeBlocks || [], // Bloqueios pontuais
        barberId // ID do barbeiro
      )

      console.log('Slots gerados:', slots.length, slots)

      setAvailableSlots(slots)
      setSelectedSlot(null) // Reset selected slot when slots change
    } catch (err) {
      console.error('Error fetching available slots:', err)
      setError('Não foi possível carregar os horários disponíveis.')
    } finally {
      setIsLoadingSlots(false)
    }
  }

  // Cálculos automáticos para múltiplos serviços
  const getTotalDuration = () => {
    return selectedServices.reduce((total, service) => total + (service.duration || 0), 0)
  }

  const getTotalPrice = () => {
    return selectedServices.reduce((total, service) => total + (service.price || 0), 0)
  }

  // Handle service selection (múltipla)
  const handleServiceSelect = (service) => {
    console.log('Selecionando serviço:', service.name)
    console.log('Serviços antes:', selectedServices.map(s => s.name))
    
    setSelectedServices(prev => {
      const isSelected = prev.find(s => s.id === service.id)
      if (isSelected) {
        // Remove se já está selecionado
        console.log('Removendo serviço:', service.name)
        return prev.filter(s => s.id !== service.id)
      } else {
        // Adiciona se não está selecionado
        console.log('Adicionando serviço:', service.name)
        return [...prev, service]
      }
    })
    setSelectedSlot(null) // Reset slot when services change
  }

  // Handle date selection
  const handleDateSelect = (date) => {
    setSelectedDate(date)
    setSelectedSlot(null) // Reset slot when date changes
  }

  // Handle slot selection
  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot)
  }

  // Check if form can be submitted
  const canSubmit = () => {
    return (
      selectedServices.length > 0 &&
      selectedDate &&
      selectedSlot &&
      clientName.trim().length >= 3 &&
      clientPhone.trim().length >= 10
    )
  }

  // Handle booking submission
  const handleSubmit = async () => {
    if (!canSubmit() || isSubmitting) return

    // Validate client data
    if (clientName.trim().length < 3) {
      haptic.error()
      setError('Por favor, digite seu nome completo.')
      return
    }

    if (clientPhone.trim().length < 10) {
      haptic.error()
      setError('Por favor, digite um telefone válido.')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      // Create start_time timestamp
      const [hours, minutes] = selectedSlot.time.split(':').map(Number)
      const startTime = new Date(selectedDate)
      startTime.setHours(hours, minutes, 0, 0)

      // Calcular tempo e valor total
      const totalDuration = getTotalDuration()
      const totalPrice = getTotalPrice()

      // Create end_time timestamp
      const endTime = new Date(startTime)
      endTime.setMinutes(endTime.getMinutes() + totalDuration)

      // Check if slot is still available (prevent race conditions)
      const { data: existingAppointments } = await supabase
        .from('appointments')
        .select('id')
        .eq('barber_id', barberId)
        .gte('start_time', startTime.toISOString())
        .lt('start_time', endTime.toISOString())
        .in('status', ['pending', 'confirmed'])

      if (existingAppointments && existingAppointments.length > 0) {
        haptic.error()
        setError('Este horário não está mais disponível. Por favor, escolha outro.')
        setSelectedSlot(null)
        setIsSubmitting(false)
        return
      }

      // Criar string com nomes dos serviços separados por " + "
      const servicesNames = selectedServices.map(s => s.name).join(' + ')

      // Create appointment with client name and phone
      // Salva o primeiro serviço no service_id e todos os nomes no service_name
      const { data, error: createError } = await supabase
        .from('appointments')
        .insert({
          barbershop_id: barber.barbershop_id,
          barber_id: barberId,
          service_id: selectedServices[0].id, // Primeiro serviço como referência
          service_name: servicesNames, // Todos os serviços concatenados
          client_name: clientName.trim(),
          client_phone: clientPhone.trim(),
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          status: 'confirmed',
          price: totalPrice // Salva o preço total
        })
        .select()
        .single()

      if (createError) {
        console.error('Erro ao criar appointment:', createError)
        throw createError
      }

      console.log('Appointment criado:', data)

      // Success!
      haptic.success()
      setSuccess(true)
      setIsSubmitting(false)

      // Recarregar horários disponíveis imediatamente
      await fetchAvailableSlots()

      // Reset form after success
      setTimeout(() => {
        setSelectedServices([])
        setSelectedDate(null)
        setSelectedSlot(null)
        setClientName('')
        setClientPhone('')
        setSuccess(false)
      }, 3000)
    } catch (err) {
      console.error('Error creating appointment:', err)
      haptic.error()
      setError('Não foi possível confirmar o agendamento. Tente novamente.')
      setIsSubmitting(false)
    }
  }

  // Retry handler for errors
  const handleRetry = () => {
    setError(null)
    window.location.reload()
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-900 dark:text-white">Carregando...</p>
        </div>
      </div>
    )
  }

  // Error state with retry
  if (error && !barber) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Ops!</h2>
          <p className="text-gray-900 dark:text-white mb-6">{error}</p>
          <button
            onClick={handleRetry}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Success Message */}
        {success && (
          <div className="bg-green-600 text-white p-4 rounded-lg shadow-lg">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <h3 className="font-semibold">Agendamento confirmado!</h3>
                <p className="text-sm text-green-100">Seu horário foi reservado com sucesso.</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && barber && (
          <div className="bg-red-600 text-white p-4 rounded-lg shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-white hover:text-gray-200"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Barber Info */}
        {barber && <BarberInfo barber={barber} />}

        {/* Services Section */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Escolha os serviços</h3>
          {services.length === 0 ? (
            <p className="text-gray-900 dark:text-white text-center py-8">Nenhum serviço disponível</p>
          ) : (
            <div className="space-y-3">
              {services.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  isSelected={selectedServices.some(s => s.id === service.id)}
                  onSelect={handleServiceSelect}
                />
              ))}
            </div>
          )}
        </div>

        {/* Resumo dos Serviços Selecionados */}
        {selectedServices.length > 0 && (
          <div className="bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
            <h4 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-3">
              Resumo da Seleção
            </h4>
            <div className="space-y-2">
              {selectedServices.map((service, index) => (
                <div key={service.id} className="flex justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">
                    {index + 1}. {service.name}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {service.duration}min • R$ {service.price.toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="border-t border-indigo-200 dark:border-indigo-700 pt-2 mt-2">
                <div className="flex justify-between font-bold text-indigo-900 dark:text-indigo-100">
                  <span>Total</span>
                  <span>{getTotalDuration()}min • R$ {getTotalPrice().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Calendar Section */}
        {selectedServices.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Escolha a data</h3>
            <HorizontalCalendar
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              daysToShow={14}
            />
          </div>
        )}

        {/* Time Slots Section */}
        {selectedServices.length > 0 && selectedDate && (
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Escolha o horário</h3>
            
            {/* Loading Skeleton */}
            {isLoadingSlots ? (
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg p-3 animate-pulse">
                  <div className="h-4 bg-blue-200 dark:bg-blue-500/20 rounded w-3/4 mx-auto"></div>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                  ))}
                </div>
              </div>
            ) : businessHours?.is_closed ? (
              <div className="bg-gray-500/10 border border-gray-500/30 rounded-2xl p-8 text-center">
                <svg className="w-12 h-12 text-gray-500 dark:text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Barbearia Fechada
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  A barbearia não funciona neste dia. Por favor, escolha outra data.
                </p>
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
                <p className="text-gray-900 dark:text-white">
                  Nenhum horário disponível
                </p>
                {businessHours && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Horário de funcionamento: {businessHours.open_time} às {businessHours.close_time}
                  </p>
                )}
              </div>
            ) : (
              <>
                {businessHours && (
                  <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-800 dark:text-blue-400 text-center">
                      Horário de funcionamento: {businessHours.open_time} às {businessHours.close_time}
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {availableSlots.map((slot, index) => (
                    <TimeSlotButton
                      key={index}
                      slot={slot}
                      isSelected={selectedSlot?.time === slot.time}
                      onSelect={handleSlotSelect}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Booking Form */}
        {selectedServices.length > 0 && selectedDate && selectedSlot && (
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Confirmar agendamento</h3>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-900 dark:text-white">
                  <span>Serviços:</span>
                  <span className="font-semibold text-right">
                    {selectedServices.map(s => s.name).join(' + ')}
                  </span>
                </div>
                <div className="flex justify-between text-gray-900 dark:text-white">
                  <span>Data:</span>
                  <span className="font-semibold">
                    {selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex justify-between text-gray-900 dark:text-white">
                  <span>Horário:</span>
                  <span className="font-semibold">{selectedSlot.time}</span>
                </div>
                <div className="flex justify-between text-gray-900 dark:text-white">
                  <span>Duração Total:</span>
                  <span className="font-semibold">{getTotalDuration()} min</span>
                </div>
                <div className="flex justify-between text-gray-900 dark:text-white text-lg pt-4 border-t border-gray-200 dark:border-gray-700">
                  <span>Total:</span>
                  <span className="font-bold">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(getTotalPrice())}
                  </span>
                </div>
              </div>

              {/* Client Information Form */}
              <div className="space-y-4 mb-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Seus dados</h4>
                
                {/* Name Input */}
                <div>
                  <label htmlFor="clientName" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Nome completo
                  </label>
                  <input
                    id="clientName"
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Digite seu nome"
                    className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Phone Input */}
                <div>
                  <label htmlFor="clientPhone" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    WhatsApp
                  </label>
                  <input
                    id="clientPhone"
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !canSubmit()}
                className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-all duration-200 ${
                  isSubmitting || !canSubmit()
                    ? 'bg-gray-700 cursor-not-allowed opacity-50'
                    : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]'
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg 
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" 
                      xmlns="http://www.w3.org/2000/svg" 
                      fill="none" 
                      viewBox="0 0 24 24"
                    >
                      <circle 
                        className="opacity-25" 
                        cx="12" 
                        cy="12" 
                        r="10" 
                        stroke="currentColor" 
                        strokeWidth="4"
                      />
                      <path 
                        className="opacity-75" 
                        fill="currentColor" 
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Agendando...
                  </span>
                ) : (
                  'Confirmar Agendamento'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
