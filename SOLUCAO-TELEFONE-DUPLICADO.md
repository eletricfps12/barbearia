# Solução: Erro "duplicate key value violates unique constraint profiles_phone_key"

## Problema
Ao tentar cadastrar, aparece o erro:
> duplicate key value violates unique constraint "profiles_phone_key"

## Causa
A tabela `profiles` tem uma constraint UNIQUE na coluna `phone` que impede que dois usuários tenham o mesmo telefone. Isso causa problemas quando:
- Vários barbeiros usam o telefone da barbearia
- Donos e barbeiros compartilham o mesmo contato
- O mesmo telefone é usado para múltiplos cadastros

## Solução

### Execute no Supabase SQL Editor:

1. Acesse: https://supabase.com/dashboard
2. Selecione o projeto: `cntdiuaxocutsqwqnrkd`
3. Vá em **SQL Editor**
4. Clique em **New Query**
5. Cole e execute o seguinte SQL:

```sql
-- Remover a constraint UNIQUE do campo phone
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_phone_key;
```

6. Pronto! Agora múltiplos usuários podem ter o mesmo telefone.

## Verificação

Para verificar se a constraint foi removida:

```sql
-- Não deve retornar nenhum resultado
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'profiles'::regclass
  AND conname = 'profiles_phone_key';
```

## Ver Telefones Duplicados

Para ver quais telefones estão sendo usados por múltiplos usuários:

```sql
SELECT 
    phone,
    COUNT(*) as count,
    STRING_AGG(email, ', ') as emails
FROM profiles
WHERE phone IS NOT NULL
GROUP BY phone
HAVING COUNT(*) > 1
ORDER BY count DESC;
```

## Por que Remover a Constraint?

Telefones podem ser legitimamente compartilhados:
- ✅ Telefone da barbearia usado por vários barbeiros
- ✅ Dono e barbeiros com o mesmo contato
- ✅ Telefone comercial compartilhado
- ✅ Campo opcional (pode ser NULL para vários usuários)

## Constraints que Devem Permanecer UNIQUE

- ✅ `email` - Cada email deve ser único
- ✅ `id` - ID do usuário (chave primária)

## Arquivo SQL

Use o arquivo `fix-profiles-phone-unique-constraint.sql` que contém:
- Verificação da constraint
- Remoção da constraint
- Verificação de telefones duplicados

## Após Executar

Tente cadastrar novamente. O erro não deve mais aparecer, mesmo que o telefone já esteja em uso por outro usuário.
