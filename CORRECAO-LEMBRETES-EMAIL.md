# Correção: Lembretes de Email Não Estão Chegando

## 🔍 Diagnóstico do Problema

Os emails automáticos de lembrete (20min, 1h, 12h antes do agendamento) não estão sendo enviados aos clientes.

### Possíveis Causas:

1. **Cron Job não configurado** - A função `process-reminders` precisa ser executada automaticamente
2. **Função não deployada** - A Edge Function pode não estar deployada no Supabase
3. **Variáveis de ambiente faltando** - `RESEND_API_KEY` pode não estar configurada
4. **Extensão pg_cron não ativada** - Necessária para agendar execuções automáticas
5. **Configurações de notificação desativadas** - Lembretes podem estar desativados no banco

---

## ✅ Solução Passo a Passo

### 1. Verificar se a Função Está Deployada

**No terminal do projeto:**

```bash
# Fazer login no Supabase CLI (se ainda não fez)
npx supabase login

# Listar funções deployadas
npx supabase functions list

# Se a função process-reminders NÃO aparecer, fazer deploy:
npx supabase functions deploy process-reminders
```

---

### 2. Configurar Variável de Ambiente RESEND_API_KEY

**No Supabase Dashboard:**

1. Acesse: https://supabase.com/dashboard
2. Selecione o projeto: `cntdiuaxocutsqwqnrkd`
3. Vá em **Settings** → **Edge Functions**
4. Adicione a variável:
   - Nome: `RESEND_API_KEY`
   - Valor: Sua chave da API do Resend (obtenha em https://resend.com/api-keys)

---

### 3. Ativar Extensão pg_cron

**IMPORTANTE:** A extensão pg_cron já deve estar ativada no seu projeto Supabase por padrão. Se você receber erro ao tentar ativá-la, pule este passo.

**No Supabase Dashboard (OPCIONAL):**

1. Vá em **Database** → **Extensions**
2. Procure por `pg_cron`
3. Se não estiver ativada, clique em **Enable**
4. Se já estiver ativada, prossiga para o próximo passo

---

### 4. Configurar Cron Job para Executar a Função

**OPÇÃO 1: Usar o script SQL simplificado (RECOMENDADO)**

No Supabase Dashboard → SQL Editor, execute o arquivo `setup-reminders-cron-simple.sql`:

```sql
-- Cole o conteúdo do arquivo setup-reminders-cron-simple.sql aqui
```

**OPÇÃO 2: Executar manualmente**

No Supabase Dashboard → SQL Editor:

Execute o seguinte SQL:

```sql
-- Remover job anterior se existir
SELECT cron.unschedule('process-reminders-every-30min');

-- Criar novo job para executar a cada 30 minutos
SELECT cron.schedule(
  'process-reminders-every-30min',
  '*/30 * * * *', -- A cada 30 minutos
  $$
  SELECT
    net.http_post(
      url:='https://cntdiuaxocutsqwqnrkd.supabase.co/functions/v1/process-reminders',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);

-- Verificar se o job foi criado
SELECT * FROM cron.job WHERE jobname = 'process-reminders-every-30min';
```

**IMPORTANTE:** Substitua `cntdiuaxocutsqwqnrkd` pela URL do seu projeto Supabase se for diferente.

---

### 5. Verificar Configurações de Notificação no Banco

**No Supabase Dashboard → SQL Editor:**

```sql
-- Verificar se existem configurações de notificação
SELECT 
  barbershop_id,
  reminder_12h_active,
  reminder_1h_active,
  reminder_20min_active
FROM notification_settings;

-- Se não houver registros, criar configurações padrão para todas as barbearias
INSERT INTO notification_settings (
  barbershop_id,
  reminder_12h_active,
  reminder_12h_subject,
  reminder_12h_body,
  reminder_1h_active,
  reminder_1h_subject,
  reminder_1h_body,
  reminder_20min_active,
  reminder_20min_subject,
  reminder_20min_body
)
SELECT 
  id as barbershop_id,
  true as reminder_12h_active,
  'Lembrete: Seu agendamento é amanhã!' as reminder_12h_subject,
  'Olá [Nome Cliente]! 

Lembramos que você tem um agendamento marcado com [Barbeiro] para [Horário].

Nos vemos em breve!' as reminder_12h_body,
  true as reminder_1h_active,
  'Lembrete: Seu agendamento é daqui a 1 hora!' as reminder_1h_subject,
  'Olá [Nome Cliente]! 

Seu agendamento com [Barbeiro] é daqui a 1 hora: [Horário].

Já está a caminho?' as reminder_1h_body,
  true as reminder_20min_active,
  'Lembrete: Seu agendamento é daqui a 20 minutos!' as reminder_20min_subject,
  'Olá [Nome Cliente]! 

Seu agendamento com [Barbeiro] é daqui a 20 minutos: [Horário].

Te esperamos!' as reminder_20min_body
FROM barbershops
WHERE id NOT IN (SELECT barbershop_id FROM notification_settings);
```

---

### 6. Testar Manualmente a Função

**Criar um agendamento de teste:**

1. Crie um agendamento para daqui a 21 minutos
2. Use um email real que você tenha acesso
3. Aguarde 1-2 minutos (o cron roda a cada 30 min, mas você pode testar manualmente)

**Testar manualmente via SQL:**

```sql
-- Chamar a função manualmente
SELECT
  net.http_post(
    url:='https://cntdiuaxocutsqwqnrkd.supabase.co/functions/v1/process-reminders',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer SEU_SERVICE_ROLE_KEY"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
```

**Ou via curl no terminal:**

```bash
curl -X POST \
  'https://cntdiuaxocutsqwqnrkd.supabase.co/functions/v1/process-reminders' \
  -H 'Authorization: Bearer SEU_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json'
```

---

### 7. Verificar Logs da Função

**No Supabase Dashboard:**

1. Vá em **Edge Functions**
2. Clique em `process-reminders`
3. Vá na aba **Logs**
4. Verifique se há erros ou se a função está sendo executada

---

## 🧪 Checklist de Verificação

- [ ] Função `process-reminders` está deployada
- [ ] Variável `RESEND_API_KEY` está configurada
- [ ] Extensão `pg_cron` está ativada
- [ ] Cron job está criado e ativo
- [ ] Configurações de notificação existem no banco
- [ ] Lembretes estão ativados (reminder_*_active = true)
- [ ] Teste manual funcionou
- [ ] Logs não mostram erros

---

## 📊 Monitoramento

### Ver Jobs Agendados:

```sql
SELECT * FROM cron.job;
```

### Ver Histórico de Execuções:

```sql
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'process-reminders-every-30min')
ORDER BY start_time DESC 
LIMIT 10;
```

### Ver Próximas Execuções:

```sql
SELECT 
  jobname,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active
FROM cron.job
WHERE jobname = 'process-reminders-every-30min';
```

---

## 🔧 Troubleshooting

### Problema: "Function not found"
**Solução:** Fazer deploy da função novamente

### Problema: "RESEND_API_KEY not configured"
**Solução:** Adicionar a variável de ambiente nas configurações da Edge Function

### Problema: "pg_cron extension not found"
**Solução:** Ativar a extensão pg_cron no Supabase Dashboard

### Problema: Emails não chegam mesmo com função executando
**Solução:** 
1. Verificar se o email do cliente está correto
2. Verificar spam/lixo eletrônico
3. Verificar se a conta Resend está ativa e com créditos
4. Verificar logs da função para ver se há erros

---

## 📞 Suporte

Se após seguir todos os passos o problema persistir:

1. Verifique os logs da função no Supabase Dashboard
2. Verifique o histórico de execuções do cron job
3. Teste manualmente a função e veja a resposta
4. Verifique se há agendamentos na janela de tempo correta

---

## 🔗 Links Úteis

- Supabase Dashboard: https://supabase.com/dashboard
- Projeto: https://cntdiuaxocutsqwqnrkd.supabase.co
- Resend Dashboard: https://resend.com/dashboard
- Documentação pg_cron: https://github.com/citusdata/pg_cron

