# Correção de Isolamento de Dados entre Barbearias

## Problema Relatado

Quando um novo barbeiro cria uma conta e aguarda aprovação do Super Admin:
1. ✅ O nome da barbearia é salvo corretamente no cadastro
2. ✅ A barbearia é criada no banco com status `pending`
3. ✅ Quando o Super Admin aprova, a barbearia fica `active`
4. ❌ **PROBLEMA**: A barbearia pode estar vendo dados de outras barbearias

## Fluxo Atual (Correto)

### 1. Cadastro (RegisterPage.jsx)
```javascript
// Cria a barbearia com status pending
const { data: barbershopData } = await supabase
  .from('barbershops')
  .insert({
    name: formData.barbershopName,  // ✅ Nome correto
    slug: slug,
    owner_id: authData.user.id,
    subscription_status: 'pending',  // ✅ Aguardando aprovação
    ...
  })
```

### 2. Aprovação (SuperAdminPage.jsx)
```javascript
// Apenas ativa a barbearia existente
const { error } = await supabase
  .from('barbershops')
  .update({
    subscription_status: 'active',  // ✅ Ativa a barbearia
    subscription_plan: 'trial',
    trial_ends_at: trialEndsAt.toISOString()
  })
  .eq('id', barbershopId)
```

## Causa Raiz

O problema NÃO é no fluxo de cadastro/aprovação, mas sim nas **RLS Policies** (Row Level Security) que podem estar permitindo que uma barbearia veja dados de outra.

### Possíveis Causas:

1. **Policies muito permissivas**: Permitindo SELECT sem filtro de `barbershop_id`
2. **Falta de filtro em queries**: Algumas queries podem não estar filtrando por `barbershop_id`
3. **Cache do navegador**: Dados antigos em cache

## Solução Implementada

### 1. SQL de Correção: `fix-barbershops-isolation.sql`

Este SQL:
- ✅ Remove policies antigas e permissivas
- ✅ Cria policies corretas que garantem isolamento
- ✅ Verifica se RLS está ativado
- ✅ Testa o isolamento entre barbearias

### 2. Policies Corretas

```sql
-- SELECT: Usuários veem apenas sua própria barbearia
CREATE POLICY "Users can view their own barbershop"
ON barbershops FOR SELECT
TO authenticated
USING (
  owner_id = auth.uid()
  OR
  id IN (
    SELECT barbershop_id 
    FROM barbers 
    WHERE profile_id = auth.uid()
  )
);

-- UPDATE: Apenas o owner pode atualizar
CREATE POLICY "Owners can update their own barbershop"
ON barbershops FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());
```

## Como Executar a Correção

### Opção 1: SQL Editor do Supabase (Recomendado)

1. Acesse: https://supabase.com/dashboard/project/cntdiuaxocutsqwqnrkd
2. Vá em **SQL Editor**
3. Copie e cole o conteúdo de `fix-barbershops-isolation.sql`
4. Clique em **Run**

### Opção 2: Via CLI (se tiver psql instalado)

```bash
psql -h aws-0-us-east-1.pooler.supabase.com -p 6543 -U postgres.cntdiuaxocutsqwqnrkd -d postgres -f fix-barbershops-isolation.sql
```

## Verificação

Após executar o SQL, verifique:

### 1. Policies Criadas
```sql
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'barbershops';
```

Deve mostrar:
- ✅ Users can view their own barbershop (SELECT)
- ✅ Users can insert their own barbershop (INSERT)
- ✅ Owners can update their own barbershop (UPDATE)
- ✅ Owners can delete their own barbershop (DELETE)

### 2. Teste de Isolamento
```sql
-- Verificar quantas barbearias cada usuário pode ver
SELECT 
  p.full_name,
  COUNT(DISTINCT b.id) as barbershops_visible
FROM profiles p
LEFT JOIN barbershops b ON (
  b.owner_id = p.id 
  OR 
  b.id IN (SELECT barbershop_id FROM barbers WHERE profile_id = p.id)
)
WHERE p.role IN ('owner', 'barber')
GROUP BY p.full_name;
```

Cada owner deve ver apenas 1 barbearia (a dele).

### 3. Teste no Frontend

1. Faça login como owner da Barbearia A
2. Vá em Clientes, Serviços, Agenda
3. Verifique se mostra apenas dados da Barbearia A
4. Faça logout e login como owner da Barbearia B
5. Verifique se mostra apenas dados da Barbearia B

## Outras Tabelas Críticas

O SQL também verifica as policies de:
- ✅ `appointments` - Agendamentos
- ✅ `barbers` - Barbeiros
- ✅ `services` - Serviços
- ✅ `customers` - Clientes

Todas devem ter filtro por `barbershop_id`.

## Prevenção

Para evitar esse problema no futuro:

### 1. Sempre filtrar por barbershop_id
```javascript
// ❌ ERRADO - Sem filtro
const { data } = await supabase
  .from('appointments')
  .select('*')

// ✅ CORRETO - Com filtro
const { data } = await supabase
  .from('appointments')
  .select('*')
  .eq('barbershop_id', barbershopId)
```

### 2. Usar RLS Policies
Sempre ativar RLS e criar policies que filtram por `barbershop_id`:

```sql
CREATE POLICY "Users can view their barbershop appointments"
ON appointments FOR SELECT
TO authenticated
USING (
  barbershop_id IN (
    SELECT barbershop_id 
    FROM barbers 
    WHERE profile_id = auth.uid()
  )
);
```

### 3. Testar com múltiplas barbearias
Sempre testar com pelo menos 2 barbearias diferentes para garantir isolamento.

## Resumo

- ✅ O fluxo de cadastro/aprovação está correto
- ✅ O nome da barbearia é salvo corretamente
- ✅ Cada barbearia é criada independentemente
- ❌ O problema é isolamento de dados (RLS policies)
- ✅ Solução: Executar `fix-barbershops-isolation.sql`

## Próximos Passos

1. Execute o SQL de correção
2. Teste com 2 barbearias diferentes
3. Verifique se cada uma vê apenas seus próprios dados
4. Se ainda houver problema, me avise com detalhes específicos
