# Correção: Saldo em Espécie vs Lucro Líquido

## 🔴 PROBLEMA IDENTIFICADO

O usuário reportou que o **Saldo em Espécie** estava igual ao **Lucro Líquido**, o que não faz sentido.

### Causa Raiz

O cálculo estava assim:
```javascript
cashBalance = appointmentsIncome + manualCashIncome - cashExpenses
```

Isso estava errado porque:
1. `appointmentsIncome` já está incluído no `totalIncome` (Faturamento)
2. Estávamos assumindo que TODOS os agendamentos eram pagos em dinheiro
3. O resultado ficava muito parecido com o `profit` (Lucro Líquido)

---

## ✅ SOLUÇÃO IMPLEMENTADA

### 1. Adicionada coluna `payment_method` na tabela `financial_transactions`

**SQL executado:** `add-payment-method-transactions.sql`

```sql
ALTER TABLE financial_transactions 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'cash';

-- Valores válidos: 'cash', 'card', 'pix', 'other'
```

### 2. Adicionado seletor de método de pagamento no modal "Nova Entrada/Despesa"

Agora quando o barbeiro registra uma entrada ou despesa manual, ele escolhe:
- 💵 Dinheiro
- 💳 Cartão
- 📱 Pix
- 🔄 Outro

### 3. Corrigido cálculo do Saldo em Espécie

**ANTES:**
```javascript
cashBalance = appointmentsIncome + manualCashIncome - cashExpenses
```

**DEPOIS:**
```javascript
const manualCashIncome = transactionsData
  .filter(t => t.type === 'income' && t.payment_method === 'cash')
  .reduce((sum, t) => sum + parseFloat(t.amount), 0)

const cashExpenses = transactionsData
  .filter(t => t.type === 'expense' && t.payment_method === 'cash')
  .reduce((sum, t) => sum + parseFloat(t.amount), 0)

cashBalance = manualCashIncome - cashExpenses
```

---

## 📊 DIFERENÇA ENTRE OS CÁLCULOS

### Faturamento (Income)
```
Faturamento = Agendamentos Completos + Todas as Entradas Manuais
```
- Inclui TODOS os agendamentos (independente do método de pagamento)
- Inclui TODAS as entradas manuais (dinheiro, cartão, pix, outro)

### Lucro Líquido (Profit)
```
Lucro Líquido = Faturamento - Despesas
```
- Considera TODAS as receitas
- Considera TODAS as despesas

### Saldo em Espécie (Cash Balance) ✅ CORRIGIDO
```
Saldo em Espécie = Entradas Manuais em Dinheiro - Despesas em Dinheiro
```
- Considera APENAS transações manuais com `payment_method = 'cash'`
- NÃO inclui agendamentos (eles não têm método de pagamento ainda)
- Mostra quanto dinheiro físico o barbeiro tem em caixa

---

## 🎯 RESULTADO ESPERADO

Agora os valores devem ser diferentes:

**Exemplo:**
- **Faturamento:** R$ 5.000 (agendamentos + todas entradas manuais)
- **Despesas:** R$ 1.500 (todas as despesas)
- **Lucro Líquido:** R$ 3.500 (5.000 - 1.500)
- **Saldo em Espécie:** R$ 800 (apenas dinheiro vivo: entradas cash - despesas cash)

---

## 📝 OBSERVAÇÕES IMPORTANTES

1. **Agendamentos não aparecem no Saldo em Espécie** porque a tabela `appointments` não tem campo `payment_method` ainda
2. **Apenas transações manuais** são consideradas no Saldo em Espécie
3. **O barbeiro deve registrar entradas manuais** quando receber dinheiro vivo de clientes
4. **Futuro:** Podemos adicionar `payment_method` na tabela `appointments` para incluir agendamentos no cálculo

---

## 🔧 ARQUIVOS MODIFICADOS

1. `src/pages/FinanceiroPage.jsx`
   - Adicionado campo `payment_method` no formData
   - Adicionado seletor no modal "Nova Entrada/Despesa"
   - Corrigido cálculo de `cashBalance`
   - Modificado `handleSubmit` para salvar `payment_method`

2. `add-payment-method-transactions.sql`
   - Criado SQL para adicionar coluna `payment_method`
   - Precisa ser executado no Supabase

---

## ✅ PRÓXIMOS PASSOS

1. ✅ Código modificado
2. ⏳ Testar no localhost (http://localhost:5173)
3. ⏳ Executar SQL no Supabase
4. ⏳ Verificar se os valores estão corretos
5. ⏳ Fazer commit e deploy

---

## 🚀 COMO TESTAR

1. Acesse o painel Financeiro
2. Clique em "Nova Entrada"
3. Verifique se aparece o campo "Método de Pagamento"
4. Registre uma entrada em DINHEIRO (R$ 100)
5. Registre uma entrada em CARTÃO (R$ 200)
6. Verifique:
   - **Faturamento** deve mostrar R$ 300 (100 + 200)
   - **Saldo em Espécie** deve mostrar apenas R$ 100 (só o dinheiro)

---

## 📌 LEMBRETE

Antes de fazer deploy, execute o SQL no Supabase:
```bash
# Copie o conteúdo de add-payment-method-transactions.sql
# Cole no SQL Editor do Supabase
# Execute
```
