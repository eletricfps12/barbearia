# 🚀 Guia Completo: Integração Stripe + Trial Automático - Brio App

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Fase 1: Preparação do Banco de Dados](#fase-1-preparação-do-banco-de-dados)
3. [Fase 2: Configuração do Stripe](#fase-2-configuração-do-stripe)
4. [Fase 3: Trial Automático](#fase-3-trial-automático)
5. [Fase 4: Webhook do Stripe](#fase-4-webhook-do-stripe)
6. [Fase 5: Página de Checkout](#fase-5-página-de-checkout)
7. [Fase 6: Sistema de Notificações](#fase-6-sistema-de-notificações)
8. [Fase 7: Página de Billing](#fase-7-página-de-billing)
9. [Fase 8: Testes](#fase-8-testes)
10. [Checklist Final](#checklist-final)

---

## 🎯 Visão Geral

### Objetivo
Transformar o fluxo manual de aprovação em um sistema automático com:
- Trial gratuito de 15 dias (sem cartão)
- Pagamento automático via Stripe após trial
- Renovação mensal automática
- Notificações por email

### Fluxo Completo
```
Landing Page → Cadastro → Trial 15 dias → Notificações → Checkout Stripe → Assinatura Ativa → Renovação Automática
```

---

## 📊 Fase 1: Preparação do Banco de Dados

### 1.1 Adicionar Novas Colunas

Crie o arquivo `add-stripe-columns.sql`:

```sql
-- Adicionar colunas relacionadas ao Stripe
ALTER TABLE barbershops 
ADD COLUMN IF NOT EXISTS signup_source TEXT DEFAULT 'manual' 
  CHECK (signup_source IN ('manual', 'landing_page', 'stripe_checkout')),
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
ADD COLUMN IF NOT EXISTS payment_method_last4 TEXT,
ADD COLUMN IF NOT EXISTS payment_method_brand TEXT,
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_notification_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS trial_ending_notification_sent BOOLEAN DEFAULT FALSE;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_barbershops_stripe_customer 
  ON barbershops(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_barbershops_stripe_subscription 
  ON barbershops(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_barbershops_trial_ends 
  ON barbershops(trial_ends_at) 
  WHERE subscription_plan = 'trial';

-- Comentários para documentação
COMMENT ON COLUMN barbershops.signup_source IS 'Origem do cadastro: manual, landing_page, stripe_checkout';
COMMENT ON COLUMN barbershops.stripe_customer_id IS 'ID do cliente no Stripe';
COMMENT ON COLUMN barbershops.stripe_subscription_id IS 'ID da assinatura no Stripe';
```

**Executar:**
```bash
# Via Supabase Dashboard: SQL Editor → Cole o SQL → Run
# Ou via CLI:
npx supabase db execute -f add-stripe-columns.sql
```

---


## 💳 Fase 2: Configuração do Stripe

### 2.1 Criar Conta no Stripe

1. Acesse [stripe.com](https://stripe.com)
2. Crie uma conta (use email profissional)
3. Ative o modo de teste primeiro
4. Depois ative o modo produção (precisa de documentos)

### 2.2 Criar Produto e Preço

**No Dashboard do Stripe:**

1. Vá em **Products** → **Add Product**
2. Preencha:
   - Name: `Brio App - Plano Mensal`
   - Description: `Acesso completo ao sistema de gestão para barbearias`
   - Pricing: `R$ 97,00 / mês`
   - Billing period: `Monthly`
   - Currency: `BRL`
3. Clique em **Save product**
4. **COPIE O PRICE ID** (começa com `price_...`)

### 2.3 Obter Chaves da API

**No Dashboard do Stripe:**

1. Vá em **Developers** → **API Keys**
2. Copie:
   - **Publishable key** (começa com `pk_test_...` ou `pk_live_...`)
   - **Secret key** (começa com `sk_test_...` ou `sk_live_...`)

### 2.4 Configurar Variáveis de Ambiente

**No Supabase Dashboard:**

1. Vá em **Project Settings** → **Edge Functions** → **Secrets**
2. Adicione:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=(vamos pegar depois)
   STRIPE_PRICE_ID=price_...
   ```

**No seu `.env` local:**
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_STRIPE_PRICE_ID=price_...
```

### 2.5 Instalar Biblioteca do Stripe

```bash
npm install @stripe/stripe-js
```

---


## 🎁 Fase 3: Trial Automático

### 3.1 Modificar RegisterPage.jsx

**Localizar a seção onde cria a barbearia e modificar:**

```javascript
// ANTES (fluxo manual):
const { data: barbershopData, error: barbershopError } = await supabase
  .from('barbershops')
  .insert({
    name: formData.barbershopName,
    slug: slug,
    owner_id: authData.user.id,
    contact_phone: formData.phone || null,
    subscription_plan: null,
    subscription_status: 'pending',
    trial_ends_at: null,
    next_payment_at: null
  })

// DEPOIS (trial automático):
const trialEndsAt = new Date()
trialEndsAt.setDate(trialEndsAt.getDate() + 15) // +15 dias

const { data: barbershopData, error: barbershopError } = await supabase
  .from('barbershops')
  .insert({
    name: formData.barbershopName,
    slug: slug,
    owner_id: authData.user.id,
    contact_phone: formData.phone || null,
    subscription_plan: 'trial',
    subscription_status: 'active',
    trial_ends_at: trialEndsAt.toISOString(),
    next_payment_at: trialEndsAt.toISOString(),
    signup_source: 'landing_page'
  })
```

### 3.2 Modificar Tela de Sucesso

**Trocar a mensagem:**

```javascript
// ANTES:
<p className="text-lg mb-6" style={{ color: 'var(--text-secondary)' }}>
  Seu acesso está em análise pela nossa equipe.
</p>

// DEPOIS:
<p className="text-lg mb-6" style={{ color: 'var(--text-secondary)' }}>
  Sua conta foi criada! Você tem 15 dias de trial gratuito.
</p>

<div className="p-4 rounded-xl mb-6" style={{...}}>
  <p className="text-sm text-green-400">
    ✨ Seu trial de 15 dias começou agora! Explore todas as funcionalidades sem compromisso.
  </p>
</div>
```

### 3.3 Modificar Login.jsx

**Remover o redirecionamento para pending-approval:**

```javascript
// REMOVER ESTE BLOCO:
if (barberData.barbershops?.subscription_status === 'pending') {
  navigate('/pending-approval')
  return
}

// Agora todos vão direto para /admin
```

### 3.4 Criar Email de Boas-vindas com Trial

Criar `supabase/functions/send-trial-welcome-email/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = 're_gWbuUp1s_4ohCpUNiRGfwCYikaSwSkmRF'

serve(async (req) => {
  try {
    const { ownerEmail, ownerName, barbershopName, trialEndsAt, loginUrl } = await req.json()

    const trialEndDate = new Date(trialEndsAt).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Brio App <team@brioapp.online>',
        to: [ownerEmail],
        subject: `🎉 Bem-vindo ao Brio App, ${ownerName}!`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">
                          🎉 Bem-vindo ao Brio App!
                        </h1>
                      </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px;">
                        <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                          Olá <strong>${ownerName}</strong>,
                        </p>
                        
                        <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                          Sua conta <strong>${barbershopName}</strong> foi criada com sucesso! 🚀
                        </p>

                        <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin: 30px 0; border-radius: 8px;">
                          <p style="margin: 0 0 10px; color: #065f46; font-size: 18px; font-weight: bold;">
                            ✨ Seu Trial Gratuito Começou!
                          </p>
                          <p style="margin: 0; color: #047857; font-size: 14px; line-height: 1.6;">
                            Você tem <strong>15 dias</strong> para explorar todas as funcionalidades do Brio App sem compromisso.
                            Seu trial termina em <strong>${trialEndDate}</strong>.
                          </p>
                        </div>

                        <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                          Durante o trial, você pode:
                        </p>

                        <ul style="margin: 0 0 30px; padding-left: 20px; color: #374151; font-size: 16px; line-height: 1.8;">
                          <li>Gerenciar sua agenda de atendimentos</li>
                          <li>Cadastrar clientes e barbeiros</li>
                          <li>Controlar o financeiro</li>
                          <li>Personalizar a identidade visual</li>
                          <li>E muito mais!</li>
                        </ul>

                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center" style="padding: 20px 0;">
                              <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">
                                Acessar Minha Conta →
                              </a>
                            </td>
                          </tr>
                        </table>

                        <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                          Precisa de ajuda? Responda este email ou entre em contato conosco em 
                          <a href="mailto:suporte@brioapp.online" style="color: #10b981; text-decoration: none;">suporte@brioapp.online</a>
                        </p>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">
                          <strong>Brio App</strong> - Sistema de Gestão para Barbearias
                        </p>
                        <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                          © 2024 Brio App. Todos os direitos reservados.
                        </p>
                      </td>
                    </tr>

                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `
      })
    })

    const data = await res.json()
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
```

**Deploy:**
```bash
npx supabase functions deploy send-trial-welcome-email --no-verify-jwt
```

### 3.5 Chamar Email no RegisterPage

**Adicionar após criar a barbearia:**

```javascript
// Enviar email de boas-vindas com trial
try {
  const loginUrl = `${window.location.origin}/login`
  
  await supabase.functions.invoke('send-trial-welcome-email', {
    body: {
      ownerEmail: formData.ownerEmail,
      ownerName: formData.ownerName,
      barbershopName: formData.barbershopName,
      trialEndsAt: trialEndsAt.toISOString(),
      loginUrl: loginUrl
    }
  })
} catch (emailError) {
  console.error('Erro ao enviar email:', emailError)
  // Não bloqueia o cadastro se o email falhar
}
```

---


## 🔔 Fase 4: Webhook do Stripe

### 4.1 Criar Edge Function para Webhook

Criar `supabase/functions/stripe-webhook/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.21.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2024-11-20.acacia',
  httpClient: Stripe.createFetchHttpClient()
})

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

  if (!signature || !webhookSecret) {
    return new Response('Missing signature or webhook secret', { status: 400 })
  }

  try {
    const body = await req.text()
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)

    console.log(`🔔 Webhook received: ${event.type}`)

    switch (event.type) {
      // Quando o checkout é completado
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        // Buscar barbearia pelo email do cliente
        const customerEmail = session.customer_email || session.customer_details?.email
        
        if (!customerEmail) {
          console.error('No customer email found')
          break
        }

        // Buscar owner pelo email
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', customerEmail)
          .maybeSingle()

        if (!profile) {
          console.error('Profile not found for email:', customerEmail)
          break
        }

        // Buscar barbearia do owner
        const { data: barbershop } = await supabase
          .from('barbershops')
          .select('id')
          .eq('owner_id', profile.id)
          .maybeSingle()

        if (!barbershop) {
          console.error('Barbershop not found for owner:', profile.id)
          break
        }

        // Atualizar barbearia com dados do Stripe
        const nextBillingDate = new Date()
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)

        await supabase
          .from('barbershops')
          .update({
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            subscription_status: 'active',
            subscription_plan: 'mensal',
            next_payment_at: nextBillingDate.toISOString(),
            last_payment_date: new Date().toISOString()
          })
          .eq('id', barbershop.id)

        console.log('✅ Subscription activated for barbershop:', barbershop.id)
        break
      }

      // Quando a assinatura é criada
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription
        
        await supabase
          .from('barbershops')
          .update({
            stripe_subscription_id: subscription.id,
            subscription_status: 'active',
            subscription_plan: 'mensal'
          })
          .eq('stripe_customer_id', subscription.customer as string)

        console.log('✅ Subscription created:', subscription.id)
        break
      }

      // Quando a assinatura é atualizada
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        
        const status = subscription.status === 'active' ? 'active' : 
                      subscription.status === 'past_due' ? 'past_due' :
                      subscription.status === 'canceled' ? 'canceled' : 'active'

        await supabase
          .from('barbershops')
          .update({
            subscription_status: status
          })
          .eq('stripe_subscription_id', subscription.id)

        console.log('✅ Subscription updated:', subscription.id, 'Status:', status)
        break
      }

      // Quando a assinatura é cancelada
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        
        await supabase
          .from('barbershops')
          .update({
            subscription_status: 'canceled',
            subscription_plan: null
          })
          .eq('stripe_subscription_id', subscription.id)

        console.log('✅ Subscription canceled:', subscription.id)
        break
      }

      // Quando o pagamento é bem-sucedido
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        
        if (invoice.billing_reason === 'subscription_cycle') {
          const nextBillingDate = new Date(invoice.period_end * 1000)
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)

          await supabase
            .from('barbershops')
            .update({
              last_payment_date: new Date().toISOString(),
              next_payment_at: nextBillingDate.toISOString(),
              subscription_status: 'active'
            })
            .eq('stripe_customer_id', invoice.customer as string)

          console.log('✅ Payment succeeded for customer:', invoice.customer)
        }
        break
      }

      // Quando o pagamento falha
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        
        await supabase
          .from('barbershops')
          .update({
            subscription_status: 'past_due'
          })
          .eq('stripe_customer_id', invoice.customer as string)

        console.log('⚠️ Payment failed for customer:', invoice.customer)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400
    })
  }
})
```

**Deploy:**
```bash
npx supabase functions deploy stripe-webhook --no-verify-jwt
```

### 4.2 Configurar Webhook no Stripe

1. Vá no Dashboard do Stripe → **Developers** → **Webhooks**
2. Clique em **Add endpoint**
3. URL do endpoint: `https://[SEU-PROJECT-ID].supabase.co/functions/v1/stripe-webhook`
4. Selecione os eventos:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Clique em **Add endpoint**
6. **COPIE O WEBHOOK SECRET** (começa com `whsec_...`)
7. Adicione no Supabase: `STRIPE_WEBHOOK_SECRET=whsec_...`

