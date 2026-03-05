-- Fix Orphan Users - Limpar usuários que existem no auth mas não nas tabelas

-- PASSO 1: Verificar usuários órfãos (existem no auth.users mas não em barbershops/barbers)
SELECT 
  au.id,
  au.email,
  au.created_at,
  CASE 
    WHEN b.id IS NOT NULL THEN 'Tem barbershop'
    WHEN br.id IS NOT NULL THEN 'Tem barber'
    ELSE 'ÓRFÃO - Não tem nada'
  END as status
FROM auth.users au
LEFT JOIN barbershops b ON b.owner_id = au.id
LEFT JOIN barbers br ON br.profile_id = au.id
WHERE b.id IS NULL AND br.id IS NULL
ORDER BY au.created_at DESC;

-- PASSO 2: Se encontrou usuários órfãos, você tem 2 opções:

-- OPÇÃO A: Deletar o usuário específico do auth (substitua o email)
-- CUIDADO: Isso é irreversível!
-- DELETE FROM auth.users WHERE email = 'email@exemplo.com';

-- OPÇÃO B: Deletar TODOS os usuários órfãos (use com cuidado!)
-- DELETE FROM auth.users 
-- WHERE id IN (
--   SELECT au.id
--   FROM auth.users au
--   LEFT JOIN barbershops b ON b.owner_id = au.id
--   LEFT JOIN barbers br ON br.profile_id = au.id
--   WHERE b.id IS NULL AND br.id IS NULL
-- );

-- PASSO 3: Verificar se ainda existem usuários órfãos
SELECT COUNT(*) as usuarios_orfaos
FROM auth.users au
LEFT JOIN barbershops b ON b.owner_id = au.id
LEFT JOIN barbers br ON br.profile_id = au.id
WHERE b.id IS NULL AND br.id IS NULL;

-- INSTRUÇÕES:
-- 1. Execute o PASSO 1 para ver quais usuários estão órfãos
-- 2. Se encontrar o email que está dando problema, use a OPÇÃO A para deletar
-- 3. Depois tente cadastrar novamente
