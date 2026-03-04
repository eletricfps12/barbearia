# 🎯 Setup Completo - Sistema de Convites por Email

Sistema de convites profissionais com design Dark Mode e identidade visual Brio App.

## ✅ O que foi implementado

### 1. Template de Email Profissional
- Design Dark Mode (fundo preto #000000)
- Botão verde neon (#22c55e)
- Identidade visual Brio App / Black Sheep Admin
- Responsivo e compatível com todos os clientes de email

### 2. Edge Function Dedicada
- Nova função `send-invite-email` criada
- Usa Resend API para envio
- Remetente: `Brio App <convite@brioapp.online>`

### 3. Integração Automática
- Modal de convite atualizado
- Envio automático ao criar convite
- Feedback visual de sucesso/erro

## 🚀 Como Configurar

### Passo 1: Configurar Resend

1. Acesse [resend.com](https://resend.com) e faça login
2. Vá em **API Keys** e crie uma nova chave
3. Copie a API Key (começa com `re_`)

### Passo 2: Adicionar Domínio no Resend

1. No Resend, vá em **Domains**
2. Clique em **Add Domain**
3. Digite: `brioapp.online`
4. Siga as instruções para adicionar os registros DNS:
   - SPF
   - DKIM
   - DMARC

**Importante:** Você precisa ter acesso ao painel DNS do domínio brioapp.online para adicionar esses registros.

### Passo 3: Configurar API Key no Supabase

Execute no terminal:

```bash
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxx
```

Substitua `re_xxxxxxxxxxxxxxxxxx` pela sua API Key do Resend.

### Passo 4: Deploy da Edge Function

Execute o script PowerShell:

```powershell
.\deploy-invite-function.ps1
```

Ou manualmente:

```bash
supabase functions deploy send-invite-email
```

## 📧 Estrutura da Tabela `invites`

Certifique-se de que sua tabela `invites` tem estas colunas:

```sql
CREATE TABLE invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  barber_name TEXT NOT NULL,
  barbershop_name TEXT NOT NULL,
  barbershop_slug TEXT NOT NULL,
  phone TEXT,
  token TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'pending',
  invited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);
```

## 🧪 Como Testar

1. Acesse o Super Admin: `/superadmin`
2. Clique em **Nova Barbearia**
3. Preencha os dados:
   - Nome do Barbeiro
   - Email (use um email real que você tenha acesso)
   - Nome da Barbearia
   - WhatsApp (opcional)
4. Clique em **Gerar Link de Convite**
5. Verifique o email na caixa de entrada

## 📋 Conteúdo do Email

O email enviado contém:

- **Assunto:** `[CONVITE] Sua barbearia foi selecionada para o Brio App ⚡`
- **Remetente:** `Brio App <convite@brioapp.online>`
- **Design:** Dark Mode com verde neon
- **Conteúdo:**
  - Saudação personalizada com nome do barbeiro
  - Mensagem sobre seleção da barbearia
  - Botão "COMEÇAR AGORA" com link de convite
  - Assinatura: Equipe Brio App | Black Sheep Admin

## 🔧 Troubleshooting

### Email não está sendo enviado

1. Verifique se a RESEND_API_KEY está configurada:
   ```bash
   supabase secrets list
   ```

2. Verifique os logs da Edge Function:
   ```bash
   supabase functions logs send-invite-email
   ```

3. Verifique se o domínio está verificado no Resend

### Email vai para spam

1. Certifique-se de que os registros DNS estão corretos:
   - SPF
   - DKIM
   - DMARC

2. Use um domínio verificado (não `onboarding@resend.dev`)

### Erro "Domain not verified"

Você precisa verificar o domínio `brioapp.online` no Resend adicionando os registros DNS necessários.

## 📱 Alternativa: Usar domínio de teste

Se você não tem acesso ao DNS do brioapp.online, pode usar o domínio de teste do Resend temporariamente:

Edite `supabase/functions/send-invite-email/index.ts`:

```typescript
from: 'Brio App <onboarding@resend.dev>',
```

**Nota:** Emails do domínio `resend.dev` podem ir para spam.

## 🎨 Personalizar o Template

Para personalizar o design do email, edite:

`src/utils/emailTemplates.js` → função `generateInviteEmail`

Você pode alterar:
- Cores
- Textos
- Layout
- Adicionar logo

## 📊 Monitoramento

Para ver quantos emails foram enviados:

1. Acesse o dashboard do Resend
2. Vá em **Emails**
3. Veja estatísticas de envio, abertura, cliques, etc.

## 🔐 Segurança

- A API Key do Resend é armazenada como secret no Supabase
- Nunca exponha a API Key no código frontend
- O token de convite expira em 7 dias
- Cada token só pode ser usado uma vez

## 💡 Próximos Passos

Após configurar o sistema de convites, você pode:

1. Adicionar tracking de abertura de email
2. Adicionar lembretes automáticos se o convite não for aceito
3. Criar templates diferentes para diferentes tipos de convite
4. Adicionar estatísticas de conversão de convites

## 📞 Suporte

Se tiver problemas:

1. Verifique os logs da Edge Function
2. Teste com um email pessoal primeiro
3. Verifique se o Resend está funcionando (status.resend.com)
4. Revise a documentação do Resend: docs.resend.com
