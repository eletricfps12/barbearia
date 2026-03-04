# Integração Assinantes + Agendamentos - INSTRUÇÕES

## ✅ O QUE FOI IMPLEMENTADO

Sistema completo para marcar agendamentos como "Assinante" e não contabilizar na receita normal.

### Funcionalidades:

1. **Botão "Assinante" na Agenda**
   - Novo botão ao lado de "Concluir" e "Faltou"
   - Marca o agendamento como assinante E completa automaticamente
   - Não contabiliza na receita (já foi pago na assinatura)

2. **Badge Visual "⭐ Assinante"**
   - Aparece nos agendamentos marcados como assinante
   - Cor indigo para diferenciar dos outros status

3. **Cálculo de Receita Atualizado**
   - Agenda: Total exclui assinantes + aviso "Assinantes não contabilizados"
   - Financeiro: Receita de agendamentos exclui assinantes
   - Dashboard Home: Receita e lucro excluem assinantes
   - Dashboard Barbeiro: Receita e gráfico semanal excluem assinantes

4. **Ocupação Mantida**
   - Assinantes CONTAM para ocupação da agenda (são clientes reais)
   - Apenas não contam para receita

## 📋 PASSO A PASSO PARA ATIVAR

### 1. Executar SQL no Supabase

Execute os seguintes arquivos SQL no Supabase SQL Editor (nesta ordem):

#### 1.1 Corrigir estrutura de assinantes (se ainda não executou)
```
fix-plan-type-column.sql
```
Este arquivo torna a coluna `plan_type` nullable.

#### 1.2 Adicionar flag de assinante em agendamentos
```
add-subscriber-flag-appointments.sql
```
Este arquivo adiciona:
- Coluna `is_subscriber` (boolean) - marca se é assinante
- Coluna `subscriber_id` (UUID) - link com tabela subscriptions
- Índices para performance

### 2. Testar no Localhost

1. Certifique-se de que o servidor está rodando (`npm run dev`)
2. Faça login no sistema
3. Vá para a página **Agenda**
4. Encontre um agendamento confirmado
5. Clique no botão **"Assinante"**
6. Verifique que:
   - Status muda para "Concluído"
   - Aparece badge "⭐ Assinante"
   - No rodapé, aparece "Assinantes não contabilizados"
   - O valor NÃO é somado no total

### 3. Verificar em Outras Páginas

#### Dashboard Home:
- Receita do dia deve excluir assinantes
- Lucro líquido deve excluir assinantes
- Ocupação deve INCLUIR assinantes (são clientes reais)

#### Financeiro:
- Gráfico de receita deve excluir assinantes
- Total de receita deve excluir assinantes

#### Dashboard Barbeiro:
- Receita do dia deve excluir assinantes
- Gráfico semanal deve excluir assinantes

## 🎯 FLUXO COMPLETO

### Cenário 1: Cliente Assinante Marca Horário

1. Cliente assinante marca horário normalmente (site público ou WhatsApp)
2. Agendamento aparece na agenda como "Confirmado"
3. No dia do atendimento:
   - Barbeiro clica em **"Assinante"**
   - Sistema marca como concluído + assinante
   - NÃO contabiliza na receita (já foi pago na assinatura)
   - Aparece badge "⭐ Assinante"

### Cenário 2: Cliente Normal Marca Horário

1. Cliente normal marca horário
2. Agendamento aparece na agenda como "Confirmado"
3. No dia do atendimento:
   - Barbeiro clica em **"Concluir"**
   - Sistema marca como concluído
   - CONTABILIZA na receita normalmente

### Cenário 3: Cliente Não Compareceu

1. Cliente não apareceu
2. Barbeiro clica em **"Faltou"**
3. Sistema marca como "Faltou"
4. NÃO contabiliza na receita
5. Pode restaurar depois se necessário

## 📊 ESTRUTURA DO BANCO DE DADOS

### Tabela: appointments

Novas colunas adicionadas:

```sql
is_subscriber BOOLEAN DEFAULT FALSE
  - TRUE: É assinante, não conta na receita
  - FALSE: Cliente normal, conta na receita

subscriber_id UUID REFERENCES subscriptions(id)
  - Link opcional com a tabela de assinantes
  - Permite rastrear qual assinatura foi usada
```

## 🔄 PRÓXIMOS PASSOS (OPCIONAL)

### Integração Automática (Futuro)

Você pode adicionar no futuro:

1. **Auto-detecção de assinantes**
   - Quando cliente marca horário, verificar se telefone está na tabela subscriptions
   - Se sim, marcar automaticamente como assinante

2. **Controle de uso de assinatura**
   - Contar quantos cortes o assinante já usou no mês
   - Alertar quando atingir o limite do plano

3. **Relatório de assinantes**
   - Quantos assinantes usaram o plano no mês
   - Quais assinantes não estão usando (risco de cancelamento)

## 📝 ARQUIVOS MODIFICADOS

### SQL:
- ✅ `fix-plan-type-column.sql` - Corrige plan_type nullable
- ✅ `add-subscriber-flag-appointments.sql` - Adiciona flag de assinante

### Código:
- ✅ `src/pages/AgendaPage.jsx` - Botão Assinante + Badge + Cálculo
- ✅ `src/pages/FinanceiroPage.jsx` - Exclui assinantes da receita
- ✅ `src/pages/DashboardHome.jsx` - Exclui assinantes da receita/lucro
- ✅ `src/pages/BarberDashboard.jsx` - Exclui assinantes da receita/gráfico

## ⚠️ IMPORTANTE

- Assinantes NÃO contam na receita de agendamentos
- Assinantes CONTAM na ocupação da agenda (são clientes reais)
- A receita de assinantes já está contabilizada na página "Assinantes"
- Não há duplicação de receita

## 🎨 VISUAL

### Botões na Agenda:
- **Concluir** (verde) - Cliente normal, conta na receita
- **Assinante** (indigo) - Cliente assinante, NÃO conta na receita
- **Faltou** (vermelho) - Cliente não compareceu

### Badge de Status:
- **⭐ Assinante** (indigo) - Aparece quando marcado como assinante
- Fica ao lado do badge de status "Concluído"

## 🚀 APÓS TESTAR E APROVAR

1. Fazer commit das mudanças
2. Push para o repositório
3. Deploy automático no Vercel
4. Testar em produção

---

**Dúvidas?** Teste primeiro no localhost antes de fazer deploy!
