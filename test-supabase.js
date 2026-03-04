// Script de teste para verificar conexão com Supabase
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cntdiuaxocutsqwqnrkd.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNudGRpdWF4b2N1dHNxd3FucmtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk1NzY0MDAsImV4cCI6MjAyNTE1MjQwMH0.eGok1YhB0M71Uc_uUcoNJg_y9u7xCxRSUA'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

console.log('🔍 Testando conexão com Supabase...\n')

// Teste 1: Buscar barbeiro
console.log('📋 Teste 1: Buscando barbeiro João Silva...')
const { data: barber, error: barberError } = await supabase
  .from('barbers')
  .select('id, name, avatar_url, barbershops(name)')
  .eq('id', '44444444-4444-4444-4444-444444444444')
  .single()

if (barberError) {
  console.error('❌ Erro ao buscar barbeiro:', barberError.message)
  console.error('Detalhes:', barberError)
} else {
  console.log('✅ Barbeiro encontrado:', barber)
}

// Teste 2: Buscar serviços
console.log('\n📋 Teste 2: Buscando serviços...')
const { data: services, error: servicesError } = await supabase
  .from('services')
  .select('id, name, duration, price')
  .eq('barber_id', '44444444-4444-4444-4444-444444444444')

if (servicesError) {
  console.error('❌ Erro ao buscar serviços:', servicesError.message)
  console.error('Detalhes:', servicesError)
} else {
  console.log('✅ Serviços encontrados:', services)
}

// Teste 3: Buscar appointments
console.log('\n📋 Teste 3: Buscando appointments...')
const { data: appointments, error: appointmentsError } = await supabase
  .from('appointments')
  .select('id, date, start_time, end_time')
  .eq('barber_id', '44444444-4444-4444-4444-444444444444')
  .limit(5)

if (appointmentsError) {
  console.error('❌ Erro ao buscar appointments:', appointmentsError.message)
  console.error('Detalhes:', appointmentsError)
} else {
  console.log('✅ Appointments encontrados:', appointments)
}

console.log('\n✨ Teste concluído!')
