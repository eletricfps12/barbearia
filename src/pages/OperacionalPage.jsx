import { useState } from 'react'
import { Clock, Mail } from 'lucide-react'
import ConfiguracoesHorario from './ConfiguracoesHorario'
import ConfiguracaoEmail from './ConfiguracaoEmail'

/**
 * OperacionalPage Component
 * 
 * Hub de Operações com tabs para Horário de Funcionamento e Automação WhatsApp.
 * Usa iOS-style segmented control para navegação entre abas.
 */
export default function OperacionalPage() {
  const [activeTab, setActiveTab] = useState('horario') // 'horario' ou 'email'

  const tabs = [
    { id: 'horario', label: 'Horário de Funcionamento', icon: Clock },
    { id: 'email', label: 'Notificações por E-mail', icon: Mail }
  ]

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-global)' }}>
      {/* Floating Header Card */}
      <div className="mx-6 mt-4 mb-6 backdrop-blur-xl rounded-[2rem] border transition-colors duration-500"
        style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--border-subtle)',
          boxShadow: 'var(--card-shadow)'
        }}
      >
        <div className="px-8 py-6">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Ajustes Operacionais
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Configure horários de funcionamento e notificações por e-mail
          </p>
        </div>
      </div>

      {/* iOS-Style Segmented Control */}
      <div className="mx-6 mb-6">
        <div 
          className="inline-flex p-1 rounded-2xl backdrop-blur-xl"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="relative px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center gap-2"
                style={{
                  background: isActive ? 'var(--bg-active)' : 'transparent',
                  color: isActive ? 'var(--text-active)' : 'var(--text-secondary)'
                }}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-6 pb-6">
        {activeTab === 'horario' && <ConfiguracoesHorario />}
        {activeTab === 'email' && <ConfiguracaoEmail />}
      </div>
    </div>
  )
}
