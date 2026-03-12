import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { showToast } from '../components/Toast'
import { Plus, Edit2, Trash2, X } from 'lucide-react'

export default function ServicosPage() {
  const [services, setServices] = useState([])
  const [barbers, setBarbers] = useState([])
  const [loading, setLoading] = useState(true)
  const [barbershopId, setBarbershopId] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingService, setEditingService] = useState(null)
  const [selectedBarberFilter, setSelectedBarberFilter] = useState('all')
  const [formData, setFormData] = useState({
    name: '',
    duration_minutes: '',
    price: '',
    barber_id: '',
    description: ''
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchBarbershopAndServices()
  }, [])

  const fetchBarbershopAndServices = async () => {
    try {
      setLoading(true)

      // 1. Buscar o usuário autenticado
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        console.error('Erro ao buscar usuário:', userError)
        return
      }

      // 2. Buscar o barber vinculado ao profile_id
      const { data: barberData, error: barberError } = await supabase
        .from('barbers')
        .select('barbershop_id')
        .eq('profile_id', user.id)
        .maybeSingle()

      if (barberError) {
        console.error('Erro ao buscar barbeiro:', barberError)
        return
      }

      if (!barberData) {
        console.error('Usuário não está vinculado a uma barbearia')
        return
      }

      setBarbershopId(barberData.barbershop_id)

      // 3. Buscar todos os barbeiros da equipe COM FOTO E COR
      const { data: barbersData, error: barbersError } = await supabase
        .from('barbers')
        .select('id, name, color, avatar_url, commission_percentage')
        .eq('barbershop_id', barberData.barbershop_id)
        .order('name', { ascending: true })

      if (barbersError) {
        console.error('Erro ao buscar barbeiros:', barbersError)
      } else {
        console.log('🔍 BARBEIROS CARREGADOS:', barbersData)
        setBarbers(barbersData || [])
      }

      // 4. Buscar os serviços da barbearia com informação do barbeiro
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*, barbers(id, name, color, avatar_url)')
        .eq('barbershop_id', barberData.barbershop_id)
        .order('name', { ascending: true })

      if (servicesError) {
        console.error('Erro ao buscar serviços:', servicesError)
        return
      }

      console.log('🔍 SERVIÇOS CARREGADOS:', servicesData)
      setServices(servicesData || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const openModal = (service = null) => {
    if (service) {
      setEditingService(service)
      setFormData({
        name: service.name,
        duration_minutes: service.duration_minutes.toString(),
        price: service.price.toString(),
        barber_id: service.barber_id || '',
        description: service.description || ''
      })
    } else {
      setEditingService(null)
      setFormData({
        name: '',
        duration_minutes: '',
        price: '',
        barber_id: '',
        description: ''
      })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingService(null)
    setFormData({
      name: '',
      duration_minutes: '',
      price: '',
      barber_id: '',
      description: ''
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name || !formData.duration_minutes || !formData.price || !formData.barber_id) {
      showToast.warning(
        'Preencha todos os campos obrigatórios para continuar.',
        'Campos Obrigatórios'
      )
      return
    }

    try {
      setIsSaving(true)

      const serviceData = {
        name: formData.name.trim(),
        duration_minutes: parseInt(formData.duration_minutes),
        price: parseFloat(formData.price),
        barbershop_id: barbershopId,
        barber_id: formData.barber_id,
        description: formData.description.trim() || null
      }

      if (editingService) {
        // UPDATE
        const { error } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', editingService.id)

        if (error) throw error
      } else {
        // INSERT
        const { error } = await supabase
          .from('services')
          .insert([serviceData])

        if (error) throw error
      }

      // Recarregar lista de serviços
      await fetchBarbershopAndServices()
      
      showToast.success(
        editingService ? 'Serviço atualizado com sucesso!' : 'Novo serviço criado com sucesso!',
        editingService ? 'Serviço Atualizado' : 'Serviço Criado'
      )
      
      closeModal()
    } catch (error) {
      console.error('Erro ao salvar serviço:', error)
      showToast.error(
        'Não foi possível salvar o serviço. Verifique os dados e tente novamente.',
        'Erro ao Salvar'
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (service) => {
    const confirmDelete = window.confirm(
      `Tem certeza que deseja excluir o serviço "${service.name}"?`
    )

    if (!confirmDelete) return

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', service.id)

      if (error) throw error

      // Recarregar lista de serviços
      await fetchBarbershopAndServices()
      showToast.success(
        'Serviço excluído com sucesso!',
        'Serviço Excluído'
      )
    } catch (error) {
      console.error('Erro ao excluir serviço:', error)
      showToast.error(
        'Não foi possível excluir o serviço. Tente novamente.',
        'Erro ao Excluir'
      )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  // Agrupar serviços por barbeiro
  const groupedServices = services.reduce((acc, service) => {
    const barberId = service.barber_id
    if (!acc[barberId]) {
      acc[barberId] = {
        barber: service.barbers,
        services: []
      }
    }
    acc[barberId].services.push(service)
    return acc
  }, {})

  // Filtrar por barbeiro selecionado
  const filteredGroups = selectedBarberFilter === 'all' 
    ? groupedServices 
    : { [selectedBarberFilter]: groupedServices[selectedBarberFilter] }

  // Opções de duração (em minutos) - de 10 min até 3 horas
  const durationOptions = [
    10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, // até 1h
    90, 120, 150, 180 // 1h30, 2h, 2h30, 3h
  ]

  return (
    <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen overflow-x-hidden max-w-full">
      <div className="max-w-7xl mx-auto max-w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Serviços & Preços</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Gerencie os serviços oferecidos pela sua barbearia</p>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full font-semibold shadow-lg shadow-blue-500/30 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Novo Serviço
          </button>
        </div>

        {/* Segmented Control - Filtro por Barbeiro */}
        {barbers.length > 1 && (
          <div className="mb-8 -mx-4 sm:mx-0 px-4 sm:px-0">
            <div className="overflow-x-auto scrollbar-hide">
              <div className="inline-flex bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-full p-1.5 shadow-sm min-w-min">
                <button
                  onClick={() => setSelectedBarberFilter('all')}
                  className={`px-4 sm:px-6 py-2.5 rounded-full font-semibold text-sm transition-all whitespace-nowrap ${
                    selectedBarberFilter === 'all'
                      ? 'bg-white dark:bg-white text-gray-900 shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Todos
                </button>
                {barbers.map((barber) => (
                  <button
                    key={barber.id}
                    onClick={() => setSelectedBarberFilter(barber.id)}
                    className={`px-4 sm:px-6 py-2.5 rounded-full font-semibold text-sm transition-all whitespace-nowrap ${
                      selectedBarberFilter === barber.id
                        ? 'bg-white dark:bg-white text-gray-900 shadow-md'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {barber.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Lista de Serviços Agrupados por Barbeiro */}
        {services.length === 0 ? (
          <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-[2rem] p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Nenhum serviço cadastrado
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Comece adicionando o primeiro serviço da sua barbearia
              </p>
              <button
                onClick={() => openModal()}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full font-semibold shadow-lg shadow-blue-500/30 transition-all active:scale-95"
              >
                <Plus className="w-5 h-5" />
                Cadastrar Primeiro Serviço
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-10">
            {Object.entries(filteredGroups).map(([barberId, group]) => {
              if (!group || !group.barber) return null
              
              const barber = group.barber
              const barberColor = barber.color || '#3b82f6'
              const avatarUrl = barber.avatar_url // DIRETO DA TABELA BARBERS
              
              console.log('🖼️ RENDERIZANDO BARBEIRO:', {
                name: barber.name,
                avatarUrl: avatarUrl,
                color: barberColor
              })
              
              // Gerar iniciais do nome
              const initials = barber.name
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)

              return (
                <div key={barberId} className="space-y-6">
                  {/* Barber Header */}
                  <div className="flex items-center gap-4">
                    {/* Avatar com Foto Real */}
                    <div className="relative flex-shrink-0">
                      {avatarUrl ? (
                        <img 
                          src={avatarUrl} 
                          alt={barber.name}
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-lg"
                        />
                      ) : (
                        <div 
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-white dark:border-gray-800 shadow-lg"
                          style={{ backgroundColor: barberColor }}
                        >
                          {initials}
                        </div>
                      )}
                    </div>
                    
                    {/* Nome */}
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                        {barber.name}
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {group.services.length} {group.services.length === 1 ? 'serviço' : 'serviços'}
                      </p>
                    </div>
                  </div>

                  {/* Grid de Serviços */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {group.services.map((service) => (
                      <div
                        key={service.id}
                        className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl p-4 sm:p-6 hover:border-gray-300 dark:hover:border-[#3A3A3A] transition-all hover:shadow-lg dark:hover:shadow-none relative overflow-hidden group"
                        style={{ borderLeftWidth: '4px', borderLeftColor: barberColor }}
                      >
                        {/* Header do Card */}
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                              {service.name}
                            </h3>
                            {service.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                {service.description}
                              </p>
                            )}
                          </div>
                          
                          {/* Botões de Ação */}
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openModal(service)}
                              className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                              aria-label="Editar serviço"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(service)}
                              className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                              aria-label="Excluir serviço"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Informações do Serviço */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Duração:</span>
                            <span className="text-gray-900 dark:text-white font-semibold">
                              {service.duration_minutes} min
                            </span>
                          </div>
                          
                          <div className="pt-3 border-t border-gray-200 dark:border-[#2A2A2A]">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Preço:</span>
                              <span className="text-green-600 dark:text-green-400 font-bold text-xl">
                                {new Intl.NumberFormat('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL'
                                }).format(service.price)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-[2.5rem] w-full max-w-md shadow-2xl my-8">
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-[#2A2A2A]">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingService ? 'Editar Serviço' : 'Novo Serviço'}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all active:scale-95"
                  aria-label="Fechar modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto">
                {/* Profissional */}
                <div>
                  <label htmlFor="barber" className="block text-[10px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mb-2">
                    Profissional *
                  </label>
                  <select
                    id="barber"
                    value={formData.barber_id}
                    onChange={(e) => setFormData({ ...formData, barber_id: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white font-semibold focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    disabled={isSaving}
                    required
                  >
                    <option value="">Selecione um profissional</option>
                    {barbers.map((barber) => (
                      <option key={barber.id} value={barber.id}>
                        {barber.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Nome do Serviço */}
                <div>
                  <label htmlFor="name" className="block text-[10px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mb-2">
                    Nome do Serviço *
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Corte Masculino"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white font-semibold placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    disabled={isSaving}
                    required
                  />
                </div>

                {/* Descrição do Serviço */}
                <div>
                  <label htmlFor="description" className="block text-[10px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mb-2">
                    Descrição (opcional)
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value.length <= 200) {
                        setFormData({ ...formData, description: value })
                      }
                    }}
                    placeholder="Ex: Corte tesoura com acabamento na navalha e lavagem inclusa"
                    rows="3"
                    maxLength="200"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                    disabled={isSaving}
                  />
                  <div className="flex justify-end mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formData.description.length}/200
                    </span>
                  </div>
                </div>

                {/* Duração - Seletor Apple Style */}
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mb-3">
                    Duração *
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {durationOptions.map((duration) => {
                      const isSelected = formData.duration_minutes === duration.toString()
                      
                      // Formatar exibição da duração
                      let displayText
                      if (duration < 60) {
                        displayText = `${duration} min`
                      } else {
                        const hours = Math.floor(duration / 60)
                        const minutes = duration % 60
                        if (minutes === 0) {
                          displayText = `${hours}h`
                        } else {
                          displayText = `${hours}h ${minutes}m`
                        }
                      }
                      
                      return (
                        <button
                          key={duration}
                          type="button"
                          onClick={() => setFormData({ ...formData, duration_minutes: duration.toString() })}
                          disabled={isSaving}
                          className={`px-3 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 scale-105'
                              : 'bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400'
                          }`}
                        >
                          {displayText}
                          {isSelected && (
                            <svg className="w-3 h-3 inline-block ml-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      )
                    })}
                  </div>
                  {!formData.duration_minutes && (
                    <p className="text-xs text-red-500 dark:text-red-400 mt-2">
                      Selecione uma duração
                    </p>
                  )}
                </div>

                {/* Preço */}
                <div>
                  <label htmlFor="price" className="block text-[10px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mb-2">
                    Preço (R$) *
                  </label>
                  <input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="Ex: 35.00"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white font-semibold placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    disabled={isSaving}
                    required
                  />
                </div>

                {/* Botões */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full font-semibold transition-all active:scale-95"
                    disabled={isSaving}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full font-semibold shadow-lg shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Salvando...
                      </span>
                    ) : (
                      editingService ? 'Salvar Alterações' : 'Criar Serviço'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
