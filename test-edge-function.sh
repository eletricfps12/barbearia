#!/bin/bash

# =====================================================
# SCRIPT DE TESTE - EDGE FUNCTION
# =====================================================
# Testa a Edge Function send-appointment-email
# =====================================================

echo "🧪 Testando Edge Function: send-appointment-email"
echo ""

# Variáveis (SUBSTITUA COM SEUS DADOS)
PROJECT_URL="https://YOUR_PROJECT.supabase.co"
ANON_KEY="YOUR_ANON_KEY"
TEST_EMAIL="seu-email@example.com"

echo "📋 Configuração:"
echo "   URL: $PROJECT_URL"
echo "   Email de teste: $TEST_EMAIL"
echo ""

echo "📤 Enviando requisição..."
echo ""

curl -i --location --request POST \
  "$PROJECT_URL/functions/v1/send-appointment-email" \
  --header "Authorization: Bearer $ANON_KEY" \
  --header "Content-Type: application/json" \
  --data "{
    \"record\": {
      \"client_name\": \"João Silva\",
      \"client_email\": \"$TEST_EMAIL\",
      \"barber_name\": \"Carlos Barbeiro\",
      \"appointment_date\": \"2024-03-15\",
      \"appointment_time\": \"14:30\"
    }
  }"

echo ""
echo ""
echo "✅ Teste concluído!"
echo ""
echo "📧 Verifique seu email: $TEST_EMAIL"
echo "📊 Veja os logs: supabase functions logs send-appointment-email"
