import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Users, TrendingUp, AlertCircle, Search, MessageCircle, Calendar, Scissors } from 'lucide-react'

/**
 * ClientesCRM Component - Customer Relationship Management
 * 
 * Focado em reativação de clientes inativos usando dados da view customer_health
 */
export default function ClientesCRM() {
  const [barbershopId, setBarbershopId] = useState(null)
  const [customers, setCustomers] = useState([])
  const [filteredCustomers, setFilteredCustomers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [barbershopName, setBarbershopName] = useState('Barbearia')
  const [activeFilter, setActiveFilter] = useState(null) // null = all, 'active', 'at_risk', 'inactive'
  
  // Summary stats
  const [stats, setStats] = useState({
    active: 0,
    at_risk: 0,
    inactive: 0
  })

  useEffect(() => {
    fetchBarbershopId()
  }, [])

  useEffect(() => {
    if (barbershopId) {
      fetchBarbershopName()
      fetchCustomerHealth()
    }
  }, [barbershopId])

  useEffect(() => {
    // Filter customers based on search term and active filter
    let filtered = customers

    // Apply status filter
    if (activeFilter) {
      filtered = filtered.filter(customer => customer.health_status === activeFilter)
    }

    // Apply search filter
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(customer => 
        customer.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.client_phone?.includes(searchTerm)
      )
    }

    setFilteredCustomers(filtered)
  }, [searchTerm, customers, activeFilter])

  const fetchBarbershopId = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: barberData } = await supabase
        .from('barbers')
        .select('barbershop_id')
        .eq('profile_id', user.id)
        .maybeSingle()

      if (barberData) {
        setBarbershopId(barberData.barbershop_id)
      }
    } catch (error) {
      console.error('Erro ao buscar barbershop_id:', error)
    }
  }

  const fetchBarbershopName = async () => {
    try {
      const { data } = await supabase
        .from('barbershops')
        .select('name')
        .eq('id', barbershopId)
        .single()

      if (data) {
        setBarbershopName(data.name)
      }
    } catch (error) {
      console.error('Erro ao buscar nome da barbearia:', error)
    }
  }

  const fetchCustomerHealth = async () => {
    try {
      setLoading(true)

      // Wait for barbershopId to be available
      if (!barbershopId) {
        setLoading(false)
        return
      }

      // Fetch customer health data filtered by barbershop_id
      const { data, error } = await supabase
        .from('customer_health')
        .select('*')
        .eq('barbershop_id', barbershopId)
        .order('last_visit', { ascending: false })

      if (error) throw error

      // Transform data to match component expectations
      const transformedData = data?.map(customer => ({
        client_name: customer.client_name,
        client_phone: customer.client_phone,
        last_visit_date: customer.last_visit,
        total_visits: customer.total_visits,
        days_since_last_visit: Math.floor((new Date() - new Date(customer.last_visit)) / (1000 * 60 * 60 * 24)),
        health_status: customer.status === 'Ativo' ? 'active' : customer.status === 'Em Risco' ? 'at_risk' : 'inactive'
      })) || []

      setCustomers(transformedData)
      setFilteredCustomers(transformedData)

      // Calculate stats
      const active = transformedData.filter(c => c.health_status === 'active').length
      const at_risk = transformedData.filter(c => c.health_status === 'at_risk').length
      const inactive = transformedData.filter(c => c.health_status === 'inactive').length

      setStats({ active, at_risk, inactive })
    } catch (error) {
      console.error('Erro ao buscar customer health:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return {
          bg: 'from-green-500 to-emerald-600',
          text: 'text-green-600 dark:text-green-400',
          border: 'border-green-500/20',
          bgLight: 'bg-green-500/10'
        }
      case 'at_risk':
        return {
          bg: 'from-yellow-500 to-orange-500',
          text: 'text-yellow-600 dark:text-yellow-400',
          border: 'border-yellow-500/20',
          bgLight: 'bg-yellow-500/10'
        }
      case 'inactive':
        return {
          bg: 'from-red-500 to-pink-600',
          text: 'text-red-600 dark:text-red-400',
          border: 'border-red-500/20',
          bgLight: 'bg-red-500/10'
        }
      default:
        return {
          bg: 'from-gray-500 to-gray-600',
          text: 'text-gray-600 dark:text-gray-400',
          border: 'border-gray-500/20',
          bgLight: 'bg-gray-500/10'
        }
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active':
        return 'Ativo'
      case 'at_risk':
        return 'Em Risco'
      case 'inactive':
        return 'Inativo'
      default:
        return status
    }
  }

  const formatDaysAgo = (days) => {
    if (days === 0) return 'Hoje'
    if (days === 1) return 'Ontem'
    if (days < 7) return `há ${days} dias`
    if (days < 30) return `há ${Math.floor(days / 7)} semanas`
    if (days < 365) return `há ${Math.floor(days / 30)} meses`
    return `há ${Math.floor(days / 365)} anos`
  }

  const openWhatsApp = (phone, name) => {
    // Remove non-numeric characters
    const cleanPhone = phone.replace(/\D/g, '')
    
    // Create message
    const message = encodeURIComponent(
      `E aí, ${name}! Notei que faz tempo que não passa aqui na ${barbershopName}. Que tal renovar o visual esta semana? 💈✨`
    )
    
    // Open WhatsApp
    window.open(`https://wa.me/55${cleanPhone}?text=${message}`, '_blank')
  }

  const handleFilterClick = (filter) => {
    // Toggle filter: if clicking the same filter, clear it; otherwise set new filter
    setActiveFilter(activeFilter === filter ? null : filter)
  }

  // Skeleton Loading Component
  const SkeletonCard = () => (
    <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-[2rem] p-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-48 mb-4 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    )
  }

  // Separate customers by status
  const inactiveCustomers = filteredCustomers.filter(c => c.health_status === 'inactive')
  const atRiskCustomers = filteredCustomers.filter(c => c.health_status === 'at_risk')
  const activeCustomers = filteredCustomers.filter(c => c.health_status === 'active')

  // Determine which customers to show based on active filter
  const customersToShow = activeFilter ? filteredCustomers : []
  const showInactiveSection = !activeFilter && inactiveCustomers.length > 0
  const showAtRiskSection = !activeFilter && atRiskCustomers.length > 0

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          CRM - Clientes
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gerencie e reative seus clientes
        </p>
      </div>

      {/* Stats Cards - Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Active Customers */}
        <button
          onClick={() => handleFilterClick('active')}
          className={`bg-white dark:bg-white/5 backdrop-blur-xl border rounded-[2.5rem] p-6 transition-all shadow-sm text-left w-full ${
            activeFilter === 'active'
              ? 'border-green-500 dark:border-green-500 shadow-lg shadow-green-500/30'
              : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
          }`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br ${getStatusColor('active').bg} shadow-lg shadow-green-500/30`}>
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">
                Clientes Ativos
              </p>
            </div>
          </div>
          <h3 className="text-4xl font-bold text-gray-900 dark:text-white">
            {stats.active}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Visitaram nos últimos 15 dias
          </p>
        </button>

        {/* At Risk Customers */}
        <button
          onClick={() => handleFilterClick('at_risk')}
          className={`bg-white dark:bg-white/5 backdrop-blur-xl border rounded-[2.5rem] p-6 transition-all shadow-sm text-left w-full ${
            activeFilter === 'at_risk'
              ? 'border-yellow-500 dark:border-yellow-500 shadow-lg shadow-yellow-500/30'
              : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
          }`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br ${getStatusColor('at_risk').bg} shadow-lg shadow-yellow-500/30`}>
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">
                Em Risco
              </p>
            </div>
          </div>
          <h3 className="text-4xl font-bold text-gray-900 dark:text-white">
            {stats.at_risk}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            15-30 dias sem visitar
          </p>
        </button>

        {/* Inactive Customers */}
        <button
          onClick={() => handleFilterClick('inactive')}
          className={`bg-white dark:bg-white/5 backdrop-blur-xl border rounded-[2.5rem] p-6 transition-all shadow-sm text-left w-full ${
            activeFilter === 'inactive'
              ? 'border-red-500 dark:border-red-500 shadow-lg shadow-red-500/30'
              : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
          }`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br ${getStatusColor('inactive').bg} shadow-lg shadow-red-500/30`}>
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">
                Inativos
              </p>
            </div>
          </div>
          <h3 className="text-4xl font-bold text-gray-900 dark:text-white">
            {stats.inactive}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Mais de 30 dias sem visitar
          </p>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Filtered Customers Section (when a filter is active) */}
      {activeFilter && customersToShow.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            {activeFilter === 'inactive' && <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />}
            {activeFilter === 'at_risk' && <TrendingUp className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />}
            {activeFilter === 'active' && <Users className="w-6 h-6 text-green-600 dark:text-green-400" />}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {activeFilter === 'inactive' && 'Clientes Inativos'}
              {activeFilter === 'at_risk' && 'Clientes em Risco'}
              {activeFilter === 'active' && 'Clientes Ativos'}
            </h2>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              activeFilter === 'inactive' ? 'bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400' :
              activeFilter === 'at_risk' ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400' :
              'bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400'
            }`}>
              {customersToShow.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customersToShow.map((customer) => {
              const statusColor = getStatusColor(customer.health_status)
              
              return (
                <div
                  key={customer.client_phone}
                  className={`group bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-[2rem] p-6 transition-all shadow-sm hover:shadow-lg ${
                    activeFilter === 'inactive' ? 'hover:border-red-500/50 dark:hover:border-red-500/50 hover:shadow-red-500/20 dark:hover:shadow-red-500/10 hover:scale-[1.02] cursor-pointer' :
                    activeFilter === 'at_risk' ? 'hover:border-yellow-500/50 dark:hover:border-yellow-500/50 hover:shadow-yellow-500/20 dark:hover:shadow-yellow-500/10' :
                    'hover:border-green-500/50 dark:hover:border-green-500/50 hover:shadow-green-500/20 dark:hover:shadow-green-500/10'
                  }`}
                >
                  {/* Customer Info */}
                  <div className="flex items-start gap-4 mb-4">
                    {/* Avatar */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br ${statusColor.bg} text-white font-bold text-lg flex-shrink-0`}>
                      {customer.client_name?.charAt(0).toUpperCase() || '?'}
                    </div>

                    {/* Name and Status */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                        {customer.client_name || 'Cliente'}
                      </h3>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${statusColor.bgLight} ${statusColor.text} border ${statusColor.border} mt-1`}>
                        {getStatusLabel(customer.health_status)}
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="space-y-3 mb-4">
                    {/* Last Visit */}
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">
                        Última visita: <span className="font-semibold text-gray-900 dark:text-white">
                          {formatDaysAgo(customer.days_since_last_visit)}
                        </span>
                      </span>
                    </div>

                    {/* Total Visits */}
                    <div className="flex items-center gap-2 text-sm">
                      <Scissors className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">
                        Total de visitas: <span className="font-semibold text-gray-900 dark:text-white">
                          {customer.total_visits}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* WhatsApp Button */}
                  <button
                    onClick={() => openWhatsApp(customer.client_phone, customer.client_name)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-all active:scale-95 shadow-lg shadow-green-500/30"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Enviar WhatsApp
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Inactive Customers Section */}
      {showInactiveSection && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Recupere estes Clientes
            </h2>
            <span className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-full text-sm font-semibold">
              {inactiveCustomers.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inactiveCustomers.map((customer) => {
              const statusColor = getStatusColor(customer.health_status)
              
              return (
                <div
                  key={customer.client_phone}
                  className="group bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-[2rem] p-6 hover:border-red-500/50 dark:hover:border-red-500/50 transition-all shadow-sm hover:shadow-lg hover:shadow-red-500/20 dark:hover:shadow-red-500/10 hover:scale-[1.02] cursor-pointer"
                >
                  {/* Customer Info */}
                  <div className="flex items-start gap-4 mb-4">
                    {/* Avatar */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br ${statusColor.bg} text-white font-bold text-lg flex-shrink-0`}>
                      {customer.client_name?.charAt(0).toUpperCase() || '?'}
                    </div>

                    {/* Name and Status */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                        {customer.client_name || 'Cliente'}
                      </h3>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${statusColor.bgLight} ${statusColor.text} border ${statusColor.border} mt-1`}>
                        {getStatusLabel(customer.health_status)}
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="space-y-3 mb-4">
                    {/* Last Visit */}
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">
                        Última visita: <span className="font-semibold text-gray-900 dark:text-white">
                          {formatDaysAgo(customer.days_since_last_visit)}
                        </span>
                      </span>
                    </div>

                    {/* Total Visits */}
                    <div className="flex items-center gap-2 text-sm">
                      <Scissors className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">
                        Total de visitas: <span className="font-semibold text-gray-900 dark:text-white">
                          {customer.total_visits}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* WhatsApp Button */}
                  <button
                    onClick={() => openWhatsApp(customer.client_phone, customer.client_name)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-all active:scale-95 shadow-lg shadow-green-500/30"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Enviar WhatsApp
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* At Risk Customers Section */}
      {showAtRiskSection && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Clientes em Risco
            </h2>
            <span className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded-full text-sm font-semibold">
              {atRiskCustomers.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {atRiskCustomers.map((customer) => {
              const statusColor = getStatusColor(customer.health_status)
              
              return (
                <div
                  key={customer.client_phone}
                  className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-[2rem] p-6 hover:border-yellow-500/50 dark:hover:border-yellow-500/50 transition-all shadow-sm hover:shadow-lg hover:shadow-yellow-500/20 dark:hover:shadow-yellow-500/10"
                >
                  {/* Customer Info */}
                  <div className="flex items-start gap-4 mb-4">
                    {/* Avatar */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br ${statusColor.bg} text-white font-bold text-lg flex-shrink-0`}>
                      {customer.client_name?.charAt(0).toUpperCase() || '?'}
                    </div>

                    {/* Name and Status */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                        {customer.client_name || 'Cliente'}
                      </h3>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${statusColor.bgLight} ${statusColor.text} border ${statusColor.border} mt-1`}>
                        {getStatusLabel(customer.health_status)}
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="space-y-3 mb-4">
                    {/* Last Visit */}
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">
                        Última visita: <span className="font-semibold text-gray-900 dark:text-white">
                          {formatDaysAgo(customer.days_since_last_visit)}
                        </span>
                      </span>
                    </div>

                    {/* Total Visits */}
                    <div className="flex items-center gap-2 text-sm">
                      <Scissors className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">
                        Total de visitas: <span className="font-semibold text-gray-900 dark:text-white">
                          {customer.total_visits}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* WhatsApp Button */}
                  <button
                    onClick={() => openWhatsApp(customer.client_phone, customer.client_name)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-all active:scale-95 shadow-lg shadow-green-500/30"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Enviar WhatsApp
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredCustomers.length === 0 && !loading && (
        <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-[2rem] p-12 text-center">
          <Users className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Nenhum cliente encontrado
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm ? 'Tente buscar com outros termos' : 'Ainda não há clientes cadastrados'}
          </p>
        </div>
      )}
    </div>
  )
}
