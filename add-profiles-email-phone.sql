-- =====================================================
-- ADICIONAR COLUNAS EMAIL E PHONE NA TABELA PROFILES
-- =====================================================
-- Garante que o perfil do usuário tenha email e telefone salvos
-- =====================================================

-- Verificar se as colunas já existem
DO $$ 
BEGIN
  -- Adicionar coluna email se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email TEXT;
    RAISE NOTICE 'Coluna email adicionada';
  ELSE
    RAISE NOTICE 'Coluna email já existe';
  END IF;

  -- Adicionar coluna phone se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone TEXT;
    RAISE NOTICE 'Coluna phone adicionada';
  ELSE
    RAISE NOTICE 'Coluna phone já existe';
  END IF;
END $$;

-- Preencher email dos perfis existentes a partir do auth.users
UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
  AND p.email IS NULL;

-- Verificar resultado
SELECT 
  id,
  full_name,
  email,
  phone,
  role,
  created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 10;
