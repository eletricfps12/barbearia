-- Criar tabela para bloqueios fixos de horário (recorrentes todos os dias)
-- Permite que donos de barbearia bloqueiem horários que se repetem diariamente

CREATE TABLE IF NOT EXISTS fixed_time_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barbershop_id UUID NOT NULL REFERENCES barbershops(id) ON DELETE CASCADE,
  barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_fixed_time_blocks_barbershop ON fixed_time_blocks(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_fixed_time_blocks_barber ON fixed_time_blocks(barber_id);

-- RLS Policies
ALTER TABLE fixed_time_blocks ENABLE ROW LEVEL SECURITY;

-- Policy: Barbeiros podem ver bloqueios fixos da sua barbearia
CREATE POLICY "Barbers can view fixed blocks from their barbershop"
  ON fixed_time_blocks
  FOR SELECT
  USING (
    barbershop_id IN (
      SELECT barbershop_id 
      FROM barbers 
      WHERE profile_id = auth.uid()
    )
  );

-- Policy: Barbeiros podem criar bloqueios fixos
CREATE POLICY "Barbers can create fixed blocks"
  ON fixed_time_blocks
  FOR INSERT
  WITH CHECK (
    barbershop_id IN (
      SELECT barbershop_id 
      FROM barbers 
      WHERE profile_id = auth.uid()
    )
  );

-- Policy: Barbeiros podem atualizar bloqueios fixos da sua barbearia
CREATE POLICY "Barbers can update fixed blocks from their barbershop"
  ON fixed_time_blocks
  FOR UPDATE
  USING (
    barbershop_id IN (
      SELECT barbershop_id 
      FROM barbers 
      WHERE profile_id = auth.uid()
    )
  );

-- Policy: Barbeiros podem deletar bloqueios fixos da sua barbearia
CREATE POLICY "Barbers can delete fixed blocks from their barbershop"
  ON fixed_time_blocks
  FOR DELETE
  USING (
    barbershop_id IN (
      SELECT barbershop_id 
      FROM barbers 
      WHERE profile_id = auth.uid()
    )
  );

-- Comentários
COMMENT ON TABLE fixed_time_blocks IS 'Bloqueios fixos de horário que se repetem todos os dias (ex: horário de almoço)';
COMMENT ON COLUMN fixed_time_blocks.barber_id IS 'Se NULL, bloqueia para todos os barbeiros da barbearia';
COMMENT ON COLUMN fixed_time_blocks.start_time IS 'Horário de início (TIME apenas, sem data)';
COMMENT ON COLUMN fixed_time_blocks.end_time IS 'Horário de término (TIME apenas, sem data)';
COMMENT ON COLUMN fixed_time_blocks.reason IS 'Motivo do bloqueio (ex: Almoço, Pausa)';
