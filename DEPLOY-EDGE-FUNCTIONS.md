# 🚀 Deploy das Edge Functions - Brio App

## ✅ Configurações Atualizadas

As Edge Functions já estão configuradas para usar o domínio **brioapp.online**:

- **Email de Agendamento**: `agendamento@brioapp.online`
- **Email de Convite**: `convite@brioapp.online`

---

## 📋 Pré-requisitos

1. **Supabase CLI instalado**
   ```bash
   npm install -g supabase
   ```

2. **Login no Supabase**
   ```bash
   supabase login
   ```

3. **Link com o projeto**
   ```bash
   supabase link --project-ref [SEU_PROJECT_REF]
   ```
   
   Para encontrar o `project-ref`:
   - Acesse: https://supabase.com/dashboard/project/[SEU_PROJECT]/settings/general
   - Copie o "Reference ID"

---

## 🔑 Configurar RESEND_API_KEY

Antes de fazer deploy, configure a chave da API do Resend:

1. Acesse: https://supabase.com/dashboard/project/[SEU_PROJECT]/settings/functions
2. Clique em "Add new secret"
3. Nome: `RESEND_API_KEY`
4. Valor: Sua chave da API do Resend (começa com `re_`)
5. Salve

---

## 📤 Deploy das Funções

### 1. Deploy da função de agendamento
```bash
supabase functions deploy send-appointment-email
```

### 2. Deploy da função de convite
```bash
supabase functions deploy send-invite-email
```

### 3. Deploy de todas as funções de uma vez
```bash
supabase functions deploy
```

---

## ✅ Verificar Deploy

Após o deploy, você verá algo assim:

```
Deploying function send-appointment-email...
Function URL: https://[PROJECT_REF].supabase.co/functions/v1/send-appointment-email
✅ Deployed successfully
```

---

## 🧪 Testar as Funções

### Testar função de agendamento (PowerShell)
```powershell
$headers = @{
    "Authorization" = "Bearer [SUA_ANON_KEY]"
    "Content-Type" = "application/json"
}

$body = @{
    record = @{
        client_name = "João Silva"
        client_email = "seu-email@teste.com"
        barbershop_id = "[ID_DA_BARBEARIA]"
        start_time = "2024-03-20T14:00:00"
        barber_id = "[ID_DO_BARBEIRO]"
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://[PROJECT_REF].supabase.co/functions/v1/send-appointment-email" -Method POST -Headers $headers -Body $body
```

### Testar função de convite (PowerShell)
```powershell
$headers = @{
    "Authorization" = "Bearer [SUA_ANON_KEY]"
    "Content-Type" = "application/json"
}

$body = @{
    to = "seu-email@teste.com"
    subject = "Convite para Brio App"
    html = "<h1>Teste de Convite</h1><p>Este é um email de teste.</p>"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://[PROJECT_REF].supabase.co/functions/v1/send-invite-email" -Method POST -Headers $headers -Body $body
```

---

## 🔧 Configurar Webhook no Supabase

Para enviar emails automaticamente quando um agendamento é criado:

1. Acesse: https://supabase.com/dashboard/project/[SEU_PROJECT]/database/hooks
2. Clique em "Create a new hook"
3. Configure:
   - **Name**: `send-appointment-email-webhook`
   - **Table**: `appointments`
   - **Events**: `INSERT`
   - **Type**: `HTTP Request`
   - **Method**: `POST`
   - **URL**: `https://[PROJECT_REF].supabase.co/functions/v1/send-appointment-email`
   - **Headers**:
     ```json
     {
       "Content-Type": "application/json",
       "Authorization": "Bearer [SERVICE_ROLE_KEY]"
     }
     ```
4. Salve

---

## 📧 Configurar Domínio no Resend

Para usar `@brioapp.online`, você precisa:

1. Acesse: https://resend.com/domains
2. Clique em "Add Domain"
3. Digite: `brioapp.online`
4. Copie os registros DNS (SPF, DKIM, DMARC)
5. Adicione esses registros no seu provedor de domínio (Vercel, Cloudflare, etc.)
6. Aguarde verificação (pode levar até 48h)

### Registros DNS necessários:
- **SPF**: TXT record para verificação
- **DKIM**: TXT record para autenticação
- **DMARC**: TXT record para política de email

Enquanto o domínio não é verificado, use o domínio padrão do Resend:
- `onboarding@resend.dev` (funciona imediatamente)

---

## ⚠️ Troubleshooting

### Erro: "RESEND_API_KEY não configurada"
- Verifique se adicionou a secret no Supabase
- Faça redeploy da função após adicionar a secret

### Erro: "Domain not verified"
- Use `onboarding@resend.dev` temporariamente
- Configure os registros DNS no seu provedor de domínio
- Aguarde verificação no painel do Resend

### Erro: "Function not found"
- Verifique se fez o deploy: `supabase functions deploy`
- Verifique se está usando a URL correta

---

## 📝 Próximos Passos

1. ✅ Execute o SQL `setup-analytics-functions.sql` no Supabase
2. ✅ Configure a `RESEND_API_KEY` nas secrets
3. ✅ Faça deploy das Edge Functions
4. ✅ Configure o webhook para appointments
5. ✅ Configure o domínio no Resend (opcional, mas recomendado)
6. ✅ Teste enviando um convite no Super Admin
7. ✅ Teste criando um agendamento

---

## 🎉 Tudo Pronto!

Agora seu sistema está completo:
- ✅ Deploy no Vercel funcionando
- ✅ Funções RPC para analytics
- ✅ Edge Functions para emails
- ✅ Domínio brioapp.online configurado
