-- =====================================================
-- DIAGNÓSTICO E CORREÇÃO DE LOGIN - bigodimg@gmail.com
-- =====================================================
-- Este script verifica e corrige problemas de login
-- =====================================================

-- PASSO 1: VERIFICAR SE O USUÁRIO EXISTE
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  encrypted_password IS NOT NULL as tem_senha
FROM auth.users
WHERE email = 'bigodimg@gmail.com';

-- PASSO 2: VERIFICAR SE TEM PERFIL
SELECT 
  id,
  role,
  created_at
FROM profiles
WHERE id = (SELECT id FROM auth.users WHERE email = 'bigodimg@gmail.com');

-- PASSO 3: VERIFICAR SE TEM BARBEARIA
SELECT 
  id,
  name,
  subscription_status,
  owner_id
FROM barbershops
WHERE owner_id = (SELECT id FROM auth.users WHERE email = 'bigodimg@gmail.com');

-- =====================================================
-- CORREÇÕES AUTOMÁTICAS
-- =====================================================

-- CORREÇÃO 1: Criar perfil se não existir
INSERT INTO profiles (id, role)
SELECT 
  id,
  'owner' as role
FROM auth.users
WHERE email = 'bigodimg@gmail.com'
  AND id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;

-- CORREÇÃO 2: Atualizar role para 'owner' se estiver errado
UPDATE profiles
SET role = 'owner'
WHERE id = (SELECT id FROM auth.users WHERE email = 'bigodimg@gmail.com')
  AND role != 'owner';

-- CORREÇÃO 3: Confirmar email se não estiver confirmado
UPDATE auth.users
SET 
  email_confirmed_at = NOW(),
  updated_at = NOW()
WHERE email = 'bigodimg@gmail.com'
  AND email_confirmed_at IS NULL;

-- CORREÇÃO 4: Atualizar subscription_status da barbearia para 'active'
UPDATE barbershops
SET subscription_status = 'active'
WHERE owner_id = (SELECT id FROM auth.users WHERE email = 'bigodimg@gmail.com')
  AND subscription_status = 'pending';

-- CORREÇÃO 5: Resetar senha para #Guilherme12
UPDATE auth.users
SET 
  encrypted_password = crypt('#Guilherme12', gen_salt('bf')),
  updated_at = NOW()
WHERE email = 'bigodimg@gmail.com';

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================
SELECT 
  u.email,
  u.email_confirmed_at IS NOT NULL as email_confirmado,
  p.role,
  b.subscription_status,
  b.name as nome_barbearia,
  u.encrypted_password IS NOT NULL as tem_senha
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
LEFT JOIN barbershops b ON b.owner_id = u.id
WHERE u.email = 'bigodimg@gmail.com';

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Correções aplicadas com sucesso!';
  RAISE NOTICE '📧 Email: bigodimg@gmail.com';
  RAISE NOTICE '🔑 Senha: #Guilherme12';
  RAISE NOTICE '✨ Pode fazer login agora em brioapp.online';
END $$;
