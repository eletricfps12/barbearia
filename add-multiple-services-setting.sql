-- Adicionar coluna para permitir múltiplos serviços por agendamento
-- Padrão: false (desativado) para não quebrar barbearias existentes

ALTER TABLE barbershops 
ADD COLUMN IF NOT EXISTS allow_multiple_services BOOLEAN DEFAULT false;

-- Comentário explicativo
COMMENT ON COLUMN barbershops.allow_multiple_services IS 'Permite que clientes selecionem múltiplos serviços em um único agendamento. Quando ativado, tempo e valor são somados automaticamente.';

-- Verificar se a coluna foi criada
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'barbershops' 
AND column_name = 'allow_multiple_services';
