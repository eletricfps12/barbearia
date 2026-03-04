-- =====================================================
-- CORRIGIR VIEW CUSTOMER_HEALTH
-- =====================================================
-- Corrige o erro da coluna appointment_date
-- A coluna correta é start_time
-- =====================================================

-- Remover view antiga se existir
DROP VIEW IF EXISTS customer_health;

-- Criar view customer_health com a coluna correta
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
