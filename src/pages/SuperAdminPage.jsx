import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { showToast } from '../components/Toast'
import MRRChart from '../components/MRRChart'
import SignupsChart from '../components/SignupsChart'
import ActivityLog from '../components/ActivityLog'
import InviteBarberModal from '../components/InviteBarberModal'
import { 
  Search, 
  Loader2,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  LogIn,
  Gift,
  Plus,
  X,
  UserPlus,
  Info
} from 'lucide-react'

export default function SuperAdminPage() {
  const navigate = useNavigate()
  const [barbershops, setBarbershops] = useState([])
  const [pendingBarbershops, setPendingBarbershops] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [approving, setApproving] = useState(null)
  
  // Analytics data
  const [mrrData, setMrrData] = useState([])
  const [signupsData, setSignupsData] = useState([])
  
  // Coupon modal
  const [showCouponModal, setShowCouponModal] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [couponDiscount, setCouponDiscount] = useState(20)
  const [couponMaxUses, setCouponMaxUses] = useState('')
  const [creatingCoupon, setCreatingCoupon] = useState(false)
  
  // Invite modal
  const [showInviteModal, setShowInviteModal] = useState(false)
  
  // Info modal
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [selectedBarbershop, setSelectedBarbershop] = useState(null)

  // Helper function to generate avatar initials
  const getInitials = (name) => {
    if (!name) return '??'
    const parts = name.trim().split(' ')
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  // Helper function to generate avatar color
  const getAvatarColor = (name) => {
    if (!name) return 'bg-gray-600'
    const colors = [
      'bg-blue-600',
      'bg-green-600',
      'bg-purple-600',
      'bg-pink-600',
      'bg-yellow-600',
      'bg-red-600',
      'bg-indigo-600',
      'bg-teal-600'
    ]
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
  }

  useEffect(() => {
    fetchBarbershops()
    fetchAnalytics()
  }, [])

  const fetchBarbershops = async () => {
    try {
      setLoading(true)

      // Query com dados completos do owner
      const { data, error } = await supabase
        .from('barbershops')
        .select(`
          *,
          profiles:owner_id (
            full_name,
            email,
            phone
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro detalhado:', error)
        throw error
      }

      // Separando localmente para ser mais rápido e evitar múltiplas chamadas
      setBarbershops(data.filter(b => b.subscription_status !== 'pending') || [])
      setPendingBarbershops(data.filter(b => b.subscription_status === 'pending') || [])
    } catch (error) {
      console.error('Erro detalhado:', error)
      showToast.error('Erro ao carregar os dados do servidor', 'Erro 500')
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalytics = async () => {
    try {
      // Fetch MRR data
      const { data: mrrResult, error: mrrError } = await supabase
        .rpc('get_mrr_last_6_months')
      
      if (!mrrError && mrrResult) {
        setMrrData(mrrResult)
      }

      // Fetch signups data
      const { data: signupsResult, error: signupsError } = await supabase
        .rpc('get_signups_last_8_weeks')
      
      if (!signupsError && signupsResult) {
        setSignupsData(signupsResult)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    }
  }

  const handleImpersonate = async (barbershopId, barbershopName) => {
    if (!confirm(`Você quer acessar o dashboard de "${barbershopName}"?\n\nIsso vai te logar como o dono desta barbearia.`)) {
      return
    }

    try {
      // Store super admin session for later
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        localStorage.setItem('superadmin_session', JSON.stringify(session))
        localStorage.setItem('impersonating_barbershop', barbershopId)
      }

      showToast.success(`Acessando ${barbershopName}...`, 'Impersonation')
      
      // Navigate to barbershop dashboard
      setTimeout(() => {
        navigate('/dashboard')
      }, 1000)
    } catch (error) {
      console.error('Error impersonating:', error)
      showToast.error('Erro ao acessar dashboard', 'Erro')
    }
  }

  const handleExtendTrial = async (barbershopId, barbershopName, currentTrialEnd) => {
    const daysToExtend = prompt('Quantos dias você quer adicionar ao trial?', '7')
    
    if (!daysToExtend || isNaN(daysToExtend)) return

    try {
      const newTrialEnd = new Date(currentTrialEnd || new Date())
      newTrialEnd.setDate(newTrialEnd.getDate() + parseInt(daysToExtend))

      const { error } = await supabase
        .from('barbershops')
        .update({
          trial_ends_at: newTrialEnd.toISOString(),
          next_payment_at: newTrialEnd.toISOString()
        })
        .eq('id', barbershopId)

      if (error) throw error

      showToast.success(
        `Trial de ${barbershopName} estendido por ${daysToExtend} dias!`,
        'Trial Estendido'
      )

      fetchBarbershops()
    } catch (error) {
      console.error('Error extending trial:', error)
      showToast.error('Erro ao estender trial', 'Erro')
    }
  }

  const handleShowInfo = (barbershop) => {
    setSelectedBarbershop(barbershop)
    setShowInfoModal(true)
  }

  const handleCreateCoupon = async (e) => {
    e.preventDefault()
    
    if (!couponCode.trim()) {
      showToast.error('Digite um código para o cupom', 'Erro')
      return
    }

    try {
      setCreatingCoupon(true)

      const { error } = await supabase
        .from('discount_coupons')
        .insert({
          code: couponCode.toUpperCase().trim(),
          discount_percent: couponDiscount,
          max_uses: couponMaxUses ? parseInt(couponMaxUses) : null,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })

      if (error) throw error

      showToast.success(
        `Cupom "${couponCode.toUpperCase()}" criado com ${couponDiscount}% de desconto!`,
        'Cupom Criado'
      )

      // Reset form
      setCouponCode('')
      setCouponDiscount(20)
      setCouponMaxUses('')
      setShowCouponModal(false)
    } catch (error) {
      console.error('Error creating coupon:', error)
      if (error.code === '23505') {
        showToast.error('Este código de cupom já existe', 'Erro')
      } else {
        showToast.error('Erro ao criar cupom', 'Erro')
      }
    } finally {
      setCreatingCoupon(false)
    }
  }

  const handleApproveBarbershop = async (barbershopId, barbershopName) => {
    try {
      setApproving(barbershopId)

      // Calcular data de fim do trial (15 dias)
      const trialEndsAt = new Date()
      trialEndsAt.setDate(trialEndsAt.getDate() + 15)

      // Buscar dados do owner para enviar email
      const { data: barbershopData, error: fetchError } = await supabase
        .from('barbershops')
        .select(`
          id,
          name,
          owner_id,
          profiles:owner_id (
            full_name,
            email
          )
        `)
        .eq('id', barbershopId)
        .single()

      if (fetchError) throw fetchError

      // Atualizar barbearia para ativa com trial
      const { error } = await supabase
        .from('barbershops')
        .update({
          subscription_status: 'active',
          subscription_plan: 'trial',
          trial_ends_at: trialEndsAt.toISOString(),
          next_payment_at: trialEndsAt.toISOString()
        })
        .eq('id', barbershopId)

      if (error) {
        console.error('Error approving barbershop:', error)
        throw error
      }

      // Enviar email de aprovação
      try {
        console.log('📧 Enviando email de aprovação...')
        
        const loginUrl = 'https://www.brioapp.online/login'
        
        const emailResponse = await supabase.functions.invoke('send-approval-email', {
          body: {
            ownerEmail: barbershopData.profiles?.email,
            ownerName: barbershopData.profiles?.full_name,
            barbershopName: barbershopData.name,
            trialEndsAt: trialEndsAt.toISOString(),
            loginUrl: loginUrl
          }
        })

        if (emailResponse.error) {
          console.error('Erro ao enviar email:', emailResponse.error)
          showToast.error(
            'Barbearia aprovada, mas houve erro ao enviar email de notificação.',
            '⚠️ Aviso'
          )
        } else {
          console.log('✅ Email enviado com sucesso!')
        }
      } catch (emailError) {
        console.error('Erro ao enviar email:', emailError)
        // Não bloqueia a aprovação se o email falhar
      }

      showToast.success(
        `${barbershopName} aprovada! Trial até ${trialEndsAt.toLocaleDateString('pt-BR')}`,
        '✅ Aprovado com Sucesso'
      )

      // Recarregar listas
      fetchBarbershops()

    } catch (error) {
      console.error('Error approving barbershop:', error)
      showToast.error(
        'Não foi possível aprovar a barbearia. Tente novamente.',
        'Erro ao Aprovar'
      )
    } finally {
      setApproving(null)
    }
  }

  const filteredBarbershops = barbershops.filter(b => 
    b.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-green-500" />
          <p className="text-gray-400">Carregando painel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="max-w-[1800px] mx-auto">
        
        {/* Header - Black Sheep Style */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                <span className="text-xl font-bold text-black">BS</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Black Sheep Super Admin
                </h1>
                <p className="text-gray-400">
                  Painel de Controle - Brio App
                </p>
              </div>
            </div>
            
            {/* Quick Action Button */}
            <div className="flex items-center gap-3">
              <button
                onClick={async () => {
                  await supabase.auth.signOut()
                  navigate('/owner/login')
                }}
                className="flex items-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl font-bold transition-all hover:scale-105 active:scale-95"
              >
                <LogIn className="w-5 h-5 rotate-180" />
                Sair
              </button>
              
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-400 text-black rounded-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-green-500/20"
              >
                <UserPlus className="w-5 h-5" />
                Nova Barbearia
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards - With Glow Effects */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Barbearias Ativas - Green Glow */}
          <div className="group relative p-6 rounded-2xl bg-zinc-900/50 backdrop-blur-md border border-white/5 hover:border-green-500/30 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                  <Building2 className="w-5 h-5 text-green-400" />
                </div>
                <span className="text-2xl font-bold text-white">
                  {barbershops.length}
                </span>
              </div>
              <p className="text-sm text-gray-400">Barbearias Ativas</p>
            </div>
          </div>

          {/* Aguardando Aprovação - Yellow Glow */}
          <div className="group relative p-6 rounded-2xl bg-zinc-900/50 backdrop-blur-md border border-white/5 hover:border-yellow-500/30 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <Clock className="w-5 h-5 text-yellow-400" />
                </div>
                <span className="text-2xl font-bold text-yellow-500">
                  {pendingBarbershops.length}
                </span>
              </div>
              <p className="text-sm text-gray-400">Aguardando Aprovação</p>
            </div>
          </div>

          {/* Em Trial - Blue Glow */}
          <div className="group relative p-6 rounded-2xl bg-zinc-900/50 backdrop-blur-md border border-white/5 hover:border-blue-500/30 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <Calendar className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-2xl font-bold text-white">
                  {barbershops.filter(b => b.subscription_plan === 'trial').length}
                </span>
              </div>
              <p className="text-sm text-gray-400">Em Trial</p>
            </div>
          </div>

          {/* MRR - Green Glow */}
          <div className="group relative p-6 rounded-2xl bg-zinc-900/50 backdrop-blur-md border border-white/5 hover:border-green-500/30 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                  <span className="text-lg">💰</span>
                </div>
                <span className="text-2xl font-bold text-green-500">
                  R$ {(barbershops.filter(b => b.subscription_plan === 'mensal' && b.subscription_status === 'active').length * 97).toFixed(2)}
                </span>
              </div>
              <p className="text-sm text-gray-400">MRR Estimado</p>
            </div>
          </div>
        </div>

        {/* Main Content - 2 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 mb-8">
          {/* Left Column - Charts */}
          <div className="space-y-6">
            {mrrData.length > 0 && <MRRChart data={mrrData} />}
            {signupsData.length > 0 && <SignupsChart data={signupsData} />}
          </div>
          
          {/* Right Sidebar - Activity Log */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <ActivityLog />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setShowCouponModal(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30 transition-all font-semibold"
          >
            <Gift className="w-5 h-5" />
            Criar Cupom de Desconto
          </button>
        </div>

        {/* Coupon Modal */}
        {showCouponModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-8 max-w-md w-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Criar Cupom</h3>
                <button
                  onClick={() => setShowCouponModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateCoupon} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Código do Cupom
                  </label>
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="PRIMEIROSMES"
                    className="w-full px-4 py-3 rounded-lg bg-black/50 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Desconto (%)
                  </label>
                  <input
                    type="number"
                    value={couponDiscount}
                    onChange={(e) => setCouponDiscount(parseInt(e.target.value))}
                    min="1"
                    max="100"
                    className="w-full px-4 py-3 rounded-lg bg-black/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Máximo de Usos (opcional)
                  </label>
                  <input
                    type="number"
                    value={couponMaxUses}
                    onChange={(e) => setCouponMaxUses(e.target.value)}
                    placeholder="Deixe vazio para ilimitado"
                    min="1"
                    className="w-full px-4 py-3 rounded-lg bg-black/50 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={creatingCoupon}
                  className="w-full py-3 rounded-lg bg-purple-500 hover:bg-purple-600 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {creatingCoupon ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Criar Cupom
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Cadastros Pendentes */}
        {pendingBarbershops.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              <h2 className="text-xl font-bold text-white">
                Cadastros Aguardando Aprovação ({pendingBarbershops.length})
              </h2>
            </div>
            
            <div className="rounded-2xl bg-zinc-900/50 backdrop-blur-md border border-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left p-4 text-gray-400 font-semibold">Barbearia</th>
                      <th className="text-left p-4 text-gray-400 font-semibold">Dono</th>
                      <th className="text-left p-4 text-gray-400 font-semibold">Email</th>
                      <th className="text-left p-4 text-gray-400 font-semibold">Telefone</th>
                      <th className="text-left p-4 text-gray-400 font-semibold">Cadastrado em</th>
                      <th className="text-left p-4 text-gray-400 font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingBarbershops.map((barbershop) => (
                      <tr 
                        key={barbershop.id}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {/* Avatar with Initials */}
                            <div className={`w-10 h-10 rounded-full ${getAvatarColor(barbershop.name)} flex items-center justify-center text-white font-bold text-sm`}>
                              {getInitials(barbershop.name)}
                            </div>
                            <div>
                              <p className="font-semibold text-white">{barbershop.name}</p>
                              <p className="text-sm text-gray-500">/{barbershop.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="font-medium text-white">
                            {barbershop.profiles?.full_name || 'N/A'}
                          </p>
                        </td>
                        <td className="p-4">
                          <p className="text-gray-400 text-sm">
                            {barbershop.profiles?.email || '-'}
                          </p>
                        </td>
                        <td className="p-4 text-gray-400">
                          {barbershop.contact_phone || barbershop.profiles?.phone || '-'}
                        </td>
                        <td className="p-4 text-gray-400">
                          {new Date(barbershop.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => handleApproveBarbershop(barbershop.id, barbershop.name)}
                            disabled={approving === barbershop.id}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all hover:scale-105 active:scale-95 bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {approving === barbershop.id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Aprovando...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                Aprovar (15 Dias Trial)
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar barbearia ou dono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Barbearias Ativas */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">
            🏪 Barbearias Ativas ({filteredBarbershops.length})
          </h2>
          
          <div className="rounded-2xl bg-zinc-900/50 backdrop-blur-md border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left p-4 text-gray-400 font-semibold">Barbearia</th>
                    <th className="text-left p-4 text-gray-400 font-semibold">Dono</th>
                    <th className="text-left p-4 text-gray-400 font-semibold">Plano</th>
                    <th className="text-left p-4 text-gray-400 font-semibold">Status</th>
                    <th className="text-left p-4 text-gray-400 font-semibold">Próximo Pagamento</th>
                    <th className="text-left p-4 text-gray-400 font-semibold">Criado em</th>
                    <th className="text-left p-4 text-gray-400 font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBarbershops.map((barbershop) => (
                    <tr 
                      key={barbershop.id}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {/* Avatar with Initials */}
                          <div className={`w-10 h-10 rounded-full ${getAvatarColor(barbershop.name)} flex items-center justify-center text-white font-bold text-sm`}>
                            {getInitials(barbershop.name)}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{barbershop.name}</p>
                            <p className="text-sm text-gray-500">/{barbershop.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-medium text-white">
                          {barbershop.profiles?.full_name || 'N/A'}
                        </p>
                      </td>
                      <td className="p-4">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                          {barbershop.subscription_plan || 'trial'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20">
                          {barbershop.subscription_status === 'active' ? 'Ativo' : barbershop.subscription_status}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="text-white">
                          {barbershop.next_payment_at 
                            ? new Date(barbershop.next_payment_at).toLocaleDateString('pt-BR')
                            : '-'
                          }
                        </p>
                        {barbershop.subscription_plan === 'trial' && barbershop.trial_ends_at && (
                          <p className="text-xs text-yellow-400">
                            Trial acaba em {Math.ceil((new Date(barbershop.trial_ends_at) - new Date()) / (1000 * 60 * 60 * 24))} dias
                          </p>
                        )}
                      </td>
                      <td className="p-4 text-gray-400">
                        {new Date(barbershop.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleShowInfo(barbershop)}
                            className="p-2 rounded-lg bg-zinc-800/50 border border-white/5 text-gray-400 hover:text-blue-400 hover:border-blue-500/30 hover:bg-blue-500/10 transition-all"
                            title="Ver informações"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleImpersonate(barbershop.id, barbershop.name)}
                            className="p-2 rounded-lg bg-zinc-800/50 border border-white/5 text-gray-400 hover:text-green-400 hover:border-green-500/30 hover:bg-green-500/10 transition-all"
                            title="Acessar como dono"
                          >
                            <LogIn className="w-4 h-4" />
                          </button>
                          {barbershop.subscription_plan === 'trial' && (
                            <button
                              onClick={() => handleExtendTrial(barbershop.id, barbershop.name, barbershop.trial_ends_at)}
                              className="p-2 rounded-lg bg-zinc-800/50 border border-white/5 text-gray-400 hover:text-yellow-400 hover:border-yellow-500/30 hover:bg-yellow-500/10 transition-all"
                              title="Estender trial"
                            >
                              <Clock className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredBarbershops.length === 0 && (
                <div className="p-12 text-center">
                  <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400">
                    {searchTerm ? 'Nenhuma barbearia encontrada' : 'Nenhuma barbearia ativa ainda'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Modal */}
        {showInfoModal && selectedBarbershop && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full ${getAvatarColor(selectedBarbershop.name)} flex items-center justify-center text-white font-bold text-lg`}>
                    {getInitials(selectedBarbershop.name)}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">{selectedBarbershop.name}</h3>
                    <p className="text-gray-400 text-sm">/{selectedBarbershop.slug}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInfoModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Info Grid */}
              <div className="space-y-6">
                
                {/* Informações do Dono */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Informações do Proprietário
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                      <span className="text-gray-400 text-sm">Nome:</span>
                      <span className="text-white font-medium">{selectedBarbershop.profiles?.full_name || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                      <span className="text-gray-400 text-sm">Email:</span>
                      <span className="text-white font-medium">{selectedBarbershop.profiles?.email || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                      <span className="text-gray-400 text-sm">Telefone:</span>
                      <span className="text-white font-medium">{selectedBarbershop.contact_phone || selectedBarbershop.profiles?.phone || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Informações da Barbearia */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Informações da Barbearia
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                      <span className="text-gray-400 text-sm">ID:</span>
                      <span className="text-white font-mono text-xs">{selectedBarbershop.id}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                      <span className="text-gray-400 text-sm">Endereço:</span>
                      <span className="text-white font-medium text-right">{selectedBarbershop.address || 'Não informado'}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                      <span className="text-gray-400 text-sm">Email de Contato:</span>
                      <span className="text-white font-medium">{selectedBarbershop.contact_email || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Informações de Assinatura */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Assinatura e Plano
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                      <span className="text-gray-400 text-sm">Plano:</span>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                        {selectedBarbershop.subscription_plan || 'trial'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                      <span className="text-gray-400 text-sm">Status:</span>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20">
                        {selectedBarbershop.subscription_status === 'active' ? 'Ativo' : selectedBarbershop.subscription_status}
                      </span>
                    </div>
                    {selectedBarbershop.trial_ends_at && (
                      <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                        <span className="text-gray-400 text-sm">Trial acaba em:</span>
                        <span className="text-white font-medium">
                          {new Date(selectedBarbershop.trial_ends_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    )}
                    {selectedBarbershop.next_payment_at && (
                      <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                        <span className="text-gray-400 text-sm">Próximo Pagamento:</span>
                        <span className="text-white font-medium">
                          {new Date(selectedBarbershop.next_payment_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Redes Sociais */}
                {(selectedBarbershop.instagram_url || selectedBarbershop.facebook_url || selectedBarbershop.whatsapp_number) && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                      Redes Sociais
                    </h4>
                    <div className="space-y-3">
                      {selectedBarbershop.instagram_url && (
                        <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                          <span className="text-gray-400 text-sm">Instagram:</span>
                          <a href={selectedBarbershop.instagram_url} target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:text-pink-300 font-medium text-sm">
                            Ver perfil →
                          </a>
                        </div>
                      )}
                      {selectedBarbershop.facebook_url && (
                        <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                          <span className="text-gray-400 text-sm">Facebook:</span>
                          <a href={selectedBarbershop.facebook_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 font-medium text-sm">
                            Ver página →
                          </a>
                        </div>
                      )}
                      {selectedBarbershop.whatsapp_number && (
                        <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                          <span className="text-gray-400 text-sm">WhatsApp:</span>
                          <span className="text-white font-medium">{selectedBarbershop.whatsapp_number}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Datas */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Datas Importantes
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                      <span className="text-gray-400 text-sm">Cadastrado em:</span>
                      <span className="text-white font-medium">
                        {new Date(selectedBarbershop.created_at).toLocaleDateString('pt-BR')} às {new Date(selectedBarbershop.created_at).toLocaleTimeString('pt-BR')}
                      </span>
                    </div>
                    {selectedBarbershop.updated_at && (
                      <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                        <span className="text-gray-400 text-sm">Última atualização:</span>
                        <span className="text-white font-medium">
                          {new Date(selectedBarbershop.updated_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Footer Actions */}
              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => handleImpersonate(selectedBarbershop.id, selectedBarbershop.name)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 rounded-lg font-semibold transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  Acessar como Dono
                </button>
                <button
                  onClick={() => setShowInfoModal(false)}
                  className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-semibold transition-all"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Invite Modal */}
        <InviteBarberModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          onInviteSent={(link) => {
            console.log('Invite link:', link)
            fetchBarbershops() // Refresh list
          }}
        />

      </div>
    </div>
  )
}
