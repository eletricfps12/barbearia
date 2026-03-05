# Solução: Erro "User already registered"

## 🔴 PROBLEMA

Usuário tenta se cadastrar e recebe erro "User already registered", mas não consegue fazer login e não aparece no banco de dados.

### Causa
O cadastro falhou em algum passo intermediário:
1. ✅ Usuário criado no `auth.users` (Supabase Auth)
2. ❌ Falhou ao criar `profiles`, `barbershops` ou `barbers`
3. Resultado: Usuário "órfão" no auth, sem dados nas tabelas

---

## ✅ SOLUÇÃO RÁPIDA

### Opção 1: Limpar usuário específico (RECOMENDADO)

1. Abra o **SQL Editor** no Supabase
2. Execute este SQL (substitua o email):

```sql
-- Deletar usuário específico do auth
DELETE FROM auth.users WHERE email = 'email@problema.com';
```

3. Tente cadastrar novamente

### Opção 2: Ver todos os usuários órfãos

```sql
-- Ver usuários que existem no auth mas não têm dados
SELECT 
  au.id,
  au.email,
  au.created_at
FROM auth.users au
LEFT JOIN barbershops b ON b.owner_id = au.id
LEFT JOIN barbers br ON br.profile_id = au.id
WHERE b.id IS NULL AND br.id IS NULL
ORDER BY au.created_at DESC;
```

### Opção 3: Limpar TODOS os órfãos (CUIDADO!)

```sql
-- Deletar todos os usuários órfãos
DELETE FROM auth.users 
WHERE id IN (
  SELECT au.id
  FROM auth.users au
  LEFT JOIN barbershops b ON b.owner_id = au.id
  LEFT JOIN barbers br ON br.profile_id = au.id
  WHERE b.id IS NULL AND br.id IS NULL
);
```

---

## 🔧 SOLUÇÃO PERMANENTE (Código)

Vou melhorar o código de registro para:
1. Verificar se o usuário já existe ANTES de tentar criar
2. Se existir e for órfão, deletar automaticamente
3. Fazer rollback se algo falhar

---

## 📝 PASSOS PARA RESOLVER AGORA

1. **Identifique o email com problema**
   - Exemplo: `fabio@exemplo.com`

2. **Abra o Supabase Dashboard**
   - https://supabase.com/dashboard/project/cntdiuaxocutsqwqnrkd

3. **Vá em SQL Editor**

4. **Execute:**
```sql
DELETE FROM auth.users WHERE email = 'fabio@exemplo.com';
```

5. **Tente cadastrar novamente**

---

## 🚨 PREVENÇÃO

Para evitar que isso aconteça novamente, vou implementar:

1. **Verificação prévia:** Checar se email já existe antes de criar
2. **Limpeza automática:** Se existir usuário órfão, deletar e recriar
3. **Melhor tratamento de erros:** Mensagens mais claras
4. **Rollback:** Se falhar, deletar o usuário do auth também

---

## 📊 VERIFICAR PROBLEMA ATUAL

Execute no SQL Editor:

```sql
-- Ver quantos usuários órfãos existem
SELECT COUNT(*) as total_orfaos
FROM auth.users au
LEFT JOIN barbershops b ON b.owner_id = au.id
LEFT JOIN barbers br ON br.profile_id = au.id
WHERE b.id IS NULL AND br.id IS NULL;

-- Ver detalhes dos órfãos
SELECT 
  au.email,
  au.created_at,
  'ÓRFÃO - Pode deletar' as status
FROM auth.users au
LEFT JOIN barbershops b ON b.owner_id = au.id
LEFT JOIN barbers br ON br.profile_id = au.id
WHERE b.id IS NULL AND br.id IS NULL
ORDER BY au.created_at DESC;
```

---

## ✅ DEPOIS DE LIMPAR

1. Usuário órfão foi deletado
2. Email está livre novamente
3. Pode cadastrar normalmente
4. Processo completo: auth → profiles → barbershops → barbers

---

**Arquivo SQL criado:** `fix-orphan-users.sql`
**Use para limpar usuários órfãos quando necessário**
