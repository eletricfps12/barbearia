import { Menu, LogOut, Scissors } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'

// Extrai iniciais do nome completo
function getInitials(fullName) {
  if (!fullName) return '?'
  const names = fullName.trim().split(' ')
  if (names.length === 1) return names[0][0].toUpperCase()
  return (names[0][0] + names[names.length - 1][0]).toUpperCase()
}

export default function Header({ user, barbershop, onMenuClick, onLogout }) {
  return (
    <header className="px-6 pt-4 pb-0">
      {/* Floating Card Header - Integrated with Bento Grid */}
      <div 
        className="backdrop-blur-xl rounded-[2rem] px-6 py-4 transition-all"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--card-shadow)'
        }}
      >
        <div className="flex items-center justify-between">
          {/* Left Side: Menu Button (Mobile) + Barbershop Info */}
          <div className="flex items-center gap-3">
            <button
              onClick={onMenuClick}
              className="md:hidden p-2 rounded-xl transition-all hover:bg-white/5 dark:hover:bg-white/5"
              style={{ color: 'var(--text-secondary)' }}
              aria-label="Abrir menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Barbershop Logo and Name */}
            <div className="flex items-center gap-3">
              {barbershop?.logo_url ? (
                <img 
                  src={barbershop.logo_url}
                  alt={barbershop.name || 'Logo'}
                  className="w-10 h-10 rounded-full object-cover"
                  style={{ border: '2px solid var(--border-subtle)' }}
                />
              ) : (
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ 
                    background: `rgba(var(--accent-color), 0.1)`,
                    border: '2px solid var(--border-subtle)'
                  }}
                >
                  <Scissors 
                    className="w-5 h-5" 
                    style={{ color: `rgb(var(--accent-color))` }}
                  />
                </div>
              )}
              <div className="hidden sm:block">
                <p 
                  className="text-sm font-semibold leading-tight"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Painel Administrativo
                </p>
                {barbershop?.name && (
                  <p 
                    className="text-xs leading-tight"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {barbershop.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Side: Theme Toggle + Logout */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="p-2 rounded-xl transition-all hover:bg-white/5 dark:hover:bg-white/5"
              style={{ color: 'var(--text-secondary)' }}
              aria-label="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
