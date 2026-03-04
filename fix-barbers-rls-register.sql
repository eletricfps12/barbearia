-- =====================================================
-- CORRIGIR RLS POLICIES DA TABELA BARBERS
-- =====================================================
-- Permite que novos owners criem registros na tabela barbers durante o cadastro
-- =====================================================

-- Remover policies antigas se existirem
DROP POLICY IF EXISTS "Allow insert during registration" ON barbers;
DROP POLICY IF EXISTS "Allow authenticated users to insert barbers" ON barbers;

-- Criar policy para permitir INSERT durante o cadastro
-- Permite que um usuário autenticado crie um registro de barber para si mesmo
CREATE POLICY "Allow insert during registration" ON barbers
  FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

-- Criar policy para permitir SELECT dos próprios dados
CREATE POLICY "Allow users to view their own barber data" ON barbers
  FOR SELECT
  USING (auth.uid() = profile_id);

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies da tabela barbers atualizadas!';
  RAISE NOTICE '📋 Agora novos owners podem criar registros automaticamente';
END $$;
