import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { showToast } from '../components/Toast'
import { 
  MessageCircle, 
  Loader2, 
  Save, 
  QrCode,
  CheckCircle,
  AlertCircle,
  Clock,
  Bell,
  UserPlus,
  Zap
} from 'lucide-react'

export default function ConfiguracaoWhatsapp() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [barbershopId, setBarbershopId] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('disconnected') // 'connected', 'waiting_qr', 'disconnected'
  const [generatingQR, setGeneratingQR] = useState(false)

  // Configurações de automação
  const [settings, setSettings] = useState({
    confirmation_enabled: false,
    confirmation_message: 'Olá [Nome Cliente]! Seu agendamento com [Barbeiro] está confirmado para [Horário]. Nos vemos em breve! 💈',
    
    reminder_12h_enabled: false,
    reminder_12h_message: 'Oi [Nome Cliente]! Lembrete: você tem agendamento amanhã às [Horário] com [Barbeiro]. Até lá! ✂️',
    
    reminder_1h_enabled: false,
    reminder_1h_message: 'Olá [Nome Cliente]! Seu horário com [Barbeiro] é daqui a 1 hora ([Horário]). Estamos te esperando! 🕐',
    
    reactivation_enabled: false,
    reactivation_message: 'Olá [Nome Cliente]! Sentimos sua falta! Que tal agendar um horário? Clique aqui: [Link de Agendamento] 😊'
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

      // Get WhatsApp settings
      const { data: settingsData } = await supabase
        .from('whatsapp_settings')
        .select('*')
        .eq('barbershop_id', barberData.barbershop_id)
        .maybeSingle()

      if (settingsData) {
        setSettings({
          confirmation_enabled: settingsData.confirmation_enabled || false,
          confirmation_message: settingsData.confirmation_message || settings.confirmation_message,
          reminder_12h_enabled: settingsData.reminder_12h_enabled || false,
          reminder_12h_message: settingsData.reminder_12h_message || settings.reminder_12h_message,
          reminder_1h_enabled: settingsData.reminder_1h_enabled || false,
          reminder_1h_message: settingsData.reminder_1h_message || settings.reminder_1h_message,
          reactivation_enabled: settingsData.reactivation_enabled || false,
          reactivation_message: settingsData.reactivation_message || settings.reactivation_message
        })
        setConnectionStatus(settingsData.connection_status || 'disconnected')
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      const { error } = await supabase
        .from('whatsapp_settings')
        .upsert({
          barbershop_id: barbershopId,
          ...settings,
          connection_status: connectionStatus,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      showToast.success(
        'Configurações de WhatsApp salvas com sucesso!',
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

  const handleGenerateQR = async () => {
    try {
      setGeneratingQR(true)
      setConnectionStatus('waiting_qr')
      
      // Aqui você integraria com a API do WhatsApp (ex: Baileys, Evolution API, etc.)
      // Por enquanto, simulamos o processo
      
      showToast.info(
        'Gerando QR Code... Aguarde alguns segundos.',
        'Conectando WhatsApp'
      )

      // Simular delay de geração
      setTimeout(() => {
        setGeneratingQR(false)
        showToast.success(
          'QR Code gerado! Escaneie com seu WhatsApp.',
          'QR Code Pronto'
        )
      }, 2000)
    } catch (error) {
      console.error('Erro ao gerar QR:', error)
      setGeneratingQR(false)
      showToast.error(
        'Não foi possível gerar o QR Code. Tente novamente.',
        'Erro ao Conectar'
      )
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

  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          icon: CheckCircle,
          label: 'Conectado',
          color: 'text-green-400',
          bg: 'rgba(34, 197, 94, 0.1)',
          border: 'rgba(34, 197, 94, 0.2)'
        }
      case 'waiting_qr':
        return {
          icon: QrCode,
          label: 'Aguardando QR Code',
          color: 'text-yellow-400',
          bg: 'rgba(234, 179, 8, 0.1)',
          border: 'rgba(234, 179, 8, 0.2)'
        }
      default:
        return {
          icon: AlertCircle,
          label: 'Desconectado',
          color: 'text-red-400',
          bg: 'rgba(239, 68, 68, 0.1)',
          border: 'rgba(239, 68, 68, 0.2)'
        }
    }
  }

  const statusConfig = getStatusConfig()
  const StatusIcon = statusConfig.icon

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
      {/* Status de Conexão - Full Width */}
      <div 
        className="lg:col-span-12 backdrop-blur-xl rounded-[2rem] p-6 transition-all"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--card-shadow)'
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ 
                background: statusConfig.bg,
                border: `1px solid ${statusConfig.border}`
              }}
            >
              <StatusIcon className={`w-7 h-7 ${statusConfig.color}`} />
            </div>
            <div>
              <h2 
                className="text-xl font-bold mb-1"
                style={{ color: 'var(--text-primary)' }}
              >
                Status da Conexão
              </h2>
              <p 
                className="text-sm flex items-center gap-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                <span className={`w-2 h-2 rounded-full ${statusConfig.color.replace('text-', 'bg-')}`}></span>
                {statusConfig.label}
              </p>
            </div>
          </div>

          {connectionStatus !== 'connected' && (
            <button
              onClick={handleGenerateQR}
              disabled={generatingQR}
              className="px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2"
              style={{
                background: `rgba(var(--accent-color), 0.1)`,
                color: `rgb(var(--accent-color))`,
                border: '1px solid var(--border-subtle)'
              }}
            >
              {generatingQR ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <QrCode className="w-5 h-5" />
                  Gerar QR Code
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Confirmação de Agendamento */}
      <AutomationCard
            icon={CheckCircle}
            title="Confirmação de Agendamento"
            description="Enviada imediatamente após o cliente agendar"
            enabled={settings.confirmation_enabled}
            message={settings.confirmation_message}
            onToggle={(value) => setSettings(prev => ({ ...prev, confirmation_enabled: value }))}
            onMessageChange={(value) => setSettings(prev => ({ ...prev, confirmation_message: value }))}
            onInsertVariable={(variable) => insertVariable('confirmation_message', variable)}
            variables={variables}
            iconColor="text-green-400"
            iconBg="rgba(34, 197, 94, 0.15)"
          />

      {/* Lembrete 12h Antes */}
      <AutomationCard
            icon={Clock}
            title="Lembrete 12h Antes"
            description="Enviado 12 horas antes do horário agendado"
            enabled={settings.reminder_12h_enabled}
            message={settings.reminder_12h_message}
            onToggle={(value) => setSettings(prev => ({ ...prev, reminder_12h_enabled: value }))}
            onMessageChange={(value) => setSettings(prev => ({ ...prev, reminder_12h_message: value }))}
            onInsertVariable={(variable) => insertVariable('reminder_12h_message', variable)}
            variables={variables}
            iconColor="text-blue-400"
            iconBg="rgba(59, 130, 246, 0.15)"
          />

      {/* Lembrete 1h Antes */}
      <AutomationCard
            icon={Bell}
            title="Lembrete 1h Antes"
            description="Enviado 1 hora antes do horário agendado"
            enabled={settings.reminder_1h_enabled}
            message={settings.reminder_1h_message}
            onToggle={(value) => setSettings(prev => ({ ...prev, reminder_1h_enabled: value }))}
            onMessageChange={(value) => setSettings(prev => ({ ...prev, reminder_1h_message: value }))}
            onInsertVariable={(variable) => insertVariable('reminder_1h_message', variable)}
            variables={variables}
            iconColor="text-purple-400"
            iconBg="rgba(168, 85, 247, 0.15)"
          />

      {/* Reativação de Clientes */}
      <AutomationCard
            icon={UserPlus}
            title="Reativação de Clientes"
            description="Enviado para clientes inativos há 30+ dias"
            enabled={settings.reactivation_enabled}
            message={settings.reactivation_message}
            onToggle={(value) => setSettings(prev => ({ ...prev, reactivation_enabled: value }))}
            onMessageChange={(value) => setSettings(prev => ({ ...prev, reactivation_message: value }))}
            onInsertVariable={(variable) => insertVariable('reactivation_message', variable)}
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
  message, 
  onToggle, 
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
