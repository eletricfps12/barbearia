-- =====================================================
-- SETUP ANALYTICS FUNCTIONS
-- =====================================================
-- Funções RPC para o painel do Super Admin
-- =====================================================

-- 1. Função para calcular o MRR dos últimos 6 meses
CREATE OR REPLACE FUNCTION get_mrr_last_6_months()
RETURNS TABLE(month text, revenue numeric) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    to_char(date_trunc('month', created_at), 'Mon') as month,
    COALESCE(COUNT(*) * 97.00, 0) as revenue
  FROM barbershops
  WHERE subscription_status = 'active'
    AND subscription_plan = 'mensal'
    AND created_at >= NOW() - INTERVAL '6 months'
  GROUP BY date_trunc('month', created_at)
  ORDER BY date_trunc('month', created_at) ASC;
END;
$$;

-- 2. Função para contar cadastros das últimas 8 semanas
CREATE OR REPLACE FUNCTION get_signups_last_8_weeks()
RETURNS TABLE(week text, signups bigint) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    to_char(date_trunc('week', created_at), 'DD/MM') as week,
    COUNT(*) as signups
  FROM barbershops
  WHERE created_at >= NOW() - INTERVAL '8 weeks'
  GROUP BY date_trunc('week', created_at)
  ORDER BY date_trunc('week', created_at) ASC;
END;
$$;

-- Conceder permissões para usuários autenticados
GRANT EXECUTE ON FUNCTION get_mrr_last_6_months() TO authenticated;
GRANT EXECUTE ON FUNCTION get_signups_last_8_weeks() TO authenticated;

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Funções de analytics criadas com sucesso!';
  RAISE NOTICE '📊 Funções disponíveis:';
  RAISE NOTICE '  - get_mrr_last_6_months()';
  RAISE NOTICE '  - get_signups_last_8_weeks()';
END $$;