---


## 💰 Fase 5: Página de Checkout

### 5.1 Criar Página de Checkout

Criar `src/pages/CheckoutPage.jsx`:

```javascript
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import { supabase } from '../lib/supabase'
import { showToast } from '../components/Toast'
import { Loader2, CreditCard, Check } from 'lucide-react'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

export default function CheckoutPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [barbershop, setBarbershop] = useState(null)
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    fetchBarbershopInfo()
  }, [])

  const fetchBarbershopInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/login')
        return
      }

      setUserEmail(user.email)

      // Buscar barbearia
      const { data: barberData } = await supabase
        .from('barbers')
        .select('barbershops(*)')
        .eq('profile_id', user.id)
        .maybeSingle()

      if (barberData?.barbershops) {
        setBarbershop(barberData.barbershops)
        
        // Se já tem assinatura ativa, redireciona
        if (barberData.barbershops.subscription_status === 'active' && 
            barberData.barbershops.subscription_plan === 'mensal') {
          navigate('/admin')
        }
      }
    } catch (error) {
      console.error('Erro ao buscar informações:', error)
    }
  }

  const handleCheckout = async () => {
    try {
      setLoading(true)

      // Criar Checkout Session via Edge Function
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          priceId: import.meta.env.VITE_STRIPE_PRICE_ID,
          customerEmail: userEmail,
          barbershopId: barbershop.id
        }
      })

      if (error) throw error

      // Redirecionar para o Stripe Checkout
      const stripe = await stripePromise
      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId: data.sessionId
      })

      if (stripeError) {
        throw stripeError
      }
    } catch (error) {
      console.error('Erro no checkout:', error)
      showToast.error('Erro ao processar pagamento', 'Erro')
    } finally {
      setLoading(false)
    }
  }

  const trialDaysLeft = barbershop?.trial_ends_at 
    ? Math.ceil((new Date(barbershop.trial_ends_at) - new Date()) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Continue com o Brio App
          </h1>
          <p className="text-gray-400">
            {trialDaysLeft > 0 
              ? `Seu trial acaba em ${trialDaysLeft} ${trialDaysLeft === 1 ? 'dia' : 'dias'}`
              : 'Seu trial acabou'}
          </p>
        </div>

        {/* Pricing Card */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-green-500/20 p-8 mb-6">
          <div className="text-center mb-6">
            <p className="text-gray-400 text-sm mb-2">Plano Mensal</p>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-5xl font-bold text-white">R$ 97</span>
              <span className="text-gray-400">/mês</span>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3 mb-8">
            {[
              'Agenda ilimitada',
              'Gestão de clientes',
              'Controle financeiro',
              'Equipe ilimitada',
              'Identidade visual personalizada',
              'Suporte prioritário'
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-green-400" />
                </div>
                <span className="text-gray-300 text-sm">{feature}</span>
              </div>
            ))}
          </div>

          {/* Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 active:scale-[0.98] shadow-lg hover:shadow-green-600/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                Assinar Agora
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 text-center mt-4">
            Pagamento seguro processado pelo Stripe
          </p>
        </div>

        {/* Info */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <p className="text-sm text-blue-400 text-center">
            💳 Cancele quando quiser, sem multas ou taxas adicionais
          </p>
        </div>
      </div>
    </div>
  )
}
```

