-- Script para remover a constraint UNIQUE do campo phone na tabela profiles
-- 
-- PROBLEMA: Erro "duplicate key value violates unique constraint profiles_phone_key"
-- CAUSA: A coluna phone tem uma constraint UNIQUE que impede telefones duplicados
-- SOLUÇÃO: Remover a constraint UNIQUE, pois telefones podem ser compartilhados
--          (ex: telefone da barbearia usado por vários barbeiros)
--
-- IMPORTANTE: Execute este script no SQL Editor do Supabase
-- Dashboard > SQL Editor > New Query > Cole e Execute

-- 1. Verificar se a constraint existe
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'profiles'::regclass
  AND conname = 'profiles_phone_key';

-- 2. Remover a constraint UNIQUE do campo phone
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_phone_key;

-- 3. Verificar se foi removida (não deve retornar nada)
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'profiles'::regclass
  AND conname = 'profiles_phone_key';

-- 4. Verificar telefones duplicados existentes (se houver)
SELECT 
    phone,
    COUNT(*) as count,
    STRING_AGG(email, ', ') as emails
FROM profiles
WHERE phone IS NOT NULL
GROUP BY phone
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- NOTA: Após executar este script, múltiplos usuários poderão ter o mesmo telefone
-- Isso é útil quando:
-- - Vários barbeiros usam o telefone da barbearia
-- - Donos e barbeiros compartilham o mesmo contato
-- - Telefone é opcional e pode ser NULL para vários usuários
