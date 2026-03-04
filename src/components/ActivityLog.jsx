import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { CheckCircle, UserPlus, CreditCard, Clock } from 'lucide-react'

export default function ActivityLog() {
  const [activities, setActivities] = useState([])

  useEffect(() => {
    fetchRecentActivities()
    
    // Subscribe to realtime changes
    const channel = supabase
      .channel('activity-log')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'barbershops' }, 
        (payload) => {
          handleRealtimeUpdate(payload)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchRecentActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('barbershops')
        .select(`
          id,
          name,
          subscription_status,
          subscription_plan,
          created_at,
          updated_at,
          profiles:owner_id (full_name)
        `)
        .order('updated_at', { ascending: false })
        .limit(10)

      if (error) throw error

      const formattedActivities = data.map(b => ({
        id: b.id,
        type: b.subscription_status === 'pending' ? 'signup' : 
              b.subscription_status === 'active' ? 'approved' : 'payment',
        message: b.subscription_status === 'pending' 
          ? `${b.profiles?.full_name} criou a conta ${b.name}`
          : b.subscription_status === 'active'
          ? `${b.name} foi aprovada`
          : `Pagamento confirmado para ${b.name}`,
        timestamp: b.updated_at || b.created_at
      }))

      setActivities(formattedActivities)
    } catch (error) {
      console.error('Error fetching activities:', error)
    }
  }

  const handleRealtimeUpdate = (payload) => {
    if (payload.eventType === 'INSERT') {
      const newActivity = {
        id: payload.new.id,
        type: 'signup',
        message: `Nova barbearia cadastrada: ${payload.new.name}`,
        timestamp: payload.new.created_at
      }
      setActivities(prev => [newActivity, ...prev].slice(0, 10))
    } else if (payload.eventType === 'UPDATE') {
      const updatedActivity = {
        id: payload.new.id,
        type: payload.new.subscription_status === 'active' ? 'approved' : 'payment',
        message: payload.new.subscription_status === 'active'
          ? `${payload.new.name} foi aprovada`
          : `Atualização em ${payload.new.name}`,
        timestamp: payload.new.updated_at
      }
      setActivities(prev => [updatedActivity, ...prev].slice(0, 10))
    }
  }

  const getIcon = (type) => {
    switch (type) {
      case 'signup': return <UserPlus className="w-4 h-4 text-blue-400" />
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'payment': return <CreditCard className="w-4 h-4 text-yellow-400" />
      default: return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getTimeAgo = (timestamp) => {
    const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000)
    if (seconds < 60) return 'agora mesmo'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m atrás`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h atrás`
    return `${Math.floor(seconds / 86400)}d atrás`
  }

  return (
    <div className="p-6 rounded-2xl bg-zinc-900/50 backdrop-blur-md border border-white/5">
      <h3 className="text-lg font-bold text-white mb-4">🔔 Atividades Recentes</h3>
      <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
        {activities.map((activity) => (
          <div 
            key={activity.id + activity.timestamp}
            className="flex items-start gap-3 p-3 rounded-lg bg-black/30 hover:bg-black/50 transition-colors border border-white/5"
          >
            <div className="mt-0.5">
              {getIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white">{activity.message}</p>
              <p className="text-xs text-gray-500 mt-1">
                {getTimeAgo(activity.timestamp)}
              </p>
            </div>
          </div>
        ))}
        {activities.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            Nenhuma atividade recente
          </p>
        )}
      </div>
    </div>
  )
}
