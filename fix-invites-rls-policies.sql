-- =====================================================
-- FIX INVITES RLS POLICIES
-- =====================================================
-- Corrige políticas de segurança para permitir super admins
-- criarem convites
-- =====================================================

-- Remover policies antigas
DROP POLICY IF EXISTS "Super admins can view all invites" ON invites;
DROP POLICY IF EXISTS "Super admins can create invites" ON invites;
DROP POLICY IF EXISTS "Anyone can read invite by token" ON invites;
DROP POLICY IF EXISTS "System can update invite status" ON invites;

-- Policy 1: Super admins podem ver todos os convites
CREATE POLICY "Super admins can view all invites"
  ON invites
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'superadmin'
    )
  );

-- Policy 2: Super admins podem criar convites
CREATE POLICY "Super admins can create invites"
  ON invites
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'superadmin'
    )
  );

-- Policy 3: Qualquer um pode ler convite pelo token (para validação no registro)
CREATE POLICY "Anyone can read invite by token"
  ON invites
  FOR SELECT
  USING (true);

-- Policy 4: Sistema pode atualizar status do convite
CREATE POLICY "System can update invite status"
  ON invites
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Políticas RLS da tabela invites corrigidas!';
  RAISE NOTICE '🔐 Super admins agora podem criar convites.';
END $$;
