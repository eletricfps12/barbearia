-- =====================================================
-- DIAGNÓSTICO E CORREÇÃO DE LOGIN
-- =====================================================
-- Este script verifica e corrige problemas de login
-- IMPORTANTE: Substitua o email do usuário
-- =====================================================

-- PASSO 1: VERIFICAR SE O USUÁRIO EXISTE
-- SUBSTITUA 'email@exemplo.com' pelo email real
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  encrypted_password IS NOT NULL as tem_senha
FROM auth.users
WHERE email = 'email@exemplo.com';

-- PASSO 2: VERIFICAR SE TEM PERFIL
SELECT 
  id,
  role,
  created_at
FROM profiles
WHERE id = (SELECT id FROM auth.users WHERE email = 'email@exemplo.com');

-- PASSO 3: VERIFICAR SE TEM BARBEARIA
SELECT 
  id,
  name,
  status,
  owner_id
FROM barbershops
WHERE owner_id = (SELECT id FROM auth.users WHERE email = 'email@exemplo.com');

-- =====================================================
-- CORREÇÕES AUTOMÁTICAS
-- =====================================================

-- CORREÇÃO 1: Criar perfil se não existir
INSERT INTO profiles (id, role, created_at, updated_at)
SELECT 
  id,
  'owner' as role,
  NOW() as created_at,
  NOW() as updated_at
FROM auth.users
WHERE email = 'email@exemplo.com'
  AND id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;

-- CORREÇÃO 2: Atualizar role para 'owner' se estiver errado
UPDATE profiles
SET role = 'owner', updated_at = NOW()
WHERE id = (SELECT id FROM auth.users WHERE email = 'email@exemplo.com')
  AND role != 'owner';

-- CORREÇÃO 3: Confirmar email se não estiver confirmado
UPDATE auth.users
SET 
  email_confirmed_at = NOW(),
  updated_at = NOW()
WHERE email = 'email@exemplo.com'
  AND email_confirmed_at IS NULL;

-- CORREÇÃO 4: Atualizar status da barbearia para 'approved'
UPDATE barbershops
SET status = 'approved', updated_at = NOW()
WHERE owner_id = (SELECT id FROM auth.users WHERE email = 'email@exemplo.com')
  AND status = 'pending';

-- CORREÇÃO 5: Resetar senha (use uma senha temporária)
-- SUBSTITUA 'senha_temporaria_123' pela senha que você quer definir
UPDATE auth.users
SET 
  encrypted_password = crypt('senha_temporaria_123', gen_salt('bf')),
  updated_at = NOW()
WHERE email = 'email@exemplo.com';

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================
SELECT 
  u.email,
  u.email_confirmed_at IS NOT NULL as email_confirmado,
  p.role,
  b.status as status_barbearia,
  u.encrypted_password IS NOT NULL as tem_senha
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
LEFT JOIN barbershops b ON b.owner_id = u.id
WHERE u.email = 'email@exemplo.com';

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Correções aplicadas com sucesso!';
  RAISE NOTICE '📧 Verifique os resultados acima';
  RAISE NOTICE '🔑 Senha temporária: senha_temporaria_123';
  RAISE NOTICE '⚠️  Lembre o usuário de trocar a senha após o primeiro login!';
END $$;
