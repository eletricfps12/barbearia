import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { showToast } from '../components/Toast'
import { AtSign, Lock, ShieldCheck, Loader2 } from 'lucide-react'

/**
 * SuperAdminLogin Component
 * 
 * Página de login exclusiva para o dono do SaaS (Black Sheep Owner)
 * Rota: /owner/login
 * 
 * Segurança:
 * - Valida credenciais via Supabase Auth
 * - Verifica role === 'superadmin' na tabela profiles
 * - Expulsa automaticamente usuários não autorizados
 */
export default function SuperAdminLogin() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()

    if (!email || !password) {
      showToast.error('Preencha todos os campos', 'Campos Obrigatórios')
      return
    }

    try {
      setIsLoading(true)

      // 1. Autenticar com Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      })

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          showToast.error('E-mail ou senha incorretos', 'Credenciais Inválidas')
        } else {
          showToast.error('Não foi possível fazer login', 'Erro de Autenticação')
        }
        setIsLoading(false)
        return
      }

      if (!authData.user) {
        showToast.error('Usuário não encontrado', 'Erro')
        setIsLoading(false)
        return
      }

      console.log('✅ SuperAdminLogin: Usuário autenticado:', authData.user.email)

      // 2. Verificar role na tabela profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', authData.user.id)
        .maybeSingle()

      if (profileError) {
        console.error('❌ SuperAdminLogin: Erro ao buscar perfil:', profileError.message || profileError)
        console.error('❌ SuperAdminLogin: Detalhes completos:', JSON.stringify(profileError, null, 2))
        await supabase.auth.signOut()
        showToast.error('Erro ao verificar permissões', 'Erro')
        setIsLoading(false)
        return
      }

      console.log('🔍 SuperAdminLogin: Role encontrado:', profile?.role)

      // 3. Validar se é superadmin
      if (profile?.role !== 'superadmin') {
        console.warn('🚫 SuperAdminLogin: Acesso negado - Role:', profile?.role)
        
        // Expulsar usuário não autorizado
        await supabase.auth.signOut()
        
        showToast.error(
          'Acesso restrito ao Owner Portal',
          'Permissão Negada'
        )
        setIsLoading(false)
        return
      }

      // 4. Sucesso - Redirecionar para painel Super Admin
      console.log('🎉 SuperAdminLogin: Acesso autorizado! Redirecionando...')
      showToast.success(
        `Bem-vindo, ${profile.full_name || 'Comandante'}!`,
        'Acesso Liberado'
      )
      
      navigate('/brio-super-admin')

    } catch (error) {
      console.error('❌ SuperAdminLogin: Erro crítico:', error.message || error)
      console.error('❌ SuperAdminLogin: Stack trace:', error.stack)
      showToast.error('Erro inesperado ao fazer login', 'Erro')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        
        {/* Logo/Brand - Black Sheep Owner Portal */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            {/* Ícone da Ovelha Geométrica (placeholder - substitua pela logo real) */}
            <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <ShieldCheck className="w-10 h-10 text-green-500" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">Brio App</h1>
          <p className="text-green-500 font-semibold tracking-wider uppercase text-sm">
            Owner Portal
          </p>
          <p className="text-gray-500 text-xs mt-2">Black Sheep Exclusive Access</p>
        </div>

        {/* Login Card - Glassmorphism */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                E-mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <AtSign className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@blacksheep.com"
                  autoComplete="email"
                  className="w-full pl-12 pr-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-12 pr-12 py-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 px-6 rounded-lg font-semibold text-black transition-all duration-200 flex items-center justify-center gap-2 ${
                isLoading
                  ? 'bg-gray-700 cursor-not-allowed opacity-50'
                  : 'bg-green-500 hover:bg-green-400 active:scale-[0.98] shadow-lg shadow-green-500/50'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  Acessar Portal
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 text-xs mt-6">
          © 2026 Black Sheep. Acesso restrito.
        </p>
      </div>
    </div>
  )
}
