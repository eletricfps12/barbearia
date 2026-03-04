// =====================================================
// SUPABASE EDGE FUNCTION: PROCESS REMINDERS
// =====================================================
// Processa lembretes automáticos (12h, 1h, 20min antes)
// Executada via Cron Job a cada 30 minutos
// Faz varredura na tabela appointments e envia emails
// Deploy: supabase functions deploy process-reminders
// =====================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_URL = 'https://api.resend.com/emails'

// =====================================================
// INTERFACES
// =====================================================
interface Appointment {
  id: string
  barbershop_id: string
  barber_id: string
  client_name: string
  client_email: string
  start_time: string
  barber_name?: string
}

interface Barbershop {
  id: string
  name: string
  logo_url?: string
  address?: string
}

interface NotificationSettings {
  reminder_12h_active: boolean
  reminder_12h_subject: string
  reminder_12h_body: string
  reminder_1h_active: boolean
  reminder_1h_subject: string
  reminder_1h_body: string
  reminder_20min_active: boolean
  reminder_20min_subject: string
  reminder_20min_body: string
}

// =====================================================
// PARSER DE VARIÁVEIS
// =====================================================
const parseMessage = (template: string, data: {
  clientName: string
  barberName: string
  appointmentTime: string
  appointmentDate: string
}): string => {
  let parsed = template
  
  parsed = parsed.replace(/\[Nome Cliente\]/g, data.clientName)
  parsed = parsed.replace(/\[Barbeiro\]/g, data.barberName)
  parsed = parsed.replace(/\[Horário\]/g, `${data.appointmentDate} às ${data.appointmentTime}`)
  
  return parsed
}

