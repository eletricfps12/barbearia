-- =====================================================
-- CORRIGIR ISOLAMENTO DE DADOS DAS BARBEARIAS
-- =====================================================
-- Garante que cada barbearia veja apenas seus próprios dados
-- =====================================================

-- 1. Verificar policies atuais
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'barbershops'
ORDER BY policyname;

-- 2. Remover policies antigas se existirem
DROP POLICY IF EXISTS "Barbershops are viewable by authenticated users" ON barbershops;
DROP POLICY IF EXISTS "Barbershops can be inserted by authenticated users" ON barbershops;
DROP POLICY IF EXISTS "Barbershops can be updated by owner" ON barbershops;
DROP POLICY IF EXISTS "Barbershops can be deleted by owner" ON barbershops;
DROP POLICY IF EXISTS "Enable read access for all users" ON barbershops;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON barbershops;
DROP POLICY IF EXISTS "Enable update for owners only" ON barbershops;

-- 3. Criar policies corretas

-- SELECT: Usuários podem ver apenas sua própria barbearia
CREATE POLICY "Users can view their own barbershop"
ON barbershops FOR SELECT
TO authenticated
USING (
  owner_id = auth.uid()
  OR
  id IN (
    SELECT barbershop_id 
    FROM barbers 
    WHERE profile_id = auth.uid()
  )
);

-- INSERT: Apenas durante o cadastro (owner_id = auth.uid())
CREATE POLICY "Users can insert their own barbershop"
ON barbershops FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

-- UPDATE: Apenas o owner pode atualizar
CREATE POLICY "Owners can update their own barbershop"
ON barbershops FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- DELETE: Apenas o owner pode deletar
CREATE POLICY "Owners can delete their own barbershop"
ON barbershops FOR DELETE
TO authenticated
USING (owner_id = auth.uid());

-- 4. Verificar se RLS está ativado
ALTER TABLE barbershops ENABLE ROW LEVEL SECURITY;

-- 5. Verificar policies criadas
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'barbershops'
ORDER BY policyname;

-- =====================================================
-- VERIFICAR OUTRAS TABELAS CRÍTICAS
-- =====================================================

-- Verificar policies de appointments
SELECT 
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'appointments'
ORDER BY policyname;

-- Verificar policies de barbers
SELECT 
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'barbers'
ORDER BY policyname;

-- Verificar policies de services
SELECT 
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'services'
ORDER BY policyname;

-- =====================================================
-- TESTE DE ISOLAMENTO
-- =====================================================

-- Verificar quantas barbearias cada usuário pode ver
SELECT 
  p.id as profile_id,
  p.full_name,
  p.role,
  COUNT(DISTINCT b.id) as barbershops_visible
FROM profiles p
LEFT JOIN barbershops b ON (
  b.owner_id = p.id 
  OR 
  b.id IN (
    SELECT barbershop_id 
    FROM barbers 
    WHERE profile_id = p.id
  )
)
WHERE p.role IN ('owner', 'barber')
GROUP BY p.id, p.full_name, p.role
ORDER BY barbershops_visible DESC;

-- Verificar se há barbearias duplicadas ou com dados misturados
SELECT 
  b.id,
  b.name,
  b.owner_id,
  p.full_name as owner_name,
  b.subscription_status,
  b.created_at
FROM barbershops b
LEFT JOIN profiles p ON p.id = b.owner_id
ORDER BY b.created_at DESC;
