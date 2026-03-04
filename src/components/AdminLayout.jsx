import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Sidebar from './Sidebar'
import Header from './Header'

export default function AdminLayout() {
  // State management
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [barbershop, setBarbershop] = useState(null)

  // Hooks
  const navigate = useNavigate()
  const location = useLocation()

  // Fetch user data on mount
  useEffect(() => {
    fetchUserData()
  }, [])

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = ''
    }
  }, [isSidebarOpen])

  // Fetch authenticated user data and barbershop info
  async function fetchUserData() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) {
        console.error('Error fetching user data:', error)
      } else {
        setUser(user)
        
        // Fetch barbershop data
        if (user) {
          await fetchBarbershopData(user.id)
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setIsLoadingUser(false)
    }
  }

  // Fetch barbershop data
  async function fetchBarbershopData(userId) {
    try {
      // First get barber data to find barbershop_id
      const { data: barberData, error: barberError } = await supabase
        .from('barbers')
        .select('barbershop_id')
        .eq('profile_id', userId)
        .maybeSingle()

      if (barberError) {
        console.error('Error fetching barber data:', barberError)
        return
      }

      if (!barberData) {
        console.log('No barber data found for user')
        return
      }

      // Then get barbershop data
      const { data: barbershopData, error: barbershopError } = await supabase
        .from('barbershops')
        .select('name, logo_url')
        .eq('id', barberData.barbershop_id)
        .single()

      if (barbershopError) {
        console.error('Error fetching barbershop data:', barbershopError)
        return
      }

      setBarbershop(barbershopData)
    } catch (error) {
      console.error('Error fetching barbershop data:', error)
    }
  }

  // Handle logout
  async function handleLogout() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error signing out:', error)
      } else {
        navigate('/login')
      }
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  // Toggle sidebar (mobile)
  function toggleSidebar() {
    setIsSidebarOpen(prev => !prev)
  }

  // Close sidebar (mobile)
  function closeSidebar() {
    setIsSidebarOpen(false)
  }

  return (
    <div className="flex h-screen" style={{ background: 'var(--bg-global)' }}>
      {/* Sidebar Desktop */}
      <aside className="hidden md:block w-64">
        <Sidebar />
      </aside>

      {/* Sidebar Mobile Overlay */}
      {isSidebarOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            style={{ 
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(4px)'
            }}
            onClick={closeSidebar}
          />
          <aside className="fixed inset-y-0 left-0 w-64 z-50">
            <Sidebar onLinkClick={closeSidebar} />
          </aside>
        </>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          user={user}
          barbershop={barbershop}
          onMenuClick={toggleSidebar}
          onLogout={handleLogout}
        />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
