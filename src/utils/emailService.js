// =====================================================
// EMAIL SERVICE
// =====================================================
// Helper para enviar emails via Edge Function
// =====================================================

import { supabase } from '../lib/supabase'
import { 
  generateConfirmationEmail, 
  generateReminder12hEmail, 
  generateReminder1hEmail, 
  generateReactivationEmail,
  generateInviteEmail
} from './emailTemplates'

/**
 * Envia email via Edge Function
 */
export const sendEmail = async ({ to, subject, html, barbershopId }) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to,
        subject,
        html,
        barbershop_id: barbershopId
      }
    })

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Erro ao enviar email:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Envia email de confirmação de agendamento
 */
export const sendConfirmationEmail = async ({
  clientEmail,
  clientName,
  barberName,
  appointmentTime,
  barbershopId,
  barbershopName
}) => {
  try {
    // Buscar configurações
    const { data: settings } = await supabase
      .from('email_settings')
      .select('confirmation_enabled, confirmation_subject, confirmation_message')
      .eq('barbershop_id', barbershopId)
      .single()

    if (!settings || !settings.confirmation_enabled) {
      return { success: false, error: 'Confirmação de email não está habilitada' }
    }

    // Gerar HTML do email
    const html = generateConfirmationEmail({
      clientName,
      barberName,
      appointmentTime,
      barbershopName,
      customMessage: settings.confirmation_message
    })

    // Enviar
    return await sendEmail({
      to: clientEmail,
      subject: settings.confirmation_subject,
      html,
      barbershopId
    })
  } catch (error) {
    console.error('Erro ao enviar email de confirmação:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Envia email de lembrete 12h antes
 */
export const sendReminder12hEmail = async ({
  clientEmail,
  clientName,
  barberName,
  appointmentTime,
  barbershopId,
  barbershopName
}) => {
  try {
    const { data: settings } = await supabase
      .from('email_settings')
      .select('reminder_12h_enabled, reminder_12h_subject, reminder_12h_message')
      .eq('barbershop_id', barbershopId)
      .single()

    if (!settings || !settings.reminder_12h_enabled) {
      return { success: false, error: 'Lembrete 12h não está habilitado' }
    }

    const html = generateReminder12hEmail({
      clientName,
      barberName,
      appointmentTime,
      barbershopName,
      customMessage: settings.reminder_12h_message
    })

    return await sendEmail({
      to: clientEmail,
      subject: settings.reminder_12h_subject,
      html,
      barbershopId
    })
  } catch (error) {
    console.error('Erro ao enviar lembrete 12h:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Envia email de lembrete 1h antes
 */
export const sendReminder1hEmail = async ({
  clientEmail,
  clientName,
  barberName,
  appointmentTime,
  barbershopId,
  barbershopName
}) => {
  try {
    const { data: settings } = await supabase
      .from('email_settings')
      .select('reminder_1h_enabled, reminder_1h_subject, reminder_1h_message')
      .eq('barbershop_id', barbershopId)
      .single()

    if (!settings || !settings.reminder_1h_enabled) {
      return { success: false, error: 'Lembrete 1h não está habilitado' }
    }

    const html = generateReminder1hEmail({
      clientName,
      barberName,
      appointmentTime,
      barbershopName,
      customMessage: settings.reminder_1h_message
    })

    return await sendEmail({
      to: clientEmail,
      subject: settings.reminder_1h_subject,
      html,
      barbershopId
    })
  } catch (error) {
    console.error('Erro ao enviar lembrete 1h:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Envia email de reativação de cliente
 */
export const sendReactivationEmail = async ({
  clientEmail,
  clientName,
  bookingLink,
  barbershopId,
  barbershopName
}) => {
  try {
    const { data: settings } = await supabase
      .from('email_settings')
      .select('reactivation_enabled, reactivation_subject, reactivation_message')
      .eq('barbershop_id', barbershopId)
      .single()

    if (!settings || !settings.reactivation_enabled) {
      return { success: false, error: 'Reativação não está habilitada' }
    }

    const html = generateReactivationEmail({
      clientName,
      bookingLink,
      barbershopName,
      customMessage: settings.reactivation_message
    })

    return await sendEmail({
      to: clientEmail,
      subject: settings.reactivation_subject,
      html,
      barbershopId
    })
  } catch (error) {
    console.error('Erro ao enviar email de reativação:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Testa envio de email (para debug)
 */
export const sendTestEmail = async ({ to, barbershopId }) => {
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px;">
        <h1 style="color: #6366f1;">🧪 Email de Teste</h1>
        <p>Este é um email de teste do sistema de notificações.</p>
        <p>Se você recebeu este email, significa que o sistema está funcionando corretamente! ✅</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e5e5;">
        <p style="color: #666; font-size: 12px;">
          Enviado em: ${new Date().toLocaleString('pt-BR')}
        </p>
      </div>
    </div>
  `

  return await sendEmail({
    to,
    subject: '🧪 Teste de Email - Sistema de Notificações',
    html,
    barbershopId
  })
}

/**
 * Envia email de convite profissional - Brio App
 */
export const sendInviteEmail = async ({ to, barberName, barbershopName, inviteLink }) => {
  try {
    const html = generateInviteEmail({
      barberName,
      barbershopName,
      inviteLink
    })

    // Usar a Edge Function dedicada para convites
    const { data, error } = await supabase.functions.invoke('send-invite-email', {
      body: {
        to,
        subject: '[CONVITE] Sua barbearia foi selecionada para o Brio App ⚡',
        html
      }
    })

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Erro ao enviar email de convite:', error)
    return { success: false, error: error.message }
  }
}
