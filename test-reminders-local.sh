#!/bin/bash

# =====================================================
# SCRIPT DE TESTE LOCAL - REMINDERS SYSTEM
# =====================================================
# Use este script para testar a Edge Function localmente
# antes de fazer o deploy
# =====================================================

echo "🧪 Testando Edge Function: process-reminders"
echo ""

# Configurações
PROJECT_REF="cntdiuaxocutsqwqnrkd"
FUNCTION_URL="https://${PROJECT_REF}.supabase.co/functions/v1/process-reminders"

# Ler Service Role Key (você precisa configurar)
read -sp "Cole sua Service Role Key: " SERVICE_KEY
echo ""
echo ""

echo "📤 Enviando requisição para: $FUNCTION_URL"
echo ""

# Fazer requisição
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  "$FUNCTION_URL" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{}')

# Separar body e status code
HTTP_BODY=$(echo "$RESPONSE" | head -n -1)
HTTP_STATUS=$(echo "$RESPONSE" | tail -n 1)

echo "📊 Status Code: $HTTP_STATUS"
echo ""
echo "📦 Response:"
echo "$HTTP_BODY" | jq '.' 2>/dev/null || echo "$HTTP_BODY"
echo ""

if [ "$HTTP_STATUS" = "200" ]; then
  echo "✅ Teste concluído com sucesso!"
else
  echo "❌ Teste falhou com status $HTTP_STATUS"
fi