// =====================================================
// TEMPLATE HTML PREMIUM (APPLE-STYLE DARK)
// =====================================================
const getEmailHTML = (
  messageContent: string,
  barbershop: Barbershop,
  reminderType: string
) => {
  const primaryColor = '#4F46E5'
  const rgbString = '79, 70, 229'
  
  const formattedContent = messageContent.replace(/\n/g, '<br>')
  
  // Emoji baseado no tipo de lembrete
  const emoji = reminderType === '12h' ? '⏰' : reminderType === '1h' ? '🔔' : '⚡'
  
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lembrete de Agendamento - ${barbershop.name}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #050505; line-height: 1.6;">
  
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #050505; padding: 40px 20px;">
    <tr>
      <td align="center">
        
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #121212; border-radius: 16px; border: 1px solid #2A2A2A; overflow: hidden;">
          
          <tr>
            <td style="background: linear-gradient(135deg, rgba(${rgbString}, 0.15), rgba(${rgbString}, 0.25)); padding: 40px 30px; text-align: center; border-bottom: 1px solid #2A2A2A;">
              
              ${barbershop.logo_url ? `
                <img src="${barbershop.logo_url}" alt="${barbershop.name}" style="width: 80px; height: 80px; border-radius: 50%; margin-bottom: 16px; object-fit: cover; display: block; margin-left: auto; margin-right: auto;" />
              ` : `
                <div style="font-size: 48px; margin-bottom: 16px;">${emoji}</div>
              `}
              
              <h1 style="margin: 0 0 8px 0; color: #FFFFFF; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                Lembrete de Agendamento
              </h1>
              
              <p style="margin: 0; color: rgba(255, 255, 255, 0.7); font-size: 14px;">
                Seu horário está chegando!
              </p>
              
              <p style="margin: 8px 0 0 0; color: rgb(${rgbString}); font-weight: 600; font-size: 16px;">
                ${barbershop.name}
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px 30px;">
              
              <div style="color: rgba(255, 255, 255, 0.9); font-size: 16px; line-height: 1.8; margin-bottom: 30px;">
                ${formattedContent}
              </div>
              
              ${barbershop.address ? `
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 30px;">
                  <tr>
                    <td align="center">
                      <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(barbershop.address)}" 
                         style="display: inline-block; background-color: ${primaryColor}; color: #FFFFFF; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                        📍 Ver no Mapa
                      </a>
                    </td>
                  </tr>
                </table>
              ` : ''}
              
            </td>
          </tr>
          
          <tr>
            <td style="padding: 30px; text-align: center; background-color: rgba(10, 10, 10, 0.5); border-top: 1px solid #2A2A2A;">
              <p style="margin: 0 0 8px 0; color: #888888; font-size: 13px;">
                Nos vemos em breve!
              </p>
              <p style="margin: 0; color: #666666; font-size: 12px;">
                © ${new Date().getFullYear()} ${barbershop.name}. Todos os direitos reservados.
              </p>
            </td>
          </tr>
          
        </table>
        
      </td>
    </tr>
  </table>
  
</body>
</html>
  `
}

// =====================================================
// FUNÇÃO PRINCIPAL
// =====================================================
serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    console.log('🔔 Iniciando processamento de lembretes...')

    // Setup Supabase Client
    const supabaseUrl = Deno.env.get('DB_URL') || Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('DB_SERVICE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Variáveis de ambiente do Supabase não configuradas')
      return new Response(
        JSON.stringify({ error: 'Configuração do Supabase incompleta' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Calcular janelas de tempo em UTC (os horários no banco estão em UTC)
    // Mas precisamos considerar que os agendamentos foram criados no timezone de Brasília
    const now = new Date()
    
    console.log('🕐 Horário atual (UTC):', now.toISOString())
    console.log('🕐 Horário atual (Brasília):', now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }))
    
    // Janela de 12 horas (11h45 a 12h15 para dar margem)
    const window12hStart = new Date(now.getTime() + (11 * 60 + 45) * 60 * 1000)
    const window12hEnd = new Date(now.getTime() + (12 * 60 + 15) * 60 * 1000)
    
    // Janela de 1 hora (55min a 1h05 para dar margem)
    const window1hStart = new Date(now.getTime() + (55) * 60 * 1000)
    const window1hEnd = new Date(now.getTime() + (65) * 60 * 1000)
    
    // Janela de 20 minutos (18min a 22min para dar margem)
    const window20minStart = new Date(now.getTime() + (18) * 60 * 1000)
    const window20minEnd = new Date(now.getTime() + (22) * 60 * 1000)

    console.log('⏰ Janelas de tempo calculadas (UTC):')
    console.log('  12h:', window12hStart.toISOString(), 'até', window12hEnd.toISOString())
    console.log('  1h:', window1hStart.toISOString(), 'até', window1hEnd.toISOString())
    console.log('  20min:', window20minStart.toISOString(), 'até', window20minEnd.toISOString())

    let totalSent = 0
    const results = {
      reminder_12h: 0,
      reminder_1h: 0,
      reminder_20min: 0,
      errors: [] as string[]
    }

    // =====================================================
    // PROCESSAR LEMBRETES DE 12H
    // =====================================================
    console.log('\n📧 Processando lembretes de 12h...')
    
    const { data: appointments12h, error: error12h } = await supabase
      .from('appointments')
      .select(`
        id,
        barbershop_id,
        barber_id,
        client_name,
        client_email,
        start_time,
        barbers (name)
      `)
      .gte('start_time', window12hStart.toISOString())
      .lte('start_time', window12hEnd.toISOString())
      .in('status', ['confirmed', 'pending'])
      .not('client_email', 'is', null)

    if (error12h) {
      console.error('❌ Erro ao buscar appointments 12h:', error12h)
      results.errors.push(`12h query error: ${error12h.message}`)
    } else if (appointments12h && appointments12h.length > 0) {
      console.log(`✅ Encontrados ${appointments12h.length} agendamentos para lembrete de 12h`)
      
      for (const apt of appointments12h) {
        try {
          await processReminder(supabase, apt, '12h', results)
          totalSent++
        } catch (err) {
          console.error(`❌ Erro ao processar appointment ${apt.id}:`, err)
          results.errors.push(`Appointment ${apt.id}: ${err.message}`)
        }
      }
    } else {
      console.log('ℹ️ Nenhum agendamento encontrado para lembrete de 12h')
    }

    // =====================================================
    // PROCESSAR LEMBRETES DE 1H
    // =====================================================
    console.log('\n📧 Processando lembretes de 1h...')
    
    const { data: appointments1h, error: error1h } = await supabase
      .from('appointments')
      .select(`
        id,
        barbershop_id,
        barber_id,
        client_name,
        client_email,
        start_time,
        barbers (name)
      `)
      .gte('start_time', window1hStart.toISOString())
      .lte('start_time', window1hEnd.toISOString())
      .in('status', ['confirmed', 'pending'])
      .not('client_email', 'is', null)

    if (error1h) {
      console.error('❌ Erro ao buscar appointments 1h:', error1h)
      results.errors.push(`1h query error: ${error1h.message}`)
    } else if (appointments1h && appointments1h.length > 0) {
      console.log(`✅ Encontrados ${appointments1h.length} agendamentos para lembrete de 1h`)
      
      for (const apt of appointments1h) {
        try {
          await processReminder(supabase, apt, '1h', results)
          totalSent++
        } catch (err) {
          console.error(`❌ Erro ao processar appointment ${apt.id}:`, err)
          results.errors.push(`Appointment ${apt.id}: ${err.message}`)
        }
      }
    } else {
      console.log('ℹ️ Nenhum agendamento encontrado para lembrete de 1h')
    }

    // =====================================================
    // PROCESSAR LEMBRETES DE 20MIN
    // =====================================================
    console.log('\n📧 Processando lembretes de 20min...')
    
    const { data: appointments20min, error: error20min } = await supabase
      .from('appointments')
      .select(`
        id,
        barbershop_id,
        barber_id,
        client_name,
        client_email,
        start_time,
        barbers (name)
      `)
      .gte('start_time', window20minStart.toISOString())
      .lte('start_time', window20minEnd.toISOString())
      .in('status', ['confirmed', 'pending'])
      .not('client_email', 'is', null)

    if (error20min) {
      console.error('❌ Erro ao buscar appointments 20min:', error20min)
      results.errors.push(`20min query error: ${error20min.message}`)
    } else if (appointments20min && appointments20min.length > 0) {
      console.log(`✅ Encontrados ${appointments20min.length} agendamentos para lembrete de 20min`)
      
      for (const apt of appointments20min) {
        try {
          await processReminder(supabase, apt, '20min', results)
          totalSent++
        } catch (err) {
          console.error(`❌ Erro ao processar appointment ${apt.id}:`, err)
          results.errors.push(`Appointment ${apt.id}: ${err.message}`)
        }
      }
    } else {
      console.log('ℹ️ Nenhum agendamento encontrado para lembrete de 20min')
    }

    console.log(`\n✅ Processamento concluído! Total de emails enviados: ${totalSent}`)
    console.log('📊 Resumo:', results)

    return new Response(
      JSON.stringify({
        success: true,
        total_sent: totalSent,
        details: results,
        timestamp: new Date().toISOString()
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('💥 Erro na função:', error)
    return new Response(
      JSON.stringify({
        error: 'Erro interno ao processar lembretes',
        details: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

// =====================================================
// FUNÇÃO AUXILIAR: PROCESSAR LEMBRETE INDIVIDUAL
// =====================================================
async function processReminder(
  supabase: any,
  appointment: any,
  reminderType: '12h' | '1h' | '20min',
  results: any
) {
  console.log(`\n🔄 Processando ${reminderType} para appointment ${appointment.id}`)

  // Buscar configurações de notificação
  const { data: settings, error: settingsError } = await supabase
    .from('notification_settings')
    .select('*')
    .eq('barbershop_id', appointment.barbershop_id)
    .single()

  if (settingsError || !settings) {
    console.log(`⏭️ Sem configurações para barbershop ${appointment.barbershop_id}`)
    return
  }

  // Verificar se o lembrete está ativo
  const activeField = `reminder_${reminderType}_active`
  const subjectField = `reminder_${reminderType}_subject`
  const bodyField = `reminder_${reminderType}_body`

  if (!settings[activeField]) {
    console.log(`⏭️ Lembrete ${reminderType} desativado para esta barbearia`)
    return
  }

  console.log(`✅ Lembrete ${reminderType} ativo`)

  // Buscar dados da barbearia
  const { data: barbershop, error: barbershopError } = await supabase
    .from('barbershops')
    .select('id, name, logo_url, address')
    .eq('id', appointment.barbershop_id)
    .single()

  if (barbershopError || !barbershop) {
    console.error('❌ Barbearia não encontrada')
    return
  }

  // Processar dados do agendamento
  const startTime = new Date(appointment.start_time)
  
  // Formatar data e hora no timezone de Brasília
  const appointmentDate = startTime.toLocaleDateString('pt-BR', { 
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
  
  const appointmentTime = startTime.toLocaleTimeString('pt-BR', { 
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit', 
    minute: '2-digit' 
  })
  
  const barberName = appointment.barbers?.name || 'Barbeiro'
  
  console.log(`📅 Agendamento: ${appointmentDate} às ${appointmentTime} (Brasília)`)
  console.log(`📅 UTC: ${startTime.toISOString()}`)

  // Processar mensagem
  const processedMessage = parseMessage(settings[bodyField], {
    clientName: appointment.client_name,
    barberName,
    appointmentTime,
    appointmentDate
  })

  // Gerar HTML
  const emailHTML = getEmailHTML(processedMessage, barbershop, reminderType)

  // Enviar email via Resend
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  
  if (!resendApiKey) {
    console.error('❌ RESEND_API_KEY não configurada')
    throw new Error('RESEND_API_KEY não configurada')
  }

  const fromEmail = `${barbershop.name} <onboarding@resend.dev>`
  const subject = settings[subjectField]

  console.log('📤 Enviando email...')
  console.log('  Para:', appointment.client_email)
  console.log('  Assunto:', subject)

  const resendResponse = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [appointment.client_email],
      subject: subject,
      html: emailHTML,
    }),
  })

  const resendData = await resendResponse.json()

  if (!resendResponse.ok) {
    console.error('❌ Erro na API do Resend:', resendData)
    throw new Error(`Resend API error: ${JSON.stringify(resendData)}`)
  }

  console.log('✅ Email enviado com sucesso!')
  console.log('📬 ID:', resendData.id)

  // Incrementar contador
  results[`reminder_${reminderType}`]++
}
