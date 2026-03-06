# Próximos Passos - Configurações no Supabase

## ✅ CORREÇÕES JÁ FEITAS NO CÓDIGO
- Corrigido erro `setError is not defined` no RegisterPage
- Código agora usa `showToast.error()` corretamente
- Deploy realizado com sucesso

---

## ⚠️ AÇÕES NECESSÁRIAS NO SUPABASE

### 1. Remover Constraint UNIQUE do Telefone
**Problema**: Erro "duplicate key value violates unique constraint profiles_phone_key"

**Solução**: Execute no SQL Editor do Supabase:
```sql
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_phone_key;
```

**Arquivo**: `fix-profiles-phone-unique-constraint.sql`
**Documentação**: `SOLUCAO-TELEFONE-DUPLICADO.md`

---

### 2. Limpar Email Órfão (fabiohenriquecla6@gmail.com)
**Problema**: Email já usado mas cadastro não foi concluído

**Solução**: Execute no SQL Editor do Supabase:
```sql
DELETE FROM auth.users WHERE email = 'fabiohenriquecla6@gmail.com';
```

**Arquivo**: `fix-orphan-user-fabio.sql`
**Documentação**: `SOLUCAO-EMAIL-JA-USADO.md`

---

### 3. Configurar URLs de Recuperação de Senha
**Problema**: Link de recuperação redireciona para landing page

**Solução**: 
1. Acesse: Supabase Dashboard > Authentication > URL Configuration
2. Adicione em **Redirect URLs**:
   - `https://brioapp.online/reset-password`
   - `http://localhost:5173/reset-password`

**Documentação**: `CONFIGURAR-RECUPERACAO-SENHA.md`

---

## 📋 COMO EXECUTAR

### Acessar Supabase SQL Editor:
1. Acesse: https://supabase.com/dashboard
2. Selecione o projeto: `cntdiuaxocutsqwqnrkd`
3. Vá em **SQL Editor** (ícone de banco de dados)
4. Clique em **New Query**
5. Cole o SQL e clique em **Run**

### Ordem Recomendada:
1. ✅ Remover constraint do telefone (Passo 1)
2. ✅ Limpar email órfão (Passo 2)
3. ✅ Configurar URLs de recuperação (Passo 3)

---

## 🧪 TESTES APÓS EXECUTAR

### Teste 1: Cadastro com Telefone Duplicado
1. Tente cadastrar com telefone já usado
2. ✅ Deve funcionar sem erro

### Teste 2: Cadastro com Email Órfão
1. Tente cadastrar com fabiohenriquecla6@gmail.com
2. ✅ Deve funcionar sem erro

### Teste 3: Recuperação de Senha
1. Vá em "Esqueci minha senha"
2. Digite um email cadastrado
3. Clique no link recebido por email
4. ✅ Deve abrir a página de redefinir senha (não a landing page)

---

## 📊 STATUS ATUAL

| Tarefa | Status | Arquivo |
|--------|--------|---------|
| Corrigir setError | ✅ Feito | RegisterPage.jsx |
| Remover constraint telefone | ⏳ Pendente | fix-profiles-phone-unique-constraint.sql |
| Limpar email órfão | ⏳ Pendente | fix-orphan-user-fabio.sql |
| Configurar URLs recuperação | ⏳ Pendente | CONFIGURAR-RECUPERACAO-SENHA.md |

---

## 🔗 Links Úteis

- Supabase Dashboard: https://supabase.com/dashboard
- Projeto: https://cntdiuaxocutsqwqnrkd.supabase.co
- Produção: https://brioapp.online
- Repositório: https://github.com/eletricfps12/barbearia.git

---

## 📞 Suporte

Se tiver dúvidas, consulte os arquivos de documentação:
- `SOLUCAO-TELEFONE-DUPLICADO.md`
- `SOLUCAO-EMAIL-JA-USADO.md`
- `CONFIGURAR-RECUPERACAO-SENHA.md`
