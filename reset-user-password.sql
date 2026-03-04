-- =====================================================
-- RESET USER PASSWORD
-- =====================================================
-- Reseta a senha de um usuário específico
-- IMPORTANTE: Substitua o email e a nova senha
-- =====================================================

-- Atualizar senha do usuário
-- SUBSTITUA 'bigodim@gmail.com' pelo email do usuário
-- SUBSTITUA 'nova_senha_123' pela senha desejada

UPDATE auth.users
SET 
  encrypted_password = crypt('nova_senha_123', gen_salt('bf')),
  updated_at = NOW()
WHERE email = 'bigodim@gmail.com';

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Senha resetada com sucesso!';
  RAISE NOTICE '📧 Email: bigodim@gmail.com';
  RAISE NOTICE '🔑 Nova senha: nova_senha_123';
  RAISE NOTICE '⚠️  Lembre-se de trocar a senha após o primeiro login!';
END $$;
