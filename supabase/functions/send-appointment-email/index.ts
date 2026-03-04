// =====================================================
// SUPABASE EDGE FUNCTION: SEND APPOINTMENT EMAIL
// =====================================================
// Envia emails de confirmação de agendamento via Resend API
// MULTI-TENANT: Suporta múltiplas barbearias com branding dinâmico
// DYNAMIC: Lê configurações e mensagens do banco de dados
// Disparado por Database Webhook quando um appointment é criado
// Deploy: supabase functions deploy send-appointment-email
// =====================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_URL = 'https://api.resend.com/emails'
const FALLBACK_EMAIL = 'seu-email@example.com' // ⚠️ Substitua pelo seu email de teste

// Interface para dados da barbearia
interface Barbershop {
  id: string
  name: string
  primary_color?: string
  logo_url?: string
  address?: string
}

// Interface para configurações de notificação
interface NotificationSettings {
  confirmation_active: boolean
  confirmation_subject: string
  confirmation_body: string
}

// =====================================================
// PARSER DE VARIÁVEIS
// =====================================================
// Substitui variáveis dinâmicas no texto
const parseMessage = (template: string, data: {
  clientName: string
  barberName: string
  appointmentTime: string
  appointmentDate: string
  bookingLink?: string
  cancelLink?: string
}): string => {
  let parsed = template
  
  // Substituir variáveis
  parsed = parsed.replace(/\[Nome Cliente\]/g, data.clientName)
  parsed = parsed.replace(/\[Barbeiro\]/g, data.barberName)
  parsed = parsed.replace(/\[Horário\]/g, `${data.appointmentDate} às ${data.appointmentTime}`)
  
  if (data.bookingLink) {
    parsed = parsed.replace(/\[Link de Agendamento\]/g, data.bookingLink)
  }
  
  if (data.cancelLink) {
    parsed = parsed.replace(/\[Link de Cancelamento\]/g, data.cancelLink)
  }
  
  return parsed
}

