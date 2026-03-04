-- =====================================================
-- ADD PHONE COLUMN TO INVITES TABLE
-- =====================================================
-- Adiciona coluna phone se não existir
-- =====================================================

-- Adicionar coluna phone se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invites' AND column_name = 'phone'
  ) THEN
    ALTER TABLE invites ADD COLUMN phone TEXT;
    RAISE NOTICE '✅ Coluna phone adicionada com sucesso!';
  ELSE
    RAISE NOTICE '⚠️  Coluna phone já existe.';
  END IF;
END $$;

-- Adicionar comentário
COMMENT ON COLUMN invites.phone IS 'Telefone/WhatsApp do barbeiro convidado (opcional)';

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Tabela invites atualizada!';
  RAISE NOTICE '📱 Coluna phone disponível para uso.';
END $$;
