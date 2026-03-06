import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { ToastContainer } from './components/Toast'
import { LoadingProvider, useLoading } from './contexts/LoadingContext'
import GlobalLoader from './components/GlobalLoader'
import LandingPage from './pages/LandingPage'
import BookingPage from './pages/BookingPage'
import DashboardHome from './pages/DashboardHome'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import AdminLayout from './components/AdminLayout'
import ServicosPage from './pages/ServicosPage'
import BrandCenterPage from './pages/BrandCenterPage'
import OperacionalPage from './pages/OperacionalPage'
import BarbershopPublicPage from './pages/BarbershopPublicPage'
import EquipePage from './pages/EquipePage'
import AgendaPage from './pages/AgendaPage'
import FinanceiroPage from './pages/FinanceiroPage'
import AssinantesPage from './pages/AssinantesPage'
import ClientesCRM from './pages/ClientesCRM'
import SuperAdminPage from './pages/SuperAdminPage'
import SuperAdminLogin from './pages/SuperAdminLogin'
import SuperAdminRoute from './components/SuperAdminRoute'
import RegisterPage from './pages/RegisterPage'
import PendingApprovalPage from './pages/PendingApprovalPage'
import AjudaPage from './pages/AjudaPage'
import { Loader2 } from 'lucide-react'

/**
 * RouteChangeListener Component
 * 
 * Monitors route changes and shows global loader during transitions.
 * Keeps loader visible until page content is fully loaded.
 */
function RouteChangeListener() {
  const location = useLocation()
  const { showLoading, hideLoading } = useLoading()

  useEffect(() => {
    // Show loader on route change
    showLoading('Carregando')
    
    // Hide loader after page has time to load data
    // Increased timeout to ensure data fetching completes
    const timer = setTimeout(() => {
      hideLoading()
    }, 1500)

    return () => clearTimeout(timer)
  }, [location.pathname])

  return null
}

/**
 * App Component
 * 
 * Gerencia autenticação global e roteamento do sistema.
 * Verifica sessão do usuário e protege rotas administrativas.
 */
function App() {
  const [session, setSession] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Verificar sessão inicial
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setSession(session)
      } catch (error) {
        console.error('Error checking session:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-400">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <LoadingProvider>
      <ToastContainer />
      <GlobalLoader />
      <BrowserRouter>
        <RouteChangeListener />
        <Routes>
          {/* Landing Page */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Rota pública - Agendamento do cliente */}
          <Route path="/booking/:barberId" element={<BookingPage />} />
        
        {/* Rota de login exclusiva para Super Admin (Black Sheep Owner) */}
        <Route path="/owner/login" element={<SuperAdminLogin />} />
        
        {/* Rota de login - redireciona se já estiver autenticado */}
        <Route 
          path="/login" 
          element={<Login />} 
        />
        
        {/* Rota de recuperação de senha */}
        <Route 
          path="/forgot-password" 
          element={<ForgotPassword />} 
        />
        
        {/* Rota de redefinição de senha */}
        <Route 
          path="/reset-password" 
          element={<ResetPassword />} 
        />
        
        {/* Rota de registro - cadastro de novas barbearias */}
        <Route 
          path="/register" 
          element={<RegisterPage />} 
        />
        
        {/* Rota de aprovação pendente */}
        <Route 
          path="/pending-approval" 
          element={
            <ProtectedRoute session={session}>
              <PendingApprovalPage />
            </ProtectedRoute>
          } 
        />
        

        
        {/* Rotas administrativas com layout */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute session={session}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          {/* Rota index - Dashboard Inteligente */}
          <Route index element={<DashboardHome />} />
          
          {/* Rotas filhas - Páginas placeholder */}
          <Route path="agenda" element={<AgendaPage />} />
          <Route path="servicos" element={<ServicosPage />} />
          <Route path="clientes" element={<ClientesCRM />} />
          <Route path="identidade" element={<BrandCenterPage />} />
          <Route path="operacional" element={<OperacionalPage />} />
          <Route path="equipe" element={<EquipePage />} />
          <Route path="financeiro" element={<FinanceiroPage />} />
          <Route path="assinantes" element={<AssinantesPage />} />
          <Route path="ajuda" element={<AjudaPage />} />
        </Route>
        
        {/* Rota Super Admin - Protegida */}
        <Route 
          path="/brio-super-admin" 
          element={
            <SuperAdminRoute session={session}>
              <SuperAdminPage />
            </SuperAdminRoute>
          } 
        />
        
        {/* Rota inicial - redireciona baseado em autenticação */}
        <Route 
          path="/" 
          element={session ? <RedirectToDashboard /> : <Navigate to="/login" replace />} 
        />

        {/* Rota pública - Página da barbearia (deve vir após rotas fixas) */}
        <Route path="/:slug" element={<BarbershopPublicPage />} />

        {/* Rota 404 - Não encontrado */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
    </LoadingProvider>
  )
}

/**
 * ProtectedRoute Component
 * 
 * Protege rotas que requerem autenticação.
 * Redireciona para login se não houver sessão.
 * Redireciona para pending-approval se subscription_status === 'pending'.
 */
function ProtectedRoute({ session, children }) {
  const [isChecking, setIsChecking] = useState(true)
  const [isPending, setIsPending] = useState(false)

  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      if (!session) {
        setIsChecking(false)
        return
      }

      try {
        // Check if user has a barbershop with pending status
        const { data: barbershop } = await supabase
          .from('barbershops')
          .select('subscription_status')
          .eq('owner_id', session.user.id)
          .maybeSingle()

        if (barbershop && barbershop.subscription_status === 'pending') {
          setIsPending(true)
        }
      } catch (error) {
        console.error('Error checking subscription status:', error)
      } finally {
        setIsChecking(false)
      }
    }

    checkSubscriptionStatus()
  }, [session])

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-400">Verificando acesso...</p>
        </div>
      </div>
    )
  }

  if (isPending && window.location.pathname !== '/pending-approval') {
    return <Navigate to="/pending-approval" replace />
  }

  return children
}

