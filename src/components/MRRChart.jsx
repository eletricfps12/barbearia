import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function MRRChart({ data }) {
  return (
    <div className="p-6 rounded-2xl bg-zinc-900/50 backdrop-blur-md border border-white/5">
      <h3 className="text-lg font-bold text-white mb-4">📈 Crescimento MRR (Últimos 6 Meses)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis 
            dataKey="month" 
            stroke="#71717a"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#71717a"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => `R$ ${value}`}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#18181b', 
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '12px',
              color: '#fff',
              backdropFilter: 'blur(12px)'
            }}
            formatter={(value) => [`R$ ${value.toFixed(2)}`, 'MRR']}
          />
          <Line 
            type="monotone" 
            dataKey="mrr" 
            stroke="#22c55e" 
            strokeWidth={3}
            dot={{ fill: '#22c55e', r: 5, strokeWidth: 2, stroke: '#18181b' }}
            activeDot={{ r: 7, strokeWidth: 2, stroke: '#22c55e' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
