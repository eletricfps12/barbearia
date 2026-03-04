# 🔧 Correção dos Erros 404 do Supabase

## ✅ Deploy Vercel - RESOLVIDO
O erro 126 foi corrigido! O site está no ar em **brioapp.online**

---

## 📊 Erros 404 das Funções RPC

Você está vendo esses erros no console:
- ❌ `404: get_mrr_last_6_months` - Função não existe
- ❌ `404: get_signups_last_8_weeks` - Função não existe

### 🎯 Solução

Execute o arquivo SQL que acabei de criar no **SQL Editor do Supabase**:

1. Acesse: https://supabase.com/dashboard/project/[SEU_PROJECT_ID]/sql/new
2. Copie todo o conteúdo do arquivo `setup-analytics-functions.sql`
3. Cole no editor SQL
4. Clique em **RUN** (ou pressione Ctrl+Enter)

### 📝 O que essas funções fazem?

**`get_mrr_last_6_months()`**
- Calcula o MRR (Monthly Recurring Revenue) dos últimos 6 meses
- Conta quantas barbearias estão ativas com plano mensal
- Multiplica por R$ 97,00 (valor da mensalidade)
- Retorna: `{ month: "Jan", revenue: 291.00 }`

**`get_signups_last_8_weeks()`**
- Conta quantas barbearias se cadastraram nas últimas 8 semanas
- Agrupa por semana
- Retorna: `{ week: "15/02", signups: 3 }`

---

## 🎨 Resultado Esperado

Depois de executar o SQL, os gráficos no Super Admin vão aparecer:
- 📈 Gráfico de MRR (receita mensal)
- 📊 Gráfico de Cadastros (signups por semana)

---

## ⚠️ Sobre o Erro do Convite

O erro "Object" ao convidar barbeiro já foi resolvido anteriormente. Se ainda aparecer:

1. Verifique se a tabela `invites` existe (você já executou o `setup-invites-table.sql`)
2. Verifique se a Edge Function `send-invite-email` está deployada
3. Verifique se a `RESEND_API_KEY` está configurada no Supabase

---

## 🚀 Próximos Passos

Após executar o SQL:
1. Recarregue a página do Super Admin (F5)
2. Os erros 404 devem sumir
3. Os gráficos devem aparecer (se houver dados)

Se não houver dados nos gráficos, é normal - significa que ainda não há barbearias ativas com plano mensal ou cadastros recentes.
