// =====================================================
// SUPABASE EDGE FUNCTION: SEND APPROVAL EMAIL
// =====================================================
// Envia email de aprovação quando Super Admin aprova uma barbearia
// Deploy: npx supabase functions deploy send-approval-email
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
    console.log('🎉 Iniciando envio de email de aprovação...')

    // Verificar autenticação (opcional - remover se causar problemas)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.log('⚠️ Sem header de autorização, mas continuando...')
    }

    const payload = await req.json()
    const { ownerEmail, ownerName, barbershopName, trialEndsAt, loginUrl } = payload

    console.log('📧 Destinatário:', ownerEmail)
    console.log('👤 Nome:', ownerName)
    console.log('🏪 Barbearia:', barbershopName)

    // Validação
    if (!ownerEmail || !ownerName || !barbershopName || !trialEndsAt || !loginUrl) {
      return new Response(
        JSON.stringify({ 
          error: 'Parâmetros obrigatórios: ownerEmail, ownerName, barbershopName, trialEndsAt, loginUrl' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
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

    // Formatar data de fim do trial
    const trialEndDate = new Date(trialEndsAt)
    const formattedDate = trialEndDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })

    // Template do email - Design moderno e profissional
    const emailHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sua barbearia foi aprovada!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Container Principal -->
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%); border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(34, 197, 94, 0.15); border: 1px solid rgba(34, 197, 94, 0.1);">
          
          <!-- Header com gradiente verde -->
          <tr>
            <td style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 40px 40px 60px 40px; text-align: center; position: relative;">
              <div style="background: rgba(255, 255, 255, 0.1); width: 80px; height: 80px; border-radius: 20px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px); border: 2px solid rgba(255, 255, 255, 0.2);">
                <span style="font-size: 40px;">🎉</span>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                Parabéns, ${ownerName}!
              </h1>
              <p style="margin: 12px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 18px; font-weight: 500;">
                Sua barbearia foi aprovada! 🚀
              </p>
            </td>
          </tr>

          <!-- Conteúdo -->
          <tr>
            <td style="padding: 40px;">
              
              <!-- Mensagem Principal -->
              <div style="background: rgba(34, 197, 94, 0.05); border: 1px solid rgba(34, 197, 94, 0.1); border-radius: 16px; padding: 24px; margin-bottom: 32px;">
                <p style="margin: 0 0 16px 0; color: #e5e5e5; font-size: 16px; line-height: 1.6;">
                  Estamos muito felizes em ter a <strong style="color: #22c55e;">${barbershopName}</strong> no Brio App! 
                </p>
                <p style="margin: 0; color: #a3a3a3; font-size: 15px; line-height: 1.6;">
                  Seu acesso está liberado e você já pode começar a usar todas as funcionalidades da plataforma.
                </p>
              </div>

              <!-- Trial Info Card -->
              <div style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%); border: 1px solid rgba(99, 102, 241, 0.2); border-radius: 16px; padding: 24px; margin-bottom: 32px;">
                <div style="display: flex; align-items: center; margin-bottom: 12px;">
                  <span style="font-size: 24px; margin-right: 12px;">⏰</span>
                  <h2 style="margin: 0; color: #e5e5e5; font-size: 18px; font-weight: 600;">
                    Período de Trial Gratuito
                  </h2>
                </div>
                <p style="margin: 0 0 8px 0; color: #a3a3a3; font-size: 15px; line-height: 1.6;">
                  Você tem <strong style="color: #818cf8;">15 dias de acesso gratuito</strong> para testar todas as funcionalidades do Brio App.
                </p>
                <p style="margin: 0; color: #71717a; font-size: 14px;">
                  Trial válido até: <strong style="color: #818cf8;">${formattedDate}</strong>
                </p>
              </div>

              <!-- Features List -->
              <div style="margin-bottom: 32px;">
                <h3 style="margin: 0 0 20px 0; color: #e5e5e5; font-size: 16px; font-weight: 600;">
                  O que você pode fazer agora:
                </h3>
                
                <div style="margin-bottom: 16px;">
                  <div style="display: flex; align-items: start;">
                    <span style="color: #22c55e; font-size: 20px; margin-right: 12px; line-height: 1;">✓</span>
                    <div>
                      <strong style="color: #e5e5e5; font-size: 15px; display: block; margin-bottom: 4px;">Gerenciar Agendamentos</strong>
                      <span style="color: #a3a3a3; font-size: 14px;">Controle total da agenda da sua barbearia</span>
                    </div>
                  </div>
                </div>

                <div style="margin-bottom: 16px;">
                  <div style="display: flex; align-items: start;">
                    <span style="color: #22c55e; font-size: 20px; margin-right: 12px; line-height: 1;">✓</span>
                    <div>
                      <strong style="color: #e5e5e5; font-size: 15px; display: block; margin-bottom: 4px;">CRM de Clientes</strong>
                      <span style="color: #a3a3a3; font-size: 14px;">Acompanhe seus clientes e fidelize</span>
                    </div>
                  </div>
                </div>

                <div style="margin-bottom: 16px;">
                  <div style="display: flex; align-items: start;">
                    <span style="color: #22c55e; font-size: 20px; margin-right: 12px; line-height: 1;">✓</span>
                    <div>
                      <strong style="color: #e5e5e5; font-size: 15px; display: block; margin-bottom: 4px;">Identidade Visual</strong>
                      <span style="color: #a3a3a3; font-size: 14px;">Personalize sua página pública</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div style="display: flex; align-items: start;">
                    <span style="color: #22c55e; font-size: 20px; margin-right: 12px; line-height: 1;">✓</span>
                    <div>
                      <strong style="color: #e5e5e5; font-size: 15px; display: block; margin-bottom: 4px;">Relatórios Financeiros</strong>
                      <span style="color: #a3a3a3; font-size: 14px;">Acompanhe o faturamento em tempo real</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 40px 0 32px 0;">
                <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-size: 16px; font-weight: 600; box-shadow: 0 10px 30px rgba(34, 197, 94, 0.3); transition: all 0.3s ease;">
                  🚀 Acessar Meu Painel
                </a>
              </div>

              <!-- Help Section -->
              <div style="background: rgba(59, 130, 246, 0.05); border: 1px solid rgba(59, 130, 246, 0.1); border-radius: 12px; padding: 20px; text-align: center;">
                <p style="margin: 0 0 8px 0; color: #e5e5e5; font-size: 14px;">
                  <strong>Precisa de ajuda?</strong>
                </p>
                <p style="margin: 0; color: #a3a3a3; font-size: 13px;">
                  Entre em contato: <a href="mailto:suporte@brioapp.online" style="color: #3b82f6; text-decoration: none;">suporte@brioapp.online</a>
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #0a0a0a; padding: 32px 40px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.05);">
              <p style="margin: 0 0 8px 0; color: #71717a; font-size: 13px;">
                Brio App - Sistema de Gestão para Barbearias
              </p>
              <p style="margin: 0; color: #52525b; font-size: 12px;">
                Desenvolvido por <strong style="color: #22c55e;">Black Sheep</strong>
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

    // Enviar email via Resend
    console.log('📤 Enviando email via Resend...')
    
    const resendResponse = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Brio App <team@brioapp.online>',
        to: [ownerEmail],
        subject: `🎉 ${barbershopName} foi aprovada no Brio App!`,
        html: emailHtml,
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

    console.log('✅ Email de aprovação enviado com sucesso!')
    console.log('📬 ID do email:', resendData.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email de aprovação enviado com sucesso!',
        email_id: resendData.id,
        sent_to: ownerEmail
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
