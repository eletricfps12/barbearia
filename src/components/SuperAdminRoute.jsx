import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Loader2 } from 'lucide-react'

export default function SuperAdminRoute({ children }) {
  const [status, setStatus] = useState('loading') // 'loading', 'authorized', 'unauthorized'

  useEffect(() => {
    // 1. Criar o ouvinte de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        try {
          // 2. Buscar o cargo (role) usando a coluna 'role' que confirmamos
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .maybeSingle()

          if (profile?.role === 'superadmin') {
            console.log('✅ SuperAdminRoute: Acesso liberado para o Comandante!')
            setStatus('authorized')
          } else {
            console.warn('🚫 SuperAdminRoute: Acesso negado para o cargo:', profile?.role)
            setStatus('unauthorized')
          }
        } catch (err) {
          console.error('❌ SuperAdminRoute: Erro na consulta do perfil', err)
          setStatus('unauthorized')
        }
      } else if (event === 'SIGNED_OUT' || (!session && event !== 'INITIAL_SESSION')) {
        setStatus('unauthorized')
      }
    })

    // Checagem inicial caso a sessão já exista
    const checkInitial = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        // Dar um pequeno tempo para o listener do onAuthStateChange agir
        setTimeout(() => {
          setStatus(prev => prev === 'loading' ? 'unauthorized' : prev)
        }, 1500)
      }
    }

    checkInitial()

    return () => subscription.unsubscribe()
  }, [])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-500 mx-auto mb-4" />
          <p className="text-gray-400 font-mono uppercase tracking-widest">
            Verificando Credenciais Black Sheep...
          </p>
        </div>
      </div>
    )
  }

  if (status === 'unauthorized') {
    return <Navigate to="/login" replace />
  }

  return children
}
