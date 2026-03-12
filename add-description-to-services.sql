-- Adicionar coluna description na tabela services
-- Campo opcional para descrição detalhada do serviço

ALTER TABLE services 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Adicionar comentário na coluna
COMMENT ON COLUMN services.description IS 'Descrição opcional do serviço (máximo 200 caracteres)';
