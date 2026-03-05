import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { showToast } from '../components/Toast'
import { ArrowLeft, Mail } from 'lucide-react'

/**
 * ForgotPassword Component
 * 
 * Página para recuperação de senha.
 * Envia e-mail com link de redefinição via Supabase Auth.
 */
export default function ForgotPassword() {
  const navigate = useNavigate()

  // State management
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  // Handle password reset request
  const handleResetPassword = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!email) {
      showToast.warning('Digite seu e-mail', 'Campo Obrigatório')
      return
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      showToast.warning('Digite um e-mail válido', 'E-mail Inválido')
      return
    }

    try {
      setIsLoading(true)

      // Send password reset email
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) throw error

      setEmailSent(true)
      showToast.success(
        'E-mail de recuperação enviado! Verifique sua caixa de entrada.',
        'E-mail Enviado'
      )
    } catch (err) {
      console.error('Password reset error:', err)
      showToast.error(
        'Não foi possível enviar o e-mail. Verifique se o e-mail está correto.',
        'Erro ao Enviar'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar para login
        </button>

        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Recuperar Senha</h1>
          <p className="text-gray-400">
            {emailSent 
              ? 'E-mail enviado com sucesso!' 
              : 'Digite seu e-mail para receber o link de recuperação'
            }
          </p>
        </div>

        {/* Card */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl shadow-green-500/20 border border-green-500/10 p-8">
          {emailSent ? (
            // Success State
            <div className="text-center space-y-6">
              <div className="w-16 h-16 mx-auto bg-green-500/10 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-green-500" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-white">
                  Verifique seu e-mail
                </h3>
                <p className="text-gray-400 text-sm">
                  Enviamos um link de recuperação para:
                </p>
                <p className="text-green-400 font-medium">
                  {email}
                </p>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-blue-400 text-sm">
                  💡 Não recebeu o e-mail? Verifique sua caixa de spam ou tente novamente em alguns minutos.
                </p>
              </div>

              <button
                onClick={() => navigate('/login')}
                className="w-full py-3 px-6 rounded-lg font-semibold text-white bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 active:scale-[0.98] shadow-lg hover:shadow-green-600/50 transition-all"
              >
                Voltar para Login
              </button>
            </div>
          ) : (
            // Form State
            <form onSubmit={handleResetPassword} className="space-y-6">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  E-mail cadastrado
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
                    required
                  />
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-gray-700/30 border border-gray-600/50 rounded-lg p-4">
                <p className="text-gray-400 text-sm">
                  📧 Você receberá um e-mail com instruções para redefinir sua senha.
                </p>
              </div>

              {/* Submit Button */}
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
                    Enviando...
                  </span>
                ) : (
                  'Enviar Link de Recuperação'
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-6">
          Powered by <span className="text-green-400 font-semibold">Brio App</span> ⚡ Desenvolvido por <span className="font-semibold">Black Sheep</span>
        </p>
      </div>
    </div>
  )
}
