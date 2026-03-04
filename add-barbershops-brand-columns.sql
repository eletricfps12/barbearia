-- =====================================================
-- ADICIONAR COLUNAS DE MARCA NA TABELA BARBERSHOPS
-- =====================================================
-- Adiciona colunas necessárias para a página de identidade visual
-- =====================================================

-- Adicionar coluna brand_color (cor da marca)
ALTER TABLE barbershops
ADD COLUMN IF NOT EXISTS brand_color TEXT DEFAULT '#3b82f6';

-- Adicionar coluna logo_url (URL do logo)
ALTER TABLE barbershops
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Adicionar coluna banner_url (URL do banner)
ALTER TABLE barbershops
ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- Adicionar coluna instagram_url (URL do Instagram)
ALTER TABLE barbershops
ADD COLUMN IF NOT EXISTS instagram_url TEXT;

-- Adicionar coluna facebook_url (URL do Facebook)
ALTER TABLE barbershops
ADD COLUMN IF NOT EXISTS facebook_url TEXT;

-- Adicionar coluna whatsapp_number (número do WhatsApp)
ALTER TABLE barbershops
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;

-- Adicionar coluna contact_email (email de contato)
ALTER TABLE barbershops
ADD COLUMN IF NOT EXISTS contact_email TEXT;

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Colunas de marca adicionadas com sucesso!';
  RAISE NOTICE '📋 Colunas criadas:';
  RAISE NOTICE '   - brand_color (cor da marca)';
  RAISE NOTICE '   - logo_url (URL do logo)';
  RAISE NOTICE '   - banner_url (URL do banner)';
  RAISE NOTICE '   - instagram_url (Instagram)';
  RAISE NOTICE '   - facebook_url (Facebook)';
  RAISE NOTICE '   - whatsapp_number (WhatsApp)';
  RAISE NOTICE '   - contact_email (Email de contato)';
END $$;
