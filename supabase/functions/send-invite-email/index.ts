// =====================================================
// SUPABASE EDGE FUNCTION: SEND INVITE EMAIL
// =====================================================
// Envia emails de convite profissional via Resend API
// Usado pelo Super Admin para convidar novos barbeiros
// Deploy: supabase functions deploy send-invite-email
// =====================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_URL = 'https://api.resend.com/emails'

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
    console.log('📧 Iniciando envio de email de convite...')

    const payload = await req.json()
    const { to, subject, html } = payload

    console.log('📧 Destinatário:', to)
    console.log('📋 Assunto:', subject)

    // Validação
    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: 'Parâmetros obrigatórios: to, subject, html' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Buscar API Key do Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    
    if (!resendApiKey) {
      console.error('❌ RESEND_API_KEY não configurada')
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY não configurada' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Enviar email via Resend
    console.log('📤 Enviando email via Resend...')
    
    const resendResponse = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Brio App <convite@brioapp.online>',
        to: [to],
        subject: subject,
        html: html,
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
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          } 
        }
      )
    }

    console.log('✅ Email enviado com sucesso!')
    console.log('📬 ID do email:', resendData.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email de convite enviado com sucesso!',
        email_id: resendData.id,
        sent_to: to
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
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
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    )
  }
})
