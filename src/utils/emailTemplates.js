// =====================================================
// EMAIL TEMPLATES - APPLE STYLE DARK THEME
// =====================================================
// Templates HTML premium para notificações por email
// =====================================================

/**
 * Template base com estilo Apple (dark theme)
 */
export const getEmailTemplate = ({ title, message, ctaText, ctaLink, barbershopName }) => {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%);
      padding: 40px 20px;
      line-height: 1.6;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: rgba(26, 26, 26, 0.95);
      border-radius: 24px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    }
    .header {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2));
      padding: 40px 30px;
      text-align: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    .header h1 {
      color: #ffffff;
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }
    .header p {
      color: rgba(255, 255, 255, 0.7);
      font-size: 14px;
    }
    .content {
      padding: 40px 30px;
    }
    .message {
      color: rgba(255, 255, 255, 0.9);
      font-size: 16px;
      line-height: 1.8;
      margin-bottom: 30px;
      white-space: pre-line;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #ffffff;
      text-decoration: none;
      padding: 16px 32px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 16px;
      transition: transform 0.2s ease;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    }
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
    }
    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
      margin: 30px 0;
    }
    .footer {
      padding: 30px;
      text-align: center;
      background: rgba(10, 10, 10, 0.5);
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }
    .footer p {
      color: rgba(255, 255, 255, 0.5);
      font-size: 13px;
      margin-bottom: 8px;
    }
    .footer a {
      color: #6366f1;
      text-decoration: none;
    }
    .icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="icon">💈</div>
      <h1>${title}</h1>
      <p>${barbershopName || 'Sua Barbearia'}</p>
    </div>
    
    <div class="content">
      <div class="message">${message}</div>
      
      ${ctaText && ctaLink ? `
        <div style="text-align: center;">
          <a href="${ctaLink}" class="cta-button">${ctaText}</a>
        </div>
      ` : ''}
    </div>
    
    <div class="footer">
      <p>Este é um email automático, por favor não responda.</p>
      <p>© ${new Date().getFullYear()} ${barbershopName || 'Sua Barbearia'}. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Processa variáveis no texto da mensagem
 */
export const processVariables = (text, variables) => {
  let processed = text

  // Substituir variáveis
  if (variables.clientName) {
    processed = processed.replace(/\[Nome Cliente\]/g, variables.clientName)
  }
  if (variables.barberName) {
    processed = processed.replace(/\[Barbeiro\]/g, variables.barberName)
  }
  if (variables.appointmentTime) {
    processed = processed.replace(/\[Horário\]/g, variables.appointmentTime)
  }
  if (variables.cancelLink) {
    processed = processed.replace(/\[Link de Cancelamento\]/g, `<a href="${variables.cancelLink}" style="color: #6366f1;">Cancelar Agendamento</a>`)
  }
  if (variables.bookingLink) {
    processed = processed.replace(/\[Link de Agendamento\]/g, `<a href="${variables.bookingLink}" style="color: #6366f1;">Agendar Horário</a>`)
  }

  return processed
}

/**
 * Gera email de confirmação de agendamento
 */
export const generateConfirmationEmail = ({ 
  clientName, 
  barberName, 
  appointmentTime, 
  barbershopName,
  customMessage 
}) => {
  const message = processVariables(
    customMessage || 'Olá [Nome Cliente]! Seu agendamento com [Barbeiro] está confirmado para [Horário]. Nos vemos em breve! 💈',
    { clientName, barberName, appointmentTime }
  )

  return getEmailTemplate({
    title: '✅ Agendamento Confirmado',
    message,
    barbershopName
  })
}

/**
 * Gera email de lembrete 12h antes
 */
export const generateReminder12hEmail = ({ 
  clientName, 
  barberName, 
  appointmentTime, 
  barbershopName,
  customMessage 
}) => {
  const message = processVariables(
    customMessage || 'Oi [Nome Cliente]! Lembrete: você tem agendamento amanhã às [Horário] com [Barbeiro]. Até lá! ✂️',
    { clientName, barberName, appointmentTime }
  )

  return getEmailTemplate({
    title: '⏰ Lembrete: Agendamento Amanhã',
    message,
    barbershopName
  })
}

