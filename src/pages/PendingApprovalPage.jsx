import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Clock, Mail, LogOut } from 'lucide-react'

export default function PendingApprovalPage() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

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
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <Clock className="w-10 h-10 text-yellow-400" />
          </div>

          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Aguardando Aprovação
          </h2>

          <p className="text-lg mb-6" style={{ color: 'var(--text-secondary)' }}>
            Seu cadastro está em análise pela nossa equipe.
          </p>

          <div 
            className="p-4 rounded-xl mb-6 text-left"
            style={{
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.2)'
            }}
          >
            <div className="flex items-start gap-3 mb-3">
              <Mail className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-indigo-400 mb-1">
                  Você receberá um e-mail
                </p>
                <p className="text-sm text-indigo-300">
                  Assim que seu acesso for liberado, enviaremos uma notificação para o seu e-mail cadastrado.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-indigo-400 mb-1">
                  Tempo de análise
                </p>
                <p className="text-sm text-indigo-300">
                  A aprovação geralmente leva até 24 horas úteis.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            style={{
              background: 'var(--bg-card-hover)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <LogOut className="w-5 h-5" />
            Sair
          </button>

          <p className="text-xs mt-6" style={{ color: 'var(--text-tertiary)' }}>
            Dúvidas? Entre em contato: suporte@brioapp.com
          </p>
        </div>
      </div>
    </div>
  )
}
