# Correção de Timezone nos Lembretes de Agendamento

## Problema Identificado

Você recebeu um email de lembrete às 3:30 da madrugada para um agendamento às 3:40, mas esse horário não deveria ser possível de agendar.

### Causa Raiz

O problema era de **timezone**:

1. **Banco de dados**: Os horários são salvos em UTC (horário universal)
2. **Edge Function**: Estava calculando as janelas de tempo em UTC
3. **Resultado**: Quando o agendamento era às 15:40 (Brasília), no banco ficava salvo como 18:40 (UTC)
4. **Lembrete**: A função enviava o email 20 minutos antes do horário UTC (18:20 UTC = 15:20 Brasília) ✅
5. **Mas no email**: Mostrava o horário errado porque não estava convertendo para Brasília

## Exemplo do Problema

- **Agendamento criado**: 15:40 (Brasília)
- **Salvo no banco**: 18:40 (UTC)
- **Email enviado**: 15:20 (Brasília) - correto! ✅
- **Horário mostrado no email**: 18:40 (UTC) - ERRADO! ❌

Isso fazia parecer que o agendamento era às 18:40, mas na verdade era às 15:40.

## Solução Implementada

Atualizei a edge function `process-reminders` para:

1. **Adicionar logs de timezone**: Agora mostra o horário em UTC e Brasília nos logs
2. **Formatar datas no timezone de Brasília**: Usa `timeZone: 'America/Sao_Paulo'` ao formatar as datas
3. **Exibir horário correto no email**: O email agora mostra o horário de Brasília, não UTC

### Código Corrigido

```typescript
// Formatar data e hora no timezone de Brasília
const appointmentDate = startTime.toLocaleDateString('pt-BR', { 
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
})

const appointmentTime = startTime.toLocaleTimeString('pt-BR', { 
  timeZone: 'America/Sao_Paulo',
  hour: '2-digit', 
  minute: '2-digit' 
})
```

## Resultado

Agora os emails de lembrete mostram:
- ✅ Horário correto de Brasília (ex: 15:40)
- ✅ Data correta de Brasília
- ✅ Enviados no momento certo (20min, 1h, 12h antes)

## Deploy

A correção foi feita em: `supabase/functions/process-reminders/index.ts`

Deploy realizado com sucesso:
```bash
npx supabase functions deploy process-reminders
```

## Verificação

Para verificar se está funcionando:

1. Crie um agendamento para daqui a 25 minutos
2. Aguarde 5 minutos
3. Verifique se o email chega com o horário correto de Brasília

## Observação Importante

Os horários no banco de dados continuam em UTC (isso é correto e é o padrão). A conversão para Brasília acontece apenas:
- Na interface do usuário (frontend)
- Nos emails enviados
- Nos logs da edge function

Isso garante que o sistema funcione corretamente independente do timezone do servidor ou do usuário.
