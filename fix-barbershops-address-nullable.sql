-- =====================================================
-- FIX BARBERSHOPS ADDRESS COLUMN
-- =====================================================
-- Torna a coluna address opcional (nullable)
-- para permitir cadastros sem endereço
-- =====================================================

-- Tornar coluna address opcional
ALTER TABLE barbershops ALTER COLUMN address DROP NOT NULL;

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Coluna address agora é opcional!';
  RAISE NOTICE '📝 Cadastros podem ser feitos sem endereço.';
END $$;
