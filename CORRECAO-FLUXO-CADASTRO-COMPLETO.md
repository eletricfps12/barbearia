# Correção Completa do Fluxo de Cadastro

## Problema Identificado

O erro "Barbeiro não encontrado no sistema" acontecia porque:
1. Email e telefone não estavam sendo salvos na tabela `profiles`
2. Super Admin não via email e telefone dos cadastros pendentes
3. Botão de Suporte não puxava dados completos do owner

## Correções Implementadas

### 1. RegisterPage.jsx ✅
- Agora salva `email` e `phone` na tabela `profiles` durante o cadastro
- Perfil criado como `owner` (não `barber`)
- Barbearia criada com status `pending`
- Registro na tabela `barbers` vinculando owner à barbearia

### 2. Login.jsx ✅
- Verifica se barbearia está `pending`
- Se pending: redireciona para `/pending-approval`
- Se ativa: redireciona para `/admin`
- Busca dados na tabela `barbers` corretamente

### 3. SuperAdminPage.jsx ✅
- Tabela de pendentes agora mostra:
  - Nome da Barbearia
  - Nome do Dono
  - **Email do Dono** (novo)
  - **Telefone** (novo)
  - Data de Cadastro
  - Botão de Aprovar

### 4. PendingApprovalPage.jsx ✅
- Página já existente e funcionando
- Mostra mensagem de "Aguardando Aprovação"
- Botão de logout

## SQL a Executar

### PASSO 1: Adicionar colunas email e phone na tabela profiles

Execute o arquivo: `add-profiles-email-phone.sql`

```sql
-- Adiciona colunas email e phone se não existirem
-- Preenche email dos perfis existentes a partir do auth.users
```

**Como executar:**
1. Abra o Supabase Dashboard
2. Vá em **SQL Editor**
3. Clique em **New Query**
4. Cole o conteúdo de `add-profiles-email-phone.sql`
5. Clique em **Run**

### PASSO 2: Verificar se funcionou

Execute este SQL para verificar:

```sql
SELECT 
  p.id,
  p.full_name,
  p.email,
  p.phone,
  p.role,
  b.barbershop_id,
  bs.name as barbershop_name,
  bs.subscription_status
FROM profiles p
LEFT JOIN barbers b ON b.profile_id = p.id
LEFT JOIN barbershops bs ON bs.id = b.barbershop_id
WHERE p.role = 'owner'
ORDER BY p.created_at DESC;
```

**Resultado esperado:**
- Todos os owners devem ter `email` preenchido
- Owners com telefone cadastrado devem ter `phone` preenchido
- Todos devem ter `barbershop_id` vinculado
- `subscription_status` deve ser `pending` ou `active`

## Fluxo Completo Corrigido

### 1. Cadastro (RegisterPage)
```
Usuário preenche:
- Nome Completo
- Email
- Nome da Barbearia
- Telefone (opcional)
- Senha

Sistema cria:
✅ Usuário no Auth (Supabase Auth)
✅ Perfil na tabela profiles (com email e phone)
✅ Barbearia na tabela barbershops (status: pending)
✅ Vínculo na tabela barbers (profile_id + barbershop_id)

Usuário vê:
✅ Tela de sucesso "Cadastro Recebido!"
✅ Mensagem: "Aguardando aprovação (até 24h)"
✅ Botão "Voltar para Login"
```

### 2. Login Antes da Aprovação
```
Usuário tenta fazer login:
✅ Email e senha validados
✅ Sistema verifica subscription_status
✅ Se pending: redireciona para /pending-approval
✅ Usuário vê tela "Aguardando Aprovação"
```

### 3. Super Admin Aprova
```
Super Admin vê na tabela:
✅ Nome da Barbearia
✅ Nome do Dono
✅ Email do Dono (NOVO)
✅ Telefone (NOVO)
✅ Data de Cadastro

Super Admin clica em "Aprovar (15 Dias Trial)":
✅ subscription_status: pending → active
✅ subscription_plan: null → trial
✅ trial_ends_at: +15 dias
✅ next_payment_at: +15 dias
```

### 4. Login Após Aprovação
```
Usuário faz login novamente:
✅ Email e senha validados
✅ Sistema verifica subscription_status
✅ Se active: redireciona para /admin
✅ Usuário acessa o painel completo
```

