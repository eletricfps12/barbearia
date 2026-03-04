import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { showToast } from '../components/Toast'

/**
 * Login Component
 * 
 * Tela de autenticação para barbeiros e donos de barbearia.
 * Integrada com Supabase Auth.
 */
export default function Login() {
  const navigate = useNavigate()

  // State management
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showPassword, setShowPassword] = useState(false)

  // Check if already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        // Get user role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle()

        if (profile?.role === 'superadmin') {
          navigate('/brio-super-admin', { replace: true })
        } else {
          navigate('/admin', { replace: true })
        }
      }
    }

    checkSession()
  }, [navigate])

  // Handle login submission
  const handleLogin = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!email || !password) {
      setError('Por favor, preencha todos os campos.')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Supabase authentication
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      })

      if (authError) {
        // Handle specific error messages
        if (authError.message.includes('Invalid login credentials')) {
          setError('E-mail ou senha incorretos.')
        } else if (authError.message.includes('Email not confirmed')) {
          setError('Por favor, confirme seu e-mail antes de fazer login.')
        } else {
          setError('Não foi possível fazer login. Tente novamente.')
        }
        setIsLoading(false)
        return
      }

      // Get user profile to find barber_id
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', data.user.id)
        .single()


      if (!profileData) {
        setError('Perfil não encontrado.')
        setIsLoading(false)
        return
      }

      // Check if user is barber or owner
      if (profileData.role !== 'barber' && profileData.role !== 'owner') {
        setError('Acesso negado. Apenas barbeiros e donos podem acessar.')
        await supabase.auth.signOut()
        setIsLoading(false)
        return
      }

      // Check if barbershop is pending approval
      const { data: barberData } = await supabase
        .from('barbers')
        .select('id, barbershop_id, barbershops(subscription_status)')
        .eq('profile_id', profileData.id)
        .maybeSingle()

      if (!barberData) {
        setError('Barbeiro não encontrado no sistema.')
        setIsLoading(false)
        return
      }

      // If barbershop is pending, redirect to pending page
      if (barberData.barbershops?.subscription_status === 'pending') {
        navigate('/pending-approval')
        return
      }

      // Redirect to admin dashboard
      navigate('/admin')
    } catch (err) {
      console.error('Login error:', err)
      setError('Erro inesperado. Tente novamente.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand - Brio App */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Brio App</h1>
          <p className="text-gray-400">Acesse seu painel administrativo</p>
        </div>

        {/* Login Card - Glass Effect com brilho verde */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl shadow-green-500/20 border border-green-500/10 p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-600/10 border border-red-600/50 text-red-400 p-4 rounded-lg flex items-start gap-3">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                E-mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-12 pr-4 py-3 bg-gray-900/80 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3 bg-gray-900/80 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button - Gradiente verde */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-all duration-200 ${
                isLoading
                  ? 'bg-gray-700 cursor-not-allowed opacity-50'
                  : 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 active:scale-[0.98] shadow-lg hover:shadow-green-600/50'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg 
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24"
                  >
                    <circle 
                      className="opacity-25" 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4"
                    />
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Entrando...
                </span>
              ) : (
                'Entrar'
              )}
            </button>

            {/* Forgot Password Link - Verde */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => showToast.info('Funcionalidade de recuperação de senha será implementada em breve.', 'Em Breve')}
                className="text-sm text-green-400 hover:text-green-300 transition-colors"
                disabled={isLoading}
              >
                Esqueci minha senha
              </button>
            </div>
          </form>
        </div>

        {/* Register Link - Cadastre-se em verde negrito */}
        <div className="text-center mt-6">
          <p className="text-gray-400 text-sm">
            Ainda não tem conta?{' '}
            <button
              onClick={() => navigate('/register')}
              className="text-green-400 hover:text-green-300 font-bold transition-colors"
              disabled={isLoading}
            >
              Cadastre-se
            </button>
          </p>
        </div>

        {/* Footer - Powered by Brio App */}
        <p className="text-center text-gray-500 text-sm mt-6">
          Powered by <span className="text-green-400 font-semibold">Brio App</span> ⚡ Desenvolvido por <span className="font-semibold">Black Sheep</span>
        </p>
      </div>
    </div>
  )
}
