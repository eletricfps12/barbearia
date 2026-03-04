// =====================================================
// TESTE DE INTEGRAÇÃO RESEND + BRIOAPP.ONLINE
// =====================================================
// Script para validar que o domínio está configurado
// e os emails estão sendo enviados corretamente
// =====================================================

import { Resend } from 'resend';

// ⚠️ SUBSTITUA PELA SUA API KEY DO RESEND
const resend = new Resend('re_gWbuUp1s_4ohCpUNiRGfwCYikaSwSkmRF');

async function testConnection() {
  console.log('🚀 Iniciando teste de envio de email...');
  console.log('📧 Remetente: team@brioapp.online');
  console.log('📬 Destinatário: zanattaguilherme12@gmail.com');
  console.log('');

  try {
    const { data, error } = await resend.emails.send({
      from: 'Brio App <team@brioapp.online>',
      to: 'zanattaguilherme12@gmail.com',
      subject: 'Sinal Verde: Brio App está Online! 🚀',
      html: `
        <div style="background: #000; color: #fff; padding: 30px; border-radius: 15px; font-family: sans-serif; border: 1px solid #22c55e;">
          <h1 style="color: #22c55e;">BRiO APP</h1>
          <p>Olá, Comandante Zanatta!</p>
          <p>Este é um teste oficial de integração. Se você recebeu isso, a ponte entre <strong>Supabase + Resend + Hostinger</strong> está operando em 100%.</p>
          <hr style="border: 1px solid #333; margin: 20px 0;" />
          <h2 style="color: #22c55e;">✅ Status da Integração</h2>
          <ul style="line-height: 1.8;">
            <li>✅ Domínio brioapp.online verificado</li>
            <li>✅ API Key do Resend configurada</li>
            <li>✅ Edge Functions deployadas</li>
            <li>✅ Sistema de convites funcionando</li>
          </ul>
          <hr style="border: 1px solid #333; margin: 20px 0;" />
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            © 2026 Black Sheep Tech. Todos os direitos reservados.
          </p>
        </div>
      `
    });

    if (error) {
      console.error('❌ Falha no disparo:', error);
      console.error('');
      console.error('🔍 Possíveis causas:');
      console.error('  1. API Key inválida ou expirada');
      console.error('  2. Domínio brioapp.online não verificado no Resend');
      console.error('  3. Limite de envios atingido (plano free tem limite)');
      console.error('');
      return;
    }

    console.log('✅ E-mail enviado com sucesso!');
    console.log('📬 ID do email:', data.id);
    console.log('');
    console.log('🎯 Próximos passos:');
    console.log('  1. Verifique sua caixa de entrada (zanattaguilherme12@gmail.com)');
    console.log('  2. Se não estiver na caixa principal, verifique o SPAM');
    console.log('  3. Confira os logs no painel do Resend: https://resend.com/emails');
    console.log('');
    console.log('📊 Logs do Resend:', data);

  } catch (error) {
    console.error('💥 Erro inesperado:', error.message);
    console.error('');
    console.error('🔧 Verifique:');
    console.error('  1. Se instalou o pacote: npm install resend');
    console.error('  2. Se está usando Node.js 18+ ou Deno');
    console.error('  3. Se a API Key está correta');
  }
}

// Executar teste
testConnection();
