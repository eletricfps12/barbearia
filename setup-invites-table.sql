-- =====================================================
-- SETUP INVITES TABLE
-- =====================================================
-- Cria ou atualiza a tabela de convites
-- =====================================================

-- Criar tabela se não existir
CREATE TABLE IF NOT EXISTS invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  barber_name TEXT,
  barbershop_name TEXT,
  barbershop_slug TEXT,
  phone TEXT,
  token TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'pending',
  invited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE
);

-- Adicionar colunas se não existirem
DO $$ 
BEGIN
  -- Adicionar expires_at se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invites' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE invites ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days');
  END IF;

  -- Adicionar barber_name se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invites' AND column_name = 'barber_name'
  ) THEN
    ALTER TABLE invites ADD COLUMN barber_name TEXT;
  END IF;

  -- Adicionar barbershop_name se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invites' AND column_name = 'barbershop_name'
  ) THEN
    ALTER TABLE invites ADD COLUMN barbershop_name TEXT;
  END IF;

  -- Adicionar barbershop_slug se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invites' AND column_name = 'barbershop_slug'
  ) THEN
    ALTER TABLE invites ADD COLUMN barbershop_slug TEXT;
  END IF;
END $$;

-- Adicionar constraint de status se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'invites_status_check'
  ) THEN
    ALTER TABLE invites ADD CONSTRAINT invites_status_check 
      CHECK (status IN ('pending', 'accepted', 'expired'));
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

-- Criar índices para performance (se não existirem)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_invites_token') THEN
    CREATE INDEX idx_invites_token ON invites(token);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_invites_email') THEN
    CREATE INDEX idx_invites_email ON invites(email);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_invites_status') THEN
    CREATE INDEX idx_invites_status ON invites(status);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_invites_expires_at') THEN
    CREATE INDEX idx_invites_expires_at ON invites(expires_at);
  END IF;
EXCEPTION
  WHEN undefined_column THEN
    NULL;
END $$;

-- Adicionar comentários
DO $$
BEGIN
  EXECUTE 'COMMENT ON TABLE invites IS ''Convites enviados pelo Super Admin para novos barbeiros''';
  EXECUTE 'COMMENT ON COLUMN invites.token IS ''Token único para validar o convite''';
  EXECUTE 'COMMENT ON COLUMN invites.status IS ''Status do convite: pending, accepted, expired''';
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invites' AND column_name = 'expires_at'
  ) THEN
    EXECUTE 'COMMENT ON COLUMN invites.expires_at IS ''Data de expiração do convite (7 dias após criação)''';
  END IF;
END $$;

-- Função para gerar token único
CREATE OR REPLACE FUNCTION generate_invite_token()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  token TEXT;
  token_exists BOOLEAN;
BEGIN
  LOOP
    -- Gerar token aleatório de 32 caracteres
    token := encode(gen_random_bytes(24), 'base64');
    token := replace(token, '/', '_');
    token := replace(token, '+', '-');
    token := replace(token, '=', '');
    
    -- Verificar se já existe
    SELECT EXISTS(SELECT 1 FROM invites WHERE invites.token = token) INTO token_exists;
    
    -- Se não existe, retornar
    IF NOT token_exists THEN
      RETURN token;
    END IF;
  END LOOP;
END;
$$;

-- Função para expirar convites antigos (executar via cron)
CREATE OR REPLACE FUNCTION expire_old_invites()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Verificar se a coluna expires_at existe antes de usar
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invites' AND column_name = 'expires_at'
  ) THEN
    UPDATE invites
    SET status = 'expired'
    WHERE status = 'pending'
      AND expires_at < NOW();
  END IF;
END;
$$;

-- RLS (Row Level Security)
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- Remover policies antigas se existirem
DROP POLICY IF EXISTS "Super admins can view all invites" ON invites;
DROP POLICY IF EXISTS "Super admins can create invites" ON invites;
DROP POLICY IF EXISTS "Anyone can read invite by token" ON invites;
DROP POLICY IF EXISTS "System can update invite status" ON invites;

-- Policy: Super admins podem ver todos os convites
CREATE POLICY "Super admins can view all invites"
  ON invites
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
  );

-- Policy: Super admins podem criar convites
CREATE POLICY "Super admins can create invites"
  ON invites
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
  );

-- Policy: Qualquer um pode ler convite pelo token (para validação no registro)
CREATE POLICY "Anyone can read invite by token"
  ON invites
  FOR SELECT
  USING (true);

-- Policy: Sistema pode atualizar status do convite
CREATE POLICY "System can update invite status"
  ON invites
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Conceder permissões
GRANT SELECT, INSERT, UPDATE ON invites TO authenticated;
GRANT SELECT ON invites TO anon;

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Tabela invites configurada com sucesso!';
  RAISE NOTICE '📋 Próximos passos:';
  RAISE NOTICE '1. Configure a RESEND_API_KEY no Supabase';
  RAISE NOTICE '2. Faça deploy da Edge Function: supabase functions deploy send-invite-email';
  RAISE NOTICE '3. Teste o envio de convite no Super Admin';
END $$;
