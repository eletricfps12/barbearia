import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { showToast } from '../components/Toast'
import { Calendar, MessageCircle, DollarSign, TrendingUp, Clock, CheckCircle2 } from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer } from 'recharts'

export default function BarberDashboard() {
  const [barbershopId, setBarbershopId] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ count: 0, revenue: 0, newClients: 0, occupancy: 0 })
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [weeklyRevenue, setWeeklyRevenue] = useState([])
  const [nextAppointments, setNextAppointments] = useState([])

  useEffect(() => {
    fetchBarbershopId()
  }, [])

  useEffect(() => {
    if (barbershopId) {
      fetchDashboardData()
      fetchWeeklyRevenue()
    }
  }, [barbershopId, selectedDate])

  const fetchBarbershopId = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.error('No authenticated user found')
        return
      }

      const { data: barberData, error } = await supabase
        .from('barbers')
        .select('barbershop_id')
        .eq('profile_id', user.id)
        .single()

      if (error) throw error

      if (barberData) {
        setBarbershopId(barberData.barbershop_id)
      }
    } catch (error) {
      console.error('Error fetching barbershop ID:', error)
      setLoading(false)
    }
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      const startOfDay = new Date(selectedDate)
      startOfDay.setHours(0, 0, 0, 0)
      
      const endOfDay = new Date(selectedDate)
      endOfDay.setHours(23, 59, 59, 999)

      const { data: appointmentsData, error } = await supabase
        .from('appointments')
        .select(`
          id,
          start_time,
          status,
          client_name,
          client_phone,
          barber_id,
          barbers (
            name,
            color
          ),
          services (
            name,
            price,
            duration_minutes
          )
        `)
        .eq('barbershop_id', barbershopId)
        .gte('start_time', startOfDay.toISOString())
        .lte('start_time', endOfDay.toISOString())
        .order('start_time', { ascending: true })

      if (error) throw error

      let count = 0
      let revenue = 0
      let newClients = 0
      const activeAppointments = appointmentsData.filter(apt => apt.status !== 'cancelled')

      activeAppointments.forEach(apt => {
        // Exclude subscribers from revenue if column exists
        if ((apt.status === 'confirmed' || apt.status === 'completed') && !apt.is_subscriber) {
          count++
          revenue += Number(apt.services.price)
        }
      })

      // Calculate occupancy (assuming 10 hours workday, 8am-6pm)
      const totalSlots = 20 // 10 hours * 2 slots per hour (30min each)
      const occupancy = activeAppointments.length > 0 ? Math.round((activeAppointments.length / totalSlots) * 100) : 0

      // Find ALL next appointments (upcoming confirmed appointments)
      const now = new Date()
      const upcomingAppointments = activeAppointments.filter(apt => 
        new Date(apt.start_time) > now && apt.status === 'confirmed'
      )

      setStats({ count, revenue, newClients, occupancy })
      setAppointments(activeAppointments)
      setNextAppointments(upcomingAppointments)
    } catch (error) {
      console.error('Erro ao carregar o dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchWeeklyRevenue = async () => {
    try {
      const today = new Date()
      const sevenDaysAgo = new Date(today)
      sevenDaysAgo.setDate(today.getDate() - 6)
      sevenDaysAgo.setHours(0, 0, 0, 0)

      const { data, error } = await supabase
        .from('appointments')
        .select('start_time, services(price), is_subscriber')
        .eq('barbershop_id', barbershopId)
        .eq('status', 'completed')
        .gte('start_time', sevenDaysAgo.toISOString())
        .lte('start_time', today.toISOString())

      if (error) throw error

      // Group by day (excluding subscribers if column exists)
      const revenueByDay = {}
      for (let i = 0; i < 7; i++) {
        const date = new Date(sevenDaysAgo)
        date.setDate(sevenDaysAgo.getDate() + i)
        const dateKey = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
        revenueByDay[dateKey] = 0
      }

      data.forEach(apt => {
        // Exclude subscribers from revenue calculation if column exists
        if (!apt.is_subscriber) {
          const date = new Date(apt.start_time).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
          if (revenueByDay[date] !== undefined) {
            revenueByDay[date] += Number(apt.services?.price || 0)
          }
        }
      })

      const chartData = Object.entries(revenueByDay).map(([date, value]) => ({
        date,
        value
      }))

      setWeeklyRevenue(chartData)
    } catch (error) {
      console.error('Error fetching weekly revenue:', error)
    }
  }

  const handleUpdateStatus = async (appointmentId, newStatus) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId)

      if (error) throw error

      fetchDashboardData()
      showToast.success(
        'Status do agendamento atualizado!',
        'Agendamento Atualizado'
      )
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      showToast.error(
        'Não foi possível atualizar o agendamento. Tente novamente.',
        'Erro ao Atualizar'
      )
    }
  }

  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() - 1)
    setSelectedDate(newDate)
  }

  const goToToday = () => {
    setSelectedDate(new Date())
  }

  const goToNextDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + 1)
    setSelectedDate(newDate)
  }

  const isToday = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const selected = new Date(selectedDate)
    selected.setHours(0, 0, 0, 0)
    return selected.getTime() === today.getTime()
  }

  const isYesterday = () => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)
    const selected = new Date(selectedDate)
    selected.setHours(0, 0, 0, 0)
    return selected.getTime() === yesterday.getTime()
  }

  const isTomorrow = () => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    const selected = new Date(selectedDate)
    selected.setHours(0, 0, 0, 0)
    return selected.getTime() === tomorrow.getTime()
  }

  const formatSelectedDate = () => {
    return selectedDate.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getInitials = (name) => {
    if (!name) return '?'
    const parts = name.trim().split(' ')
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!barbershopId) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center shadow-sm">
            <p className="text-gray-500 dark:text-gray-400">Erro ao carregar dados da barbearia.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Apple Style Segmented Control - Date Navigator */}
        <div className="flex items-center justify-center">
          <div className="inline-flex items-center gap-1 p-1.5 bg-gray-100/50 dark:bg-white/5 backdrop-blur-xl rounded-full border border-gray-200/50 dark:border-white/10 shadow-sm">
            <button
              onClick={goToPreviousDay}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                isYesterday()
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Ontem
            </button>
            <button
              onClick={goToToday}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                isToday()
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Hoje
            </button>
            <button
              onClick={goToNextDay}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                isTomorrow()
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Amanhã
            </button>
          </div>
        </div>

        {/* Date Display */}
        <div className="flex items-center justify-center gap-2">
          <Calendar className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {formatSelectedDate()}
          </span>
        </div>

        {/* Bento Grid - Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Próximos Clientes */}
          <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200/50 dark:border-white/10 rounded-[2rem] p-6 shadow-sm dark:shadow-none backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-blue-100 dark:bg-blue-500/10 rounded-xl">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stats.count}</p>
            <p className="text-xs uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400">
              Clientes Hoje
            </p>
          </div>

          {/* Card 2: Faturamento com Mini Chart */}
          <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200/50 dark:border-white/10 rounded-[2rem] p-6 shadow-sm dark:shadow-none backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-green-100 dark:bg-green-500/10 rounded-xl">
                <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.revenue)}
            </p>
            <p className="text-xs uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mb-3">
              Faturamento
            </p>
            {/* Mini Sparkline */}
            {weeklyRevenue.length > 0 && (
              <ResponsiveContainer width="100%" height={40}>
                <AreaChart data={weeklyRevenue}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    fill="url(#colorRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Card 3: Ocupação */}
          <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200/50 dark:border-white/10 rounded-[2rem] p-6 shadow-sm dark:shadow-none backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-orange-100 dark:bg-orange-500/10 rounded-xl">
                <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stats.occupancy}%</p>
            <p className="text-xs uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400">
              Ocupação
            </p>
          </div>
        </div>

        {/* Próximos Atendimentos - Destaque */}
        {nextAppointments.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm uppercase tracking-wider font-bold text-blue-600 dark:text-blue-400">
                Próximo da Fila
              </h3>
            </div>

            {nextAppointments.map((appointment) => (
              <div 
                key={appointment.id}
                className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-500/10 dark:to-indigo-500/5 border border-blue-200/50 dark:border-blue-500/20 rounded-[2rem] p-6 shadow-sm backdrop-blur-xl"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-500/20 dark:to-blue-400/10 flex items-center justify-center border-2 border-blue-200 dark:border-blue-500/30 shadow-sm">
                      <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {getInitials(appointment.client_name)}
                      </span>
                    </div>

                    {/* Info */}
                    <div>
                      <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                        {appointment.client_name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        {appointment.services.name} • {appointment.services.duration_minutes} min
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {new Date(appointment.start_time).toLocaleTimeString('pt-BR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                        {appointment.barbers?.name && (
                          <span 
                            className="text-xs px-2 py-0.5 rounded-full font-medium border"
                            style={{
                              color: appointment.barbers.color || '#6366f1',
                              backgroundColor: `${appointment.barbers.color || '#6366f1'}1A`,
                              borderColor: `${appointment.barbers.color || '#6366f1'}33`
                            }}
                          >
                            {appointment.barbers.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => handleUpdateStatus(appointment.id, 'no_show')}
                      className="px-5 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-full border border-gray-300 dark:border-gray-600 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      Não Veio
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(appointment.id, 'completed')}
                      className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-full shadow-lg shadow-blue-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Confirmar Atendimento
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Lista de Agenda */}
        <div>
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Agenda Completa</h2>
          
          {appointments.length === 0 ? (
            <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] p-12 rounded-[2rem] text-center flex flex-col items-center shadow-sm dark:shadow-none">
              <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400">Nenhum cliente marcado para este dia.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map((apt) => {
                const time = new Date(apt.start_time).toLocaleTimeString('pt-BR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })
                
                const phoneClean = apt.client_phone ? apt.client_phone.replace(/\D/g, '') : ''
                
                const isCompleted = apt.status === 'completed'
                const isNoShow = apt.status === 'no_show'
                let statusColor = 'bg-blue-500'
                if (isCompleted) statusColor = 'bg-green-500'
                if (isNoShow) statusColor = 'bg-red-500'

                const barberColor = apt.barbers?.color || '#6366f1'

                return (
                  <div 
                    key={apt.id} 
                    className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-200 dark:border-[#2A2A2A] flex overflow-hidden shadow-sm dark:shadow-none hover:border-gray-300 dark:hover:border-gray-600 transition-all"
                  >
                    <div className={`w-1 ${statusColor}`}></div>

                    <div className="p-5 flex-1 flex flex-col sm:flex-row gap-4 sm:gap-6 justify-between items-start sm:items-center">
                      <div className="flex gap-4 items-center w-full sm:w-auto">
                        <div className="flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-xl p-3 min-w-[70px] border border-gray-200 dark:border-[#2A2A2A]">
                          <span className={`text-xl font-bold ${isCompleted ? 'text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                            {time}
                          </span>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className={`font-semibold text-lg ${isCompleted ? 'text-gray-400 line-through decoration-2' : 'text-gray-900 dark:text-white'}`}>
                              {apt.client_name || 'Sem nome'}
                            </h3>
                            {apt.barbers?.name && (
                              <span 
                                className="text-xs px-2 py-0.5 rounded-full font-medium border"
                                style={{
                                  color: barberColor,
                                  backgroundColor: `${barberColor}1A`,
                                  borderColor: `${barberColor}33`
                                }}
                              >
                                {apt.barbers.name}
                              </span>
                            )}
                            {isCompleted && (
                              <span className="text-[10px] uppercase font-bold tracking-wider bg-green-500/10 text-green-400 px-2 py-0.5 rounded">
                                Concluído
                              </span>
                            )}
                            {isNoShow && (
                              <span className="text-[10px] uppercase font-bold tracking-wider bg-red-500/10 text-red-400 px-2 py-0.5 rounded">
                                Faltou
                              </span>
                            )}
                          </div>
                          <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
                            {apt.services.name} • {apt.services.duration_minutes} min
                          </p>

                          {phoneClean && (
                            <a 
                              href={`https://wa.me/55${phoneClean}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-green-400 hover:text-green-300 transition-colors bg-green-400/10 px-2.5 py-1 rounded-full w-max"
                            >
                              <MessageCircle size={14} />
                              Chamar no WhatsApp
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto border-t sm:border-t-0 border-gray-200 dark:border-[#2A2A2A] pt-3 sm:pt-0 gap-3">
                        <span className={`font-bold text-lg ${isCompleted ? 'text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(apt.services.price)}
                        </span>

                        {apt.status === 'confirmed' && (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleUpdateStatus(apt.id, 'no_show')}
                              className="px-4 py-2 text-sm font-semibold text-red-400 bg-red-400/10 hover:bg-red-400/20 rounded-xl transition-all active:scale-95"
                            >
                              Faltou
                            </button>
                            <button 
                              onClick={() => handleUpdateStatus(apt.id, 'completed')}
                              className="px-4 py-2 text-sm font-semibold text-green-400 bg-green-400/10 hover:bg-green-400/20 rounded-xl transition-all active:scale-95"
                            >
                              Concluir
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
