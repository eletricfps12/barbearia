# 📋 Resumo da Sessão - Brio App

## ✅ Problemas Resolvidos

### 1. Sistema Dark/Light Mode
- **Problema**: Toggle funcionava mas cores não mudavam
- **Solução**: Adicionadas variáveis CSS em `src/index.css`
- **Status**: ✅ Funcionando

### 2. Scrollbar Horizontal do Calendário
- **Problema**: Barra de scroll aparecendo embaixo do calendário
- **Solução**: Removido padding e adicionada classe `.scrollbar-hide`
- **Status**: ✅ Funcionando

### 3. Botão "Realizar Repasse"
- **Problema**: Botão desnecessário na página financeira
- **Solução**: Removido da `FinanceiroPage.jsx`
- **Status**: ✅ Funcionando

### 4. Deploy Vercel - Erro 126
- **Problema**: Permission denied ao executar `vite build`
- **Causa**: `node_modules` commitado no Git
- **Solução**: 
  - Removido `node_modules` do Git
  - Atualizado `.gitignore`
  - Configurado `vercel.json` com comandos explícitos
- **Status**: ✅ Deploy funcionando em **brioapp.online**

### 5. Erros 404 das Funções RPC
- **Problema**: `get_mrr_last_6_months` e `get_signups_last_8_weeks` não existiam
- **Solução**: Criado `setup-analytics-functions.sql` e executado no Supabase
- **Status**: ✅ Funções criadas

### 6. Sistema de Convites - Função `generate_invite_token`
- **Problema**: Erro de ambiguidade na coluna "token"
- **Solução**: Recriada função sem parâmetros em `fix-generate-invite-token.sql`
- **Status**: ✅ Função corrigida

### 7. Coluna `phone` na Tabela `invites`
- **Problema**: Coluna não existia
- **Solução**: Criado `add-phone-column-invites.sql`
- **Status**: ✅ Coluna adicionada

### 8. RLS Policies da Tabela `invites`
- **Problema**: Super admins não podiam criar convites
- **Solução**: Criado `fix-invites-rls-policies.sql`
- **Status**: ✅ Policies corrigidas

### 9. Edge Functions Deployadas
- **Solução**: 
  - Atualizada `send-appointment-email` para usar `agendamento@brioapp.online`
  - Verificada `send-invite-email` usando `convite@brioapp.online`
  - Deploy feito via `npx supabase functions deploy`
- **Status**: ✅ Funções deployadas

### 10. Sistema de Convites
- **Status**: ✅ Link de convite é gerado corretamente
- **Exemplo**: `https://www.brioapp.online/register?invite=EZrUUEc20VSVcjsbpAYge6_-7ePzZCfZ`

---

## ⚠️ Problemas Pendentes

### 1. Emails Não Chegam
- **Problema**: Resend diz que enviou mas email não chega
- **Causa Provável**: Domínio `brioapp.online` não verificado no Resend
- **Soluções Possíveis**:
  1. Verificar domínio no Resend (adicionar DNS records)
  2. Ativar "Enable Custom SMTP" no Supabase
  3. Usar `onboarding@resend.dev` temporariamente

### 2. Erro 400 ao Criar Conta de Barbearia
- **Problema**: `Error creating account: Object` ao tentar cadastrar barbearia
- **Causa Provável**: RLS bloqueando inserções anônimas na tabela `barbershops`
- **Solução**: Executar SQL para permitir cadastros anônimos (próximo passo)

---

## 📁 Arquivos Criados

1. `setup-analytics-functions.sql` - Funções RPC para gráficos
2. `fix-generate-invite-token.sql` - Correção da função de token
3. `add-phone-column-invites.sql` - Adiciona coluna phone
4. `fix-invites-rls-policies.sql` - Corrige permissões de convites
5. `DEPLOY-EDGE-FUNCTIONS.md` - Guia de deploy completo
6. `CORRECAO-ERROS-404.md` - Documentação dos erros 404
7. `deploy-edge-functions.ps1` - Script PowerShell para deploy
8. `test-resend-email.js` - Teste de integração Resend
9. `test-resend-browser.html` - Teste via navegador
10. `ROTAS.md` - Documentação de todas as rotas

---

## 🔑 Configurações Importantes

### Supabase
- **Project ID**: `cntdiuaxocutsqwqnrkd`
- **URL**: `https://cntdiuaxocutsqwqnrkd.supabase.co`

### Resend
- **API Key**: `re_gWbuUp1s_4ohCpUNiRGfwCYikaSwSkmRF`
- **Domínio**: `brioapp.online` (precisa verificar)
- **Emails Configurados**:
  - `team@brioapp.online`
  - `agendamento@brioapp.online`
  - `convite@brioapp.online`

### Vercel
- **Domínio**: `brioapp.online`
- **Status**: ✅ Deploy funcionando

---

## 🎯 Próximos Passos

### Prioridade Alta
1. **Corrigir erro 400 ao criar conta**
   - Executar SQL para permitir cadastros anônimos
   - Testar cadastro de barbearia

2. **Configurar emails**
   - Verificar domínio no Resend OU
   - Ativar SMTP customizado no Supabase OU
   - Usar `onboarding@resend.dev` temporariamente

### Prioridade Média
3. **Criar página "Atualizar Senha"**
   - Rota: `/atualizar-senha`
   - Para barbeiros resetarem senha

4. **Adicionar "Esqueci minha senha" no Login**
   - Botão que chama `supabase.auth.resetPasswordForEmail()`

### Prioridade Baixa
5. **Configurar Redirect URLs no Supabase**
   - Adicionar `https://brioapp.online/**` em Auth → URL Configuration

6. **Melhorar sistema de aprovação**
   - Notificações quando novo cadastro chega
   - Email automático após aprovação

---

## 📊 Status Geral

| Componente | Status |
|------------|--------|
| Deploy Vercel | ✅ Funcionando |
| Dark/Light Mode | ✅ Funcionando |
| Sistema de Convites | ✅ Link gerado |
| Edge Functions | ✅ Deployadas |
| Funções RPC | ✅ Criadas |
| Envio de Emails | ⚠️ Não chega |
| Cadastro de Barbearia | ❌ Erro 400 |

---

## 🛠️ Comandos Úteis

### Deploy Edge Functions
```powershell
cd "C:\Users\gsant\Desktop\BS Barberapp"
npx supabase functions deploy send-appointment-email
npx supabase functions deploy send-invite-email
```

### Testar Email
```powershell
node test-resend-email.js
```

### Build Local
```powershell
npm run build
```

### Deploy Vercel (automático via Git)
```powershell
git add .
git commit -m "mensagem"
git push
```

---

## 📝 Notas Importantes

- Sempre executar comandos na pasta do projeto: `C:\Users\gsant\Desktop\BS Barberapp`
- Usar `npx` para comandos Supabase (não `supabase` global)
- Verificar logs das Edge Functions em: https://supabase.com/dashboard/project/cntdiuaxocutsqwqnrkd/functions
- Verificar emails enviados em: https://resend.com/emails

---

**Última atualização**: 28/02/2026
**Sessão**: Correção de bugs e configuração de infraestrutura
