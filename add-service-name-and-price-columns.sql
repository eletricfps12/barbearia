-- Adicionar colunas para suportar múltiplos serviços e valor total
-- Isso permite salvar todos os serviços concatenados e o preço total do agendamento

-- 1. Adicionar coluna service_name (para salvar múltiplos serviços concatenados)
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS service_name TEXT;

-- 2. Adicionar coluna price (para salvar o valor total)
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS price DECIMAL(10,2);

-- 3. Comentários explicativos
COMMENT ON COLUMN appointments.service_name IS 'Nome dos serviços concatenados com " + " quando múltiplos serviços são selecionados. Ex: "Cabelo + Barba + Sobrancelha"';
COMMENT ON COLUMN appointments.price IS 'Valor total do agendamento (soma de todos os serviços selecionados)';

-- 4. Atualizar registros existentes com o nome do serviço do service_id
UPDATE appointments 
SET service_name = services.name
FROM services
WHERE appointments.service_id = services.id
AND appointments.service_name IS NULL;

-- 5. Atualizar registros existentes com o preço do serviço
UPDATE appointments 
SET price = services.price
FROM services
WHERE appointments.service_id = services.id
AND appointments.price IS NULL;

-- 6. Verificar se as colunas foram criadas
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'appointments' 
AND column_name IN ('service_name', 'price');
