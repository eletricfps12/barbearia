import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { 
  Calendar, 
  DollarSign,
  Users,
  Scissors, 
  Settings,
  LogOut,
  Sparkles,
  LayoutDashboard,
  UserCheck,
  Palette,
  Sliders,
  HelpCircle,
  Copy,
  Check,
  X,
  CreditCard
} from 'lucide-react'
import { supabase } from '../lib/supabase'

const navigationItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/admin/agenda', icon: Calendar, label: 'Agenda' },
  { path: '/admin/financeiro', icon: DollarSign, label: 'Financeiro' },
  { path: '/admin/assinantes', icon: CreditCard, label: 'Assinantes' },
  { path: '/admin/clientes', icon: UserCheck, label: 'Clientes' },
  { path: '/admin/equipe', icon: Users, label: 'Equipe' },
  { path: '/admin/servicos', icon: Scissors, label: 'Serviços' },
  { path: '/admin/identidade', icon: Palette, label: 'Identidade Visual' },
  { path: '/admin/operacional', icon: Sliders, label: 'Ajustes Operacionais' },
  { path: '/admin/ajuda', icon: HelpCircle, label: 'Ajuda' }
]

export default function Sidebar({ onLinkClick }) {
  const navigate = useNavigate()
  const [barberProfile, setBarberProfile] = useState(null)
  const [barberColor, setBarberColor] = useState('#3b82f6')
  const [showSupportModal, setShowSupportModal] = useState(false)
  const [supportInfo, setSupportInfo] = useState(null)
  const [copiedField, setCopiedField] = useState(null)

  useEffect(() => {
    fetchBarberProfile()
  }, [])

  const fetchBarberProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Buscar dados do barbeiro com foto e cor
      const { data: barberData } = await supabase
        .from('barbers')
        .select('id, name, color, profiles(avatar_url, name)')
        .eq('profile_id', user.id)
        .maybeSingle()

      if (barberData) {
        setBarberProfile({
          name: barberData.profiles?.name || barberData.name || 'Barbeiro',
          avatar_url: barberData.profiles?.avatar_url,
          color: barberData.color || '#3b82f6'
        })
        setBarberColor(barberData.color || '#3b82f6')
      }
    } catch (error) {
      console.error('Erro ao buscar perfil:', error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  // Buscar informações de suporte
  const fetchSupportInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Buscar dados do barbeiro e barbearia
      const { data: barberData } = await supabase
        .from('barbers')
        .select(`
          barbershop_id,
          barbershops (
            id,
            name,
            contact_phone,
            created_at,
            owner_id
          )
        `)
        .eq('profile_id', user.id)
        .maybeSingle()

      if (!barberData || !barberData.barbershops) {
        console.error('Dados da barbearia não encontrados')
        return
      }

      // Buscar dados do owner da barbearia
      const { data: ownerProfile } = await supabase
        .from('profiles')
        .select('full_name, email, phone')
        .eq('id', barberData.barbershops.owner_id)
        .maybeSingle()

      setSupportInfo({
        barbershopId: barberData.barbershops.id || 'N/A',
        barbershopName: barberData.barbershops.name || 'N/A',
        ownerName: ownerProfile?.full_name || 'N/A',
        ownerEmail: ownerProfile?.email || 'N/A',
        phone: ownerProfile?.phone || barberData.barbershops.contact_phone || 'N/A',
        createdAt: barberData.barbershops.created_at 
          ? new Date(barberData.barbershops.created_at).toLocaleDateString('pt-BR')
          : 'N/A'
      })
    } catch (error) {
      console.error('Erro ao buscar informações de suporte:', error)
    }
  }

  // Copiar para clipboard
  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (error) {
      console.error('Erro ao copiar:', error)
    }
  }

  // Abrir modal de suporte
  const openSupportModal = () => {
    fetchSupportInfo()
    setShowSupportModal(true)
  }

  // Gerar iniciais do nome
  const getInitials = (name) => {
    if (!name) return 'BB'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="h-full p-4 flex items-center justify-center">
      {/* Floating Island Container - Unified Glass with Glow */}
      <nav 
        className="h-[calc(100%-2rem)] w-full backdrop-blur-2xl rounded-[2rem] flex flex-col overflow-hidden"
        style={{
          background: 'var(--bg-sidebar)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--sidebar-shadow)'
        }}
      >
        
        {/* Logo Section - Brio App Branding */}
        <div className="p-6" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            {/* Brio Logo - Minimalist "B" */}
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-lg" 
              style={{ 
                background: '#050505',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              B
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Brio
              </h1>
              <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
                App
              </p>
            </div>
          </div>
        </div>
        
        {/* Navigation Items */}
        <div className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-hide">
          {navigationItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              onClick={onLinkClick}
              style={({ isActive }) => ({
                color: isActive ? 'var(--text-active)' : 'var(--text-secondary)',
                background: isActive ? 'var(--bg-active)' : 'transparent'
              })}
              className={({ isActive }) => 
                `group flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 relative overflow-hidden
                ${!isActive && 'hover:bg-white/5 dark:hover:bg-white/5'}`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Glow Effect for Active Item (Dark Mode Only) */}
                  {isActive && (
                    <div 
                      className="absolute inset-0 rounded-2xl opacity-0 dark:opacity-20 blur-xl pointer-events-none"
                      style={{ backgroundColor: barberColor }}
                    />
                  )}
                  
                  {/* Icon */}
                  <div className="relative z-10">
                    <item.icon 
                      className={`w-5 h-5 transition-all duration-300 ${
                        isActive ? 'scale-110' : 'group-hover:scale-105'
                      }`}
                      style={isActive ? { color: 'var(--text-active)' } : {}}
                    />
                  </div>
                  
                  {/* Label */}
                  <span className="relative z-10 font-medium text-sm">
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
        
        {/* Support Button */}
        <div className="px-4 pb-2">
          <button
            onClick={openSupportModal}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 hover:bg-white/5 dark:hover:bg-white/5 group"
            style={{ color: 'var(--text-secondary)' }}
          >
            <HelpCircle className="w-5 h-5 group-hover:scale-105 transition-transform" />
            <span className="font-medium text-sm">Suporte</span>
          </button>
        </div>
        
        {/* User Profile Section - Professional Design */}
        <div className="p-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <div 
            className="flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 hover:bg-white/5 dark:hover:bg-white/5 cursor-pointer group"
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {barberProfile?.avatar_url ? (
                <img 
                  src={barberProfile.avatar_url} 
                  alt={barberProfile.name}
                  className="w-11 h-11 rounded-full object-cover ring-2 ring-white/10"
                />
              ) : (
                <div 
                  className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm ring-2 ring-white/10"
                  style={{ 
                    backgroundColor: barberColor,
                    color: 'white'
                  }}
                >
                  {getInitials(barberProfile?.name)}
                </div>
              )}
              {/* Status Indicator */}
              <div 
                className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full ring-2"
                style={{ 
                  backgroundColor: '#10b981',
                  ringColor: 'var(--bg-sidebar)'
                }}
              />
            </div>
            
            {/* Name & Status */}
            <div className="flex-1 min-w-0">
              <p 
                className="text-sm font-semibold truncate leading-tight mb-0.5"
                style={{ color: 'var(--text-primary)' }}
              >
                {barberProfile?.name || 'Carregando...'}
              </p>
              <div className="flex items-center gap-1.5">
                <div 
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: '#10b981' }}
                />
                <p 
                  className="text-xs font-medium"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Online
                </p>
              </div>
            </div>
            
            {/* Logout Button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleLogout()
              }}
              className="p-2.5 rounded-xl transition-all duration-300 active:scale-95 hover:bg-red-500/10 group/logout"
              title="Sair"
            >
              <LogOut 
                className="w-4 h-4 transition-colors group-hover/logout:text-red-400"
                style={{ color: 'var(--text-tertiary)' }}
              />
            </button>
          </div>
        </div>
      </nav>

      {/* Support Modal */}
      {showSupportModal && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4"
          onClick={() => setShowSupportModal(false)}
        >
          <div 
            className="bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-2xl rounded-3xl shadow-2xl w-full max-w-md border border-white/10 dark:border-white/5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200/50 dark:border-white/10">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Informações de Suporte
              </h3>
              <button
                onClick={() => setShowSupportModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Envie estas informações para o suporte quando precisar de ajuda:
              </p>

              {supportInfo ? (
                <>
                  {/* Barbershop ID */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      ID da Barbearia
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={supportInfo.barbershopId}
                        readOnly
                        className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white font-mono"
                      />
                      <button
                        onClick={() => copyToClipboard(supportInfo.barbershopId, 'id')}
                        className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                        title="Copiar"
                      >
                        {copiedField === 'id' ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Barbershop Name */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Nome da Barbearia
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={supportInfo.barbershopName}
                        readOnly
                        className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white"
                      />
                      <button
                        onClick={() => copyToClipboard(supportInfo.barbershopName, 'name')}
                        className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                        title="Copiar"
                      >
                        {copiedField === 'name' ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Owner Name */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Nome do Proprietário
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={supportInfo.ownerName}
                        readOnly
                        className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white"
                      />
                      <button
                        onClick={() => copyToClipboard(supportInfo.ownerName, 'ownerName')}
                        className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                        title="Copiar"
                      >
                        {copiedField === 'ownerName' ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Email de Cadastro
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={supportInfo.ownerEmail}
                        readOnly
                        className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white"
                      />
                      <button
                        onClick={() => copyToClipboard(supportInfo.ownerEmail, 'email')}
                        className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                        title="Copiar"
                      >
                        {copiedField === 'email' ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Telefone de Cadastro
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={supportInfo.phone}
                        readOnly
                        className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white"
                      />
                      <button
                        onClick={() => copyToClipboard(supportInfo.phone, 'phone')}
                        className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                        title="Copiar"
                      >
                        {copiedField === 'phone' ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Created At */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Data de Cadastro
                    </label>
                    <input
                      type="text"
                      value={supportInfo.createdAt}
                      readOnly
                      className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white"
                    />
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200/50 dark:border-white/10">
              <button
                onClick={() => setShowSupportModal(false)}
                className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
