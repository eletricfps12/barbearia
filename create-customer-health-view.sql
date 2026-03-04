-- =====================================================
-- CRIAR VIEW CUSTOMER_HEALTH
-- =====================================================
-- View que mostra a saúde dos clientes baseado nos agendamentos
-- =====================================================

-- Remover view antiga se existir
DROP VIEW IF EXISTS customer_health;

-- Criar view customer_health
CREATE OR REPLACE VIEW customer_health AS
SELECT 
  a.barbershop_id,
  a.client_name,
  a.client_phone,
  MAX(a.start_time::date) as last_visit,
  COUNT(a.id) as total_visits,
  CASE 
    WHEN MAX(a.start_time::date) >= CURRENT_DATE - INTERVAL '15 days' THEN 'Ativo'
    WHEN MAX(a.start_time::date) >= CURRENT_DATE - INTERVAL '30 days' THEN 'Em Risco'
    ELSE 'Inativo'
  END as status
FROM appointments a
WHERE a.status = 'completed'
  AND a.client_name IS NOT NULL
  AND a.client_phone IS NOT NULL
GROUP BY a.barbershop_id, a.client_name, a.client_phone;

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ View customer_health criada com sucesso!';
  RAISE NOTICE '📊 A view agrupa clientes por:';
  RAISE NOTICE '   - Barbearia (barbershop_id)';
  RAISE NOTICE '   - Nome e telefone do cliente';
  RAISE NOTICE '   - Última visita e total de visitas';
  RAISE NOTICE '   - Status: Ativo (últimos 15 dias), Em Risco (15-30 dias), Inativo (30+ dias)';
END $$;
