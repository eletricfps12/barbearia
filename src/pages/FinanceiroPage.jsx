import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, TrendingUp, TrendingDown, DollarSign, X, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { showToast } from '../components/Toast'
import { 
  BarChart, Bar, PieChart, Pie, Cell, 
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend 
} from 'recharts'

/**
 * FinanceiroPage Component - Premium Financial Dashboard
 * 
 * Features:
 * - Summary cards with trends
 * - Bar chart for daily/weekly revenue
 * - Pie chart for expense categories
 * - Transaction list
 * - Manual income/expense registration
 */
export default function FinanceiroPage() {
  // Filter states
  const [selectedPeriod, setSelectedPeriod] = useState('current_month')
  const [selectedBarber, setSelectedBarber] = useState('all')
  
  // Data states
  const [barbershopId, setBarbershopId] = useState(null)
  const [barbers, setBarbers] = useState([])
  const [summary, setSummary] = useState({
    income: 0,
    expenses: 0,
    profit: 0,
    avgTicket: 0,
    trend: 0,
    houseProfit: 0 // Lucro da casa (sobra após comissões)
  })
  const [chartData, setChartData] = useState([])
  const [expensesByCategory, setExpensesByCategory] = useState([])
  const [transactions, setTransactions] = useState([])
  const [commissionsData, setCommissionsData] = useState([])
  const [expandedBarber, setExpandedBarber] = useState(null)
  
  // UI states
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalType, setModalType] = useState('income')
  const [isSaving, setIsSaving] = useState(false)
  const [transactionFilter, setTransactionFilter] = useState('all') // 'all', 'income', 'expense'
  const [isCashModalOpen, setIsCashModalOpen] = useState(false)
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false)
  const [selectedBarberForPayout, setSelectedBarberForPayout] = useState(null)
  const [cashBalance, setCashBalance] = useState(0)
  
  // Form states
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    barber_id: '',
    is_recurring: false,
    recurrence_day: ''
  })

  // Cash reconciliation form
  const [cashForm, setCashForm] = useState({
    expected_cash: 0,
    actual_cash: '',
    notes: ''
  })

  // Colors for charts
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

  useEffect(() => {
    fetchBarbershopId()
  }, [])

  useEffect(() => {
    if (barbershopId) {
      fetchBarbers()
    }
  }, [barbershopId])

  useEffect(() => {
    if (barbershopId) {
      fetchFinancialData()
    }
  }, [barbershopId, selectedPeriod, selectedBarber])

  const fetchBarbershopId = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setIsLoading(false)
        return
      }

      // First, try to find if user is the owner of a barbershop
      const { data: barbershopData, error: barbershopError } = await supabase
        .from('barbershops')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle()

      if (barbershopData) {
        // User is the owner
        setBarbershopId(barbershopData.id)
        return
      }

      // If not owner, check if user is a barber
      const { data: barberData, error: barberError } = await supabase
        .from('barbers')
        .select('barbershop_id')
        .eq('profile_id', user.id)
        .single()

      if (barberError) throw barberError
      setBarbershopId(barberData.barbershop_id)
    } catch (err) {
      console.error('Error fetching barbershop ID:', err)
      setIsLoading(false)
    }
  }

  const fetchBarbers = async () => {
    try {
      const { data, error } = await supabase
        .from('barbers')
        .select('id, name, avatar_url, commission_percentage')
        .eq('barbershop_id', barbershopId)
        .order('name', { ascending: true })

      if (error) throw error
      setBarbers(data || [])
    } catch (err) {
      console.error('Error fetching barbers:', err)
    }
  }

  const getDateRange = () => {
    const now = new Date()
    let startDate, endDate

    switch (selectedPeriod) {
      case 'today':
        startDate = new Date(now)
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date(now)
        endDate.setHours(23, 59, 59, 999)
        break
      case 'this_week':
        const dayOfWeek = now.getDay()
        startDate = new Date(now)
        startDate.setDate(now.getDate() - dayOfWeek)
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date(now)
        endDate.setHours(23, 59, 59, 999)
        break
      case 'current_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
        break
      case 'last_month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    }

    return { startDate, endDate }
  }

  const calculateCommissions = async (appointmentsData, barbersList, transactionsData) => {
    try {
      // Use the barbersList passed as parameter instead of state
      const barbersToUse = barbersList || barbers
      
      // Group appointments by barber
      const barberData = {}
      
      // Add appointments revenue
      appointmentsData.forEach(apt => {
        if (!apt.barber_id) return
        
        if (!barberData[apt.barber_id]) {
          barberData[apt.barber_id] = {
            appointments: [],
            manualIncomes: [],
            totalRevenue: 0,
            cashRevenue: 0
          }
        }
        
        barberData[apt.barber_id].appointments.push(apt)
        barberData[apt.barber_id].totalRevenue += (apt.services?.price || 0)
      })

      // Add manual income transactions (dinheiro vivo)
      transactionsData.filter(t => t.type === 'income' && t.barber_id).forEach(transaction => {
        if (!barberData[transaction.barber_id]) {
          barberData[transaction.barber_id] = {
            appointments: [],
            manualIncomes: [],
            totalRevenue: 0,
            cashRevenue: 0
          }
        }
        
        barberData[transaction.barber_id].manualIncomes.push(transaction)
        const amount = parseFloat(transaction.amount)
        barberData[transaction.barber_id].totalRevenue += amount
        barberData[transaction.barber_id].cashRevenue += amount
      })

      // Calculate commission for each barber
      const commissionsArray = []
      let totalHouseProfit = 0
      
      for (const barber of barbersToUse) {
        const data = barberData[barber.id]
        
        if (!data) {
          commissionsArray.push({
            barber_id: barber.id,
            barber_name: barber.name,
            barber_avatar: barber.avatar_url,
            commission_percentage: barber.commission_percentage || 0,
            total_revenue: 0,
            cash_revenue: 0,
            commission_amount: 0,
            house_profit: 0,
            appointments_count: 0,
            appointments: [],
            manual_incomes: []
          })
          continue
        }

        const commissionPercentage = barber.commission_percentage || 0
        const commissionAmount = (data.totalRevenue * commissionPercentage) / 100
        const houseProfit = data.totalRevenue - commissionAmount

        totalHouseProfit += houseProfit

        commissionsArray.push({
          barber_id: barber.id,
          barber_name: barber.name,
          barber_avatar: barber.avatar_url,
          commission_percentage: commissionPercentage,
          total_revenue: data.totalRevenue,
          cash_revenue: data.cashRevenue,
          commission_amount: commissionAmount,
          house_profit: houseProfit,
          appointments_count: data.appointments.length,
          appointments: data.appointments,
          manual_incomes: data.manualIncomes
        })
      }

      // Sort by total revenue (descending)
      commissionsArray.sort((a, b) => b.total_revenue - a.total_revenue)
      
      setCommissionsData(commissionsArray)
      
      // Return total house profit to update summary
      return totalHouseProfit
    } catch (err) {
      console.error('Error calculating commissions:', err)
      return 0
    }
  }

  const toggleBarberDetails = (barberId) => {
    setExpandedBarber(expandedBarber === barberId ? null : barberId)
  }

  const getInitials = (name) => {
    if (!name) return '?'
    const parts = name.trim().split(' ')
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
  }

  const fetchFinancialData = async () => {
    try {
      setIsLoading(true)
      const { startDate, endDate } = getDateRange()

      // STEP 0: Fetch barbers FIRST to avoid race condition
      const { data: barbersData, error: barbersError } = await supabase
        .from('barbers')
        .select('id, name, avatar_url, commission_percentage')
        .eq('barbershop_id', barbershopId)
        .order('name', { ascending: true })

      if (barbersError) throw barbersError
      const barbersList = barbersData || []
      setBarbers(barbersList) // Update state for other uses

      // 1. Fetch completed appointments
      let appointmentsQuery = supabase
        .from('appointments')
        .select('start_time, services(price), barber_id')
        .eq('barbershop_id', barbershopId)
        .eq('status', 'completed')
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString())

      if (selectedBarber !== 'all') {
        appointmentsQuery = appointmentsQuery.eq('barber_id', selectedBarber)
      }

      const { data: appointmentsData, error: appointmentsError } = await appointmentsQuery
      if (appointmentsError) throw appointmentsError

      const appointmentsIncome = (appointmentsData || []).reduce(
        (sum, apt) => sum + (apt.services?.price || 0), 0
      )

      // 2. Fetch manual transactions
      let transactionsQuery = supabase
        .from('financial_transactions')
        .select('*, barbers(name)')
        .eq('barbershop_id', barbershopId)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: false })

      if (selectedBarber !== 'all') {
        transactionsQuery = transactionsQuery.eq('barber_id', selectedBarber)
      }

      const { data: transactionsData, error: transactionsError } = await transactionsQuery
      if (transactionsError) throw transactionsError

      const manualIncome = (transactionsData || [])
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0)

      const expenses = (transactionsData || [])
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0)

      const totalIncome = appointmentsIncome + manualIncome
      const profit = totalIncome - expenses
      const avgTicket = appointmentsData.length > 0 ? totalIncome / appointmentsData.length : 0

      // 3. Prepare chart data (daily revenue)
      const dailyData = {}
      appointmentsData.forEach(apt => {
        const date = new Date(apt.start_time).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
        dailyData[date] = (dailyData[date] || 0) + (apt.services?.price || 0)
      })

      const chartDataArray = Object.entries(dailyData).map(([date, value]) => ({
        date,
        receita: value
      })).slice(0, 15)

      // 4. Prepare expense categories for pie chart
      const categoryData = {}
      transactionsData.filter(t => t.type === 'expense').forEach(t => {
        categoryData[t.category] = (categoryData[t.category] || 0) + parseFloat(t.amount)
      })

      const expensesArray = Object.entries(categoryData).map(([name, value]) => ({
        name,
        value
      }))

      // 5. Calculate commissions per barber - PASS barbersList AND transactionsData
      const totalHouseProfit = await calculateCommissions(appointmentsData, barbersList, transactionsData)

      setSummary({
        income: totalIncome,
        expenses,
        profit,
        avgTicket,
        trend: 0,
        houseProfit: totalHouseProfit
      })
      setChartData(chartDataArray)
      setExpensesByCategory(expensesArray)
      setTransactions(transactionsData || [])
      
      // Calculate cash balance (cash income - cash expenses)
      const cashIncome = (transactionsData || [])
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0)
      
      const cashExpenses = (transactionsData || [])
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0)
      
      setCashBalance(cashIncome - cashExpenses)
      
      setIsLoading(false)
    } catch (err) {
      console.error('Error fetching financial data:', err)
      setIsLoading(false)
    }
  }

  const handlePayoutBarber = async () => {
    if (!selectedBarberForPayout) return

    try {
      setIsSaving(true)
      const { startDate, endDate } = getDateRange()
      const { data: { user } } = await supabase.auth.getUser()

      // Insert payment record
      const { error } = await supabase
        .from('commission_payments')
        .insert([{
          barbershop_id: barbershopId,
          barber_id: selectedBarberForPayout.barber_id,
          period_start: startDate.toISOString().split('T')[0],
          period_end: endDate.toISOString().split('T')[0],
          total_revenue: selectedBarberForPayout.total_revenue,
          commission_percentage: selectedBarberForPayout.commission_percentage,
          commission_amount: selectedBarberForPayout.commission_amount,
          paid_by: user?.id
        }])

      if (error) throw error

      showToast.success(
        `Repasse de ${formatCurrency(selectedBarberForPayout.commission_amount)} registrado com sucesso!`,
        'Repasse Realizado'
      )
      setIsPayoutModalOpen(false)
      setSelectedBarberForPayout(null)
      await fetchFinancialData()
    } catch (err) {
      console.error('Error processing payout:', err)
      showToast.error(
        'Não foi possível processar o repasse. Tente novamente.',
        'Erro no Repasse'
      )
    } finally {
      setIsSaving(false)
    }
  }

  const openCashReconciliation = () => {
    // Calculate expected cash from transactions
    const expectedCash = cashBalance
    setCashForm({
      expected_cash: expectedCash,
      actual_cash: '',
      notes: ''
    })
    setIsCashModalOpen(true)
  }

  const handleCashReconciliation = async (e) => {
    e.preventDefault()
    
    try {
      setIsSaving(true)
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase
        .from('cash_reconciliation')
        .upsert([{
          barbershop_id: barbershopId,
          date: new Date().toISOString().split('T')[0],
          expected_cash: parseFloat(cashForm.expected_cash),
          actual_cash: parseFloat(cashForm.actual_cash),
          notes: cashForm.notes || null,
          reconciled_by: user?.id
        }], {
          onConflict: 'barbershop_id,date'
        })

      if (error) throw error

      const difference = parseFloat(cashForm.actual_cash) - parseFloat(cashForm.expected_cash)
      
      if (difference === 0) {
        showToast.success(
          'Os valores conferem perfeitamente!',
          'Caixa Fechado'
        )
      } else if (difference > 0) {
        showToast.info(
          `Sobra de ${formatCurrency(Math.abs(difference))} no caixa.`,
          'Caixa Fechado'
        )
      } else {
        showToast.warning(
          `Falta de ${formatCurrency(Math.abs(difference))} no caixa.`,
          'Caixa Fechado'
        )
      }
      
      setIsCashModalOpen(false)
    } catch (err) {
      console.error('Error reconciling cash:', err)
      showToast.error(
        'Não foi possível fechar o caixa. Tente novamente.',
        'Erro no Fechamento'
      )
    } finally {
      setIsSaving(false)
    }
  }

  const openModal = (type) => {
    setModalType(type)
    setFormData({
      amount: '',
      category: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      barber_id: '',
      is_recurring: false,
      recurrence_day: ''
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setFormData({
      amount: '',
      category: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      barber_id: '',
      is_recurring: false,
      recurrence_day: ''
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.amount || !formData.category) {
      showToast.warning(
        'Preencha o valor e a categoria para continuar.',
        'Campos Obrigatórios'
      )
      return
    }

    try {
      setIsSaving(true)
      const transactionData = {
        barbershop_id: barbershopId,
        type: modalType,
        category: formData.category.trim(),
        amount: parseFloat(formData.amount),
        description: formData.description.trim() || null,
        date: formData.date,
        barber_id: formData.barber_id || null,
        is_recurring: formData.is_recurring,
        recurrence_day: formData.is_recurring && formData.recurrence_day ? parseInt(formData.recurrence_day) : null
      }

      const { error } = await supabase
        .from('financial_transactions')
        .insert([transactionData])

      if (error) throw error
      
      const transactionType = modalType === 'income' ? 'Entrada' : 'Despesa'
      showToast.success(
        `${transactionType} de ${formatCurrency(parseFloat(formData.amount))} registrada com sucesso!`,
        `${transactionType} Registrada`
      )
      
      await fetchFinancialData()
      closeModal()
    } catch (err) {
      console.error('Error saving transaction:', err)
      showToast.error(
        'Não foi possível salvar a transação. Verifique os dados e tente novamente.',
        'Erro ao Salvar'
      )
    } finally {
      setIsSaving(false)
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getPeriodLabel = () => {
    const labels = {
      today: 'Hoje',
      this_week: 'Esta Semana',
      current_month: 'Mês Atual',
      last_month: 'Mês Anterior'
    }
    return labels[selectedPeriod] || 'Mês Atual'
  }

  if (isLoading && chartData.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando dados financeiros...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Financeiro</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {getPeriodLabel()}
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={openCashReconciliation}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all text-indigo-600 bg-indigo-100 hover:bg-indigo-200 dark:text-indigo-400 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20"
          >
            <DollarSign className="w-4 h-4" />
            Fechar Caixa
          </button>
          <button
            onClick={() => openModal('income')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all text-green-600 bg-green-100 hover:bg-green-200 dark:text-green-400 dark:bg-green-500/10 dark:hover:bg-green-500/20"
          >
            <Plus className="w-4 h-4" />
            Entrada
          </button>
          <button
            onClick={() => openModal('expense')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all text-red-600 bg-red-100 hover:bg-red-200 dark:text-red-400 dark:bg-red-500/10 dark:hover:bg-red-500/20"
          >
            <Plus className="w-4 h-4" />
            Despesa
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="px-4 py-2 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="today">Hoje</option>
          <option value="this_week">Esta Semana</option>
          <option value="current_month">Mês Atual</option>
          <option value="last_month">Mês Anterior</option>
        </select>

        <select
          value={selectedBarber}
          onChange={(e) => setSelectedBarber(e.target.value)}
          className="px-4 py-2 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todos os Profissionais</option>
          {barbers.map((barber) => (
            <option key={barber.id} value={barber.id}>
              {barber.name}
            </option>
          ))}
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Revenue Card */}
        <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl p-6 shadow-sm dark:shadow-none">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Faturamento</span>
            <div className="p-2 bg-blue-100 dark:bg-blue-500/10 rounded-lg">
              <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(summary.income)}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <ArrowUpRight className="w-4 h-4 text-green-500" />
                <span className="text-xs text-green-500 font-medium">+2.5%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cash Balance Card (NEW) */}
        <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl p-6 shadow-sm dark:shadow-none">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Saldo em Espécie</span>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-500/10 rounded-lg">
              <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(cashBalance)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Dinheiro Vivo</p>
            </div>
          </div>
        </div>

        {/* House Profit Card (NEW) */}
        <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl p-6 shadow-sm dark:shadow-none">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Lucro Comissões</span>
            <div className="p-2 bg-indigo-100 dark:bg-indigo-500/10 rounded-lg">
              <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
              </svg>
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {formatCurrency(summary.houseProfit)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Sobra da Casa</p>
            </div>
          </div>
        </div>

        {/* Profit Card */}
        <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl p-6 shadow-sm dark:shadow-none">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Lucro Líquido</span>
            <div className={`p-2 rounded-lg ${
              summary.profit >= 0 
                ? 'bg-green-100 dark:bg-green-500/10' 
                : 'bg-red-100 dark:bg-red-500/10'
            }`}>
              <TrendingUp className={`w-4 h-4 ${
                summary.profit >= 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`} />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className={`text-2xl font-bold ${
                summary.profit >= 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {formatCurrency(summary.profit)}
              </p>
            </div>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl p-6 shadow-sm dark:shadow-none">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Despesas</span>
            <div className="p-2 bg-red-100 dark:bg-red-500/10 rounded-lg">
              <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(summary.expenses)}
              </p>
            </div>
          </div>
        </div>

        {/* Avg Ticket Card */}
        <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl p-6 shadow-sm dark:shadow-none">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Ticket Médio</span>
            <div className="p-2 bg-purple-100 dark:bg-purple-500/10 rounded-lg">
              <DollarSign className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(summary.avgTicket)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row - Minimalista e Moderno */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart - Revenue (Minimalista) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl p-6 shadow-sm dark:shadow-none">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Evolução Diária</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis 
                  dataKey="date" 
                  stroke="#9ca3af"
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#9ca3af"
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                  contentStyle={{
                    backgroundColor: 'rgba(31, 41, 55, 0.95)',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
                  }}
                  labelStyle={{ color: '#e5e7eb', fontWeight: '600', marginBottom: '4px' }}
                  itemStyle={{ color: '#60a5fa', fontSize: '14px' }}
                  formatter={(value) => formatCurrency(value)}
                />
                <Bar 
                  dataKey="receita" 
                  fill="#3b82f6" 
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-gray-400 dark:text-gray-600">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                </div>
                <p className="text-sm">Sem dados para exibir</p>
              </div>
            </div>
          )}
        </div>

        {/* Donut Chart - Expenses (Moderno) */}
        <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl p-6 shadow-sm dark:shadow-none">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Despesas</h3>
          {expensesByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={expensesByCategory}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {expensesByCategory.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                      stroke="none"
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(31, 41, 55, 0.95)',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
                  }}
                  itemStyle={{ color: '#e5e7eb', fontSize: '13px' }}
                  formatter={(value) => formatCurrency(value)}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{
                    fontSize: '11px',
                    paddingTop: '16px'
                  }}
                  formatter={(value) => (
                    <span className="text-gray-600 dark:text-gray-400">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-gray-400 dark:text-gray-600">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path>
                  </svg>
                </div>
                <p className="text-sm">Sem despesas</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Commissions Report Section */}
      <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl shadow-sm dark:shadow-none">
        <div className="p-6 border-b border-gray-200 dark:border-[#2A2A2A]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Relatório de Comissões</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Repasse por profissional no período selecionado
              </p>
            </div>
            <div className="px-4 py-2 bg-blue-100 dark:bg-blue-500/10 rounded-lg">
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                {commissionsData.length} {commissionsData.length === 1 ? 'Profissional' : 'Profissionais'}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6">
          {commissionsData.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
              </div>
              <p className="text-gray-600 dark:text-gray-400">Nenhum dado de comissão disponível</p>
            </div>
          ) : (
            <div className="space-y-4">
              {commissionsData.map((commission) => (
                <div
                  key={commission.barber_id}
                  className="border border-gray-200 dark:border-[#2A2A2A] rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Commission Summary Card - Apple Style Responsive */}
                  <div className="p-6 bg-gradient-to-r from-gray-50 to-white dark:from-gray-900/50 dark:to-[#1A1A1A]">
                    {/* Mobile: Stack vertically | Desktop: Side by side */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      {/* Top Section: Avatar + Name + Info */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          {commission.barber_avatar ? (
                            <img
                              src={commission.barber_avatar}
                              alt={commission.barber_name}
                              className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700 shadow-sm"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-500/10 dark:to-blue-400/5 flex items-center justify-center border-2 border-gray-200 dark:border-gray-700 shadow-sm">
                              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                {getInitials(commission.barber_name)}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Info: Name + Stats */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                            {commission.barber_name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {commission.appointments_count} {commission.appointments_count === 1 ? 'atendimento' : 'atendimentos'}
                            </span>
                            {commission.manual_incomes && commission.manual_incomes.length > 0 && (
                              <>
                                <span className="text-gray-400 hidden sm:inline">•</span>
                                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500/20">
                                  {commission.manual_incomes.length} entrada{commission.manual_incomes.length > 1 ? 's' : ''} manual{commission.manual_incomes.length > 1 ? 'is' : ''}
                                </span>
                              </>
                            )}
                            <span className="text-gray-400 hidden sm:inline">•</span>
                            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                              {commission.commission_percentage}% de comissão
                            </span>
                          </div>
                          {/* Cash Revenue Indicator */}
                          {commission.cash_revenue > 0 && (
                            <div className="mt-2 flex items-center gap-2">
                              <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
                              </svg>
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                Dinheiro Vivo: <span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(commission.cash_revenue)}</span>
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Financial Info Section - Responsive Grid */}
                      <div className="grid grid-cols-2 sm:flex sm:flex-col gap-3 sm:items-end sm:flex-shrink-0">
                        {/* Total Revenue */}
                        <div className="text-left sm:text-right">
                          <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-500 mb-1">
                            Valor Bruto
                          </p>
                          <p className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400">
                            {formatCurrency(commission.total_revenue)}
                          </p>
                        </div>

                        {/* Commission Amount - Apple Style Highlight */}
                        <div className="px-4 py-2 sm:px-5 sm:py-3 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-500/10 dark:to-emerald-500/5 rounded-2xl border border-green-200 dark:border-green-500/20 shadow-sm">
                          <p className="text-[10px] uppercase tracking-wider font-semibold text-green-600 dark:text-green-400 mb-1">
                            Comissão
                          </p>
                          <p className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">
                            {formatCurrency(commission.commission_amount)}
                          </p>
                        </div>

                        {/* House Profit - Subtle indicator */}
                        <div className="col-span-2 sm:col-span-1 text-left sm:text-right">
                          <p className="text-[10px] uppercase tracking-wider font-semibold text-indigo-600 dark:text-indigo-400 mb-1">
                            Lucro para a Casa
                          </p>
                          <p className="text-base sm:text-lg font-bold text-indigo-600 dark:text-indigo-400">
                            {formatCurrency(commission.house_profit)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Details Button - Apple Style */}
                    <div className="flex gap-3 mt-5">
                      {(commission.appointments_count > 0 || (commission.manual_incomes && commission.manual_incomes.length > 0)) && (
                        <button
                          onClick={() => toggleBarberDetails(commission.barber_id)}
                          className="flex-1 px-4 py-3 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-medium text-gray-700 dark:text-gray-300 transition-all active:scale-98 flex items-center justify-center gap-2"
                        >
                          {expandedBarber === commission.barber_id ? (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                              Ocultar Detalhes
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                              Ver Detalhes
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Details - Appointments and Manual Incomes List */}
                  {expandedBarber === commission.barber_id && (commission.appointments.length > 0 || (commission.manual_incomes && commission.manual_incomes.length > 0)) && (
                    <div className="border-t border-gray-200 dark:border-[#2A2A2A] bg-gray-50 dark:bg-gray-900/30">
                      <div className="p-5">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
                          Detalhamento de Receitas
                        </h4>
                        <div className="space-y-2">
                          {/* Appointments from schedule */}
                          {commission.appointments.map((apt, index) => (
                            <div
                              key={`apt-${index}`}
                              className="flex items-center justify-between p-3 bg-white dark:bg-[#1A1A1A] rounded-lg border border-gray-200 dark:border-gray-800"
                            >
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {apt.services?.name || 'Serviço'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                  {new Date(apt.start_time).toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-gray-900 dark:text-white">
                                  {formatCurrency(apt.services?.price || 0)}
                                </p>
                                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                  +{formatCurrency((apt.services?.price || 0) * (commission.commission_percentage / 100))}
                                </p>
                              </div>
                            </div>
                          ))}
                          
                          {/* Manual income transactions (dinheiro vivo) */}
                          {commission.manual_incomes && commission.manual_incomes.map((income, index) => (
                            <div
                              key={`income-${index}`}
                              className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-500/10 dark:to-emerald-500/5 rounded-lg border border-green-200 dark:border-green-500/20"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {income.category}
                                  </p>
                                  <span className="text-[10px] uppercase font-bold tracking-wider bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-0.5 rounded">
                                    Dinheiro Vivo
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                  {new Date(income.date).toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                  })}
                                  {income.description && ` • ${income.description}`}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-green-600 dark:text-green-400">
                                  {formatCurrency(parseFloat(income.amount))}
                                </p>
                                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                  +{formatCurrency(parseFloat(income.amount) * (commission.commission_percentage / 100))}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] rounded-2xl shadow-sm dark:shadow-none">
        <div className="p-6 border-b border-gray-200 dark:border-[#2A2A2A]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Transações Manuais</h2>
          </div>
          
          {/* Tabs Filter - iOS Style */}
          <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-900/50 rounded-xl">
            <button
              onClick={() => setTransactionFilter('all')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                transactionFilter === 'all'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Tudo
            </button>
            <button
              onClick={() => setTransactionFilter('income')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                transactionFilter === 'income'
                  ? 'bg-white dark:bg-gray-800 text-green-600 dark:text-green-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400'
              }`}
            >
              Entradas
            </button>
            <button
              onClick={() => setTransactionFilter('expense')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                transactionFilter === 'expense'
                  ? 'bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400'
              }`}
            >
              Saídas
            </button>
          </div>
        </div>

        <div className="p-6">
          {transactions.filter(t => transactionFilter === 'all' || t.type === transactionFilter).length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Nenhuma transação manual</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.filter(t => transactionFilter === 'all' || t.type === transactionFilter).map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`p-2 rounded-lg ${
                      transaction.type === 'income'
                        ? 'bg-green-100 dark:bg-green-500/10'
                        : 'bg-red-100 dark:bg-red-500/10'
                    }`}>
                      {transaction.type === 'income' ? (
                        <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                          {transaction.category}
                        </h4>
                        {transaction.is_recurring && (
                          <span className="text-[10px] uppercase font-bold tracking-wider bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded">
                            Recorrente
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {new Date(transaction.date).toLocaleDateString('pt-BR')}
                        </p>
                        {transaction.barbers && (
                          <>
                            <span className="text-gray-400">•</span>
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              {transaction.barbers.name}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className={`text-lg font-bold ${
                    transaction.type === 'income'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'} {formatCurrency(parseFloat(transaction.amount))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal - Apple Style */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop com blur (vidro fosco) */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-md"
            onClick={closeModal}
          />
          
          {/* Modal Card */}
          <div className="relative bg-white/95 dark:bg-[#1A1A1A]/95 backdrop-blur-xl rounded-[2.5rem] w-full max-w-md border border-white/10 dark:border-white/5 shadow-2xl animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {modalType === 'income' ? 'Nova Entrada' : 'Nova Despesa'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all"
                disabled={isSaving}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">
              {/* Valor com R$ integrado */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mb-2">
                  Valor *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-400 dark:text-gray-500">
                    R$
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full pl-14 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white text-lg font-semibold placeholder-gray-400 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    placeholder="0,00"
                    required
                    disabled={isSaving}
                  />
                </div>
              </div>

              {/* Categoria */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mb-2">
                  Categoria *
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder={modalType === 'income' ? 'Ex: Venda Avulsa' : 'Ex: Aluguel, Luz'}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  required
                  disabled={isSaving}
                />
              </div>

              {/* Profissional */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mb-2">
                  Profissional
                </label>
                <select
                  value={formData.barber_id}
                  onChange={(e) => setFormData({ ...formData, barber_id: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none cursor-pointer"
                  disabled={isSaving}
                >
                  <option value="">Nenhum</option>
                  {barbers.map((barber) => (
                    <option key={barber.id} value={barber.id}>
                      {barber.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Data */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mb-2">
                  Data *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  required
                  disabled={isSaving}
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
                  placeholder="Informações adicionais (opcional)"
                  disabled={isSaving}
                />
              </div>

              {/* Recurring Expense Option (only for expenses) */}
              {modalType === 'expense' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl border border-indigo-200 dark:border-indigo-500/20">
                    <input
                      type="checkbox"
                      id="is_recurring"
                      checked={formData.is_recurring}
                      onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                      className="w-5 h-5 text-indigo-600 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-indigo-500"
                      disabled={isSaving}
                    />
                    <label htmlFor="is_recurring" className="flex-1 cursor-pointer">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        Despesa Recorrente
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                        Lançar automaticamente todo mês
                      </p>
                    </label>
                  </div>

                  {formData.is_recurring && (
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mb-2">
                        Dia do Mês para Lançamento *
                      </label>
                      <select
                        value={formData.recurrence_day}
                        onChange={(e) => setFormData({ ...formData, recurrence_day: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none cursor-pointer"
                        required={formData.is_recurring}
                        disabled={isSaving}
                      >
                        <option value="">Selecione o dia</option>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                          <option key={day} value={day}>Dia {day}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons - Apple Style */}
              <div className="flex gap-3 pt-4">
                {/* Cancel Button - Ghost Style */}
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-full transition-all active:scale-95"
                  disabled={isSaving}
                >
                  Cancelar
                </button>
                
                {/* Save Button - Vibrant & Rounded */}
                <button
                  type="submit"
                  className={`flex-1 px-6 py-3 text-white font-semibold rounded-full shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                    modalType === 'income'
                      ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 shadow-green-500/30'
                      : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 shadow-red-500/30'
                  }`}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Salvando...
                    </span>
                  ) : (
                    'Salvar'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cash Reconciliation Modal */}
      {isCashModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-md"
            onClick={() => setIsCashModalOpen(false)}
          />
          
          <div className="relative bg-white/95 dark:bg-[#1A1A1A]/95 backdrop-blur-xl rounded-[2.5rem] w-full max-w-md border border-white/10 dark:border-white/5 shadow-2xl">
            <div className="flex items-center justify-between p-6 pb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Fechamento de Caixa
              </h2>
              <button
                onClick={() => setIsCashModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCashReconciliation} className="px-6 pb-6 space-y-5">
              <div className="p-4 bg-blue-50 dark:bg-blue-500/10 rounded-2xl border border-blue-200 dark:border-blue-500/20">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">
                  Valor Esperado em Caixa
                </p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(cashForm.expected_cash)}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Baseado nas transações manuais do período
                </p>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mb-2">
                  Valor Real em Caixa *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-400 dark:text-gray-500">
                    R$
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={cashForm.actual_cash}
                    onChange={(e) => setCashForm({ ...cashForm, actual_cash: e.target.value })}
                    className="w-full pl-14 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white text-lg font-semibold placeholder-gray-400 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    placeholder="0,00"
                    required
                  />
                </div>
              </div>

              {cashForm.actual_cash && (
                <div className={`p-4 rounded-2xl border ${
                  parseFloat(cashForm.actual_cash) === parseFloat(cashForm.expected_cash)
                    ? 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20'
                    : parseFloat(cashForm.actual_cash) > parseFloat(cashForm.expected_cash)
                    ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20'
                    : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20'
                }`}>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                    {parseFloat(cashForm.actual_cash) === parseFloat(cashForm.expected_cash)
                      ? '✓ Caixa Conferido'
                      : parseFloat(cashForm.actual_cash) > parseFloat(cashForm.expected_cash)
                      ? 'Sobra de Caixa'
                      : 'Falta de Caixa'}
                  </p>
                  <p className={`text-2xl font-bold ${
                    parseFloat(cashForm.actual_cash) === parseFloat(cashForm.expected_cash)
                      ? 'text-green-600 dark:text-green-400'
                      : parseFloat(cashForm.actual_cash) > parseFloat(cashForm.expected_cash)
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {formatCurrency(Math.abs(parseFloat(cashForm.actual_cash) - parseFloat(cashForm.expected_cash)))}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mb-2">
                  Observações
                </label>
                <textarea
                  value={cashForm.notes}
                  onChange={(e) => setCashForm({ ...cashForm, notes: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
                  placeholder="Motivo da diferença (opcional)"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCashModalOpen(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-full transition-all active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white font-semibold rounded-full shadow-lg shadow-indigo-500/30 transition-all active:scale-95"
                  disabled={isSaving}
                >
                  {isSaving ? 'Fechando...' : 'Fechar Caixa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payout Confirmation Modal */}
      {isPayoutModalOpen && selectedBarberForPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-md"
            onClick={() => setIsPayoutModalOpen(false)}
          />
          
          <div className="relative bg-white/95 dark:bg-[#1A1A1A]/95 backdrop-blur-xl rounded-[2.5rem] w-full max-w-md border border-white/10 dark:border-white/5 shadow-2xl">
            <div className="flex items-center justify-between p-6 pb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Confirmar Repasse
              </h2>
              <button
                onClick={() => setIsPayoutModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="px-6 pb-6 space-y-5">
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl">
                {selectedBarberForPayout.barber_avatar ? (
                  <img
                    src={selectedBarberForPayout.barber_avatar}
                    alt={selectedBarberForPayout.barber_name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-500/10 dark:to-blue-400/5 flex items-center justify-center border-2 border-gray-200 dark:border-gray-700">
                    <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {getInitials(selectedBarberForPayout.barber_name)}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {selectedBarberForPayout.barber_name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedBarberForPayout.commission_percentage}% de comissão
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Valor Bruto</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(selectedBarberForPayout.total_revenue)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Atendimentos</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {selectedBarberForPayout.appointments_count}
                  </span>
                </div>
                <div className="h-px bg-gray-200 dark:bg-gray-700"></div>
                <div className="flex justify-between items-center p-4 bg-green-50 dark:bg-green-500/10 rounded-xl">
                  <span className="text-sm font-bold text-green-900 dark:text-green-300">Valor do Repasse</span>
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(selectedBarberForPayout.commission_amount)}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 dark:bg-yellow-500/10 rounded-2xl border border-yellow-200 dark:border-yellow-500/20">
                <p className="text-xs text-yellow-800 dark:text-yellow-300">
                  ⚠️ Esta ação registrará o pagamento da comissão no histórico. Certifique-se de que o valor foi repassado ao profissional.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsPayoutModalOpen(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-full transition-all active:scale-95"
                  disabled={isSaving}
                >
                  Cancelar
                </button>
                <button
                  onClick={handlePayoutBarber}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-semibold rounded-full shadow-lg shadow-green-500/30 transition-all active:scale-95"
                  disabled={isSaving}
                >
                  {isSaving ? 'Processando...' : 'Confirmar Repasse'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
