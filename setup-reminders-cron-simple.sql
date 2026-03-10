-- =====================================================
-- SETUP SIMPLIFICADO: CRON JOB PARA LEMBRETES
-- =====================================================
-- Este script configura apenas o cron job, assumindo que
-- a extensão pg_cron já está ativada
-- =====================================================

-- PASSO 1: Remover job anterior se existir (ignora erro se não existir)
DO $$
BEGIN
  PERFORM cron.unschedule('process-reminders-every-30min');
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Job não existia anteriormente';
END $$;

-- PASSO 2: Criar job para executar a cada 30 minutos
SELECT cron.schedule(
  'process-reminders-every-30min',
  '*/30 * * * *',
  $$
  SELECT
    net.http_post(
      url:='https://cntdiuaxocutsqwqnrkd.supabase.co/functions/v1/process-reminders',
      headers:=jsonb_build_object(
        'Content-Type', 'application/json',c:\Users\gsant\AppData\Local\Packages\5319275A.WhatsAppDesktop_cv1g1gvanyjgm\LocalState\sessions\A299DA9A00786592B0506B5F806AAC819DB231BC\transfers\2026-10\WhatsApp Image 2026-03-06 at 16.28.52.jpegc
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body:='{}'::jsonb
    ) as request_id;
  $$
);

-- PASSO 3: Verificar se o job foi criado
SELECT 
  jobid,
  jobname,
  schedule,
  active,
  database
FROM cron.job 
WHERE jobname = 'process-reminders-every-30min';

-- PASSO 4: Criar configurações padrão de notificação
INSERT INTO notification_settings (
  barbershop_id,
  reminder_12h_active,
  reminder_12h_subject,
  reminder_12h_body,
  reminder_1h_active,
  reminder_1h_subject,
  reminder_1h_body,
  reminder_20min_active,
  reminder_20min_subject,
  reminder_20min_body
)
SELECT 
  id as barbershop_id,
  true,
  'Lembrete: Seu agendamento é amanhã!',
  'Olá [Nome Cliente]! 

Lembramos que você tem um agendamento marcado com [Barbeiro] para [Horário].

Nos vemos em breve!',
  true,
  'Lembrete: Seu agendamento é daqui a 1 hora!',
  'Olá [Nome Cliente]! 

Seu agendamento com [Barbeiro] é daqui a 1 hora: [Horário].

Já está a caminho?',
  true,
  'Lembrete: Seu agendamento é daqui a 20 minutos!',
  'Olá [Nome Cliente]! 

Seu agendamento com [Barbeiro] é daqui a 20 minutos: [Horário].

Te esperamos!'
FROM barbershops
WHERE id NOT IN (SELECT barbershop_id FROM notification_settings)
ON CONFLICT (barbershop_id) DO NOTHING;

-- PASSO 5: Verificar configurações
SELECT 
  ns.barbershop_id,
  b.name as barbershop_name,
  ns.reminder_12h_active,
  ns.reminder_1h_active,
  ns.reminder_20min_active
FROM notification_settings ns
JOIN barbershops b ON b.id = ns.barbershop_id;

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
-- Você deve ver:
-- 1. Uma linha confirmando que o job foi criado
-- 2. Lista de barbearias com lembretes ativados
-- =====================================================
