-- Script para limpar usuário órfão específico
-- Email: fabiohenriquecla6@gmail.com
-- 
-- IMPORTANTE: Execute este script no SQL Editor do Supabase
-- Dashboard > SQL Editor > New Query > Cole e Execute

-- 1. Verificar se o usuário existe em auth.users mas não em profiles
SELECT 
  au.id,
  au.email,
  au.created_at,
  p.id as profile_id
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
WHERE au.email = 'fabiohenriquecla6@gmail.com';

-- 2. Se o resultado acima mostrar que profile_id é NULL, execute o DELETE abaixo:
-- (Descomente a linha abaixo para executar)

-- DELETE FROM auth.users WHERE email = 'fabiohenriquecla6@gmail.com';

-- 3. Após executar o DELETE, o usuário poderá se cadastrar novamente

-- NOTA: Este é um problema conhecido de "usuários órfãos" que ocorre quando:
-- - O cadastro começa mas não é concluído
-- - Há erro após criar o usuário no auth mas antes de criar o profile
-- - O processo é interrompido no meio
