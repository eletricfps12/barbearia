import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { showToast } from '../components/Toast'
import { Clock, Copy, Save, CheckCircle2 } from 'lucide-react'

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
  const [barbershopId, setBarbershopId] = useState(null)
  const [businessHours, setBusinessHours] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetchBarbershopId()
  }, [])

  useEffect(() => {
    if (barbershopId) {
      fetchBusinessHours()
    }
  }, [barbershopId])

  const fetchBarbershopId = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Check if user is owner
      const { data: barbershopData } = await supabase
        .from('barbershops')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle()

      if (barbershopData) {
        setBarbershopId(barbershopData.id)
        return
      }

      // Check if user is barber
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

  const fetchBusinessHours = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('business_hours')
        .select('*')
        .eq('barbershop_id', barbershopId)
        .order('day_of_week', { ascending: true })

      if (error) throw error

      // If no data exists, create default hours
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

  const createDefaultHours = async () => {
    try {
      const defaultHours = DAYS_OF_WEEK.map(day => ({
        barbershop_id: barbershopId,
        day_of_week: day.value,
        is_closed: day.value === 0, // Sunday closed by default
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

      console.log('Salvando horários:', businessHours)

      // Update each record individually
      for (const hour of businessHours) {
        console.log('Atualizando horário:', hour.id, {
          is_closed: hour.is_closed,
          open_time: hour.open_time,
          close_time: hour.close_time
        })
        
        const { error } = await supabase
          .from('business_hours')
          .update({
            is_closed: hour.is_closed,
            open_time: hour.open_time,
            close_time: hour.close_time
          })
          .eq('id', hour.id)

        if (error) {
          console.error('Erro detalhado:', error)
          throw error
        }
      }

      console.log('Todos os horários salvos com sucesso!')
      showToast.success(
        'Horários de funcionamento atualizados com sucesso!',
        'Horários Salvos'
      )
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error('Error saving business hours:', err)
      showToast.error(
        err.message || 'Não foi possível salvar os horários. Tente novamente.',
        'Erro ao Salvar'
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando horários...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Save Button - Top Right */}
      <div className="flex justify-end">
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

      {/* Days List */}
      <div className="space-y-4">
          {DAYS_OF_WEEK.map((day) => {
            const hourData = businessHours.find(h => h.day_of_week === day.value)
            if (!hourData) return null

            return (
              <div
                key={day.value}
                className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-[2rem] p-6 shadow-sm dark:shadow-none backdrop-blur-xl"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
                  {/* Day Name + Toggle */}
                  <div className="flex items-center justify-between lg:w-48">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-gray-400" />
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {day.label}
                      </h3>
                    </div>

                    {/* iOS Style Toggle */}
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

                  {/* Time Pickers */}
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

                      {/* Copy to All Button */}
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
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-500">
                        Fechado
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Info Card */}
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
  )
}