### 5.2 Criar Edge Function para Checkout Session

Criar `supabase/functions/create-checkout-session/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2024-11-20.acacia',
  httpClient: Stripe.createFetchHttpClient()
})

serve(async (req) => {
  try {
    const { priceId, customerEmail, barbershopId } = await req.json()

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      customer_email: customerEmail,
      success_url: `${req.headers.get('origin')}/admin?payment=success`,
      cancel_url: `${req.headers.get('origin')}/checkout?payment=canceled`,
      metadata: {
        barbershopId: barbershopId
      }
    })

    return new Response(
      JSON.stringify({ sessionId: session.id }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
```

**Deploy:**
```bash
npx supabase functions deploy create-checkout-session --no-verify-jwt
```

### 5.3 Adicionar Rota no App.jsx

```javascript
import CheckoutPage from './pages/CheckoutPage'

// Dentro das rotas:
<Route path="/checkout" element={
  <ProtectedRoute session={session}>
    <CheckoutPage />
  </ProtectedRoute>
} />
```

### 5.4 Criar Lógica de Redirecionamento

**Modificar ProtectedRoute no App.jsx:**

```javascript
function ProtectedRoute({ session, children }) {
  const [loading, setLoading] = useState(true)
  const [isPending, setIsPending] = useState(false)
  const [isTrialExpired, setIsTrialExpired] = useState(false)

  useEffect(() => {
    checkSubscriptionStatus()
  }, [session])

  const checkSubscriptionStatus = async () => {
    if (!session) {
      setLoading(false)
      return
    }

    try {
      const { data: barberData } = await supabase
        .from('barbers')
        .select('barbershops(subscription_status, subscription_plan, trial_ends_at)')
        .eq('profile_id', session.user.id)
        .maybeSingle()

      if (barberData?.barbershops) {
        const barbershop = barberData.barbershops
        
        // Verificar se está pendente
        if (barbershop.subscription_status === 'pending') {
          setIsPending(true)
        }
        
        // Verificar se o trial expirou
        if (barbershop.subscription_plan === 'trial' && barbershop.trial_ends_at) {
          const trialEnd = new Date(barbershop.trial_ends_at)
          const now = new Date()
          
          if (now > trialEnd) {
            setIsTrialExpired(true)
          }
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-green-500" />
    </div>
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (isPending && window.location.pathname !== '/pending-approval') {
    return <Navigate to="/pending-approval" replace />
  }

  if (isTrialExpired && window.location.pathname !== '/checkout') {
    return <Navigate to="/checkout" replace />
  }

  return children
}
```

