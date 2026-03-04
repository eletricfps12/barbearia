-- =====================================================
-- FIX BARBERSHOPS RLS FOR REGISTRATION
-- =====================================================
-- Permite que usuários anônimos criem cadastros de barbearia
-- (status pending) para aprovação do super admin
-- =====================================================

-- Policy: Permitir cadastro anônimo com status pending
DROP POLICY IF EXISTS "Allow anonymous barbershop registration" ON barbershops;

CREATE POLICY "Allow anonymous barbershop registration"
  ON barbershops
  FOR INSERT
  WITH CHECK (
    subscription_status = 'pending'
  );

-- Policy: Permitir que donos vejam suas próprias barbearias
DROP POLICY IF EXISTS "Owners can view their barbershops" ON barbershops;

CREATE POLICY "Owners can view their barbershops"
  ON barbershops
  FOR SELECT
  USING (
    owner_id = auth.uid()
  );

-- Policy: Super admins podem ver todas as barbearias
DROP POLICY IF EXISTS "Super admins can view all barbershops" ON barbershops;

CREATE POLICY "Super admins can view all barbershops"
  ON barbershops
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'superadmin'
    )
  );

-- Policy: Super admins podem atualizar qualquer barbearia
DROP POLICY IF EXISTS "Super admins can update barbershops" ON barbershops;

CREATE POLICY "Super admins can update barbershops"
  ON barbershops
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'superadmin'
    )
  );

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Políticas RLS da tabela barbershops corrigidas!';
  RAISE NOTICE '🔓 Cadastros anônimos agora são permitidos (status pending).';
  RAISE NOTICE '🔐 Super admins podem aprovar e gerenciar todas as barbearias.';
END $$;
