import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

export default function SignupsChart({ data }) {
  // ========================================
  // VERSÃO 2.0 - GRÁFICO DE DONUT (ROSQUINHA)
  // Se você está vendo barras, o deploy está ERRADO!
  // ========================================
  // Cores para o gráfico de donut (rosquinha)
  const COLORS = ['#22c55e', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#8b5cf6']
  
  // Calcular total
  const total = data.reduce((sum, item) => sum + (item.signups || 0), 0)
  
  return (
    <div className="p-6 rounded-2xl bg-zinc-900/50 backdrop-blur-md border border-white/5">
      <h3 className="text-lg font-bold text-white mb-4">👥 Novos Cadastros (Últimas 8 Semanas)</h3>
      
      {total === 0 ? (
        <div className="h-[300px] flex items-center justify-center">
          <p className="text-gray-500">Nenhum cadastro ainda</p>
        </div>
      ) : (
        <>
          <div className="text-center mb-4">
            <p className="text-3xl font-bold text-white">{total}</p>
            <p className="text-sm text-gray-400">Total de Cadastros</p>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                paddingAngle={2}
                dataKey="signups"
                label={({ week, signups }) => `${week}: ${signups}`}
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#18181b', 
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '12px',
                  color: '#fff',
                  backdropFilter: 'blur(12px)'
                }}
                formatter={(value) => [value, 'Cadastros']}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value, entry) => `${entry.payload.week}`}
                wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  )
}