---


## 📧 Fase 6: Sistema de Notificações

### 6.1 Criar Edge Function de Notificações

Criar `supabase/functions/send-trial-notifications/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const RESEND_API_KEY = 're_gWbuUp1s_4ohCpUNiRGfwCYikaSwSkmRF'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  try {
    const now = new Date()
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)

    // Buscar trials que acabam em 2 dias e ainda não receberam notificação
    const { data: expiringTrials } = await supabase
      .from('barbershops')
      .select(`
        id,
        name,
        trial_ends_at,
        trial_ending_notification_sent,
        profiles:owner_id (
          full_name,
          email
        )
      `)
      .eq('subscription_plan', 'trial')
      .eq('subscription_status', 'active')
      .eq('trial_ending_notification_sent', false)
      .gte('trial_ends_at', now.toISOString())
      .lte('trial_ends_at', twoDaysFromNow.toISOString())

    console.log(`Found ${expiringTrials?.length || 0} trials expiring soon`)

    for (const barbershop of expiringTrials || []) {
      try {
        const trialEndDate = new Date(barbershop.trial_ends_at).toLocaleDateString('pt-BR')
        const ownerEmail = barbershop.profiles?.email
        const ownerName = barbershop.profiles?.full_name

        if (!ownerEmail) continue

        // Enviar email
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`
          },
          body: JSON.stringify({
            from: 'Brio App <team@brioapp.online>',
            to: [ownerEmail],
            subject: `⏰ Seu trial acaba em 2 dias - ${barbershop.name}`,
            html: `
              <!DOCTYPE html>
              <html>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6; padding: 40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" style="margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden;">
                  <tr>
                    <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px;">
                        ⏰ Seu Trial Está Acabando
                      </h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <p style="margin: 0 0 20px; color: #374151; font-size: 16px;">
                        Olá <strong>${ownerName}</strong>,
                      </p>
                      <p style="margin: 0 0 20px; color: #374151; font-size: 16px;">
                        Seu trial de 15 dias do <strong>${barbershop.name}</strong> acaba em <strong>2 dias</strong> (${trialEndDate}).
                      </p>
                      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 30px 0; border-radius: 8px;">
                        <p style="margin: 0; color: #92400e; font-size: 14px;">
                          Para continuar usando o Brio App sem interrupções, adicione um método de pagamento antes do fim do trial.
                        </p>
                      </div>
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding: 20px 0;">
                            <a href="${Deno.env.get('APP_URL')}/checkout" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: bold;">
                              Adicionar Pagamento →
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </body>
              </html>
            `
          })
        })

        // Marcar como notificado
        await supabase
          .from('barbershops')
          .update({ trial_ending_notification_sent: true })
          .eq('id', barbershop.id)

        console.log(`✅ Notification sent to ${ownerEmail}`)
      } catch (error) {
        console.error(`Error sending notification for barbershop ${barbershop.id}:`, error)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        notificationsSent: expiringTrials?.length || 0 
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error in send-trial-notifications:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
```

**Deploy:**
```bash
npx supabase functions deploy send-trial-notifications --no-verify-jwt
```

### 6.2 Configurar Cron Job

**No Supabase Dashboard:**

1. Vá em **Database** → **Extensions**
2. Ative a extensão `pg_cron`
3. Vá em **SQL Editor** e execute:

```sql
-- Criar função que chama a Edge Function
CREATE OR REPLACE FUNCTION trigger_trial_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM
    net.http_post(
      url := 'https://[SEU-PROJECT-ID].supabase.co/functions/v1/send-trial-notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      )
    );
END;
$$;

-- Agendar para rodar todo dia às 10h (horário UTC)
SELECT cron.schedule(
  'send-trial-notifications-daily',
  '0 10 * * *', -- Todo dia às 10h UTC (7h Brasília)
  $$SELECT trigger_trial_notifications()$$
);
```

**Ou usar GitHub Actions (alternativa):**

Criar `.github/workflows/trial-notifications.yml`:

```yaml
name: Send Trial Notifications

on:
  schedule:
    - cron: '0 10 * * *' # Todo dia às 10h UTC
  workflow_dispatch: # Permite executar manualmente

jobs:
  send-notifications:
    runs-on: ubuntu-latest
    steps:
      - name: Call Edge Function
        run: |
          curl -X POST \
            https://[SEU-PROJECT-ID].supabase.co/functions/v1/send-trial-notifications \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}"
```

---


## 💼 Fase 7: Página de Billing

### 7.1 Criar Página de Billing

Criar `src/pages/BillingPage.jsx`:

```javascript
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { showToast } from '../components/Toast'
import { 
  CreditCard, 
  Calendar, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  ExternalLink
} from 'lucide-react'

export default function BillingPage() {
  const [loading, setLoading] = useState(true)
  const [barbershop, setBarbershop] = useState(null)

  useEffect(() => {
    fetchBillingInfo()
  }, [])

  const fetchBillingInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: barberData } = await supabase
        .from('barbers')
        .select('barbershops(*)')
        .eq('profile_id', user.id)
        .maybeSingle()

      if (barberData?.barbershops) {
        setBarbershop(barberData.barbershops)
      }
    } catch (error) {
      console.error('Erro ao buscar informações:', error)
      showToast.error('Erro ao carregar informações de cobrança', 'Erro')
    } finally {
      setLoading(false)
    }
  }

  const handleManageSubscription = async () => {
    try {
      // Criar portal session via Edge Function
      const { data, error } = await supabase.functions.invoke('create-portal-session', {
        body: {
          customerId: barbershop.stripe_customer_id
        }
      })

      if (error) throw error

      // Redirecionar para o portal do Stripe
      window.location.href = data.url
    } catch (error) {
      console.error('Erro ao abrir portal:', error)
      showToast.error('Erro ao abrir portal de pagamento', 'Erro')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    )
  }

  const getStatusBadge = (status) => {
    const badges = {
      active: { color: 'green', text: 'Ativo', icon: CheckCircle },
      trial: { color: 'blue', text: 'Trial', icon: Calendar },
      past_due: { color: 'yellow', text: 'Pagamento Pendente', icon: AlertCircle },
      canceled: { color: 'red', text: 'Cancelado', icon: AlertCircle }
    }

    const badge = badges[status] || badges.active
    const Icon = badge.icon

    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold bg-${badge.color}-500/10 text-${badge.color}-400 border border-${badge.color}-500/20`}>
        <Icon className="w-4 h-4" />
        {badge.text}
      </span>
    )
  }

  const trialDaysLeft = barbershop?.trial_ends_at 
    ? Math.ceil((new Date(barbershop.trial_ends_at) - new Date()) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Cobrança e Assinatura</h1>
          <p className="text-gray-400">Gerencie sua assinatura e métodos de pagamento</p>
        </div>

        {/* Status Card */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Status da Assinatura</h2>
              {getStatusBadge(barbershop?.subscription_plan === 'trial' ? 'trial' : barbershop?.subscription_status)}
            </div>
            <CreditCard className="w-12 h-12 text-gray-600" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Plano */}
            <div>
              <p className="text-sm text-gray-400 mb-1">Plano Atual</p>
              <p className="text-lg font-semibold text-white">
                {barbershop?.subscription_plan === 'trial' ? 'Trial Gratuito' : 
                 barbershop?.subscription_plan === 'mensal' ? 'Mensal - R$ 97/mês' : 
                 'Nenhum'}
              </p>
            </div>

            {/* Próximo Pagamento */}
            {barbershop?.next_payment_at && (
              <div>
                <p className="text-sm text-gray-400 mb-1">
                  {barbershop.subscription_plan === 'trial' ? 'Trial Acaba em' : 'Próximo Pagamento'}
                </p>
                <p className="text-lg font-semibold text-white">
                  {new Date(barbershop.next_payment_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
                {barbershop.subscription_plan === 'trial' && trialDaysLeft > 0 && (
                  <p className="text-sm text-yellow-400 mt-1">
                    {trialDaysLeft} {trialDaysLeft === 1 ? 'dia restante' : 'dias restantes'}
                  </p>
                )}
              </div>
            )}

            {/* Último Pagamento */}
            {barbershop?.last_payment_date && (
              <div>
                <p className="text-sm text-gray-400 mb-1">Último Pagamento</p>
                <p className="text-lg font-semibold text-white">
                  {new Date(barbershop.last_payment_date).toLocaleDateString('pt-BR')}
                </p>
              </div>
            )}

            {/* Método de Pagamento */}
            {barbershop?.payment_method_last4 && (
              <div>
                <p className="text-sm text-gray-400 mb-1">Método de Pagamento</p>
                <p className="text-lg font-semibold text-white">
                  {barbershop.payment_method_brand?.toUpperCase()} •••• {barbershop.payment_method_last4}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          {/* Trial - Adicionar Pagamento */}
          {barbershop?.subscription_plan === 'trial' && (
            <button
              onClick={() => window.location.href = '/checkout'}
              className="w-full flex items-center justify-between p-6 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 rounded-xl transition-all"
            >
              <div className="text-left">
                <p className="text-white font-semibold text-lg mb-1">
                  Adicionar Método de Pagamento
                </p>
                <p className="text-green-100 text-sm">
                  Continue usando após o trial acabar
                </p>
              </div>
              <ExternalLink className="w-6 h-6 text-white" />
            </button>
          )}

          {/* Assinatura Ativa - Gerenciar */}
          {barbershop?.subscription_plan === 'mensal' && barbershop?.stripe_customer_id && (
            <button
              onClick={handleManageSubscription}
              className="w-full flex items-center justify-between p-6 bg-gray-800/50 hover:bg-gray-800 border border-white/10 rounded-xl transition-all"
            >
              <div className="text-left">
                <p className="text-white font-semibold text-lg mb-1">
                  Gerenciar Assinatura
                </p>
                <p className="text-gray-400 text-sm">
                  Atualizar cartão, ver faturas ou cancelar
                </p>
              </div>
              <ExternalLink className="w-6 h-6 text-gray-400" />
            </button>
          )}
        </div>

        {/* Info */}
        <div className="mt-8 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <p className="text-sm text-blue-400">
            💡 Todas as transações são processadas de forma segura pelo Stripe. 
            Seus dados de pagamento nunca são armazenados em nossos servidores.
          </p>
        </div>
      </div>
    </div>
  )
}
```

### 7.2 Criar Edge Function para Portal do Stripe

Criar `supabase/functions/create-portal-session/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2024-11-20.acacia',
  httpClient: Stripe.createFetchHttpClient()
})

serve(async (req) => {
  try {
    const { customerId } = await req.json()

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${req.headers.get('origin')}/admin/billing`
    })

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
```

**Deploy:**
```bash
npx supabase functions deploy create-portal-session --no-verify-jwt
```

### 7.3 Adicionar Rota no App.jsx

```javascript
import BillingPage from './pages/BillingPage'

