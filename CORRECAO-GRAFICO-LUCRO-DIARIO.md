# Correção: Gráfico mostrando Lucro Diário Real

## 🔴 PROBLEMA IDENTIFICADO

O gráfico "Evolução de Receita" estava mostrando apenas **R$ 70** (valor dos agendamentos), mas deveria mostrar o **lucro real do dia** (receita - despesas).

### Exemplo do problema:
- Agendamentos do dia: R$ 70
- Entradas manuais: R$ 480
- Despesas: R$ 240
- **Gráfico mostrava:** R$ 70 ❌
- **Deveria mostrar:** R$ 310 (70 + 480 - 240) ✅

---

## ✅ SOLUÇÃO IMPLEMENTADA

### 1. Modificado cálculo dos dados do gráfico

**ANTES:**
```javascript
// Apenas receita de agendamentos
const dailyData = {}
appointmentsData.forEach(apt => {
  const date = new Date(apt.start_time).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  dailyData[date] = (dailyData[date] || 0) + (apt.services?.price || 0)
})

const chartDataArray = Object.entries(dailyData).map(([date, value]) => ({
  date,
  receita: value
}))
```

**DEPOIS:**
```javascript
// Receita (agendamentos + entradas manuais) - Despesas = Lucro
const dailyData = {}

// Add appointments revenue by date
appointmentsData.forEach(apt => {
  const date = new Date(apt.start_time).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  if (!dailyData[date]) {
    dailyData[date] = { receita: 0, despesas: 0 }
  }
  dailyData[date].receita += (apt.services?.price || 0)
})

// Add manual transactions (income and expenses) by date
transactionsData.forEach(t => {
  const date = new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  if (!dailyData[date]) {
    dailyData[date] = { receita: 0, despesas: 0 }
  }
  if (t.type === 'income') {
    dailyData[date].receita += parseFloat(t.amount)
  } else {
    dailyData[date].despesas += parseFloat(t.amount)
  }
})

const chartDataArray = Object.entries(dailyData).map(([date, values]) => ({
  date,
  receita: values.receita,
  despesas: values.despesas,
  lucro: values.receita - values.despesas
}))
```

### 2. Modificado o gráfico para mostrar LUCRO ao invés de RECEITA

**Mudanças no AreaChart:**
- Título: "Evolução de Receita" → "Evolução de Lucro Diário"
- dataKey: `receita` → `lucro`
- Cor: Azul (#3b82f6) → Verde (#10b981)
- Tooltip: Agora mostra Receita, Despesas e Lucro

**Cores atualizadas:**
- Linha: Verde (#10b981)
- Preenchimento: Gradiente verde
- Dots: Verde (#10b981)
- ActiveDot: Verde claro (#34d399)

---

## 📊 COMO FUNCIONA AGORA

### Cálculo por dia:
```
Lucro do Dia = (Agendamentos + Entradas Manuais) - Despesas
```

### Exemplo prático:
**Dia 04/03:**
- Agendamentos: R$ 70
- Entradas manuais: R$ 480
- Despesas: R$ 240
- **Lucro mostrado no gráfico:** R$ 310 ✅

**Dia 05/03:**
- Agendamentos: R$ 150
- Entradas manuais: R$ 0
- Despesas: R$ 50
- **Lucro mostrado no gráfico:** R$ 100 ✅

---

## 🎯 RESULTADO ESPERADO

Agora o gráfico mostra o **lucro real de cada dia**, considerando:
- ✅ Agendamentos completos
- ✅ Entradas manuais (dinheiro, cartão, pix)
- ✅ Despesas do dia

O tooltip ao passar o mouse mostra:
- Receita total do dia
- Despesas do dia
- Lucro líquido do dia

---

## 🔧 ARQUIVOS MODIFICADOS

1. `src/pages/FinanceiroPage.jsx`
   - Modificado cálculo de `chartDataArray` para incluir receita, despesas e lucro
   - Modificado `AreaChart` para mostrar `dataKey="lucro"`
   - Alterado título para "Evolução de Lucro Diário"
   - Alterado cores de azul para verde
   - Modificado tooltip para mostrar todos os valores

---

## ✅ PRÓXIMOS PASSOS

1. ✅ Código modificado
2. ⏳ Testar no localhost (http://localhost:5173)
3. ⏳ Verificar se o gráfico mostra o lucro correto
4. ⏳ Fazer commit e deploy

---

## 🚀 COMO TESTAR

1. Acesse o painel Financeiro
2. Verifique o gráfico "Evolução de Lucro Diário"
3. Passe o mouse sobre os pontos do gráfico
4. Verifique se mostra:
   - Receita do dia
   - Despesas do dia
   - Lucro do dia (receita - despesas)
5. Confirme que o valor do lucro está correto

---

## 📌 OBSERVAÇÃO

O gráfico agora mostra o **lucro líquido diário**, que é diferente de:
- **Faturamento:** Apenas receitas (sem descontar despesas)
- **Lucro Comissões:** Receita - Comissões dos barbeiros
- **Saldo em Espécie:** Apenas transações em dinheiro

O gráfico mostra: **Receita Total - Despesas Total = Lucro Líquido**
