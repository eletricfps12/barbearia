# Debug: Barbearia Não Identificada

## Erro
```
Barbearia não identificada. Recarregue a página e tente novamente.
```

## Possíveis Causas

### 1. Usuário não está vinculado à tabela `barbers`

**Verificar:**
1. Abra o Console do navegador (F12)
2. Vá na aba **Console**
3. Procure pelos logs:
   ```
   🔍 User: [user_id]
   🔍 Barber data: null ou undefined
   ```

**Se `Barber data` for `null`:**
- O usuário não tem registro na tabela `barbers`
- Precisa executar SQL para criar o vínculo

**SQL para corrigir:**
```sql
-- Substitua os valores abaixo
INSERT INTO barbers (profile_id, barbershop_id, name)
VALUES (
  '[USER_ID]',  -- ID do usuário (pegar do console)
  '[BARBERSHOP_ID]',  -- ID da barbearia
  '[NOME_DO_USUARIO]'  -- Nome do usuário
);
```

### 2. RLS Policy bloqueando acesso

**Verificar:**
1. No Console, procure por:
   ```
   🔍 Barber error: { code: '42501', message: 'permission denied' }
   ```

**Se houver erro de permissão:**
- As RLS policies estão bloqueando o acesso
- Execute o SQL: `fix-barbershops-isolation.sql`

### 3. Barbearia não existe

**Verificar:**
1. No Console, procure por:
   ```
   🔍 Barbershop data: null
   🔍 Barbershop error: { code: 'PGRST116', message: 'not found' }
   ```

**Se barbearia não for encontrada:**
- A barbearia foi deletada ou não existe
- Verifique no banco de dados

## Passo a Passo para Debug

### 1. Abrir Console do Navegador
- Pressione **F12**
- Vá na aba **Console**
- Recarregue a página

### 2. Verificar Logs
Procure pelos logs que começam com 🔍:

```
🔍 User: abc123...
🔍 Barber data: { barbershop_id: 'xyz789...' }
🔍 Barbershop ID: xyz789...
🔍 Barbershop data: { id: 'xyz789...', name: 'Minha Barbearia', ... }
```

### 3. Identificar o Problema

**Cenário A: User é null**
```
🔍 User: undefined
```
→ Usuário não está logado. Faça login novamente.

**Cenário B: Barber data é null**
```
🔍 User: abc123...
🔍 Barber data: null
```
→ Usuário não está vinculado a uma barbearia. Execute SQL de correção.

**Cenário C: Barbershop data é null**
```
🔍 User: abc123...
🔍 Barber data: { barbershop_id: 'xyz789...' }
🔍 Barbershop ID: xyz789...
🔍 Barbershop data: null
```
→ Barbearia não existe ou RLS está bloqueando. Execute `fix-barbershops-isolation.sql`.

## SQL de Correção

### Opção 1: Vincular usuário existente a barbearia existente

```sql
-- 1. Verificar se usuário tem perfil
SELECT id, full_name, role FROM profiles WHERE id = '[USER_ID]';

-- 2. Verificar se barbearia existe
SELECT id, name, owner_id FROM barbershops WHERE owner_id = '[USER_ID]';

-- 3. Criar vínculo na tabela barbers
INSERT INTO barbers (profile_id, barbershop_id, name)
SELECT 
  p.id,
  b.id,
  p.full_name
FROM profiles p
CROSS JOIN barbershops b
WHERE p.id = '[USER_ID]'
  AND b.owner_id = '[USER_ID]'
  AND NOT EXISTS (
    SELECT 1 FROM barbers 
    WHERE profile_id = p.id 
    AND barbershop_id = b.id
  );
```

### Opção 2: Criar barbearia para usuário sem barbearia

```sql
-- 1. Criar barbearia
INSERT INTO barbershops (name, slug, owner_id, subscription_status, subscription_plan)
VALUES (
  'Minha Barbearia',  -- Nome da barbearia
  'minha-barbearia',  -- Slug (sem espaços, minúsculo)
  '[USER_ID]',  -- ID do usuário
  'active',  -- Status
  'trial'  -- Plano
)
RETURNING id;

-- 2. Copie o ID retornado e use no próximo comando

-- 3. Criar vínculo
INSERT INTO barbers (profile_id, barbershop_id, name)
VALUES (
  '[USER_ID]',
  '[BARBERSHOP_ID_RETORNADO]',
  '[NOME_DO_USUARIO]'
);
```

## Teste Rápido

Execute este SQL para verificar o vínculo:

```sql
SELECT 
  p.id as user_id,
  p.full_name,
  p.role,
  b.barbershop_id,
  bs.name as barbershop_name,
  bs.subscription_status
FROM profiles p
LEFT JOIN barbers b ON b.profile_id = p.id
LEFT JOIN barbershops bs ON bs.id = b.barbershop_id
WHERE p.id = '[USER_ID]';
```

**Resultado esperado:**
```
user_id | full_name | role  | barbershop_id | barbershop_name | subscription_status
--------|-----------|-------|---------------|-----------------|--------------------
abc123  | João      | owner | xyz789        | Minha Barbearia | active
```

**Se `barbershop_id` for NULL:**
- Usuário não está vinculado
- Execute SQL de correção acima

## Prevenção

Para evitar esse erro no futuro, garanta que:

1. **No cadastro (RegisterPage.jsx):**
   - Cria perfil
   - Cria barbearia
   - Cria vínculo na tabela `barbers` ✅ (já implementado)

2. **Na aprovação (SuperAdminPage.jsx):**
   - Apenas ativa a barbearia
   - Não precisa criar vínculo (já existe)

3. **RLS Policies:**
   - Permitem que usuário veja sua própria barbearia
   - Execute `fix-barbershops-isolation.sql` se necessário

## Contato

Se o problema persistir após seguir este guia:

1. Tire um print do Console (F12 → Console)
2. Tire um print do erro na tela
3. Execute o SQL de teste acima e envie o resultado
4. Me envie essas informações para análise
