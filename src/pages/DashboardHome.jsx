import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { showToast } from '../components/Toast'
import { 
  TrendingUp, 
  DollarSign, 
  Calendar,
  Users,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

export default function DashboardHome() {
  const [loading, setLoading] = useState(true)
  const [barbershopId, setBarbershopId] = useState(null)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [appointments, setAppointments] = useState([])
  const [dashboardData, setDashboardData] = useState({
    todayRevenue: 0,
    todayNetProfit: 0,
    occupationRate: 0,
    totalSlots: 0,
    filledSlots: 0,
    inactiveClients: 0,
    isOpen: false,
    nextAppointment: null
  })

  useEffect(() => {
    fetchDashboardData()
  }, [selectedDate])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // 1. Buscar barbershop_id do usuário
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: barberData } = await supabase
        .from('barbers')
        .select('barbershop_id')
        .eq('profile_id', user.id)
        .maybeSingle()

      if (!barberData) return

      const shopId = barberData.barbershop_id
      setBarbershopId(shopId)

      // 2. Data selecionada (início e fim do dia)
      const startOfDay = new Date(selectedDate)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(selectedDate)
      endOfDay.setHours(23, 59, 59, 999)

      // 3. Buscar agendamentos do dia selecionado
      const { data: appointmentsData } = await supabase
        .from('appointments')
        .select('*, barbers(name, commission_percentage)')
        .eq('barbershop_id', shopId)
        .gte('start_time', startOfDay.toISOString())
        .lte('start_time', endOfDay.toISOString())
        .order('start_time', { ascending: true })

      setAppointments(appointmentsData || [])

      // Filtrar apenas confirmados e completos para métricas (excluindo assinantes se coluna existir)
      const confirmedAppointments = appointmentsData?.filter(apt => 
        (apt.status === 'confirmed' || apt.status === 'completed') && !apt.is_subscriber
      ) || []

      // 4. Calcular receita e lucro usando o campo price do agendamento
      let totalRevenue = 0
      let totalCommissions = 0

      confirmedAppointments.forEach(apt => {
        const price = apt.price || 0 // Usar price do agendamento
        const commission = apt.barbers?.commission_percentage || 50
        totalRevenue += price
        totalCommissions += (price * commission) / 100
      })

      const netProfit = totalRevenue - totalCommissions

      // 5. Calcular ocupação (baseado em horários de funcionamento)
      const dayOfWeek = selectedDate.getDay()
      const { data: businessHours } = await supabase
        .from('business_hours')
        .select('*')
        .eq('barbershop_id', shopId)
        .eq('day_of_week', dayOfWeek)
        .maybeSingle()

      let occupationRate = 0
      let totalSlots = 0
      // Count all confirmed/completed appointments for occupation (including subscribers)
      let filledSlots = (appointmentsData?.filter(apt => 
        apt.status === 'confirmed' || apt.status === 'completed'
      ) || []).length

      if (businessHours && !businessHours.is_closed) {
        // Calcular slots disponíveis (30 min cada)
        const openTime = businessHours.open_time.split(':')
        const closeTime = businessHours.close_time.split(':')
        const openMinutes = parseInt(openTime[0]) * 60 + parseInt(openTime[1])
        const closeMinutes = parseInt(closeTime[0]) * 60 + parseInt(closeTime[1])
        totalSlots = Math.floor((closeMinutes - openMinutes) / 30)
        occupationRate = totalSlots > 0 ? (filledSlots / totalSlots) * 100 : 0
      }

      // 6. Clientes inativos (30+ dias)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: recentClients } = await supabase
        .from('appointments')
        .select('client_phone')
        .eq('barbershop_id', shopId)
        .gte('start_time', thirtyDaysAgo.toISOString())

      const { data: allClients } = await supabase
        .from('appointments')
        .select('client_phone')
        .eq('barbershop_id', shopId)

      const recentPhones = new Set(recentClients?.map(c => c.client_phone))
      const allPhones = new Set(allClients?.map(c => c.client_phone))
      const inactiveCount = allPhones.size - recentPhones.size

      // 7. Próximo agendamento (a partir da data selecionada)
      const now = selectedDate.toISOString()
      const { data: nextApt } = await supabase
        .from('appointments')
        .select('*, barbers(name)')
        .eq('barbershop_id', shopId)
        .gte('start_time', now)
        .eq('status', 'confirmed')
        .order('start_time', { ascending: true })
        .limit(1)
        .maybeSingle()

      setDashboardData({
        todayRevenue: totalRevenue,
        todayNetProfit: netProfit,
        occupationRate: Math.round(occupationRate),
        totalSlots,
        filledSlots,
        inactiveClients: inactiveCount,
        isOpen: businessHours && !businessHours.is_closed,
        nextAppointment: nextApt
      })
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  // Gerar array de datas (7 dias atrás até 30 dias à frente)
  const generateDateRange = () => {
    const dates = []
    const start = new Date()
    start.setDate(start.getDate() - 7)
    
    for (let i = 0; i < 38; i++) {
      const date = new Date(start)
      date.setDate(start.getDate() + i)
      dates.push(date)
    }
    
    return dates
  }

  const dateRange = generateDateRange()

  const isToday = (date) => {
    const today = new Date()
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear()
  }

  const isSelectedDate = (date) => {
    return date.getDate() === selectedDate.getDate() &&
           date.getMonth() === selectedDate.getMonth() &&
           date.getFullYear() === selectedDate.getFullYear()
  }

  const formatDateLabel = (date) => {
    if (isToday(date)) return 'Hoje'
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }

  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() - 1)
    setSelectedDate(newDate)
  }

  const goToNextDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + 1)
    setSelectedDate(newDate)
  }

  const handleCompleteAppointment = async (appointmentId) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'completed' })
        .eq('id', appointmentId)

      if (error) throw error

      // Recarregar dados
      await fetchDashboardData()
      showToast.success(
        'Agendamento marcado como concluído!',
        'Agendamento Concluído'
      )
    } catch (error) {
      console.error('Erro ao completar agendamento:', error)
      showToast.error(
        'Não foi possível completar o agendamento. Tente novamente.',
        'Erro ao Completar'
      )
    }
  }

  const handleMarkNoShow = async (appointmentId) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'no_show' })
        .eq('id', appointmentId)

      if (error) throw error

      // Recarregar dados
      await fetchDashboardData()
      showToast.warning(
        'Cliente marcado como faltante.',
        'Falta Registrada'
      )
    } catch (error) {
      console.error('Erro ao marcar falta:', error)
      showToast.error(
        'Não foi possível registrar a falta. Tente novamente.',
        'Erro ao Registrar'
      )
    }
  }

  const handleRestoreAppointment = async (appointmentId) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'confirmed' })
        .eq('id', appointmentId)

      if (error) throw error

      // Recarregar dados
      await fetchDashboardData()
      showToast.info(
        'Agendamento restaurado com sucesso!',
        'Agendamento Restaurado'
      )
    } catch (error) {
      console.error('Erro ao restaurar agendamento:', error)
      showToast.error(
        'Não foi possível restaurar o agendamento. Tente novamente.',
        'Erro ao Restaurar'
      )
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return { label: 'Confirmado', color: 'blue' }
      case 'completed':
        return { label: 'Concluído', color: 'green' }
      case 'no_show':
        return { label: 'Faltou', color: 'red' }
      case 'cancelled':
        return { label: 'Cancelado', color: 'gray' }
      default:
        return { label: status, color: 'gray' }
    }
  }

  // Skeleton Loading Component
  const SkeletonCard = ({ className = '' }) => (
    <div 
      className={`backdrop-blur-xl rounded-[2rem] p-6 animate-pulse ${className}`}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)'
      }}
    >
      <div 
        className="h-4 rounded w-1/3 mb-4"
        style={{ background: 'var(--border-subtle)' }}
      ></div>
      <div 
        className="h-8 rounded w-2/3 mb-2"
        style={{ background: 'var(--border-subtle)' }}
      ></div>
      <div 
        className="h-3 rounded w-1/2"
        style={{ background: 'var(--border-subtle)' }}
      ></div>
    </div>
  )

  if (loading) {
    return (
      <div className="p-4 sm:p-6 min-h-screen" style={{ background: 'var(--bg-global)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="h-8 bg-white/10 rounded w-48 mb-2"></div>
            <div className="h-4 bg-white/10 rounded w-64"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard className="md:col-span-2" />
            <SkeletonCard />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 min-h-screen overflow-x-hidden" style={{ background: 'var(--bg-global)' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex-1">
              <h1 
                className="text-3xl font-bold mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                Dashboard Inteligente
              </h1>
              <p style={{ color: 'var(--text-secondary)' }}>
                {isToday(selectedDate) ? 'Visão em tempo real do seu negócio' : `Métricas de ${selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`}
              </p>
            </div>
            
            {/* Status Toggle - Mais Destacado */}
            <div 
              className="flex items-center gap-3 px-6 py-3 rounded-2xl flex-shrink-0 shadow-lg"
              style={{
                background: dashboardData.isOpen 
                  ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.1))' 
                  : 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.1))',
                border: dashboardData.isOpen 
                  ? '2px solid rgba(34, 197, 94, 0.4)' 
                  : '2px solid rgba(239, 68, 68, 0.4)'
              }}
            >
              {dashboardData.isOpen ? (
                <>
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <span className="text-base font-bold text-green-500">Aberto</span>
                </>
              ) : (
                <>
                  <XCircle className="w-6 h-6 text-red-500" />
                  <span className="text-base font-bold text-red-500">Fechado</span>
                </>
              )}
            </div>
          </div>

          {/* Date Picker Horizontal */}
          <div className="flex items-center gap-3">
            {/* Botão Voltar */}
            <button
              onClick={goToPreviousDay}
              className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-white/[0.03] border border-white/10 rounded-xl hover:bg-white/[0.05] transition-all"
            >
              <ChevronLeft className="w-5 h-5 text-gray-400" />
            </button>

            {/* Botão Hoje */}
            {!isToday(selectedDate) && (
              <button
                onClick={() => setSelectedDate(new Date())}
                className="flex-shrink-0 px-4 py-2 border border-white/10 rounded-xl text-sm font-semibold hover:bg-white/[0.05] transition-all"
                style={{ 
                  background: `rgba(${getComputedStyle(document.documentElement).getPropertyValue('--brand-color') || '99, 102, 241'}, 0.1)`,
                  color: `rgb(${getComputedStyle(document.documentElement).getPropertyValue('--brand-color') || '99, 102, 241'})`
                }}
              >
                Hoje
              </button>
            )}

            {/* Scroll de Datas */}
            <div className="flex-1 overflow-x-auto scrollbar-hide">
              <div className="flex gap-2 min-w-min">
                {dateRange.map((date, index) => {
                  const selected = isSelectedDate(date)
                  const today = isToday(date)
                  
                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedDate(date)}
                      className={`flex-shrink-0 px-4 py-3 rounded-xl transition-all ${
                        selected
                          ? 'text-white shadow-lg'
                          : today
                          ? 'border border-white/10 text-gray-300'
                          : 'bg-white/[0.03] border border-white/10 text-gray-400 hover:bg-white/[0.05]'
                      }`}
                      style={selected ? {
                        background: `rgb(${getComputedStyle(document.documentElement).getPropertyValue('--brand-color') || '99, 102, 241'})`,
                        boxShadow: `0 10px 30px rgba(${getComputedStyle(document.documentElement).getPropertyValue('--brand-color') || '99, 102, 241'}, 0.3)`
                      } : today ? {
                        background: `rgba(${getComputedStyle(document.documentElement).getPropertyValue('--brand-color') || '99, 102, 241'}, 0.1)`
                      } : {}}
                    >
                      <div className="text-center">
                        <div className={`text-xs uppercase tracking-wider font-semibold mb-1 ${
                          selected ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {date.toLocaleDateString('pt-BR', { weekday: 'short' })}
                        </div>
                        <div className="text-lg font-bold">
                          {date.getDate()}
                        </div>
                        <div className={`text-xs ${
                          selected ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {date.toLocaleDateString('pt-BR', { month: 'short' })}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Botão Avançar */}
            <button
              onClick={goToNextDay}
              className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-white/[0.03] border border-white/10 rounded-xl hover:bg-white/[0.05] transition-all"
            >
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card 1: Previsão Financeira */}
          <div 
            className="backdrop-blur-xl rounded-[2rem] p-6 transition-all"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--card-shadow)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--border-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
          >
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center" 
                style={{ background: 'rgba(34, 197, 94, 0.15)' }}
              >
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p 
                  className="text-xs uppercase tracking-wider font-semibold"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {isToday(selectedDate) ? 'Receita Hoje' : 'Receita do Dia'}
                </p>
              </div>
            </div>
            <h3 
              className="text-3xl font-bold mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(dashboardData.todayRevenue)}
            </h3>
            <div className="flex items-center gap-2">
              <span 
                className="text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                Lucro Líquido:
              </span>
              <span className="text-sm font-semibold text-green-400">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(dashboardData.todayNetProfit)}
              </span>
            </div>
          </div>

          {/* Card 2: Ocupação do Dia */}
          <div 
            className="backdrop-blur-xl rounded-[2rem] p-6 transition-all"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--card-shadow)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--border-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
          >
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center" 
                style={{ background: `rgba(var(--accent-color), 0.15)` }}
              >
                <TrendingUp 
                  className="w-6 h-6" 
                  style={{ color: `rgb(var(--accent-color))` }}
                />
              </div>
              <div>
                <p 
                  className="text-xs uppercase tracking-wider font-semibold"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Ocupação
                </p>
              </div>
            </div>
            <h3 
              className="text-3xl font-bold mb-4"
              style={{ color: 'var(--text-primary)' }}
            >
              {dashboardData.occupationRate}%
            </h3>
            
            {/* Progress Bar */}
            <div 
              className="relative w-full h-3 rounded-full overflow-hidden"
              style={{ background: 'var(--border-subtle)' }}
            >
              <div 
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000"
                style={{ 
                  width: `${dashboardData.occupationRate}%`,
                  background: `linear-gradient(to right, rgb(var(--accent-color)), rgb(var(--accent-active)))`
                }}
              />
            </div>
            <p 
              className="text-xs mt-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              {dashboardData.filledSlots} de {dashboardData.totalSlots} horários disponíveis hoje
            </p>
          </div>

          {/* Card 3: Clientes Inativos */}
          <div 
            className="backdrop-blur-xl rounded-[2rem] p-6 transition-all"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--card-shadow)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--border-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
          >
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center" 
                style={{ background: 'rgba(249, 115, 22, 0.15)' }}
              >
                <AlertCircle className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <p 
                  className="text-xs uppercase tracking-wider font-semibold"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Alerta CRM
                </p>
              </div>
            </div>
            <h3 
              className="text-3xl font-bold mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              {dashboardData.inactiveClients}
            </h3>
            <p 
              className="text-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              Clientes inativos há 30+ dias
            </p>
            {dashboardData.inactiveClients > 0 && (
              <button 
                className="mt-4 w-full px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                style={{ 
                  background: 'rgba(249, 115, 22, 0.1)',
                  color: 'rgb(251, 146, 60)',
                  border: '1px solid var(--border-subtle)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(249, 115, 22, 0.15)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(249, 115, 22, 0.1)'}
              >
                Reativar Clientes
              </button>
            )}
          </div>

          {/* Card 4: Próximo Agendamento (Span 2 columns) */}
          <div 
            className="md:col-span-2 backdrop-blur-xl rounded-[2rem] p-6 transition-all"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--card-shadow)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--border-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
          >
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center" 
                style={{ background: 'rgba(168, 85, 247, 0.15)' }}
              >
                <Clock className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p 
                  className="text-xs uppercase tracking-wider font-semibold"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Próximo na Fila
                </p>
              </div>
            </div>
            
            {dashboardData.nextAppointment ? (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 
                    className="text-xl font-bold mb-1"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {dashboardData.nextAppointment.client_name}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
                    {dashboardData.nextAppointment.service_name || dashboardData.nextAppointment.services?.name} • {dashboardData.nextAppointment.barbers?.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-purple-400">
                    {new Date(dashboardData.nextAppointment.start_time).toLocaleTimeString('pt-BR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                  <p 
                    className="text-xs"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {new Date(dashboardData.nextAppointment.start_time).toLocaleDateString('pt-BR', { 
                      day: '2-digit', 
                      month: 'short' 
                    })}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar 
                  className="w-12 h-12 mx-auto mb-3"
                  style={{ color: 'var(--text-tertiary)' }}
                />
                <p style={{ color: 'var(--text-secondary)' }}>Nenhum agendamento próximo</p>
              </div>
            )}
          </div>

          {/* Card 5: Quick Stats */}
          <div 
            className="backdrop-blur-xl rounded-[2rem] p-6 transition-all"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--card-shadow)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--border-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
          >
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center" 
                style={{ background: 'rgba(6, 182, 212, 0.15)' }}
              >
                <Users className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <p 
                  className="text-xs uppercase tracking-wider font-semibold"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {isToday(selectedDate) ? 'Clientes Hoje' : 'Clientes do Dia'}
                </p>
              </div>
            </div>
            <h3 
              className="text-3xl font-bold mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              {dashboardData.filledSlots}
            </h3>
            <p 
              className="text-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              Atendimentos confirmados
            </p>
          </div>

        </div>

        {/* Lista de Agendamentos do Dia */}
        {appointments.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Agendamentos do Dia
            </h2>
            <div className="space-y-3">
              {appointments.map((appointment) => {
                const statusInfo = getStatusBadge(appointment.status)
                const appointmentTime = new Date(appointment.start_time)
                const appointmentEndTime = new Date(appointment.end_time)
                
                // Calcular duração em minutos
                const durationMinutes = Math.round((appointmentEndTime - appointmentTime) / (1000 * 60))
                
                // Definir cor da barra lateral baseado no status
                const getStatusBarColor = (status) => {
                  switch (status) {
                    case 'confirmed':
                      return 'bg-blue-500'
                    case 'completed':
                      return 'bg-green-500'
                    case 'no_show':
                      return 'bg-red-500'
                    case 'cancelled':
                      return 'bg-gray-500'
                    default:
                      return 'bg-gray-400'
                  }
                }
                
                return (
                  <div
                    key={appointment.id}
                    className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all"
                  >
                    {/* Barra Colorida Lateral */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${getStatusBarColor(appointment.status)}`} />
                    
                    <div className="p-4 pl-6">
                      <div className="flex flex-col gap-3">
                        {/* Linha 1: Horário e Status */}
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-xl font-bold text-gray-900 dark:text-white">
                            {appointmentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            statusInfo.color === 'green' ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20' :
                            statusInfo.color === 'blue' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' :
                            statusInfo.color === 'red' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20' :
                            'bg-gray-500/10 text-gray-600 dark:text-gray-400 border border-gray-500/20'
                          }`}>
                            {statusInfo.label}
                          </span>
                        </div>

                        {/* Linha 2: Nome do Cliente */}
                        <p className="text-gray-900 dark:text-white font-bold text-lg break-words">
                          {appointment.client_name}
                        </p>

                        {/* Linha 3: Valor Total - DESTAQUE */}
                        <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2 inline-block w-fit">
                          <span className="text-xl font-bold text-green-400">
                            {appointment.price ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(appointment.price) : 'R$ 0,00'}
                          </span>
                        </div>

                        {/* Linha 4: Serviço(s) e Duração */}
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white break-words">
                            {appointment.service_name || appointment.services?.name || 'Serviço'}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            ⏱️ {durationMinutes} minutos
                          </p>
                        </div>

                        {/* Linha 5: Barbeiro */}
                        <div className="flex items-center gap-2">
                          <span 
                            className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20"
                          >
                            👤 {appointment.barbers?.name || 'Barbeiro'}
                          </span>
                        </div>

                        {/* Linha 6: Telefone */}
                        <p className="text-sm text-gray-600 dark:text-gray-400 break-all">
                          📱 {appointment.client_phone}
                        </p>

                        {/* Linha 7: Botões de Ação */}
                        <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-white/10">
                          {appointment.status === 'confirmed' && (
                            <>
                              <button
                                onClick={() => handleCompleteAppointment(appointment.id)}
                                className="w-full sm:flex-1 px-4 py-3 border border-white/10 rounded-xl text-sm font-semibold transition-all hover:bg-white/[0.05]"
                                style={{ 
                                  background: 'rgba(34, 197, 94, 0.1)',
                                  color: 'rgb(74, 222, 128)'
                                }}
                              >
                                ✓ Concluir
                              </button>
                              <button
                                onClick={() => handleMarkNoShow(appointment.id)}
                                className="w-full sm:flex-1 px-4 py-3 border border-white/10 rounded-xl text-sm font-semibold transition-all hover:bg-white/[0.05]"
                                style={{ 
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  color: 'rgb(248, 113, 113)'
                                }}
                              >
                                ✗ Faltou
                              </button>
                            </>
                          )}
                          {(appointment.status === 'completed' || appointment.status === 'no_show') && (
                            <button
                              onClick={() => handleRestoreAppointment(appointment.id)}
                              className="w-full px-4 py-3 border border-white/10 rounded-xl text-sm font-semibold transition-all hover:bg-white/[0.05]"
                              style={{ 
                                background: `rgba(${getComputedStyle(document.documentElement).getPropertyValue('--brand-color') || '99, 102, 241'}, 0.1)`,
                                color: `rgb(${getComputedStyle(document.documentElement).getPropertyValue('--brand-color') || '99, 102, 241'})`
                              }}
                            >
                              ↻ Restaurar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
