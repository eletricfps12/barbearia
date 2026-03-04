-- =====================================================
-- FIX: generate_invite_token function
-- =====================================================
-- Corrige erro de ambiguidade na coluna "token"
-- Cria função SEM parâmetros que apenas gera e retorna um token único
-- =====================================================

-- Remover TODAS as versões da função antiga
DROP FUNCTION IF EXISTS generate_invite_token();
DROP FUNCTION IF EXISTS generate_invite_token(text, text, text);

-- Criar função SEM parâmetros (apenas gera token)
CREATE OR REPLACE FUNCTION generate_invite_token()
RETURNS text 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_token text;
  token_exists boolean;
BEGIN
  LOOP
    -- Gerar token único
    new_token := encode(gen_random_bytes(24), 'base64');
    new_token := replace(new_token, '/', '_');
    new_token := replace(new_token, '+', '-');
    new_token := replace(new_token, '=', '');
    
    -- Verificar se já existe
    SELECT EXISTS(
      SELECT 1 FROM public.invites WHERE invites.token = new_token
    ) INTO token_exists;
    
    -- Se não existe, retornar
    IF NOT token_exists THEN
      RETURN new_token;
    END IF;
  END LOOP;
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION generate_invite_token() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_invite_token() TO anon;

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Função generate_invite_token corrigida com sucesso!';
  RAISE NOTICE '📧 Agora você pode enviar convites sem erros.';
END $$;
