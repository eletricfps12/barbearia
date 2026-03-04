# Send Invite Email - Edge Function

Esta Edge Function envia emails de convite profissional para novos barbeiros via Resend API.

## Deploy

Para fazer o deploy desta função, execute:

```bash
supabase functions deploy send-invite-email
```

## Configuração

Certifique-se de que a variável de ambiente `RESEND_API_KEY` está configurada no Supabase:

```bash
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxx
```

## Configuração do Resend

1. Acesse [resend.com](https://resend.com)
2. Crie uma API Key
3. Configure o domínio `brioapp.online` no Resend
4. Verifique o domínio seguindo as instruções do Resend (adicionar registros DNS)

## Uso

A função é chamada automaticamente pelo `InviteBarberModal` quando um convite é criado.

### Parâmetros

```typescript
{
  to: string,        // Email do destinatário
  subject: string,   // Assunto do email
  html: string       // HTML do email
}
```

### Resposta de Sucesso

```json
{
  "success": true,
  "message": "Email de convite enviado com sucesso!",
  "email_id": "abc123",
  "sent_to": "email@exemplo.com"
}
```

### Resposta de Erro

```json
{
  "error": "Descrição do erro",
  "details": { ... }
}
```

## Remetente

O email é enviado de: `Brio App <convite@brioapp.online>`

Para usar este email, você precisa:
1. Ter o domínio `brioapp.online` verificado no Resend
2. Adicionar os registros DNS necessários (SPF, DKIM, DMARC)

## Template do Email

O template HTML é gerado pela função `generateInviteEmail` em `src/utils/emailTemplates.js`.

Design:
- Fundo preto (#000000)
- Textos brancos
- Botão verde neon (#22c55e)
- Identidade visual Brio App / Black Sheep Admin
