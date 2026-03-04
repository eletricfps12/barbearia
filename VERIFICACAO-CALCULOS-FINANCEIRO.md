# Verificação dos Cálculos do Sistema Financeiro

## 📊 RESUMO DOS CÁLCULOS

### 1. FATURAMENTO (Income)
```
Faturamento Total = Receita de Agendamentos + Entradas Manuais
```

**Receita de Agendamentos:**
- Busca: `appointments` com `status = 'completed'`
- Filtro: Exclui agendamentos com `is_subscriber = true`
- Cálculo: Soma de `services.price` de todos agendamentos
- ✅ **CORRETO**: Assinantes não são contabilizados

**Entradas Manuais:**
- Busca: `financial_transactions` com `type = 'income'`
- Cálculo: Soma de `amount` de todas transações de entrada
- ✅ **CORRETO**

**Fórmula Final:**
```javascript
totalIncome = appointmentsIncome + manualIncome
```

---

### 2. SALDO EM ESPÉCIE (Cash Balance)
```
Saldo em Espécie = Agendamentos + Entradas Manuais - Despesas
```

**Entradas em Dinheiro:**
- Agendamentos completos (assumindo pagamento em dinheiro)
- Entradas manuais registradas

**Saídas em Dinheiro:**
- Despesas registradas manualmente

**Fórmula:**
```javascript
cashBalance = appointmentsIncome + manualCashIncome - cashExpenses
```

⚠️ **OBSERVAÇÃO**: 
- Atualmente assume que TODOS os agendamentos são pagos em dinheiro
- No futuro, você pode adicionar campo `payment_method` (dinheiro, cartão, pix)
- Aí o cálculo seria: `appointmentsIncome.filter(apt => apt.payment_method === 'cash')`

---

### 3. LUCRO COMISSÕES (House Profit)
```
Lucro da Casa = Receita Total - Comissões dos Barbeiros
```

**Por Barbeiro:**
```javascript
Receita do Barbeiro = Agendamentos do Barbeiro + Entradas Manuais do Barbeiro
Comissão do Barbeiro = Receita do Barbeiro × (commission_percentage / 100)
Lucro da Casa (por barbeiro) = Receita do Barbeiro - Comissão do Barbeiro
```

**Total:**
```javascript
houseProfit = Soma de todos os lucros por barbeiro
```

✅ **CORRETO**: Considera tanto agendamentos quanto entradas manuais vinculadas ao barbeiro

---

### 4. LUCRO LÍQUIDO (Net Profit)
```
Lucro Líquido = Faturamento Total - Despesas
```

**Fórmula:**
```javascript
profit = totalIncome - expenses
```

⚠️ **ATENÇÃO**: 
- Este cálculo NÃO considera as comissões dos barbeiros
- É apenas: Receita - Despesas
- O "Lucro Comissões" é que mostra o lucro real da casa após pagar barbeiros

---

### 5. TICKET MÉDIO (Average Ticket)
```
Ticket Médio = Faturamento Total / Número de Agendamentos
```

**Fórmula:**
```javascript
avgTicket = totalIncome / appointmentsData.length
```

⚠️ **POSSÍVEL ERRO**: 
- Está dividindo o faturamento TOTAL (agendamentos + entradas manuais) pelo número de agendamentos
- O correto seria dividir apenas a receita de agendamentos pelo número de agendamentos

**Correção sugerida:**
```javascript
avgTicket = appointmentsIncome / appointmentsData.filter(apt => !apt.is_subscriber).length
```

---

### 6. DESPESAS (Expenses)
```
Despesas = Soma de todas transações com type = 'expense'
```

**Fórmula:**
```javascript
expenses = transactionsData
  .filter(t => t.type === 'expense')
  .reduce((sum, t) => sum + parseFloat(t.amount), 0)
```

✅ **CORRETO**

---

## 🔍 PROBLEMAS IDENTIFICADOS

### ❌ PROBLEMA 1: Ticket Médio Incorreto
**Atual:**
```javascript
avgTicket = totalIncome / appointmentsData.length
```

**Problema:** Inclui entradas manuais no cálculo, mas divide apenas por agendamentos

**Correção:**
```javascript
const nonSubscriberAppointments = appointmentsData.filter(apt => !apt.is_subscriber)
avgTicket = nonSubscriberAppointments.length > 0 
  ? appointmentsIncome / nonSubscriberAppointments.length 
  : 0
```

---

### ⚠️ OBSERVAÇÃO 2: Saldo em Espécie
**Atual:** Assume que todos agendamentos são pagos em dinheiro

**Sugestão futura:** Adicionar campo `payment_method` na tabela `appointments`:
- `cash` (dinheiro)
- `card` (cartão)
- `pix` (pix)

Aí o cálculo seria:
```javascript
const appointmentsCash = appointmentsData
  .filter(apt => !apt.is_subscriber && apt.payment_method === 'cash')
  .reduce((sum, apt) => sum + (apt.services?.price || 0), 0)
```

---

### ⚠️ OBSERVAÇÃO 3: Lucro Líquido vs Lucro Comissões
**Dois conceitos diferentes:**

1. **Lucro Líquido** (atual): `Receita - Despesas`
   - Não considera comissões
   - Mostra quanto sobrou após pagar contas

2. **Lucro Comissões**: `Receita - Comissões dos Barbeiros`
   - Não considera despesas
   - Mostra quanto a casa lucra após pagar barbeiros

**Lucro Real da Casa deveria ser:**
```
Lucro Real = Receita - Comissões - Despesas
```

Ou seja:
```javascript
realProfit = totalIncome - totalCommissions - expenses
```

---

## ✅ CÁLCULOS CORRETOS

1. ✅ Faturamento Total
2. ✅ Despesas
3. ✅ Lucro Comissões (por barbeiro)
4. ✅ Exclusão de assinantes da receita
5. ✅ Saldo em Espécie (com a observação de payment_method)

---

## 🔧 CORREÇÕES RECOMENDADAS

### 1. Corrigir Ticket Médio
```javascript
const nonSubscriberAppointments = appointmentsData.filter(apt => !apt.is_subscriber)
const avgTicket = nonSubscriberAppointments.length > 0 
  ? appointmentsIncome / nonSubscriberAppointments.length 
  : 0
```

### 2. Adicionar Lucro Real (opcional)
```javascript
const totalCommissions = commissionsData.reduce((sum, c) => sum + c.commission_amount, 0)
const realProfit = totalIncome - totalCommissions - expenses
```

### 3. Futuro: Campo payment_method
- Adicionar coluna `payment_method` na tabela `appointments`
- Valores: 'cash', 'card', 'pix'
- Calcular saldo em espécie apenas com pagamentos em dinheiro

---

## 📝 RESUMO FINAL

**Cálculos Corretos:**
- ✅ Faturamento
- ✅ Despesas
- ✅ Lucro Comissões
- ✅ Saldo em Espécie (com observação)

**Cálculos com Problema:**
- ❌ Ticket Médio (inclui entradas manuais indevidamente)

**Melhorias Futuras:**
- 💡 Campo payment_method para saldo em espécie preciso
- 💡 Lucro Real = Receita - Comissões - Despesas