// Dentro das rotas protegidas:
<Route path="/admin/billing" element={
  <ProtectedRoute session={session}>
    <BillingPage />
  </ProtectedRoute>
} />
```

### 7.4 Adicionar Link na Sidebar

**Em `src/components/Sidebar.jsx`:**

```javascript
import { CreditCard } from 'lucide-react'

// Adicionar no array navigationItems:
{ path: '/admin/billing', icon: CreditCard, label: 'Cobrança' }
```

---


## 🧪 Fase 8: Testes

### 8.1 Testar Trial Automático

1. Acesse `/register`
2. Preencha o formulário
3. Verifique se:
   - ✅ Conta foi criada com `subscription_plan: 'trial'`
   - ✅ `subscription_status: 'active'`
   - ✅ `trial_ends_at` está 15 dias no futuro
   - ✅ Email de boas-vindas foi recebido
   - ✅ Consegue fazer login e acessar `/admin`

### 8.2 Testar Checkout

**Cartões de Teste do Stripe:**

```
Sucesso:
4242 4242 4242 4242
Qualquer CVC, data futura

Falha:
4000 0000 0000 0002

3D Secure:
4000 0025 0000 3155
```

**Fluxo de Teste:**

1. Crie uma conta com trial
2. Espere ou force o trial expirar (mude `trial_ends_at` no banco)
3. Tente acessar `/admin` → deve redirecionar para `/checkout`
4. Complete o checkout com cartão de teste
5. Verifique se:
   - ✅ Webhook foi recebido
   - ✅ `subscription_status` mudou para 'active'
   - ✅ `subscription_plan` mudou para 'mensal'
   - ✅ `stripe_customer_id` foi salvo
   - ✅ `stripe_subscription_id` foi salvo
   - ✅ Consegue acessar `/admin` novamente

### 8.3 Testar Notificações

**Forçar envio de notificação:**

```sql
-- Mudar trial_ends_at para daqui 2 dias
UPDATE barbershops 
SET trial_ends_at = NOW() + INTERVAL '2 days',
    trial_ending_notification_sent = false
