-- =====================================================
-- SETUP: CONFIGURAR CRON JOB PARA LEMBRETES AUTOMÁTICOS
-- =====================================================
-- Este script configura o envio automático de lembretes
-- de agendamento (20min, 1h, 12h antes)
-- =====================================================

-- PASSO 1: Ativar extensão pg_cron (se ainda não estiver ativa)
-- Nota: Isso também pode ser feito via Dashboard → Database → Extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- PASSO 2: Remover job anterior se existir
SELECT cron.unschedule('process-reminders-every-30min');

-- PASSO 3: Criar job para executar a cada 30 minutos
-- A função será chamada via HTTP POST
SELECT cron.schedule(
  'process-reminders-every-30min',
  '*/30 * * * *', -- A cada 30 minutos
  $$
  SELECT
    net.http_post(
      url:='https://cntdiuaxocutsqwqnrkd.supabase.co/functions/v1/process-reminders',
      headers:=jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body:='{}'::jsonb
    ) as request_id;
  $$
);

-- PASSO 4: Verificar se o job foi criado com sucesso
SELECT 
  jobid,
  jobname,
  schedule,
  active,
  database
FROM cron.job 
WHERE jobname = 'process-reminders-every-30min';

-- PASSO 5: Criar configurações padrão de notificação para barbearias que não têm
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
  true as reminder_12h_active,
  'Lembrete: Seu agendamento é amanhã!' as reminder_12h_subject,
  'Olá [Nome Cliente]! 

Lembramos que você tem um agendamento marcado com [Barbeiro] para [Horário].

Nos vemos em breve!' as reminder_12h_body,
  true as reminder_1h_active,
  'Lembrete: Seu agendamento é daqui a 1 hora!' as reminder_1h_subject,
  'Olá [Nome Cliente]! 

Seu agendamento com [Barbeiro] é daqui a 1 hora: [Horário].

Já está a caminho?' as reminder_1h_body,
  true as reminder_20min_active,
  'Lembrete: Seu agendamento é daqui a 20 minutos!' as reminder_20min_subject,
  'Olá [Nome Cliente]! 

Seu agendamento com [Barbeiro] é daqui a 20 minutos: [Horário].

Te esperamos!' as reminder_20min_body
FROM barbershops
WHERE id NOT IN (SELECT barbershop_id FROM notification_settings);

-- PASSO 6: Verificar configurações criadas
SELECT 
  barbershop_id,
  reminder_12h_active,
  reminder_1h_active,
  reminder_20min_active
FROM notification_settings;

-- =====================================================
-- COMANDOS ÚTEIS PARA MONITORAMENTO
-- =====================================================

-- Ver todos os jobs agendados:
-- SELECT * FROM cron.job;

-- Ver histórico de execuções (últimas 10):
-- SELECT * FROM cron.job_run_details 
-- WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'process-reminders-every-30min')
-- ORDER BY start_time DESC 
-- LIMIT 10;

-- Desativar o job temporariamente:
-- UPDATE cron.job SET active = false WHERE jobname = 'process-reminders-every-30min';

-- Reativar o job:
-- UPDATE cron.job SET active = true WHERE jobname = 'process-reminders-every-30min';

-- Remover o job completamente:
-- SELECT cron.unschedule('process-reminders-every-30min');

-- =====================================================
-- TESTE MANUAL
-- =====================================================
-- Para testar manualmente a função (sem esperar o cron):
-- SELECT
--   net.http_post(
--     url:='https://cntdiuaxocutsqwqnrkd.supabase.co/functions/v1/process-reminders',
--     headers:=jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer SEU_SERVICE_ROLE_KEY_AQUI'
--     ),
--     body:='{}'::jsonb
--   ) as request_id;

