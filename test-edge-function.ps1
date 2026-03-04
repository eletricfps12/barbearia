# =====================================================
# SCRIPT DE TESTE - EDGE FUNCTION (PowerShell)
# =====================================================
# Testa a Edge Function send-appointment-email
# =====================================================

Write-Host "🧪 Testando Edge Function: send-appointment-email" -ForegroundColor Cyan
Write-Host ""

# Variáveis (SUBSTITUA COM SEUS DADOS)
$PROJECT_URL = "https://YOUR_PROJECT.supabase.co"
$ANON_KEY = "YOUR_ANON_KEY"
$TEST_EMAIL = "seu-email@example.com"

Write-Host "📋 Configuração:" -ForegroundColor Yellow
Write-Host "   URL: $PROJECT_URL"
Write-Host "   Email de teste: $TEST_EMAIL"
Write-Host ""

Write-Host "📤 Enviando requisição..." -ForegroundColor Yellow
Write-Host ""

$headers = @{
    "Authorization" = "Bearer $ANON_KEY"
    "Content-Type" = "application/json"
}

$body = @{
    record = @{
        client_name = "João Silva"
        client_email = $TEST_EMAIL
        barber_name = "Carlos Barbeiro"
        appointment_date = "2024-03-15"
        appointment_time = "14:30"
    }
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$PROJECT_URL/functions/v1/send-appointment-email" `
        -Method Post `
        -Headers $headers `
        -Body $body

    Write-Host ""
    Write-Host "✅ Resposta recebida:" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 10)
    Write-Host ""
    Write-Host "📧 Verifique seu email: $TEST_EMAIL" -ForegroundColor Green
    Write-Host "📊 Veja os logs: supabase functions logs send-appointment-email" -ForegroundColor Cyan
}
catch {
    Write-Host ""
    Write-Host "❌ Erro ao testar:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    Write-Host ""
    Write-Host "💡 Dicas:" -ForegroundColor Yellow
    Write-Host "   1. Verifique se a função foi deployed: supabase functions list"
    Write-Host "   2. Confirme se o RESEND_API_KEY está configurado: supabase secrets list"
    Write-Host "   3. Veja os logs: supabase functions logs send-appointment-email"
}