/**
 * RedirectToDashboard Component
 * 
 * Redireciona usuário autenticado para seu dashboard.
 * Verifica primeiro se é Super Admin, depois se é barbeiro.
 */
function RedirectToDashboard() {
  const navigate = useNavigate()
  const [isRedirecting, setIsRedirecting] = useState(true)

  useEffect(() => {
    let isMounted = true
    
    const redirectUser = async () => {
      try {
        console.log('🔄 RedirectToDashboard: Iniciando verificação...')
        
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!isMounted) {
          console.log('⚠️ RedirectToDashboard: Componente desmontado, abortando')
          return
        }
        
        if (!user) {
          console.log('❌ RedirectToDashboard: Nenhum usuário encontrado')
          navigate('/login', { replace: true })
          return
        }

        console.log('👤 RedirectToDashboard: Usuário logado:', user.email)

        // 1. PRIMEIRO: Verificar o Cargo no Profile (Usando a coluna role)
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()

        if (!isMounted) {
          console.log('⚠️ RedirectToDashboard: Componente desmontado após buscar profile')
          return
        }

        console.log('🔍 RedirectToDashboard: Profile encontrado:', profile)
        console.log('🔍 RedirectToDashboard: Role:', profile?.role)
        
        if (profileError) {
          console.error('❌ RedirectToDashboard: Erro ao buscar profile:', profileError)
        }

        // Se for Super Admin, vai direto para o painel de controle da Black Sheep
        if (profile?.role === 'superadmin') {
          console.log('🚀 RedirectToDashboard: Redirecionando Super Admin para /brio-super-admin')
          navigate('/brio-super-admin', { replace: true })
          return
        }

        console.log('🔍 RedirectToDashboard: Não é superadmin, verificando se é barbeiro...')

        // 2. SEGUNDO: Verificar se é um barbeiro comum
        const { data: barberData, error: barberError } = await supabase
          .from('barbers')
          .select('id')
          .eq('profile_id', user.id)
          .maybeSingle()

        if (!isMounted) {
          console.log('⚠️ RedirectToDashboard: Componente desmontado após buscar barber')
          return
        }

        console.log('🔍 RedirectToDashboard: Barber data:', barberData)
        
        if (barberError) {
          console.error('❌ RedirectToDashboard: Erro ao buscar barber:', barberError)
        }

        if (barberData) {
          console.log('✅ RedirectToDashboard: É barbeiro, redirecionando para /admin')
          navigate('/admin', { replace: true })
        } else {
          // Se não for nem admin nem barbeiro, algo está errado
          console.warn('⚠️ RedirectToDashboard: Usuário sem perfil de acesso definido.')
          console.warn('⚠️ RedirectToDashboard: Profile role:', profile?.role)
          console.warn('⚠️ RedirectToDashboard: Barber data:', barberData)
          console.warn('🚪 RedirectToDashboard: Fazendo signOut...')
          await supabase.auth.signOut()
          navigate('/login', { replace: true })
        }
      } catch (error) {
        console.error('❌ RedirectToDashboard: Erro inesperado:', error)
        if (isMounted) {
          navigate('/login', { replace: true })
        }
      } finally {
        if (isMounted) {
          console.log('✅ RedirectToDashboard: Finalizando verificação')
          setIsRedirecting(false)
        }
      }
    }

    redirectUser()
    
    return () => {
      isMounted = false
      console.log('🧹 RedirectToDashboard: Cleanup executado')
    }
  }, [])

  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-500 mx-auto mb-4" />
          <p className="text-gray-400">Identificando acesso...</p>
        </div>
      </div>
    )
  }

  return null
}

/**
 * NotFound Component
 * 
 * Página 404 para rotas não encontradas.
 */
function NotFound() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="text-blue-500 text-6xl mb-4">404</div>
        <h2 className="text-2xl font-bold text-white mb-2">Página não encontrada</h2>
        <p className="text-gray-400 mb-6">A página que você está procurando não existe.</p>
        <a
          href="/login"
          className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
        >
          Ir para Login
        </a>
      </div>
    </div>
  )
}

export default App