### 5. Botão de Suporte (Sidebar)
```
Dono clica em "Suporte":
✅ Modal mostra:
  - ID da Barbearia (copiável)
  - Nome da Barbearia (copiável)
  - Nome do Proprietário (copiável)
  - Email de Cadastro (copiável) ← Agora funciona
  - Telefone de Cadastro (copiável) ← Agora funciona
  - Data de Cadastro
```

## Teste Completo

### 1. Criar novo cadastro
```bash
1. Acesse http://localhost:5173/register
2. Preencha todos os campos:
   - Nome: "João Silva"
   - Email: "joao@teste.com"
   - Barbearia: "Barbearia do João"
   - Telefone: "(11) 99999-9999"
   - Senha: "123456"
3. Clique em "Criar Conta"
4. Deve ver tela de sucesso
```

### 2. Tentar fazer login (antes da aprovação)
```bash
1. Acesse http://localhost:5173/login
2. Digite email e senha
3. Deve ser redirecionado para /pending-approval
4. Deve ver mensagem "Aguardando Aprovação"
```

### 3. Aprovar no Super Admin
```bash
1. Acesse http://localhost:5173/brio-super-admin
2. Veja a tabela "Cadastros Aguardando Aprovação"
3. Deve ver:
   - Nome: "Barbearia do João"
   - Dono: "João Silva"
   - Email: "joao@teste.com" ← NOVO
   - Telefone: "(11) 99999-9999" ← NOVO
4. Clique em "Aprovar (15 Dias Trial)"
5. Deve ver toast de sucesso
```

### 4. Fazer login após aprovação
```bash
1. Acesse http://localhost:5173/login
2. Digite email e senha
3. Deve ser redirecionado para /admin
4. Deve ver o painel completo
```

### 5. Testar botão de Suporte
```bash
1. No painel, clique em "Suporte" na sidebar
2. Deve ver modal com:
   - ID da Barbearia
   - Nome: "Barbearia do João"
   - Proprietário: "João Silva"
   - Email: "joao@teste.com" ← Deve aparecer
   - Telefone: "(11) 99999-9999" ← Deve aparecer
   - Data de Cadastro
3. Teste copiar cada campo
```

## Arquivos Modificados

1. ✅ `src/pages/RegisterPage.jsx` - Salva email e phone no perfil
2. ✅ `src/pages/Login.jsx` - Verifica status pending e redireciona
3. ✅ `src/pages/SuperAdminPage.jsx` - Mostra email e telefone na tabela
4. ✅ `add-profiles-email-phone.sql` - SQL para adicionar colunas

## Próximos Passos

1. **Execute o SQL** `add-profiles-email-phone.sql` no Supabase
2. **Teste o fluxo completo** seguindo os passos acima
3. **Verifique** se email e telefone aparecem no Super Admin
4. **Teste** o botão de Suporte na sidebar

## Troubleshooting

### Email não aparece no Super Admin
```sql
-- Verificar se coluna existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN ('email', 'phone');

-- Se não existir, execute add-profiles-email-phone.sql
```

### Erro "Barbeiro não encontrado"
```sql
-- Verificar vínculo na tabela barbers
SELECT 
  p.email,
  p.full_name,
  b.barbershop_id,
  bs.name as barbershop_name
FROM profiles p
LEFT JOIN barbers b ON b.profile_id = p.id
LEFT JOIN barbershops bs ON bs.id = b.barbershop_id
WHERE p.email = 'email@do.usuario';

-- Se barbershop_id for NULL, execute:
INSERT INTO barbers (profile_id, barbershop_id, name)
SELECT p.id, bs.id, p.full_name
FROM profiles p
CROSS JOIN barbershops bs
WHERE p.email = 'email@do.usuario'
  AND bs.owner_id = p.id;
```

### Usuário não consegue fazer login após aprovação
```sql
-- Verificar status da barbearia
SELECT 
  bs.name,
  bs.subscription_status,
  bs.subscription_plan,
  bs.trial_ends_at
FROM barbershops bs
JOIN profiles p ON p.id = bs.owner_id
WHERE p.email = 'email@do.usuario';

-- Se status for pending, aprovar manualmente:
UPDATE barbershops
SET 
  subscription_status = 'active',
  subscription_plan = 'trial',
  trial_ends_at = NOW() + INTERVAL '15 days',
  next_payment_at = NOW() + INTERVAL '15 days'
WHERE owner_id = (SELECT id FROM profiles WHERE email = 'email@do.usuario');
```

## Contato

Se o problema persistir:
1. Tire print do erro no Console (F12)
2. Execute os SQLs de verificação acima
3. Me envie os resultados para análise
