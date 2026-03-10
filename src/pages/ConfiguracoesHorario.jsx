import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { showToast } from '../components/Toast'
import { Clock, Lock, Calendar, Save, CheckCircle2, Copy, Plus, X, Edit2, Trash2 } from 'lucide-react'

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo', shortLabel: 'Dom' },
  { value: 1, label: 'Segunda-feira', shortLabel: 'Seg' },
  { value: 2, label: 'Terça-feira', shortLabel: 'Ter' },
  { value: 3, label: 'Quarta-feira', shortLabel: 'Qua' },
  { value: 4, label: 'Quinta-feira', shortLabel: 'Qui' },
  { value: 5, label: 'Sexta-feira', shortLabel: 'Sex' },
  { value: 6, label: 'Sábado', shortLabel: 'Sáb' }
]

export default function ConfiguracoesHorario() {
  // Tab state
  const [activeTab, setActiveTab] = useState('horarios') // 'horarios', 'bloqueios-fixos', 'bloqueios-pontuais'
  
  // Common states
  const [barbershopId, setBarbershopId] = useState(null)
  const [barbers, setBarbers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  
  // Business hours states
  const [businessHours, setBusinessHours] = useState([])
  
  // Fixed blocks states
  const [fixedBlocks, setFixedBlocks] = useState([])
  const [showFixedBlockModal, setShowFixedBlockModal] = useState(false)
  const [editingFixedBlock, setEditingFixedBlock] = useState(null)
  const [fixedBlockBarber, setFixedBlockBarber] = useState('all')
  const [fixedBlockStartTime, setFixedBlockStartTime] = useState('')
  const [fixedBlockEndTime, setFixedBlockEndTime] = useState('')
  const [fixedBlockReason, setFixedBlockReason] = useState('')
  
  // Specific blocks states
  const [specificBlocks, setSpecificBlocks] = useState([])
  const [showSpecificBlockModal, setShowSpecificBlockModal] = useState(false)
  const [specificBlockBarber, setSpecificBlockBarber] = useState('all')
  const [specificBlockDate, setSpecificBlockDate] = useState('')
  const [specificBlockStartTime, setSpecificBlockStartTime] = useState('')
  const [specificBlockEndTime, setSpecificBlockEndTime] = useState('')
  const [specificBlockReason, setSpecificBlockReason] = useState('')

  useEffect(() => {
    fetchBarbershopId()
  }, [])

  useEffect(() => {
    if (barbershopId) {
      fetchBarbers()
      fetchBusinessHours()
      fetchFixedBlocks()
      fetchSpecificBlocks()
    }
  }, [barbershopId])

  const fetchBarbershopId = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: barbershopData } = await supabase
        .from('barbershops')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle()

      if (barbershopData) {
        setBarbershopId(barbershopData.id)
        return
      }

      const { data: barberData } = await supabase
        .from('barbers')
        .select('barbershop_id')
        .eq('profile_id', user.id)
        .single()

      if (barberData) {
        setBarbershopId(barberData.barbershop_id)
      }
    } catch (err) {
      console.error('Error fetching barbershop ID:', err)
    }
  }

  const fetchBarbers = async () => {
    try {
      const { data, error } = await supabase
        .from('barbers')
        .select('id, name')
        .eq('barbershop_id', barbershopId)
        .order('name', { ascending: true })

      if (error) throw error
      setBarbers(data || [])
    } catch (err) {
      console.error('Error fetching barbers:', err)
    }
  }

  const fetchBusinessHours = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('business_hours')
        .select('*')
        .eq('barbershop_id', barbershopId)
        .order('day_of_week', { ascending: true })

      if (error) throw error

      if (!data || data.length === 0) {
        await createDefaultHours()
        return
      }

      setBusinessHours(data)
    } catch (err) {
      console.error('Error fetching business hours:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchFixedBlocks = async () => {
    try {
      const { data, error } = await supabase
        .from('fixed_time_blocks')
        .select(`
          *,
          barbers(name)
        `)
        .eq('barbershop_id', barbershopId)
        .order('start_time', { ascending: true })

      if (error) throw error
      setFixedBlocks(data || [])
    } catch (err) {
      console.error('Error fetching fixed blocks:', err)
    }
  }

  const fetchSpecificBlocks = async () => {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data, error } = await supabase
        .from('time_blocks')
        .select(`
          *,
          barbers(name)
        `)
        .eq('barbershop_id', barbershopId)
        .gte('start_time', today.toISOString())
        .order('start_time', { ascending: true })

      if (error) throw error
      setSpecificBlocks(data || [])
    } catch (err) {
      console.error('Error fetching specific blocks:', err)
    }
  }

  const createDefaultHours = async () => {
    try {
      const defaultHours = DAYS_OF_WEEK.map(day => ({
        barbershop_id: barbershopId,
        day_of_week: day.value,
        is_closed: day.value === 0,
        open_time: '09:00',
        close_time: '18:00'
      }))

      const { data, error } = await supabase
        .from('business_hours')
        .insert(defaultHours)
        .select()

      if (error) throw error
      setBusinessHours(data)
    } catch (err) {
      console.error('Error creating default hours:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleDay = (dayOfWeek) => {
    setBusinessHours(prev =>
      prev.map(hour =>
        hour.day_of_week === dayOfWeek
          ? { ...hour, is_closed: !hour.is_closed }
          : hour
      )
    )
  }

  const handleTimeChange = (dayOfWeek, field, value) => {
    setBusinessHours(prev =>
      prev.map(hour =>
        hour.day_of_week === dayOfWeek
          ? { ...hour, [field]: value }
          : hour
      )
    )
  }

  const copyToAllDays = (dayOfWeek) => {
    const sourceDay = businessHours.find(h => h.day_of_week === dayOfWeek)
    if (!sourceDay) return

    setBusinessHours(prev =>
      prev.map(hour => ({
        ...hour,
        is_closed: sourceDay.is_closed,
        open_time: sourceDay.open_time,
        close_time: sourceDay.close_time
      }))
    )
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setSaved(false)

      for (const hour of businessHours) {
        const { error } = await supabase
          .from('business_hours')
          .update({
            is_closed: hour.is_closed,
            open_time: hour.open_time,
            close_time: hour.close_time
          })
          .eq('id', hour.id)

        if (error) throw error
      }

      showToast.success('Configurações salvas com sucesso!', 'Salvo')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error('Error saving:', err)
      showToast.error('Erro ao salvar configurações', 'Erro')
    } finally {
      setSaving(false)
    }
  }

  const handleCreateFixedBlock = async () => {
    if (!fixedBlockStartTime || !fixedBlockEndTime) {
      showToast.error('Preencha horário de início e fim', 'Erro')
      return
    }

    if (fixedBlockStartTime >= fixedBlockEndTime) {
      showToast.error('Horário de término deve ser após o início', 'Erro')
      return
    }

    try {
      const blockData = {
        barbershop_id: barbershopId,
        barber_id: fixedBlockBarber === 'all' ? null : fixedBlockBarber,
        start_time: fixedBlockStartTime,
        end_time: fixedBlockEndTime,
        reason: fixedBlockReason.trim() || null
      }

      if (editingFixedBlock) {
        const { error } = await supabase
          .from('fixed_time_blocks')
          .update(blockData)
          .eq('id', editingFixedBlock.id)

        if (error) throw error
        showToast.success('Bloqueio fixo atualizado!', 'Sucesso')
      } else {
        const { error } = await supabase
          .from('fixed_time_blocks')
          .insert(blockData)

        if (error) throw error
        showToast.success('Bloqueio fixo criado!', 'Sucesso')
      }

      setShowFixedBlockModal(false)
      setEditingFixedBlock(null)
      setFixedBlockBarber('all')
      setFixedBlockStartTime('')
      setFixedBlockEndTime('')
      setFixedBlockReason('')
      await fetchFixedBlocks()
    } catch (err) {
      console.error('Error creating fixed block:', err)
      showToast.error('Erro ao criar bloqueio', 'Erro')
    }
  }

  const handleEditFixedBlock = (block) => {
    setEditingFixedBlock(block)
    setFixedBlockBarber(block.barber_id || 'all')
    setFixedBlockStartTime(block.start_time)
    setFixedBlockEndTime(block.end_time)
    setFixedBlockReason(block.reason || '')
    setShowFixedBlockModal(true)
  }

  const handleDeleteFixedBlock = async (blockId) => {
    if (!confirm('Deseja remover este bloqueio fixo?')) return

    try {
      const { error } = await supabase
        .from('fixed_time_blocks')
        .delete()
        .eq('id', blockId)

      if (error) throw error
      showToast.success('Bloqueio removido!', 'Sucesso')
      await fetchFixedBlocks()
    } catch (err) {
      console.error('Error deleting fixed block:', err)
      showToast.error('Erro ao remover bloqueio', 'Erro')
    }
  }

  const handleCreateSpecificBlock = async () => {
    if (!specificBlockDate || !specificBlockStartTime || !specificBlockEndTime) {
      showToast.error('Preencha todos os campos obrigatórios', 'Erro')
      return
    }

    if (specificBlockStartTime >= specificBlockEndTime) {
      showToast.error('Horário de término deve ser após o início', 'Erro')
      return
    }

    try {
      const [startHours, startMinutes] = specificBlockStartTime.split(':').map(Number)
      const [endHours, endMinutes] = specificBlockEndTime.split(':').map(Number)
      
      const startTime = new Date(specificBlockDate)
      startTime.setHours(startHours, startMinutes, 0, 0)
      
      const endTime = new Date(specificBlockDate)
      endTime.setHours(endHours, endMinutes, 0, 0)

      const barberId = specificBlockBarber === 'all' ? null : specificBlockBarber

      if (barberId) {
        const { data: conflictingAppointments } = await supabase
          .from('appointments')
          .select('id, client_name, start_time')
          .eq('barber_id', barberId)
          .gte('start_time', startTime.toISOString())
          .lt('start_time', endTime.toISOString())
          .in('status', ['pending', 'confirmed'])

        if (conflictingAppointments && conflictingAppointments.length > 0) {
          const appointmentTime = new Date(conflictingAppointments[0].start_time).toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })
          showToast.error(
            `Já existe agendamento neste horário (${appointmentTime} - ${conflictingAppointments[0].client_name})`,
            'Conflito'
          )
          return
        }
      }

      const { error } = await supabase
        .from('time_blocks')
        .insert({
          barbershop_id: barbershopId,
          barber_id: barberId,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          reason: specificBlockReason.trim() || null
        })

      if (error) throw error

      showToast.success('Bloqueio pontual criado!', 'Sucesso')
      setShowSpecificBlockModal(false)
      setSpecificBlockBarber('all')
      setSpecificBlockDate('')
      setSpecificBlockStartTime('')
      setSpecificBlockEndTime('')
      setSpecificBlockReason('')
      await fetchSpecificBlocks()
    } catch (err) {
      console.error('Error creating specific block:', err)
      showToast.error('Erro ao criar bloqueio', 'Erro')
    }
  }

  const handleDeleteSpecificBlock = async (blockId) => {
    if (!confirm('Deseja remover este bloqueio pontual?')) return

    try {
      const { error } = await supabase
        .from('time_blocks')
        .delete()
        .eq('id', blockId)

      if (error) throw error
      showToast.success('Bloqueio removido!', 'Sucesso')
      await fetchSpecificBlocks()
    } catch (err) {
      console.error('Error deleting specific block:', err)
      showToast.error('Erro ao remover bloqueio', 'Erro')
    }
  }

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('horarios')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${
              activeTab === 'horarios'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-[#1A1A1A] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#2A2A2A]'
            }`}
          >
            <Clock className="w-4 h-4" />
            Horário de Funcionamento
          </button>
          <button
            onClick={() => setActiveTab('bloqueios-fixos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${
              activeTab === 'bloqueios-fixos'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-[#1A1A1A] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#2A2A2A]'
            }`}
          >
            <Lock className="w-4 h-4" />
            Bloqueios de Horário
          </button>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving || saved}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all hover:scale-105 active:scale-95"
          style={{
            background: saved 
              ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05))' 
              : 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))',
            color: saved ? 'rgb(34, 197, 94)' : 'rgb(99, 102, 241)',
            border: saved ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid rgba(99, 102, 241, 0.2)',
            backdropFilter: 'blur(12px)'
          }}
        >
          {saved ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Salvo
            </>
          ) : saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500"></div>
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Salvar Alterações
            </>
          )}
        </button>
      </div>

      {/* Tab Content: Horários de Funcionamento */}
      {activeTab === 'horarios' && (
        <div className="space-y-4">
          {DAYS_OF_WEEK.map((day) => {
            const hourData = businessHours.find(h => h.day_of_week === day.value)
            if (!hourData) return null

            return (
              <div
                key={day.value}
                className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-[2rem] p-6 shadow-sm"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
                  <div className="flex items-center justify-between lg:w-48">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-gray-400" />
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {day.label}
                      </h3>
                    </div>

                    <button
                      onClick={() => handleToggleDay(day.value)}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                        hourData.is_closed
                          ? 'bg-gray-300 dark:bg-gray-700'
                          : 'bg-green-500'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${
                          hourData.is_closed ? 'translate-x-1' : 'translate-x-7'
                        }`}
                      />
                    </button>
                  </div>

                  {!hourData.is_closed ? (
                    <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="flex-1 w-full">
                        <label className="block text-[10px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mb-2">
                          Abertura
                        </label>
                        <input
                          type="time"
                          value={hourData.open_time}
                          onChange={(e) => handleTimeChange(day.value, 'open_time', e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white font-semibold focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                      </div>

                      <div className="flex-1 w-full">
                        <label className="block text-[10px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mb-2">
                          Fechamento
                        </label>
                        <input
                          type="time"
                          value={hourData.close_time}
                          onChange={(e) => handleTimeChange(day.value, 'close_time', e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white font-semibold focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                      </div>

                      <button
                        onClick={() => copyToAllDays(day.value)}
                        className="px-4 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl transition-all active:scale-95 flex items-center gap-2 text-sm font-medium"
                        title="Copiar para todos os dias"
                      >
                        <Copy className="w-4 h-4" />
                        <span className="hidden sm:inline">Copiar</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center py-3">
                      <span className="text-sm font-medium text-gray-500">Fechado</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-2xl p-6">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300 mb-1">
                  Como funciona?
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-400">
                  Os horários configurados aqui serão aplicados automaticamente na agenda e na página de agendamento público. 
                  Clientes não poderão agendar em dias fechados ou fora do horário de funcionamento.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Bloqueios de Horário */}
      {activeTab === 'bloqueios-fixos' && (
        <div className="space-y-8">
          {/* Seção 1: Bloqueios Fixos */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Bloqueios Fixos
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Horários bloqueados todos os dias
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingFixedBlock(null)
                  setFixedBlockBarber('all')
                  setFixedBlockStartTime('')
                  setFixedBlockEndTime('')
                  setFixedBlockReason('')
                  setShowFixedBlockModal(true)
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all"
              >
                <Plus className="w-4 h-4" />
                Adicionar Bloqueio Fixo
              </button>
            </div>

            {fixedBlocks.length === 0 ? (
              <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl p-8 text-center">
                <Lock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">
                  Nenhum bloqueio fixo cadastrado
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {fixedBlocks.map((block) => (
                  <div
                    key={block.id}
                    className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                        <Lock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {block.start_time} - {block.end_time}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {block.barber_id ? block.barbers?.name : 'Todos os barbeiros'}
                          {block.reason && ` • ${block.reason}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditFixedBlock(block)}
                        className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteFixedBlock(block.id)}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Seção 2: Bloqueios Pontuais */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Bloqueios Pontuais
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Bloquear um horário em uma data específica
                </p>
              </div>
              <button
                onClick={() => {
                  setSpecificBlockBarber('all')
                  setSpecificBlockDate('')
                  setSpecificBlockStartTime('')
                  setSpecificBlockEndTime('')
                  setSpecificBlockReason('')
                  setShowSpecificBlockModal(true)
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all"
              >
                <Plus className="w-4 h-4" />
                Adicionar Bloqueio Pontual
              </button>
            </div>

            {specificBlocks.length === 0 ? (
              <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl p-8 text-center">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">
                  Nenhum bloqueio pontual cadastrado
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {specificBlocks.map((block) => {
                  const blockDate = new Date(block.start_time)
                  return (
                    <div
                      key={block.id}
                      className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {blockDate.toLocaleDateString('pt-BR')} • {blockDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - {new Date(block.end_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {block.barber_id ? block.barbers?.name : 'Todos os barbeiros'}
                            {block.reason && ` • ${block.reason}`}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteSpecificBlock(block.id)}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Bloqueio Fixo */}
      {showFixedBlockModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setShowFixedBlockModal(false)}
          />
          
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingFixedBlock ? 'Editar' : 'Adicionar'} Bloqueio Fixo
                </h3>
                <button
                  onClick={() => setShowFixedBlockModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Barbeiro
                  </label>
                  <select
                    value={fixedBlockBarber}
                    onChange={(e) => setFixedBlockBarber(e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#2A2A2A] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Todos os barbeiros</option>
                    {barbers.map((barber) => (
                      <option key={barber.id} value={barber.id}>
                        {barber.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Horário Início
                    </label>
                    <input
                      type="time"
                      value={fixedBlockStartTime}
                      onChange={(e) => setFixedBlockStartTime(e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#2A2A2A] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Horário Fim
                    </label>
                    <input
                      type="time"
                      value={fixedBlockEndTime}
                      onChange={(e) => setFixedBlockEndTime(e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#2A2A2A] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Motivo (opcional)
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {['Almoço', 'Pausa', 'Outro'].map((reason) => (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => setFixedBlockReason(reason)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          fixedBlockReason === reason
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-[#0A0A0A] text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={fixedBlockReason}
                    onChange={(e) => setFixedBlockReason(e.target.value)}
                    placeholder="Digite o motivo..."
                    className="w-full px-4 py-3 bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#2A2A2A] rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowFixedBlockModal(false)}
                    className="flex-1 px-4 py-3 rounded-xl font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#0A0A0A] hover:bg-gray-200 dark:hover:bg-[#2A2A2A] transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateFixedBlock}
                    className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    {editingFixedBlock ? 'Salvar' : 'Criar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal: Bloqueio Pontual */}
      {showSpecificBlockModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setShowSpecificBlockModal(false)}
          />
          
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Adicionar Bloqueio Pontual
                </h3>
                <button
                  onClick={() => setShowSpecificBlockModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Barbeiro
                  </label>
                  <select
                    value={specificBlockBarber}
                    onChange={(e) => setSpecificBlockBarber(e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#2A2A2A] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Todos os barbeiros</option>
                    {barbers.map((barber) => (
                      <option key={barber.id} value={barber.id}>
                        {barber.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Data
                  </label>
                  <input
                    type="date"
                    value={specificBlockDate}
                    onChange={(e) => setSpecificBlockDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#2A2A2A] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Horário Início
                    </label>
                    <input
                      type="time"
                      value={specificBlockStartTime}
                      onChange={(e) => setSpecificBlockStartTime(e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#2A2A2A] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Horário Fim
                    </label>
                    <input
                      type="time"
                      value={specificBlockEndTime}
                      onChange={(e) => setSpecificBlockEndTime(e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#2A2A2A] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Motivo (opcional)
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {['Almoço', 'Buscar filho', 'Reunião', 'Compromisso', 'Outro'].map((reason) => (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => setSpecificBlockReason(reason)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          specificBlockReason === reason
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-[#0A0A0A] text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={specificBlockReason}
                    onChange={(e) => setSpecificBlockReason(e.target.value)}
                    placeholder="Digite o motivo..."
                    className="w-full px-4 py-3 bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-[#2A2A2A] rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowSpecificBlockModal(false)}
                    className="flex-1 px-4 py-3 rounded-xl font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#0A0A0A] hover:bg-gray-200 dark:hover:bg-[#2A2A2A] transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateSpecificBlock}
                    className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    Criar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