/**
 * Gera email de lembrete 1h antes
 */
export const generateReminder1hEmail = ({ 
  clientName, 
  barberName, 
  appointmentTime, 
  barbershopName,
  customMessage 
}) => {
  const message = processVariables(
    customMessage || 'Olá [Nome Cliente]! Seu horário com [Barbeiro] é daqui a 1 hora ([Horário]). Estamos te esperando! 🕐',
    { clientName, barberName, appointmentTime }
  )

  return getEmailTemplate({
    title: '🔔 Seu horário é daqui a 1 hora',
    message,
    barbershopName
  })
}

/**
 * Gera email de reativação de cliente
 */
export const generateReactivationEmail = ({ 
  clientName, 
  bookingLink, 
  barbershopName,
  customMessage 
}) => {
  const message = processVariables(
    customMessage || 'Olá [Nome Cliente]! Sentimos sua falta! Que tal agendar um horário? [Link de Agendamento] 😊',
    { clientName, bookingLink }
  )

  return getEmailTemplate({
    title: '😊 Sentimos sua falta!',
    message,
    ctaText: 'Agendar Horário',
    ctaLink: bookingLink,
    barbershopName
  })
}

/**
 * Gera email de convite profissional - Brio App Style
 */
export const generateInviteEmail = ({ barberName, barbershopName, inviteLink }) => {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Convite Brio App</title>
</head>
<body style="margin: 0; padding: 0; background-color: #000000; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <div style="background-color: #000000; color: #ffffff; padding: 50px 20px; text-align: center;">
    <div style="border: 1px solid rgba(34, 197, 94, 0.2); padding: 40px; border-radius: 20px; background: #0a0a0a; max-width: 500px; margin: 0 auto;">
      
      <!-- Logo -->
      <h1 style="color: #22c55e; letter-spacing: 2px; margin-bottom: 10px; font-size: 32px; font-weight: 700;">BRiO APP</h1>
      <p style="color: #a1a1aa; font-size: 14px; margin-bottom: 30px; text-transform: uppercase; letter-spacing: 1px;">BLACK SHEEP SUPER ADMIN</p>
      
      <!-- Título -->
      <h2 style="font-size: 20px; margin-bottom: 20px; color: #ffffff; font-weight: 600;">Você foi convidado pelo Brio App</h2>
      
      <!-- Mensagem -->
      <p style="color: #d4d4d8; line-height: 1.6; margin-bottom: 30px; font-size: 15px;">
        Olá, <strong style="color: #ffffff;">${barberName}</strong>!<br><br>
        É com prazer que informamos que a <strong style="color: #22c55e;">${barbershopName}</strong> foi selecionada para integrar o ecossistema Brio App.<br><br>
        Nossa plataforma foi desenvolvida para barbearias que buscam gestão de elite e performance superior. Você recebeu um acesso exclusivo para configurar sua unidade e testar todas as nossas funcionalidades em primeira mão.
      </p>
      
      <!-- CTA Button -->
      <a href="${inviteLink}" style="background-color: #22c55e; color: #000000; padding: 15px 35px; border-radius: 12px; font-weight: bold; text-decoration: none; display: inline-block; box-shadow: 0 4px 15px rgba(34, 197, 94, 0.3); font-size: 16px; transition: all 0.3s ease;">
        COMEÇAR AGORA
      </a>
      
      <!-- Footer -->
      <p style="margin-top: 40px; color: #52525b; font-size: 12px; line-height: 1.5;">
        Este é um convite exclusivo e intransferível enviado por <strong style="color: #22c55e;">brioapp.online</strong><br>
        Seja bem-vindo à nova era da sua gestão.
      </p>
      
      <p style="margin-top: 20px; color: #3f3f46; font-size: 11px;">
        Equipe Brio App | Black Sheep Admin 💻
      </p>
    </div>
  </div>
</body>
</html>
  `.trim()
}
