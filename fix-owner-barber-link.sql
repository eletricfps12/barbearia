-- =====================================================
-- VINCULAR OWNER À BARBEARIA ATRAVÉS DA TABELA BARBERS
-- =====================================================
-- Cria registro na tabela barbers para o owner poder acessar a barbearia
-- =====================================================

-- PASSO 1: Verificar se o owner tem barbearia mas não tem registro em barbers
SELECT 
  u.email,
  u.id as user_id,
  b.id as barbershop_id,
  b.name as barbershop_name,
  (SELECT COUNT(*) FROM barbers WHERE profile_id = u.id) as tem_registro_barber
FROM auth.users u
JOIN barbershops b ON b.owner_id = u.id
WHERE u.email = 'bigodimg@gmail.com';

-- PASSO 2: Criar registro na tabela barbers para o owner
-- Isso permite que o owner acesse as configurações da barbearia
INSERT INTO barbers (profile_id, barbershop_id, name)
SELECT 
  u.id as profile_id,
  b.id as barbershop_id,
  p.full_name as name
FROM auth.users u
JOIN profiles p ON p.id = u.id
JOIN barbershops b ON b.owner_id = u.id
WHERE u.email = 'bigodimg@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM barbers WHERE profile_id = u.id
  );

-- PASSO 3: Verificar se foi criado com sucesso
SELECT 
  u.email,
  b.id as barber_id,
  b.name as barber_name,
  b.barbershop_id,
  bb.name as barbershop_name
FROM auth.users u
JOIN barbers b ON b.profile_id = u.id
JOIN barbershops bb ON bb.id = b.barbershop_id
WHERE u.email = 'bigodimg@gmail.com';

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Owner vinculado à barbearia com sucesso!';
  RAISE NOTICE '📧 Email: bigodimg@gmail.com';
  RAISE NOTICE '🏪 Agora você pode acessar as configurações da barbearia';
END $$;
