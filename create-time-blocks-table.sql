-- Criar tabela para bloqueios de horário
-- Permite que barbeiros bloqueiem horários específicos (almoço, reunião, etc)

CREATE TABLE IF NOT EXISTS time_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barbershop_id UUID NOT NULL REFERENCES barbershops(id) ON DELETE CASCADE,
  barber_id UUID NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_time_blocks_barber ON time_blocks(barber_id);
CREATE INDEX IF NOT EXISTS idx_time_blocks_barbershop ON time_blocks(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_time_blocks_start_time ON time_blocks(start_time);
CREATE INDEX IF NOT EXISTS idx_time_blocks_date_range ON time_blocks(barber_id, start_time, end_time);

-- RLS Policiescontinue de
ALTER TABLE time_blocks ENABLE ROW LEVEL SECURITY;

-- Policy: Barbeiros podem ver bloqueios da sua barbearia
CREATE POLICY "Barbers can view time blocks from their barbershop"
  ON time_blocks
  FOR SELECT
  USING (
    barbershop_id IN (
      SELECT barbershop_id 
      FROM barbers 
      WHERE profile_id = auth.uid()
    )
  );

-- Policy: Barbeiros podem criar bloqueios
CREATE POLICY "Barbers can create their own time blocks"
  ON time_blocks
  FOR INSERT
  WITH CHECK (
    barber_id IN (
      SELECT id 
      FROM barbers 
      WHERE profile_id = auth.uid()
    )
  );

-- Policy: Barbeiros podem deletar seus próprios bloqueios
CREATE POLICY "Barbers can delete their own time blocks"
  ON time_blocks
  FOR DELETE
  USING (
    barber_id IN (
      SELECT id 
      FROM barbers 
      WHERE profile_id = auth.uid()
    )
  );

-- Comentários
COMMENT ON TABLE time_blocks IS 'Bloqueios de horário criados pelos barbeiros (almoço, reunião, etc)';
COMMENT ON COLUMN time_blocks.reason IS 'Motivo do bloqueio (ex: Almoço, Reunião, Buscar filho)';

-- Verificar se a tabela foi criada
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'time_blocks'
ORDER BY ordinal_position;