// =====================================================
// TEMPLATE HTML PREMIUM (APPLE-STYLE DARK)
// =====================================================
// CSS Inline obrigatório para compatibilidade com clientes de email
const getEmailHTML = (
  messageContent: string,
  barbershop: Barbershop
) => {
  // Usar cor primária da barbearia ou fallback para indigo
  const primaryColor = barbershop.primary_color || '#4F46E5'
  
  // Converter hex para RGB para usar com opacity
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 79, g: 70, b: 229 }
  }
  
  const rgb = hexToRgb(primaryColor)
  const rgbString = `${rgb.r}, ${rgb.g}, ${rgb.b}`
  
  // Processar quebras de linha no conteúdo
  const formattedContent = messageContent.replace(/\n/g, '<br>')
  
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Agendamento Confirmado - ${barbershop.name}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #050505; line-height: 1.6;">
  
  <!-- Container Principal -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #050505; padding: 40px 20px;">
    <tr>
      <td align="center">
        
        <!-- Card Principal -->
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #121212; border-radius: 16px; border: 1px solid #2A2A2A; overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, rgba(${rgbString}, 0.15), rgba(${rgbString}, 0.25)); padding: 40px 30px; text-align: center; border-bottom: 1px solid #2A2A2A;">
              
              ${barbershop.logo_url ? `
                <img src="${barbershop.logo_url}" alt="${barbershop.name}" style="width: 80px; height: 80px; border-radius: 50%; margin-bottom: 16px; object-fit: cover; display: block; margin-left: auto; margin-right: auto;" />
              ` : `
                <div style="font-size: 48px; margin-bottom: 16px;">✂️</div>
              `}
              
              <h1 style="margin: 0 0 8px 0; color: #FFFFFF; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                Agendamento Confirmado!
              </h1>
              
              <p style="margin: 0; color: rgba(255, 255, 255, 0.7); font-size: 14px;">
                Seu horário foi reservado com sucesso
              </p>
              
              <p style="margin: 8px 0 0 0; color: rgb(${rgbString}); font-weight: 600; font-size: 16px;">
                ${barbershop.name}
              </p>
            </td>
          </tr>
          
          <!-- Conteúdo -->
          <tr>
            <td style="padding: 40px 30px;">
              
              <!-- Mensagem Personalizada -->
              <div style="color: rgba(255, 255, 255, 0.9); font-size: 16px; line-height: 1.8; margin-bottom: 30px;">
                ${formattedContent}
              </div>
              
              ${barbershop.address ? `
                <!-- Botão Ver no Mapa -->
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
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; text-align: center; background-color: rgba(10, 10, 10, 0.5); border-top: 1px solid #2A2A2A;">
              <p style="margin: 0 0 8px 0; color: #888888; font-size: 13px;">
                Se precisar cancelar ou reagendar, por favor, entre em contato com antecedência.
              </p>
              <p style="margin: 0 0 8px 0; color: #888888; font-size: 13px;">
                Esperamos você!
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
    console.log('📧 Iniciando envio de email de agendamento...')

    // Parse do payload do webhook
    const payload = await req.json()
    console.log('📦 Payload recebido:', JSON.stringify(payload, null, 2))

    // Extrair dados do appointment (vem do webhook do Supabase)
    const record = payload.record || payload
    
    const clientName = record.client_name || 'Cliente'
    const clientEmail = record.client_email || FALLBACK_EMAIL
    const barbershopId = record.barbershop_id
    
    // Processar start_time (timestamp)
    const startTime = record.start_time ? new Date(record.start_time) : new Date()
    const appointmentDate = startTime.toLocaleDateString('pt-BR')
    const appointmentTime = startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    
    // Buscar nome do barbeiro (precisamos fazer query)
    let barberName = 'Barbeiro'

    console.log('👤 Cliente:', clientName)
    console.log('📧 Email:', clientEmail)
    console.log('🏪 Barbershop ID:', barbershopId)
    console.log('📅 Data:', appointmentDate)
    console.log('🕐 Horário:', appointmentTime)

    // Validação básica
    if (!clientEmail) {
      console.error('❌ Email do cliente não fornecido')
      return new Response(
        JSON.stringify({ error: 'Email do cliente é obrigatório' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!barbershopId) {
      console.error('❌ barbershop_id não fornecido')
      return new Response(
        JSON.stringify({ error: 'barbershop_id é obrigatório' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Criar cliente Supabase
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

    // =====================================================
    // 1. BUSCAR CONFIGURAÇÕES DE NOTIFICAÇÃO
    // =====================================================
    console.log('⚙️ Buscando configurações de notificação...')
    const { data: notificationSettings, error: settingsError } = await supabase
      .from('notification_settings')
      .select('confirmation_active, confirmation_subject, confirmation_body')
      .eq('barbershop_id', barbershopId)
      .single()

    if (settingsError) {
      console.error('❌ Erro ao buscar configurações:', settingsError)
      return new Response(
        JSON.stringify({ error: 'Configurações de notificação não encontradas', details: settingsError }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // =====================================================
    // 2. VERIFICAR SE NOTIFICAÇÃO ESTÁ ATIVADA
    // =====================================================
    if (!notificationSettings || !notificationSettings.confirmation_active) {
      console.log('⏸️ Notificação de confirmação desativada para esta barbearia')
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Notificação de confirmação está desativada' 
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Notificação ativada')
    console.log('📝 Assunto:', notificationSettings.confirmation_subject)
    console.log('💬 Template:', notificationSettings.confirmation_body.substring(0, 50) + '...')

    // =====================================================
    // 3. BUSCAR DADOS DA BARBEARIA
    // =====================================================
    console.log('🔍 Buscando dados da barbearia...')
    const { data: barbershop, error: barbershopError } = await supabase
      .from('barbershops')
      .select('id, name, logo_url, address')
      .eq('id', barbershopId)
      .single()

    if (barbershopError || !barbershop) {
      console.error('❌ Erro ao buscar barbearia:', barbershopError)
      return new Response(
        JSON.stringify({ error: 'Barbearia não encontrada', details: barbershopError }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log('🏪 Barbearia encontrada:', barbershop.name)
    console.log('🖼️ Logo:', barbershop.logo_url || 'Sem logo')
    console.log('📍 Endereço:', barbershop.address || 'Não informado')

    // =====================================================
    // 4. BUSCAR NOME DO BARBEIRO
    // =====================================================
    if (record.barber_id) {
      console.log('🔍 Buscando dados do barbeiro...')
      const { data: barber, error: barberError } = await supabase
        .from('barbers')
        .select('name')
        .eq('id', record.barber_id)
        .single()
      
      if (!barberError && barber) {
        barberName = barber.name
        console.log('💈 Barbeiro encontrado:', barberName)
      }
    }

    // =====================================================
    // 5. PROCESSAR VARIÁVEIS NA MENSAGEM
    // =====================================================
    console.log('🔄 Processando variáveis na mensagem...')
    const processedMessage = parseMessage(notificationSettings.confirmation_body, {
      clientName,
      barberName,
      appointmentTime,
      appointmentDate
    })

    console.log('✅ Mensagem processada')

    // =====================================================
    // 6. GERAR HTML DO EMAIL
    // =====================================================
    const emailHTML = getEmailHTML(processedMessage, barbershop)

    // =====================================================
    // 7. ENVIAR EMAIL VIA RESEND
    // =====================================================
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    
    if (!resendApiKey) {
      console.error('❌ RESEND_API_KEY não configurada')
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY não configurada nas variáveis de ambiente' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log('📤 Enviando email via Resend...')
    
    const fromEmail = `${barbershop.name} <agendamento@brioapp.online>`
    const subject = notificationSettings.confirmation_subject
    
    console.log('📧 Remetente:', fromEmail)
    console.log('📋 Assunto:', subject)
    
    const resendResponse = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [clientEmail],
        subject: subject,
        html: emailHTML,
      }),
    })

    const resendData = await resendResponse.json()

    if (!resendResponse.ok) {
      console.error('❌ Erro na API do Resend:', resendData)
      return new Response(
        JSON.stringify({ 
          error: 'Falha ao enviar email', 
          details: resendData 
        }),
        { 
          status: resendResponse.status, 
          headers: { 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ Email enviado com sucesso!')
    console.log('📬 ID do email:', resendData.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email de confirmação enviado com sucesso!',
        email_id: resendData.id,
        sent_to: clientEmail,
        barbershop: barbershop.name,
        subject: subject
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('💥 Erro na função:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno ao processar requisição',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    )
  }
})
