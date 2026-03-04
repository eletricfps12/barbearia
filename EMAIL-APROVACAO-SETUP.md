# 📧 Email de Aprovação - Setup Completo

## 🎯 Objetivo

Quando você clicar em "Aprovar (15 Dias Trial)" no Super Admin, o sistema vai:
1. ✅ Aprovar a barbearia (status: pending → active)
2. ✅ Definir trial de 15 dias
3. ✅ **Enviar email personalizado para o dono**
4. ✅ Email contém link direto para fazer login

## 📁 Arquivos Criados

1. ✅ `supabase/functions/send-approval-email/index.ts` - Edge Function
2. ✅ `deploy-approval-email-function.ps1` - Script de deploy
3. ✅ `EMAIL-APROVACAO-SETUP.md` - Este arquivo

## 📝 Modificações

### SuperAdminPage.jsx
- Função `handleApproveBarbershop` agora:
  1. Busca dados do owner (nome e email)
  2. Aprova a barbearia
  3. Chama a Edge Function para enviar email
  4. Mostra toast de sucesso

## 🚀 Como Fazer o Deploy

### PASSO 1: Executar o Script de Deploy

Abra o PowerShell na pasta do projeto e execute:

```powershell
.\deploy-approval-email-function.ps1
```

**OU** execute manualmente:

```powershell
npx supabase functions deploy send-approval-email
```

### PASSO 2: Verificar no Supabase Dashboard

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Edge Functions** (menu lateral)
4. Verifique se `send-approval-email` aparece na lista
5. Status deve estar **Active** (verde)

### PASSO 3: Verificar Variáveis de Ambiente

A função usa a variável `RESEND_API_KEY` que já está configurada.

Para verificar:
1. No Supabase Dashboard
2. Vá em **Edge Functions**
3. Clique em **Manage secrets**
4. Verifique se `RESEND_API_KEY` está presente

**Valor atual:**
```
RESEND_API_KEY=re_gWbuUp1s_4ohCpUNiRGfwCYikaSwSkmRF
```

## 📧 Template do Email

O email enviado tem:

### Design
- ✅ Fundo escuro moderno (tema Brio)
- ✅ Gradiente verde no header
- ✅ Ícone de celebração 🎉
- ✅ Card com informações do trial
- ✅ Lista de funcionalidades disponíveis
- ✅ Botão CTA verde "Acessar Meu Painel"
- ✅ Link direto para login
- ✅ Seção de ajuda com email de suporte

### Conteúdo Personalizado
```
Assunto: 🎉 [Nome da Barbearia] foi aprovada no Brio App!

Parabéns, [Nome do Dono]!
Sua barbearia foi aprovada! 🚀

Estamos muito felizes em ter a [Nome da Barbearia] no Brio App!

Período de Trial Gratuito:
- 15 dias de acesso gratuito
- Trial válido até: [Data formatada]

O que você pode fazer agora:
✓ Gerenciar Agendamentos
✓ CRM de Clientes
✓ Identidade Visual
✓ Relatórios Financeiros

[Botão: 🚀 Acessar Meu Painel]
Link: https://brioapp.online/login
```

## 🧪 Como Testar

### Teste 1: Criar Cadastro de Teste

1. Acesse: http://localhost:5173/register
2. Preencha com dados reais (use seu email para testar):
   ```
   Nome: Teste Aprovação
   Email: seu-email@gmail.com
   Barbearia: Barbearia Teste Email
   Telefone: (11) 99999-9999
   Senha: 123456
   ```
3. Clique em "Criar Conta"
4. Deve ver tela de sucesso

### Teste 2: Aprovar no Super Admin

1. Acesse: http://localhost:5173/brio-super-admin
2. Veja a tabela "Cadastros Aguardando Aprovação"
3. Encontre "Barbearia Teste Email"
4. Clique em "Aprovar (15 Dias Trial)"
5. ✅ Deve ver toast verde de sucesso
6. ✅ Abra o Console (F12) e veja logs:
   ```
   📧 Enviando email de aprovação...
   ✅ Email enviado com sucesso!
   ```

