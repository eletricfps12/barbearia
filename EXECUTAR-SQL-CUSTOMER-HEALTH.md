# Como Executar o SQL para Corrigir a View customer_health

## Problema
A view `customer_health` estava usando a coluna `appointment_date` que não existe. A coluna correta é `start_time`.

## Solução

### Passo 1: Acessar o SQL Editor do Supabase
1. Acesse: https://supabase.com/dashboard/project/cntdiuaxocutsqwqnrkd
2. No menu lateral, clique em **SQL Editor**

### Passo 2: Executar o SQL
Copie e cole o SQL abaixo no editor e clique em **Run**:

```sql
-- Remover view antiga se existir
DROP VIEW IF EXISTS customer_health;

-- Criar view customer_health com a coluna correta
CREATE OR REPLACE VIEW customer_health AS
SELECT 
  a.barbershop_id,
  a.client_name,
  a.client_phone,
  MAX(a.start_time::date) as last_visit,
  COUNT(a.id) as total_visits,
  CASE 
    WHEN MAX(a.start_time::date) >= CURRENT_DATE - INTERVAL '15 days' THEN 'Ativo'
    WHEN MAX(a.start_time::date) >= CURRENT_DATE - INTERVAL '30 days' THEN 'Em Risco'
    ELSE 'Inativo'
  END as status
FROM appointments a
WHERE a.status = 'completed'
  AND a.client_name IS NOT NULL
  AND a.client_phone IS NOT NULL
GROUP BY a.barbershop_id, a.client_name, a.client_phone;
```

### Passo 3: Verificar
Após executar, você deve ver a mensagem: **Success. No rows returned**

Isso significa que a view foi criada com sucesso!

### Passo 4: Testar
Agora os clientes devem aparecer na página de CRM. A view vai mostrar:
- Clientes que tiveram agendamentos **completados**
- Última visita de cada cliente
- Total de visitas
- Status: **Ativo** (últimos 15 dias), **Em Risco** (15-30 dias), **Inativo** (30+ dias)

## Arquivo SQL
O SQL também está salvo em: `fix-customer-health-view.sql`