WHERE id = '[ID-DA-BARBEARIA]';
```

**Chamar função manualmente:**

```bash
curl -X POST \
  https://[SEU-PROJECT-ID].supabase.co/functions/v1/send-trial-notifications \
  -H "Authorization: Bearer [SERVICE-ROLE-KEY]"
```

**Verificar:**
- ✅ Email foi recebido
- ✅ `trial_ending_notification_sent` mudou para `true`

### 8.4 Testar Portal de Billing

1. Acesse `/admin/billing`
2. Clique em "Gerenciar Assinatura"
3. Verifique se:
   - ✅ Abre o portal do Stripe
   - ✅ Mostra informações corretas
   - ✅ Consegue atualizar cartão
   - ✅ Consegue ver faturas
   - ✅ Consegue cancelar assinatura

### 8.5 Testar Webhook

**No Dashboard do Stripe:**

1. Vá em **Developers** → **Webhooks**
2. Clique no seu webhook
3. Clique em **Send test webhook**
4. Selecione eventos para testar:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`

**Verificar logs:**
```bash
npx supabase functions logs stripe-webhook
```

### 8.6 Testar Cancelamento

1. No portal do Stripe, cancele a assinatura
2. Verifique se:
   - ✅ Webhook `customer.subscription.deleted` foi recebido
   - ✅ `subscription_status` mudou para 'canceled'
   - ✅ Usuário não consegue mais acessar o sistema

