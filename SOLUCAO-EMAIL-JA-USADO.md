# Solução: "Este email já foi usado anteriormente"

## Problema
Ao tentar cadastrar, aparece a mensagem:
> "Este email já foi usado anteriormente. Por favor, entre em contato com o suporte para liberar o cadastro."

## Causa
Isso acontece quando um cadastro foi iniciado mas não foi concluído. O email fica "preso" no sistema de autenticação (auth.users) mas não tem dados completos nas outras tabelas.

## Solução Rápida (Para o Administrador do Sistema)

### Opção 1: Limpar o Email Órfão no Supabase

1. Acesse o Supabase Dashboard: https://supabase.com/dashboard
2. Selecione o projeto: `cntdiuaxocutsqwqnrkd`
3. Vá em **SQL Editor** (ícone de banco de dados no menu lateral)
4. Clique em **New Query**
5. Cole o seguinte SQL:

```sql
-- Verificar se o email existe
SELECT 
  au.id,
  au.email,
  au.created_at,
  p.id as profile_id
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
WHERE au.email = 'fabiohenriquecla6@gmail.com';
```

6. Clique em **Run** (ou pressione Ctrl+Enter)
7. Se o resultado mostrar que `profile_id` é `NULL`, execute:

```sql
DELETE FROM auth.users WHERE email = 'fabiohenriquecla6@gmail.com';
```

8. Agora o usuário pode se cadastrar novamente com este email

### Opção 2: Usar Outro Email

O usuário pode simplesmente usar outro email para fazer o cadastro.

## Solução Permanente (Prevenção)

O código já foi atualizado para:
1. ✅ Detectar usuários órfãos automaticamente
2. ✅ Mostrar mensagem clara com opções
3. ✅ Tentar fazer rollback se o cadastro falhar no meio

## Para o Usuário Final

Se você recebeu esta mensagem, você tem 2 opções:

### Opção 1: Use outro email
Cadastre-se com um email diferente.

### Opção 2: Entre em contato com o suporte
Envie um email para: **suporte@brioapp.online**

Informe:
- O email que você tentou usar
- Que recebeu a mensagem "email já foi usado anteriormente"

Nossa equipe irá liberar o email em até 24 horas.

## Emails Órfãos Conhecidos

Para limpar emails órfãos específicos, use o arquivo:
- `fix-orphan-user-fabio.sql` - Para fabiohenriquecla6@gmail.com
- `fix-orphan-users.sql` - Script genérico para limpar todos os órfãos

## Verificação de Usuários Órfãos

Para ver todos os usuários órfãos no sistema:

```sql
SELECT 
  au.id,
  au.email,
  au.created_at,
  p.id as profile_id,
  b.id as barber_id,
  bs.id as barbershop_id
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
LEFT JOIN barbers b ON b.profile_id = au.id
LEFT JOIN barbershops bs ON bs.owner_id = au.id
WHERE p.id IS NULL
ORDER BY au.created_at DESC;
```

Usuários órfãos são aqueles onde `profile_id`, `barber_id` e `barbershop_id` são todos `NULL`.
