# Instruções para Ativar a Página de Assinantes - ATUALIZADO

## ⚠️ ERRO CORRIGIDO - EXECUTAR NOVO SQL

Se você está recebendo o erro: `null value in column "plan_type" violates not-null constraint`

**SOLUÇÃO**: Execute o arquivo `fix-plan-type-column.sql` no Supabase SQL Editor

Este arquivo vai:
- Tornar a coluna `plan_type` nullable (remover constraint NOT NULL)
- Definir valor padrão 'custom' para registros existentes
- Permitir que você salve assinantes com planos personalizados

## ✅ CONCLUÍDO

1. ✅ Criado `src/utils/phoneMask.js` - Utilitário de máscara de telefone
2. ✅ Criado `src/pages/AssinantesPage.jsx` - Página completa com planos personalizados
3. ✅ Atualizado `create-subscriptions-table.sql` - SQL com tabela de planos
4. ✅ Atualizado `src/App.jsx` - Rota adicionada
5. ✅ Atualizado `src/components/Sidebar.jsx` - Link no menu

## 1. Executar SQL de Migração no Supabase

⚠️ **IMPORTANTE**: Use o arquivo `migrate-subscriptions-to-plans.sql` ao invés do `create-subscriptions-table.sql`

Este arquivo faz a migração segura da estrutura existente.

### Passo a passo:

1. Acesse o Supabase: https://supabase.com/dashboard
2. Selecione seu projeto
3. No menu lateral, clique em **SQL Editor**
4. Clique em **New Query**
5. Copie todo o conteúdo do arquivo `migrate-subscriptions-to-plans.sql`
6. Cole no editor SQL
7. Clique em **Run** (ou pressione Ctrl+Enter)

### O que será feito:

- ✅ Criar tabela `subscription_plans` (planos personalizados)
- ✅ Adicionar colunas novas na tabela `subscriptions` existente:
  - `plan_id` - Referência ao plano
  - `plan_name` - Nome do plano
  - `duration_days` - Duração em dias
- ✅ Migrar dados existentes de `plan_type` para `plan_name`
- ✅ Configurar políticas RLS
- ✅ Criar índices para performance

### Dados Existentes:

Se você já tem assinantes cadastrados, eles serão migrados automaticamente:
- `plan_type = 'monthly'` → `plan_name = 'Plano Mensal'` + `duration_days = 30`
- `plan_type = 'weekly'` → `plan_name = 'Plano Semanal'` + `duration_days = 7`

## 2. Testar no Localhost

Após executar o SQL, você pode testar a página:

1. Certifique-se de que o servidor está rodando (`npm run dev`)
2. Faça login no sistema
3. No menu lateral, clique em **Assinantes**
4. Teste todas as funcionalidades:

### Gerenciar Planos:
- Clicar em "Planos"
- Criar novo plano (nome, descrição, preço, duração em dias)
- Editar plano existente
- Excluir plano

### Cadastrar Assinante:
- Clicar em "Novo Assinante"
- Preencher nome *
- Telefone com máscara automática: (11) 99999-9999
- Email (opcional)
- Selecionar um plano da lista
- Data de início *
- Observações (opcional)

### Outras Funcionalidades:
- Definir meta do mês
- Filtrar por status (Todos/Ativos/Inativos)
- Editar assinante
- Excluir assinante

## 3. Mudanças Implementadas

### ✅ Sistema de Planos Personalizados:
- Barbeiro cria seus próprios planos
- Cada plano tem: nome, descrição, preço, duração em dias
- Ao cadastrar assinante, seleciona um plano existente
- **REMOVIDO**: Sistema fixo de "semanal/mensal"

### ✅ Máscara de Telefone:
- Formato automático: (11) 99999-9999 ou (11) 9999-9999
- Validação automática
- Criado utilitário reutilizável em `src/utils/phoneMask.js`

### ✅ Cálculo de Receita Simplificado:
- **REMOVIDO**: Cálculo de "semanal × 4"
- Agora soma apenas o valor dos planos ativos
- Mais simples e preciso

### ✅ Cards de Estatísticas:
- Assinantes Ativos (com progresso de meta)
- Receita Mensal Total (soma de todos os planos ativos)

## 4. Próximos Passos

### Adicionar máscara de telefone em outros lugares:

Arquivos que ainda precisam de máscara de telefone:
- `src/pages/BookingPage.jsx` - Campo de telefone do cliente no agendamento
- `src/pages/BrandCenterPage.jsx` - Campo contact_phone da barbearia

Posso fazer isso agora se você quiser, ou você pode testar primeiro a página de Assinantes.

## 5. Após Testar e Aprovar

1. Fazer commit das mudanças
2. Push para o repositório
3. Deploy automático no Vercel

## Arquivos Modificados/Criados

- ✅ `src/utils/phoneMask.js` - NOVO - Utilitário de máscara
- ✅ `src/pages/AssinantesPage.jsx` - NOVO - Página completa
- ✅ `src/App.jsx` - Rota adicionada
- ✅ `src/components/Sidebar.jsx` - Link no menu
- ✅ `create-subscriptions-table.sql` - SQL atualizado

## Observações

- A página está 100% responsiva para mobile
- Design moderno seguindo o padrão das outras páginas
- Todas as operações são seguras com RLS
- Cálculos automáticos de receita e estatísticas
- Sistema de planos flexível e personalizável