### 8.7 Testar Renovação

1. Espere 1 mês (ou force no Stripe Dashboard)
2. Verifique se:
   - ✅ Webhook `invoice.payment_succeeded` foi recebido
   - ✅ `last_payment_date` foi atualizado
   - ✅ `next_payment_at` foi atualizado (+30 dias)

---


## ✅ Checklist Final

### Banco de Dados
- [ ] Executar `add-stripe-columns.sql`
- [ ] Verificar se todas as colunas foram criadas
- [ ] Verificar índices criados

### Stripe
- [ ] Conta criada e verificada
- [ ] Produto criado (R$ 97/mês)
- [ ] Price ID copiado
- [ ] API Keys copiadas (Publishable e Secret)
- [ ] Webhook configurado
- [ ] Webhook Secret copiado
- [ ] Eventos do webhook selecionados

### Variáveis de Ambiente
- [ ] `STRIPE_SECRET_KEY` no Supabase
- [ ] `STRIPE_WEBHOOK_SECRET` no Supabase
- [ ] `STRIPE_PRICE_ID` no Supabase
- [ ] `VITE_STRIPE_PUBLISHABLE_KEY` no `.env`
- [ ] `VITE_STRIPE_PRICE_ID` no `.env`
- [ ] `APP_URL` no Supabase (para emails)

