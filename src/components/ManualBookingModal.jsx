import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { showToast } from '../components/Toast'
import { X, Search, Plus } from 'lucide-react'

export default function ManualBookingModal({ 
  isOpen, 
  onClose, 
  barbershopId,
  prefilledDate = null,
  prefilledTime = null,
  prefilledBarberId = null,
  onSuccess
}) {
  const [clientSearch, setClientSearch] = useState('')
  const [selectedClient, setSelectedClient] = useState(null)
  const [showNewClientForm, setShowNewClientForm] = useState(false)
  const [newClientName, setNewClientName] = useState('')
  const [newClientPhone, setNewClientPhone] = useState('')
  const [selectedBarberId, setSelectedBarberId] = useState(prefilledBarberId || '')
  const [selectedServices, setSelectedServices] = useState([])
  const [selectedDate, setSelectedDate] = useState(prefilledDate || new Date())
  const [selectedTime, setSelectedTime] = useState(prefilledTime || '')
  const [observation, setObservation] = useState('')
  const [clients, setClients] = useState([])
  const [barbers, setBarbers] = useState([])
  const [services, setServices] = useState([])
  const [businessHours, setBusinessHours] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [searchResults, setSearchResults] = useState([])

  // Update states when props change
  useEffect(() => {
    if (isOpen) {
      setSelectedDate(prefilledDate || new Date())
      setSelectedTime(prefilledTime || '')
      setSelectedBarberId(prefilledBarberId || '')
      setError(null)
    } else {
      // Reset form when modal closes
      setClientSearch('')
      setSelectedClient(null)
      setShowNewClientForm(false)
      setNewClientName('')
      setNewClientPhone('')
      setSelectedServices([])
      setObservation('')
      setError(null)
    }
  }, [isOpen, prefilledDate, prefilledTime, prefilledBarberId])

  useEffect(() => {
    if (isOpen && barbershopId) {
      fetchBarbers()
      fetchBusinessHours()
    }
  }, [isOpen, barbershopId])

  useEffect(() => {
    if (selectedBarberId) {
      fetchServices()
    }
  }, [selectedBarberId])

  useEffect(() => {
    if (clientSearch.length >= 2) {
      searchClients()
    } else {
      setSearchResults([])
    }
  }, [clientSearch])

  const fetchBarbers = async () => {
    try {
      const { data, error } = await supabase
        .from('barbers')
        .select('id, name, color')
        .eq('barbershop_id', barbershopId)
        .order('name', { ascending: true });
      
      if (error) throw error;
      setBarbers(data || []);
    } catch (err) {
      console.error('Error fetching barbers:', err);
    }
  }

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('barbershop_id', barbershopId)
        .eq('barber_id', selectedBarberId)
        .order('name', { ascending: true })
      if (error) throw error
      setServices(data || [])
    } catch (err) {
      console.error('Error fetching services:', err)
    }
  }

  const fetchBusinessHours = async () => {
    try {
      const dayOfWeek = selectedDate.getDay()
      const { data, error } = await supabase
        .from('business_hours')
        .select('*')
        .eq('barbershop_id', barbershopId)
        .eq('day_of_week', dayOfWeek)
        .maybeSingle()
      if (error) throw error
      setBusinessHours(data)
    } catch (err) {
      console.error('Error fetching business hours:', err)
    }
  }

  const searchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('client_name, client_phone')
        .eq('barbershop_id', barbershopId)
        .or(`client_name.ilike.%${clientSearch}%,client_phone.ilike.%${clientSearch}%`)
        .limit(10)
      if (error) throw error
      const uniqueClients = []
      const seen = new Set()
      data.forEach(apt => {
        const key = `${apt.client_name}-${apt.client_phone}`
        if (!seen.has(key)) {
          seen.add(key)
          uniqueClients.push({ name: apt.client_name, phone: apt.client_phone })
        }
      })
      setSearchResults(uniqueClients)
    } catch (err) {
      console.error('Error searching clients:', err)
    }
  }

  const getTotalDuration = () => {
    return selectedServices.reduce((total, service) => total + service.duration_minutes, 0)
  }

  const getTotalPrice = () => {
    return selectedServices.reduce((total, service) => total + service.price, 0)
  }

  const calculateEndTime = () => {
    if (!selectedTime) return ''
    const [hours, minutes] = selectedTime.split(':').map(Number)
    const totalMinutes = getTotalDuration()
    const endDate = new Date(selectedDate)
    endDate.setHours(hours, minutes + totalMinutes, 0, 0)
    return endDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false })
  }

  const validateForm = () => {
    if (!selectedClient && !showNewClientForm) {
      setError('Selecione um cliente ou cadastre um novo')
      return false
    }
    if (showNewClientForm && (!newClientName.trim() || !newClientPhone.trim())) {
      setError('Preencha nome e telefone do cliente')
      return false
    }
    if (showNewClientForm) {
      const phoneNumbers = newClientPhone.replace(/\D/g, '')
      if (phoneNumbers.length < 10 || phoneNumbers.length > 11) {
        setError('Telefone inválido. Use o formato (XX) XXXXX-XXXX')
        return false
      }
    }
    if (!selectedBarberId) {
      setError('Selecione um barbeiro')
      return false
    }
    if (selectedServices.length === 0) {
      setError('Selecione pelo menos um serviço')
      return false
    }
    if (!selectedTime) {
      setError('Selecione um horário')
      return false
    }
    if (businessHours && !businessHours.is_closed) {
      const [hours] = selectedTime.split(':').map(Number)
      const [openHour] = businessHours.open_time.split(':').map(Number)
      const [closeHour] = businessHours.close_time.split(':').map(Number)
      if (hours < openHour || hours >= closeHour) {
        setError('Horário fora do expediente')
        return false
      }
      const endTime = calculateEndTime()
      const [endHour] = endTime.split(':').map(Number)
      if (endHour > closeHour || (endHour === closeHour && endTime.split(':')[1] !== '00')) {
        setError('O agendamento ultrapassa o horário de fechamento')
        return false
      }
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    console.log('🔵 Iniciando salvamento do agendamento manual...')
    
    if (!validateForm()) {
      console.log('❌ Validação falhou')
      return
    }
    
    try {
      setIsSubmitting(true)
      setError(null)
      
      const [hours, minutes] = selectedTime.split(':').map(Number)
      const startTime = new Date(selectedDate)
      startTime.setHours(hours, minutes, 0, 0)
      const totalDuration = getTotalDuration()
      const endTime = new Date(startTime)
      endTime.setMinutes(endTime.getMinutes() + totalDuration)
      
      console.log('📅 Data/Hora:', {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: totalDuration
      })
      
      // Check for conflicts
      const { data: existingAppointments, error: checkError } = await supabase
        .from('appointments')
        .select('id')
        .eq('barber_id', selectedBarberId)
        .gte('start_time', startTime.toISOString())
        .lt('start_time', endTime.toISOString())
        .in('status', ['pending', 'confirmed'])
      
      if (checkError) {
        console.error('❌ Erro ao verificar conflitos:', checkError)
        throw checkError
      }
      
      if (existingAppointments && existingAppointments.length > 0) {
        console.log('⚠️ Conflito de horário detectado')
        setError('Já existe um agendamento neste horário')
        setIsSubmitting(false)
        return
      }
      
      const clientName = showNewClientForm ? newClientName.trim() : selectedClient.name
      const clientPhone = showNewClientForm ? newClientPhone.trim() : selectedClient.phone
      const servicesNames = selectedServices.map(s => s.name).join(' + ')
      const totalPrice = getTotalPrice()
      
      const appointmentData = {
        barbershop_id: barbershopId,
        barber_id: selectedBarberId,
        service_id: selectedServices[0].id,
        service_name: servicesNames,
        client_name: clientName,
        client_phone: clientPhone,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: 'confirmed',
        price: totalPrice
      }
      
      console.log('💾 Salvando agendamento:', appointmentData)
      
      const { data: newAppointment, error: createError } = await supabase
        .from('appointments')
        .insert(appointmentData)
        .select()
      
      if (createError) {
        console.error('❌ Erro ao criar agendamento:', createError)
        throw createError
      }
      
      console.log('✅ Agendamento criado com sucesso!', newAppointment)
      
      // Show success message
      showToast.success(
        'Agendamento criado com sucesso! O horário já está bloqueado.',
        '✅ Agendamento Confirmado'
      )
      
      // Call success callback to refresh calendar
      if (onSuccess) {
        console.log('🔄 Atualizando calendário...')
        onSuccess()
      }
      
      // Close modal
      onClose()
    } catch (err) {
      console.error('❌ Erro ao criar agendamento:', err)
      setError('Erro ao criar agendamento. Tente novamente.')
      showToast.error(
        'Não foi possível criar o agendamento. Verifique os dados e tente novamente.',
        '❌ Erro ao Salvar'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleService = (service) => {
    setSelectedServices(prev => {
      const isSelected = prev.find(s => s.id === service.id)
      if (isSelected) {
        return prev.filter(s => s.id !== service.id)
      } else {
        return [...prev, service]
      }
    })
  }

  const selectClient = (client) => {
    setSelectedClient(client)
    setClientSearch('')
    setSearchResults([])
    setShowNewClientForm(false)
  }

  const showNewClient = () => {
    setShowNewClientForm(true)
    setSelectedClient(null)
    setClientSearch('')
    setSearchResults([])
  }

  const formatPhoneNumber = (value) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 2) {
      return numbers
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
    } else if (numbers.length <= 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
    }
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
  }

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value)
    setNewClientPhone(formatted)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-[2.5rem] w-full max-w-2xl shadow-2xl my-8">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-[#2A2A2A]">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Novo Agendamento Manual</h2>
          <button onClick={onClose} className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all active:scale-95">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
          <div>
            <label className="block text-[10px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mb-2">Cliente *</label>
            {!selectedClient && !showNewClientForm ? (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="text" value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} placeholder="Buscar por nome ou telefone..." className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all" />
                </div>
                {searchResults.length > 0 && (
                  <div className="mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                    {searchResults.map((client, index) => (
                      <button key={index} type="button" onClick={() => selectClient(client)} className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-b-0">
                        <p className="font-semibold text-gray-900 dark:text-white">{client.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{client.phone}</p>
                      </button>
                    ))}
                  </div>
                )}
                <button type="button" onClick={showNewClient} className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl font-semibold hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all">
                  <Plus className="w-5 h-5" />Novo Cliente
                </button>
              </>
            ) : selectedClient ? (
              <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{selectedClient.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedClient.phone}</p>
                </div>
                <button type="button" onClick={() => setSelectedClient(null)} className="text-gray-500 hover:text-red-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <input type="text" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} placeholder="Nome completo" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all" required />
                <input type="tel" value={newClientPhone} onChange={handlePhoneChange} placeholder="(00) 00000-0000" maxLength="15" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all" required />
                <button type="button" onClick={() => setShowNewClientForm(false)} className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">← Voltar para busca</button>
              </div>
            )}
          </div>
          <div>
            <label htmlFor="barber" className="block text-[10px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mb-2">Barbeiro *</label>
            <select id="barber" value={selectedBarberId} onChange={(e) => setSelectedBarberId(e.target.value)} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white font-semibold focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all" required>
              <option value="">Selecione um barbeiro</option>
              {barbers.map((barber) => (
                <option key={barber.id} value={barber.id}>{barber.name}</option>
              ))}
            </select>
          </div>
          {selectedBarberId && (
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mb-2">Serviço(s) *</label>
              {services.length === 0 ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">Nenhum serviço cadastrado para este barbeiro</p>
              ) : (
                <div className="space-y-2">
                  {services.map((service) => {
                    const isSelected = selectedServices.find(s => s.id === service.id)
                    return (
                      <button key={service.id} type="button" onClick={() => toggleService(service)} className={`w-full p-4 rounded-xl border-2 transition-all text-left ${isSelected ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-500' : 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{service.name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{service.duration_minutes} min • R$ {service.price.toFixed(2)}</p>
                          </div>
                          {isSelected && (
                            <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
              {selectedServices.length > 0 && (
                <div className="mt-3 p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-300">Total:</span>
                    <span className="font-bold text-gray-900 dark:text-white">{getTotalDuration()} min • R$ {getTotalPrice().toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className="block text-[10px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mb-2">Data *</label>
              <input id="date" type="date" value={selectedDate.toISOString().split('T')[0]} onChange={(e) => setSelectedDate(new Date(e.target.value + 'T00:00:00'))} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white font-semibold focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all" required />
            </div>
            <div>
              <label htmlFor="time" className="block text-[10px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mb-2">Horário *</label>
              <input id="time" type="time" value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white font-semibold focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all" required />
            </div>
          </div>
          {selectedTime && selectedServices.length > 0 && (
            <div className="text-sm text-gray-600 dark:text-gray-400">Término previsto: {calculateEndTime()}</div>
          )}
          <div>
            <label htmlFor="observation" className="block text-[10px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mb-2">Observação (opcional)</label>
            <textarea id="observation" value={observation} onChange={(e) => setObservation(e.target.value)} placeholder="Ex: Cliente pediu degradê mais fechado" rows="3" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none" />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full font-semibold transition-all active:scale-95" disabled={isSubmitting}>Cancelar</button>
            <button type="submit" className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full font-semibold shadow-lg shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>Criando...
                </span>
              ) : 'Confirmar Agendamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
