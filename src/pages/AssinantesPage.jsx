import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { showToast } from '../components/Toast'
import { formatPhone, validatePhone } from '../utils/phoneMask'
import { 
  Users, Plus, Target, DollarSign, 
  Calendar, X, Edit2, Trash2, Loader2, Settings, Package
} from 'lucide-react'

/**
 * AssinantesPage - Subscription Management
 * Manage recurring customer subscriptions with custom plans
 */
export default function AssinantesPage() {
  // States
  const [barbershopId, setBarbershopId] = useState(null)
  const [subscriptions, setSubscriptions] = useState([])
  const [plans, setPlans] = useState([])
  const [currentGoal, setCurrentGoal] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false)
  const [isPlansModalOpen, setIsPlansModalOpen] = useState(false)
  const [isPlanFormOpen, setIsPlanFormOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingSubscription, setEditingSubscription] = useState(null)
  const [editingPlan, setEditingPlan] = useState(null)
  const [filterStatus, setFilterStatus] = useState('active')
  
  // Form states
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    plan_id: '',
    start_date: new Date().toISOString().split('T')[0],
    notes: ''
  })

  const [planForm, setPlanForm] = useState({
    name: '',
    description: '',
    price: '',
    duration_days: 30
  })

  const [goalForm, setGoalForm] = useState({
    target_count: '',
    target_revenue: ''
  })

  // Stats
  const [stats, setStats] = useState({
    activeCount: 0,
    totalRevenue: 0
  })

  useEffect(() => {
    fetchBarbershopId()
  }, [])

  useEffect(() => {
    if (barbershopId) {
      fetchSubscriptions()
      fetchPlans()
      fetchCurrentGoal()
    }
  }, [barbershopId])

  const fetchBarbershopId = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: barberData } = await supabase
        .from('barbers')
        .select('barbershop_id')
        .eq('profile_id', user.id)
        .single()

      if (barberData) {
        setBarbershopId(barberData.barbershop_id)
      }
    } catch (err) {
      console.error('Error fetching barbershop:', err)
    }
  }

  const fetchSubscriptions = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('barbershop_id', barbershopId)
        .order('created_at', { ascending: false })

      if (error) throw error

      setSubscriptions(data || [])
      calculateStats(data || [])
    } catch (err) {
      console.error('Error fetching subscriptions:', err)
      showToast.error('Erro ao carregar assinantes')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('barbershop_id', barbershopId)
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (error) throw error
      setPlans(data || [])
    } catch (err) {
      console.error('Error fetching plans:', err)
    }
  }

  const fetchCurrentGoal = async () => {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7)
      const { data } = await supabase
        .from('subscription_goals')
        .select('*')
        .eq('barbershop_id', barbershopId)
        .eq('month_year', currentMonth)
        .single()

      setCurrentGoal(data)
    } catch (err) {
      console.error('Error fetching goal:', err)
    }
  }

  const calculateStats = (subs) => {
    const active = subs.filter(s => s.status === 'active')
    const totalRevenue = active.reduce((sum, s) => sum + parseFloat(s.plan_value), 0)

    setStats({
      activeCount: active.length,
      totalRevenue
    })
  }

  const handlePhoneChange = (e) => {
    const formatted = formatPhone(e.target.value)
    setFormData({ ...formData, customer_phone: formatted })
  }

  const handlePlanSelect = (e) => {
    const planId = e.target.value
    setFormData({ ...formData, plan_id: planId })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validar telefone se preenchido
    if (formData.customer_phone && !validatePhone(formData.customer_phone)) {
      showToast.error('Telefone inválido. Use o formato (11) 99999-9999')
      return
    }

    setIsSaving(true)

    try {
      const selectedPlan = plans.find(p => p.id === formData.plan_id)
      if (!selectedPlan) {
        showToast.error('Selecione um plano')
        return
      }

      const subscriptionData = {
        barbershop_id: barbershopId,
        plan_id: selectedPlan.id,
        plan_type: 'custom',
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone || null,
        customer_email: formData.customer_email || null,
        plan_name: selectedPlan.name,
        plan_value: parseFloat(selectedPlan.price),
        duration_days: selectedPlan.duration_days,
        start_date: formData.start_date,
        status: 'active',
        notes: formData.notes || null
      }

      if (editingSubscription) {
        const { error } = await supabase
          .from('subscriptions')
          .update(subscriptionData)
          .eq('id', editingSubscription.id)

        if (error) throw error
        showToast.success('Assinante atualizado com sucesso!')
      } else {
        const { error } = await supabase
          .from('subscriptions')
          .insert([subscriptionData])

        if (error) throw error
        showToast.success('Assinante cadastrado com sucesso!')
      }

      closeModal()
      fetchSubscriptions()
    } catch (err) {
      console.error('Error saving subscription:', err)
      showToast.error('Erro ao salvar assinante')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePlanSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const planData = {
        barbershop_id: barbershopId,
        name: planForm.name,
        description: planForm.description || null,
        price: parseFloat(planForm.price),
        duration_days: parseInt(planForm.duration_days),
        is_active: true
      }

      if (editingPlan) {
        const { error } = await supabase
          .from('subscription_plans')
          .update(planData)
          .eq('id', editingPlan.id)

        if (error) throw error
        showToast.success('Plano atualizado!')
      } else {
        const { error } = await supabase
          .from('subscription_plans')
          .insert([planData])

        if (error) throw error
        showToast.success('Plano criado!')
      }

      // Fechar o modal de criar/editar plano
      setIsPlanFormOpen(false)
      setEditingPlan(null)
      
      // Recarregar a lista de planos
      await fetchPlans()
    } catch (err) {
      console.error('Error saving plan:', err)
      showToast.error('Erro ao salvar plano')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeletePlan = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este plano?')) return

    try {
      const { error } = await supabase
        .from('subscription_plans')
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error
      showToast.success('Plano desativado')
      fetchPlans()
    } catch (err) {
      console.error('Error deleting plan:', err)
      showToast.error('Erro ao excluir plano')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este assinante?')) return

    try {
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', id)

      if (error) throw error
      showToast.success('Assinante excluído')
      fetchSubscriptions()
    } catch (err) {
      console.error('Error deleting subscription:', err)
      showToast.error('Erro ao excluir assinante')
    }
  }

  const handleGoalSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const currentMonth = new Date().toISOString().slice(0, 7)
      const goalData = {
        barbershop_id: barbershopId,
        month_year: currentMonth,
        target_count: parseInt(goalForm.target_count),
        target_revenue: parseFloat(goalForm.target_revenue) || null
      }

      const { error } = await supabase
        .from('subscription_goals')
        .upsert([goalData], { onConflict: 'barbershop_id,month_year' })

      if (error) throw error
      showToast.success('Meta atualizada!')
      setIsGoalModalOpen(false)
      fetchCurrentGoal()
    } catch (err) {
      console.error('Error saving goal:', err)
      showToast.error('Erro ao salvar meta')
    } finally {
      setIsSaving(false)
    }
  }

  const openModal = (subscription = null) => {
    if (subscription) {
      setEditingSubscription(subscription)
      setFormData({
        customer_name: subscription.customer_name,
        customer_phone: subscription.customer_phone || '',
        customer_email: subscription.customer_email || '',
        plan_id: subscription.plan_id || '',
        start_date: subscription.start_date,
        notes: subscription.notes || ''
      })
    } else {
      setEditingSubscription(null)
      setFormData({
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        plan_id: '',
        start_date: new Date().toISOString().split('T')[0],
        notes: ''
      })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingSubscription(null)
  }

  const openPlanForm = (plan = null) => {
    if (plan) {
      setEditingPlan(plan)
      setPlanForm({
        name: plan.name,
        description: plan.description || '',
        price: plan.price,
        duration_days: plan.duration_days
      })
    } else {
      setEditingPlan(null)
      setPlanForm({
        name: '',
        description: '',
        price: '',
        duration_days: 30
      })
    }
    setIsPlanFormOpen(true)
  }

  const closePlanForm = () => {
    setIsPlanFormOpen(false)
    setEditingPlan(null)
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400'
      case 'inactive': return 'bg-gray-100 dark:bg-gray-500/10 text-gray-600 dark:text-gray-400'
      case 'cancelled': return 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400'
      default: return 'bg-gray-100 dark:bg-gray-500/10 text-gray-600 dark:text-gray-400'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return 'Ativo'
      case 'inactive': return 'Inativo'
      case 'cancelled': return 'Cancelado'
      default: return status
    }
  }

  const filteredSubscriptions = subscriptions.filter(s => 
    filterStatus === 'all' ? true : s.status === filterStatus
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Assinantes
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Gerencie planos e assinaturas
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsPlansModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-xl text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Planos</span>
            </button>
            <button
              onClick={() => setIsGoalModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-xl text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Meta</span>
            </button>
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-600 transition-all shadow-lg shadow-indigo-500/30"
            >
              <Plus className="w-4 h-4" />
              Novo Assinante
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Active Subscribers */}
          <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Assinantes Ativos</span>
              <div className="p-2 bg-indigo-100 dark:bg-indigo-500/10 rounded-lg">
                <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.activeCount}</p>
            {currentGoal && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-full transition-all"
                    style={{ width: `${Math.min((stats.activeCount / currentGoal.target_count) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {currentGoal.target_count}
                </span>
              </div>
            )}
          </div>

          {/* Total Revenue */}
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-500 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-indigo-100">Receita Mensal</span>
              <div className="p-2 bg-white/20 rounded-lg">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
            <p className="text-xs text-indigo-100 mt-1">Planos ativos</p>
          </div>
        </div>

        {/* Subscriptions List */}
        <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-[#2A2A2A]">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Lista de Assinantes</h2>
            
            {/* Filter Tabs */}
            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-900/50 rounded-xl">
              <button
                onClick={() => setFilterStatus('all')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  filterStatus === 'all'
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilterStatus('active')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  filterStatus === 'active'
                    ? 'bg-white dark:bg-gray-800 text-green-600 dark:text-green-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                Ativos
              </button>
              <button
                onClick={() => setFilterStatus('inactive')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  filterStatus === 'inactive'
                    ? 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                Inativos
              </button>
            </div>
          </div>

          <div className="p-6">
            {filteredSubscriptions.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Nenhum assinante encontrado</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSubscriptions.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800 gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                          {sub.customer_name}
                        </h4>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${getStatusColor(sub.status)}`}>
                          {getStatusLabel(sub.status)}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                          {sub.plan_name}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {sub.customer_phone && (
                          <span>{sub.customer_phone}</span>
                        )}
                        {sub.customer_email && (
                          <>
                            <span>•</span>
                            <span>{sub.customer_email}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                          {formatCurrency(sub.plan_value)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          /{sub.duration_days} dias
                        </p>
                      </div>
                      
                      <div className="flex gap-1">
                        <button
                          onClick={() => openModal(sub)}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(sub.id)}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Subscription Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
            <div className="relative bg-white dark:bg-[#1A1A1A] rounded-2xl w-full max-w-md border border-gray-200 dark:border-[#2A2A2A] shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-[#2A2A2A]">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingSubscription ? 'Editar Assinante' : 'Novo Assinante'}
                </h2>
                <button onClick={closeModal} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-2">
                    Nome do Cliente *
                  </label>
                  <input
                    type="text"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-2">
                      Telefone
                    </label>
                    <input
                      type="tel"
                      value={formData.customer_phone}
                      onChange={handlePhoneChange}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
                      placeholder="(11) 99999-9999"
                      maxLength={15}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.customer_email}
                      onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-2">
                    Plano *
                  </label>
                  <select
                    value={formData.plan_id}
                    onChange={handlePlanSelect}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
                    required
                  >
                    <option value="">Selecione um plano</option>
                    {plans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} - {formatCurrency(plan.price)} / {plan.duration_days} dias
                      </option>
                    ))}
                  </select>
                  {plans.length === 0 && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                      ⚠️ Crie um plano primeiro na aba "Planos"
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-2">
                    Data de Início *
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-2">
                    Observações
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows="3"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || plans.length === 0}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold rounded-xl disabled:opacity-50"
                  >
                    {isSaving ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Plans Management Modal */}
        {isPlansModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
            <div className="relative bg-white dark:bg-[#1A1A1A] rounded-2xl w-full max-w-2xl border border-gray-200 dark:border-[#2A2A2A] shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-[#2A2A2A]">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Gerenciar Planos</h2>
                <button onClick={() => setIsPlansModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <button
                  onClick={() => openPlanForm()}
                  className="w-full mb-4 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-600 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Criar Novo Plano
                </button>

                {plans.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Nenhum plano cadastrado</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {plans.map((plan) => (
                      <div
                        key={plan.id}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800"
                      >
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                            {plan.name}
                          </h4>
                          {plan.description && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {plan.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                              {formatCurrency(plan.price)}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              / {plan.duration_days} dias
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex gap-1">
                          <button
                            onClick={() => openPlanForm(plan)}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePlan(plan.id)}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Plan Form Modal */}
        {isPlanFormOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
            <div className="relative bg-white dark:bg-[#1A1A1A] rounded-2xl w-full max-w-md border border-gray-200 dark:border-[#2A2A2A] shadow-2xl">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-[#2A2A2A]">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingPlan ? 'Editar Plano' : 'Novo Plano'}
                </h2>
                <button onClick={closePlanForm} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handlePlanSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-2">
                    Nome do Plano *
                  </label>
                  <input
                    type="text"
                    value={planForm.name}
                    onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
                    placeholder="Ex: Plano Mensal"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={planForm.description}
                    onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                    rows="2"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white resize-none"
                    placeholder="Descrição opcional"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-2">
                      Preço *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={planForm.price}
                      onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-2">
                      Duração (dias) *
                    </label>
                    <input
                      type="number"
                      value={planForm.duration_days}
                      onChange={(e) => setPlanForm({ ...planForm, duration_days: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
                      placeholder="30"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closePlanForm}
                    className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold rounded-xl disabled:opacity-50"
                  >
                    {isSaving ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Goal Modal */}
        {isGoalModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
            <div className="relative bg-white dark:bg-[#1A1A1A] rounded-2xl w-full max-w-md border border-gray-200 dark:border-[#2A2A2A] shadow-2xl">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-[#2A2A2A]">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Meta do Mês</h2>
                <button onClick={() => setIsGoalModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleGoalSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-2">
                    Quantidade de Assinantes *
                  </label>
                  <input
                    type="number"
                    value={goalForm.target_count}
                    onChange={(e) => setGoalForm({ ...goalForm, target_count: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
                    placeholder={currentGoal?.target_count || '50'}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-2">
                    Receita Alvo (Opcional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={goalForm.target_revenue}
                    onChange={(e) => setGoalForm({ ...goalForm, target_revenue: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
                    placeholder="5000.00"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsGoalModalOpen(false)}
                    className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold rounded-xl disabled:opacity-50"
                  >
                    {isSaving ? 'Salvando...' : 'Salvar Meta'}
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
