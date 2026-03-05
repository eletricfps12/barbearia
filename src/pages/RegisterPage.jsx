import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { showToast } from '../components/Toast'
import { Loader2, Store, User, Mail, Phone, Lock, CheckCircle, Check, X, AlertCircle } from 'lucide-react'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    ownerName: '',
    ownerEmail: '',
    barbershopName: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })

  // Password validation state
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false
  })

  // Máscara de telefone brasileiro
  const formatPhone = (value) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '')
    
    // Aplica a máscara (11) 99999-9999
    if (numbers.length <= 2) {
      return numbers
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
    } else if (numbers.length <= 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
    }
    
    // Limita a 11 dígitos
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
  }

  const handlePhoneChange = (e) => {
    const formatted = formatPhone(e.target.value)
    setFormData(prev => ({ ...prev, phone: formatted }))
  }

  // Validação de senha em tempo real
  const handlePasswordChange = (e) => {
    const password = e.target.value
    setFormData(prev => ({ ...prev, password }))

    // Validar requisitos
    setPasswordValidation({
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/'`~;]/.test(password)
    })
  }

  // Verificar se a senha é válida
  const isPasswordValid = () => {
    return Object.values(passwordValidation).every(v => v === true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validações
    if (!formData.ownerName || !formData.ownerEmail || !formData.barbershopName || !formData.password) {
      showToast.error('Preencha todos os campos obrigatórios', 'Campos Obrigatórios')
      return
    }

    // Validar senha profissional
    if (!isPasswordValid()) {
      showToast.error('A senha não atende aos requisitos de segurança', 'Senha Inválida')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      showToast.error('As senhas não coincidem', 'Erro')
      return
    }

    // Validar telefone (se preenchido)
    if (formData.phone) {
      const numbers = formData.phone.replace(/\D/g, '')
      if (numbers.length !== 11) {
        showToast.error('Telefone inválido. Use o formato (11) 99999-9999', 'Telefone Inválido')
        return
      }
    }

    try {
      setLoading(true)

      // 0. Verificar se o email já existe e se é um usuário órfão
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', formData.ownerEmail)
        .maybeSingle()

      if (existingUser) {
        throw new Error('Este email já está cadastrado. Tente fazer login ou use outro email.')
      }

      // 1. Criar usuário no Auth (sem enviar email de confirmação)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.ownerEmail,
        password: formData.password,
        options: {
          data: {
            full_name: formData.ownerName
          },
          emailRedirectTo: undefined // Não enviar email de confirmação
        }
      })

      if (authError) {
        // Se o erro for "User already registered", significa que é um usuário órfão
        if (authError.message.includes('already registered')) {
          throw new Error('Este email já foi usado anteriormente. Por favor, entre em contato com o suporte para liberar o cadastro.')
        }
        throw authError
      }

      if (!authData.user) {
        throw new Error('Usuário não foi criado')
      }

      const userId = authData.user.id

      try {
        // 2. Criar perfil como OWNER com email e telefone
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            full_name: formData.ownerName,
            email: formData.ownerEmail,
            phone: formData.phone || null,
            role: 'owner'
          })

        if (profileError) throw profileError

        // 3. Criar barbearia com status PENDING
        const slug = formData.barbershopName
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')

        const { data: barbershopData, error: barbershopError } = await supabase
          .from('barbershops')
          .insert({
            name: formData.barbershopName,
            slug: slug,
            owner_id: userId,
            contact_phone: formData.phone || null,
            subscription_plan: null,
            subscription_status: 'pending',
            trial_ends_at: null,
            next_payment_at: null
          })
          .select()
          .single()

        if (barbershopError) throw barbershopError

        // 4. Criar registro na tabela barbers para vincular owner à barbearia
        const { error: barberError } = await supabase
          .from('barbers')
          .insert({
            profile_id: userId,
            barbershop_id: barbershopData.id,
            name: formData.ownerName
          })

        if (barberError) throw barberError

        // 5. Fazer logout imediatamente (não deixar logado)
        await supabase.auth.signOut()

        // 6. Mostrar tela de sucesso
        setSuccess(true)

      } catch (innerError) {
        // Se algo falhou após criar o usuário no auth, tentar fazer rollback
        console.error('Error in registration process, attempting rollback:', innerError)
        
        // Tentar deletar o usuário do auth (rollback)
        try {
          await supabase.auth.admin.deleteUser(userId)
        } catch (rollbackError) {
          console.error('Failed to rollback user creation:', rollbackError)
        }
        
        throw innerError
      }

    } catch (error) {
      console.error('Error creating account:', error)
      showToast.error(
        error.message || 'Não foi possível criar a conta',
        'Erro ao Cadastrar'
      )
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div 
            className="rounded-2xl p-8 text-center"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>

            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Cadastro Recebido!
            </h2>

            <p className="text-lg mb-6" style={{ color: 'var(--text-secondary)' }}>
              Seu acesso está em análise pela nossa equipe.
            </p>

            <div 
              className="p-4 rounded-xl mb-6"
              style={{
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.2)'
              }}
            >
              <p className="text-sm text-green-400">
                ℹ️ Você receberá um e-mail assim que seu acesso for liberado. 
                Isso geralmente leva até 24 horas.
              </p>
            </div>

            <button
              onClick={() => navigate('/login')}
              className="w-full px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, rgb(34, 197, 94), rgb(22, 163, 74))',
                color: 'white'
              }}
            >
              Voltar para Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div 
            className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
            style={{ 
              background: '#050505',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <span className="text-2xl font-bold text-white">B</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Cadastre sua Barbearia</h1>
          <p className="text-gray-400">Preencha os dados para criar sua conta no Brio App</p>
        </div>

        {/* Form Card */}
        <div 
          className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl shadow-green-500/20 border border-green-500/10 p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Dados do Dono */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-white">
                Dados do Proprietário
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-300">
                    <User className="w-4 h-4 inline mr-2" />
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={formData.ownerName}
                    onChange={(e) => setFormData(prev => ({ ...prev, ownerName: e.target.value }))}
                    placeholder="João Silva"
                    className="w-full px-4 py-3 bg-gray-900/80 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-300">
                    <Mail className="w-4 h-4 inline mr-2" />
                    E-mail *
                  </label>
                  <input
                    type="email"
                    value={formData.ownerEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, ownerEmail: e.target.value }))}
                    placeholder="joao@email.com"
                    className="w-full px-4 py-3 bg-gray-900/80 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Dados da Barbearia */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-white">
                Dados da Barbearia
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-300">
                    <Store className="w-4 h-4 inline mr-2" />
                    Nome da Barbearia *
                  </label>
                  <input
                    type="text"
                    value={formData.barbershopName}
                    onChange={(e) => setFormData(prev => ({ ...prev, barbershopName: e.target.value }))}
                    placeholder="Barbearia do João"
                    className="w-full px-4 py-3 bg-gray-900/80 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-300">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Telefone (opcional)
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    placeholder="(11) 99999-9999"
                    maxLength={15}
                    className="w-full px-4 py-3 bg-gray-900/80 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 mt-1">Formato: (11) 99999-9999</p>
                </div>
              </div>
            </div>

            {/* Senha */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-white">
                Crie sua Senha
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-300">
                    <Lock className="w-4 h-4 inline mr-2" />
                    Senha *
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={handlePasswordChange}
                    placeholder="Digite uma senha forte"
                    className="w-full px-4 py-3 bg-gray-900/80 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-300">
                    <Lock className="w-4 h-4 inline mr-2" />
                    Confirmar Senha *
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Digite a senha novamente"
                    className="w-full px-4 py-3 bg-gray-900/80 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password Requirements */}
              {formData.password && (
                <div className="mt-4 p-4 bg-gray-900/50 border border-gray-700 rounded-lg">
                  <p className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Requisitos de Segurança:
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      {passwordValidation.minLength ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <X className="w-4 h-4 text-gray-500" />
                      )}
                      <span className={passwordValidation.minLength ? 'text-green-400' : 'text-gray-400'}>
                        Mínimo de 8 caracteres
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {passwordValidation.hasUpperCase ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <X className="w-4 h-4 text-gray-500" />
                      )}
                      <span className={passwordValidation.hasUpperCase ? 'text-green-400' : 'text-gray-400'}>
                        Pelo menos uma letra maiúscula (A-Z)
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {passwordValidation.hasLowerCase ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <X className="w-4 h-4 text-gray-500" />
                      )}
                      <span className={passwordValidation.hasLowerCase ? 'text-green-400' : 'text-gray-400'}>
                        Pelo menos uma letra minúscula (a-z)
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {passwordValidation.hasNumber ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <X className="w-4 h-4 text-gray-500" />
                      )}
                      <span className={passwordValidation.hasNumber ? 'text-green-400' : 'text-gray-400'}>
                        Pelo menos um número (0-9)
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {passwordValidation.hasSpecialChar ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <X className="w-4 h-4 text-gray-500" />
                      )}
                      <span className={passwordValidation.hasSpecialChar ? 'text-green-400' : 'text-gray-400'}>
                        Pelo menos um caractere especial (!@#$%^&*)
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Info Banner */}
            <div 
              className="p-4 rounded-xl"
              style={{
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.2)'
              }}
            >
              <p className="text-sm text-green-400">
                ℹ️ Após o cadastro, sua conta será analisada pela nossa equipe. 
                Você receberá um e-mail quando for aprovado!
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="flex-1 px-5 py-3 rounded-xl font-semibold transition-all bg-gray-700 hover:bg-gray-600 text-gray-300 border border-gray-600"
                disabled={loading}
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-5 py-3 rounded-xl font-semibold transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                style={{
                  background: loading ? 'rgba(34, 197, 94, 0.5)' : 'linear-gradient(135deg, rgb(34, 197, 94), rgb(22, 163, 74))',
                  color: 'white'
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Criando Conta...
                  </>
                ) : (
                  'Criar Conta'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-6">
          Já tem uma conta? <button onClick={() => navigate('/login')} className="text-green-400 hover:text-green-300">Fazer login</button>
        </p>
      </div>
    </div>
  )
}