### Teste 3: Verificar Email Recebido

1. Abra seu email (gmail, outlook, etc)
2. Procure por email de "Brio App <team@brioapp.online>"
3. Assunto: "🎉 Barbearia Teste Email foi aprovada no Brio App!"
4. ✅ Verifique se o email está bonito e formatado
5. ✅ Clique no botão "Acessar Meu Painel"
6. ✅ Deve abrir a página de login

### Teste 4: Fazer Login

1. Use o email e senha do cadastro
2. ✅ Deve entrar no painel
3. ✅ Deve ver todas as funcionalidades

## 🔍 Troubleshooting

### Email não foi enviado

**Verificar no Console (F12):**
```javascript
// Se aparecer:
❌ Erro ao enviar email: { error: "..." }

// Possíveis causas:
1. Edge Function não foi deployada
2. RESEND_API_KEY inválida
3. Email do destinatário inválido
```

**Solução:**
1. Verifique se a função foi deployada:
   ```powershell
   npx supabase functions list
   ```
2. Verifique se `send-approval-email` aparece na lista
3. Verifique logs da função:
   ```powershell
   npx supabase functions logs send-approval-email
   ```

### Email vai para spam

**Causa:** Domínio `brioapp.online` não está verificado no Resend

**Solução temporária:**
- Emails vão para spam até verificar o domínio
- Peça ao destinatário para marcar como "Não é spam"

**Solução permanente:**
1. Acesse: https://resend.com/domains
2. Clique em `brioapp.online`
3. Siga instruções para verificar DNS
4. Adicione registros SPF, DKIM e DMARC

### Erro: "RESEND_API_KEY não configurada"

**Causa:** Variável de ambiente não está definida

**Solução:**
```powershell
# Definir secret no Supabase
npx supabase secrets set RESEND_API_KEY=re_gWbuUp1s_4ohCpUNiRGfwCYikaSwSkmRF
```

### Email não chega (sem erro)

**Verificar:**
1. Abra Resend Dashboard: https://resend.com/emails
2. Procure pelo email enviado
3. Veja o status:
   - ✅ Delivered: Email foi entregue
   - ⏳ Queued: Email está na fila
   - ❌ Failed: Email falhou

## 📊 Logs e Monitoramento

### Ver logs da função em tempo real

```powershell
npx supabase functions logs send-approval-email --follow
```

### Ver últimos 50 logs

```powershell
npx supabase functions logs send-approval-email --limit 50
```

### Logs esperados (sucesso)

```
🎉 Iniciando envio de email de aprovação...
📧 Destinatário: teste@email.com
👤 Nome: Teste Silva
🏪 Barbearia: Barbearia Teste
📤 Enviando email via Resend...
✅ Email de aprovação enviado com sucesso!
📬 ID do email: abc123...
```

## 🎨 Personalizar o Email

Para modificar o template do email, edite:
```
supabase/functions/send-approval-email/index.ts
```

Procure por `const emailHtml = ` e modifique o HTML.

Após modificar, faça deploy novamente:
```powershell
.\deploy-approval-email-function.ps1
```

## 📋 Checklist Final

- [ ] Edge Function deployada com sucesso
- [ ] Variável RESEND_API_KEY configurada
- [ ] Teste de aprovação realizado
- [ ] Email recebido e formatado corretamente
- [ ] Link do email funciona
- [ ] Login após aprovação funciona

## 🎉 Resultado Final

Após completar o setup:

1. ✅ Super Admin aprova barbearia
2. ✅ Sistema envia email automaticamente
3. ✅ Dono recebe email bonito e profissional
4. ✅ Email tem link direto para login
5. ✅ Dono clica e acessa o painel
6. ✅ Experiência completa e profissional

## 📞 Suporte

Se algo não funcionar:
1. Verifique os logs da função
2. Verifique o Console do navegador (F12)
3. Verifique o Resend Dashboard
4. Me envie prints dos erros
