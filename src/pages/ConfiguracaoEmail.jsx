import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { showToast } from '../components/Toast'
import { 
  Mail, 
  Loader2, 
  Save, 
  CheckCircle,
  Clock,
  Bell,
  UserPlus
} from 'lucide-react'

export default function ConfiguracaoEmail() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [barbershopId, setBarbershopId] = useState(null)

  // Configurações de automação (notification_settings table)
  const [settings, setSettings] = useState({
    confirmation_active: false,
    confirmation_subject: 'Agendamento Confirmado',
    confirmation_body: 'Olá [Nome Cliente]! Seu agendamento com [Barbeiro] está confirmado para [Horário]. Nos vemos em breve! 💈',
    
    reminder_12h_active: false,
    reminder_12h_subject: 'Lembrete: Agendamento Amanhã',
    reminder_12h_body: 'Oi [Nome Cliente]! Lembrete: você tem agendamento amanhã às [Horário] com [Barbeiro]. Até lá! ✂️',
    
    reminder_1h_active: false,
    reminder_1h_subject: 'O seu horário é daqui a 1 hora',
    reminder_1h_body: 'Olá [Nome Cliente]! Seu horário com [Barbeiro] é daqui a 1 hora ([Horário]). Estamos te esperando! 🕐',
    
    reminder_20min_active: false,
    reminder_20min_subject: 'Seu horário é em 20 minutos',
    reminder_20min_body: 'Olá [Nome Cliente]! Seu horário com [Barbeiro] é em 20 minutos ([Horário]). Já estamos te esperando! ⏰',
    
    reactivation_active: false,
    reactivation_subject: 'Sentimos a sua falta!',
    reactivation_body: 'Olá [Nome Cliente]! Sentimos sua falta! Que tal agendar um horário? Clique aqui: [Link de Agendamento] 😊'
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)

      // Get authenticated user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get barber data to find barbershop_id
      const { data: barberData } = await supabase
        .from('barbers')
        .select('barbershop_id')
        .eq('profile_id', user.id)
        .maybeSingle()

      if (!barberData) return

      setBarbershopId(barberData.barbershop_id)

      // Get notification settings from new table
      const { data: settingsData } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('barbershop_id', barberData.barbershop_id)
        .maybeSingle()

      if (settingsData) {
        setSettings({
          confirmation_active: settingsData.confirmation_active || false,
          confirmation_subject: settingsData.confirmation_subject || 'Agendamento Confirmado',
          confirmation_body: settingsData.confirmation_body || settings.confirmation_body,
          
          reminder_12h_active: settingsData.reminder_12h_active || false,
          reminder_12h_subject: settingsData.reminder_12h_subject || 'Lembrete: Agendamento Amanhã',
          reminder_12h_body: settingsData.reminder_12h_body || settings.reminder_12h_body,
          
          reminder_1h_active: settingsData.reminder_1h_active || false,
          reminder_1h_subject: settingsData.reminder_1h_subject || 'O seu horário é daqui a 1 hora',
          reminder_1h_body: settingsData.reminder_1h_body || settings.reminder_1h_body,
          
          reminder_20min_active: settingsData.reminder_20min_active || false,
          reminder_20min_subject: settingsData.reminder_20min_subject || 'Seu horário é em 20 minutos',
          reminder_20min_body: settingsData.reminder_20min_body || settings.reminder_20min_body,
          
          reactivation_active: settingsData.reactivation_active || false,
          reactivation_subject: settingsData.reactivation_subject || 'Sentimos a sua falta!',
          reactivation_body: settingsData.reactivation_body || settings.reactivation_body
        })
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
      showToast.error(
        'Não foi possível carregar as configurações.',
        'Erro ao Carregar'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!barbershopId) {
      showToast.error(
        'Não foi possível identificar sua barbearia.',
        'Erro de Identificação'
      )
      return
    }

    try {
      setSaving(true)

      const { error } = await supabase
        .from('notification_settings')
        .upsert({
          barbershop_id: barbershopId,
          ...settings,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'barbershop_id'
        })

      if (error) throw error

      showToast.success(
        'Suas configurações de notificação foram atualizadas!',
        'Configurações Salvas'
      )
    } catch (error) {
      console.error('Erro ao salvar:', error)
      showToast.error(
        'Não foi possível salvar as configurações. Tente novamente.',
        'Erro ao Salvar'
      )
    } finally {
      setSaving(false)
    }
  }

  const insertVariable = (field, variable) => {
    setSettings(prev => ({
      ...prev,
      [field]: prev[field] + ` ${variable}`
    }))
  }

  const variables = [
    { label: 'Nome Cliente', value: '[Nome Cliente]' },
    { label: 'Horário', value: '[Horário]' },
    { label: 'Barbeiro', value: '[Barbeiro]' },
    { label: 'Link de Cancelamento', value: '[Link de Cancelamento]' },
    { label: 'Link de Agendamento', value: '[Link de Agendamento]' }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <Loader2 
            className="w-12 h-12 animate-spin mx-auto mb-4"
            style={{ color: 'var(--text-secondary)' }}
          />
          <p style={{ color: 'var(--text-secondary)' }}>Carregando configurações...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Info Banner - Full Width */}
      <div 
        className="lg:col-span-12 backdrop-blur-xl rounded-[2rem] p-6 transition-all"
        style={{
          background: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid rgba(99, 102, 241, 0.2)'
        }}
      >
        <div className="flex items-start gap-4">
          <div 
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ 
              background: 'rgba(99, 102, 241, 0.2)',
              border: '1px solid rgba(99, 102, 241, 0.3)'
            }}
          >
            <Mail className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h3 
              className="text-lg font-bold mb-1"
              style={{ color: 'var(--text-primary)' }}
            >
              Sistema de Notificações por E-mail
            </h3>
            <p 
              className="text-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              Configure as notificações automáticas que serão enviadas aos seus clientes. 
              Ative ou desative cada tipo de notificação e personalize as mensagens com as variáveis disponíveis.
            </p>
          </div>
        </div>
      </div>

      {/* Confirmação de Agendamento */}
      <AutomationCard
        icon={CheckCircle}
        title="Confirmação de Agendamento"
        description="Enviada imediatamente após o cliente agendar"
        enabled={settings.confirmation_active}
        subject={settings.confirmation_subject}
        message={settings.confirmation_body}
        onToggle={(value) => setSettings(prev => ({ ...prev, confirmation_active: value }))}
        onSubjectChange={(value) => setSettings(prev => ({ ...prev, confirmation_subject: value }))}
        onMessageChange={(value) => setSettings(prev => ({ ...prev, confirmation_body: value }))}
        onInsertVariable={(variable) => insertVariable('confirmation_body', variable)}
        variables={variables}
        iconColor="text-green-400"
        iconBg="rgba(34, 197, 94, 0.15)"
      />

      {/* Lembrete 12h Antes */}
      <AutomationCard
        icon={Clock}
        title="Lembrete 12h Antes"
        description="Enviado 12 horas antes do horário agendado"
        enabled={settings.reminder_12h_active}
        subject={settings.reminder_12h_subject}
        message={settings.reminder_12h_body}
        onToggle={(value) => setSettings(prev => ({ ...prev, reminder_12h_active: value }))}
        onSubjectChange={(value) => setSettings(prev => ({ ...prev, reminder_12h_subject: value }))}
        onMessageChange={(value) => setSettings(prev => ({ ...prev, reminder_12h_body: value }))}
        onInsertVariable={(variable) => insertVariable('reminder_12h_body', variable)}
        variables={variables}
        iconColor="text-blue-400"
        iconBg="rgba(59, 130, 246, 0.15)"
      />

      {/* Lembrete 1h Antes */}
      <AutomationCard
        icon={Bell}
        title="Lembrete 1h Antes"
        description="Enviado 1 hora antes do horário agendado"
        enabled={settings.reminder_1h_active}
        subject={settings.reminder_1h_subject}
        message={settings.reminder_1h_body}
        onToggle={(value) => setSettings(prev => ({ ...prev, reminder_1h_active: value }))}
        onSubjectChange={(value) => setSettings(prev => ({ ...prev, reminder_1h_subject: value }))}
        onMessageChange={(value) => setSettings(prev => ({ ...prev, reminder_1h_body: value }))}
        onInsertVariable={(variable) => insertVariable('reminder_1h_body', variable)}
        variables={variables}
        iconColor="text-purple-400"
        iconBg="rgba(168, 85, 247, 0.15)"
      />

      {/* Lembrete 20min Antes */}
      <AutomationCard
        icon={Clock}
        title="Lembrete 20min Antes"
        description="Enviado 20 minutos antes do horário agendado"
        enabled={settings.reminder_20min_active}
        subject={settings.reminder_20min_subject}
        message={settings.reminder_20min_body}
        onToggle={(value) => setSettings(prev => ({ ...prev, reminder_20min_active: value }))}
        onSubjectChange={(value) => setSettings(prev => ({ ...prev, reminder_20min_subject: value }))}
        onMessageChange={(value) => setSettings(prev => ({ ...prev, reminder_20min_body: value }))}
        onInsertVariable={(variable) => insertVariable('reminder_20min_body', variable)}
        variables={variables}
        iconColor="text-yellow-400"
        iconBg="rgba(234, 179, 8, 0.15)"
      />

      {/* Reativação de Clientes */}
      <AutomationCard
        icon={UserPlus}
        title="Reativação de Clientes"
        description="Enviado para clientes inativos há 30+ dias"
        enabled={settings.reactivation_active}
        subject={settings.reactivation_subject}
        message={settings.reactivation_body}
        onToggle={(value) => setSettings(prev => ({ ...prev, reactivation_active: value }))}
        onSubjectChange={(value) => setSettings(prev => ({ ...prev, reactivation_subject: value }))}
        onMessageChange={(value) => setSettings(prev => ({ ...prev, reactivation_body: value }))}
        onInsertVariable={(variable) => insertVariable('reactivation_body', variable)}
        variables={variables}
        iconColor="text-orange-400"
        iconBg="rgba(249, 115, 22, 0.15)"
      />

      {/* Botão Salvar - Full Width */}
      <div className="lg:col-span-12 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all hover:scale-105 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))',
            color: 'rgb(99, 102, 241)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            backdropFilter: 'blur(12px)'
          }}
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Salvar Configurações
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// Componente de Card de Automação
function AutomationCard({ 
  icon: Icon, 
  title, 
  description, 
  enabled, 
  subject,
  message, 
  onToggle, 
  onSubjectChange,
  onMessageChange, 
  onInsertVariable,
  variables,
  iconColor,
  iconBg
}) {
  return (
    <div 
      className="lg:col-span-6 backdrop-blur-xl rounded-[2rem] p-6 transition-all"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--card-shadow)'
      }}
    >
      {/* Header com Toggle */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: iconBg }}
          >
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>
          <div>
            <h3 
              className="text-lg font-bold"
              style={{ color: 'var(--text-primary)' }}
            >
              {title}
            </h3>
            <p 
              className="text-xs"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {description}
            </p>
          </div>
        </div>

        {/* iOS Style Toggle */}
        <button
          onClick={() => onToggle(!enabled)}
          className="relative inline-flex h-7 w-12 items-center rounded-full transition-colors flex-shrink-0"
          style={{
            background: enabled ? `rgb(var(--accent-color))` : 'var(--border-subtle)'
          }}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
              enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Assunto do Email */}
      <div className="mb-3">
        <label 
          className="block text-xs font-semibold uppercase tracking-wider mb-2"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Assunto do Email
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => onSubjectChange(e.target.value)}
          className="w-full px-4 py-2 rounded-xl transition-all"
          style={{
            background: 'var(--bg-card-hover)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)'
          }}
          placeholder="Assunto..."
        />
      </div>

      {/* Variáveis (Pills) */}
      <div className="mb-3">
        <p 
          className="text-xs font-semibold uppercase tracking-wider mb-2"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Variáveis Disponíveis
        </p>
        <div className="flex flex-wrap gap-2">
          {variables.map((variable) => (
            <button
              key={variable.value}
              onClick={() => onInsertVariable(variable.value)}
              className="px-3 py-1 rounded-full text-xs font-medium transition-all"
              style={{
                background: `rgba(var(--accent-color), 0.1)`,
                color: `rgb(var(--accent-color))`,
                border: '1px solid var(--border-subtle)'
              }}
            >
              {variable.label}
            </button>
          ))}
        </div>
      </div>

      {/* Textarea de Mensagem */}
      <textarea
        value={message}
        onChange={(e) => onMessageChange(e.target.value)}
        rows={4}
        className="w-full px-4 py-3 rounded-xl resize-none transition-all"
        style={{
          background: 'var(--bg-card-hover)',
          border: '1px solid var(--border-subtle)',
          color: 'var(--text-primary)'
        }}
        placeholder="Digite sua mensagem..."
      />
    </div>
  )
}