### Edge Functions
- [ ] `send-trial-welcome-email` criada e deployed
- [ ] `stripe-webhook` criada e deployed
- [ ] `create-checkout-session` criada e deployed
- [ ] `create-portal-session` criada e deployed
- [ ] `send-trial-notifications` criada e deployed

### Código Frontend
- [ ] `@stripe/stripe-js` instalado
- [ ] `RegisterPage.jsx` modificado (trial automático)
- [ ] `Login.jsx` modificado (remover pending redirect)
- [ ] `CheckoutPage.jsx` criado
- [ ] `BillingPage.jsx` criado
- [ ] Rotas adicionadas no `App.jsx`
- [ ] `ProtectedRoute` modificado (verificar trial expirado)
- [ ] Link de Billing na Sidebar

### Notificações
- [ ] Cron job configurado (pg_cron ou GitHub Actions)
- [ ] Testado envio de notificações
- [ ] Email de trial ending funcionando

### Testes
- [ ] Trial automático funcionando
- [ ] Checkout funcionando
- [ ] Webhook recebendo eventos
- [ ] Portal de billing funcionando
- [ ] Notificações sendo enviadas
- [ ] Cancelamento funcionando
- [ ] Renovação funcionando

### Produção
- [ ] Stripe em modo produção
- [ ] Webhook em produção configurado
- [ ] Variáveis de ambiente de produção configuradas
- [ ] Testes em produção realizados
- [ ] Monitoramento configurado

---

## 🚨 Problemas Comuns e Soluções

### Webhook não está recebendo eventos

**Problema:** Webhook retorna erro 401 ou 403

**Solução:**
```bash
# Verificar se a função foi deployed com --no-verify-jwt
npx supabase functions deploy stripe-webhook --no-verify-jwt

# Verificar se o webhook secret está correto
# No Supabase: Project Settings → Edge Functions → Secrets
```

### Trial não está sendo criado automaticamente

**Problema:** Barbearia ainda fica como 'pending'

**Solução:**
- Verificar se o código do RegisterPage foi modificado corretamente
- Verificar se `trial_ends_at` está sendo calculado
- Verificar se `subscription_plan` está sendo setado como 'trial'

### Email não está sendo enviado

**Problema:** Email não chega

**Solução:**
- Verificar se a API Key do Resend está correta
- Verificar se o domínio está verificado no Resend
- Verificar logs da Edge Function: `npx supabase functions logs send-trial-welcome-email`

### Checkout redireciona mas não atualiza o banco

**Problema:** Pagamento foi feito mas status não muda

**Solução:**
- Verificar se o webhook está recebendo o evento `checkout.session.completed`
- Verificar logs do webhook: `npx supabase functions logs stripe-webhook`
- Verificar se o email do cliente corresponde ao email do owner

### Notificações não estão sendo enviadas

**Problema:** Cron job não executa

**Solução:**
- Verificar se pg_cron está ativado
- Verificar se a função foi agendada corretamente:
```sql
SELECT * FROM cron.job;
```
- Testar manualmente a função

---

## 📚 Recursos Adicionais

### Documentação
- [Stripe Docs](https://stripe.com/docs)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Resend Docs](https://resend.com/docs)

### Monitoramento
- Dashboard do Stripe: Ver pagamentos, assinaturas, clientes
- Supabase Logs: Ver logs das Edge Functions
- Resend Dashboard: Ver emails enviados

### Suporte
- Stripe Support: support@stripe.com
- Supabase Discord: discord.supabase.com
- Resend Support: support@resend.com

---

## 🎯 Próximos Passos

Após implementar tudo:

1. **Testar exaustivamente** em modo de teste
2. **Ativar modo produção** no Stripe
3. **Configurar webhook de produção**
4. **Atualizar variáveis de ambiente** para produção
5. **Fazer testes finais** com cartão real
6. **Monitorar** primeiros pagamentos
7. **Ajustar** conforme necessário

---

## 💡 Dicas Finais

1. **Sempre teste em modo de teste primeiro**
2. **Use os cartões de teste do Stripe**
3. **Monitore os logs das Edge Functions**
4. **Verifique os webhooks no Dashboard do Stripe**
5. **Mantenha backup do banco de dados**
6. **Documente qualquer mudança**
7. **Teste o fluxo completo antes de lançar**

---

## 🎉 Conclusão

Seguindo este guia, você terá um sistema completo de:
- ✅ Trial automático de 15 dias
- ✅ Pagamento via Stripe
- ✅ Renovação automática
- ✅ Notificações por email
- ✅ Portal de gerenciamento
- ✅ Webhooks funcionando

**Boa sorte com o lançamento do Brio App! 🚀**

---

**Criado por:** Black Sheep  
**Data:** 2024  
**Versão:** 1.0
