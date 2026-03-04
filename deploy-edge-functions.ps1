# =====================================================
# DEPLOY EDGE FUNCTIONS - BRIO APP
# =====================================================
# Script para fazer deploy das Edge Functions usando npx
# =====================================================

Write-Host "🚀 Iniciando deploy das Edge Functions..." -ForegroundColor Green
Write-Host ""

# Verificar se está logado no Supabase
Write-Host "📋 Verificando login no Supabase..." -ForegroundColor Yellow
npx supabase login

Write-Host ""
Write-Host "🔗 Linkando com o projeto..." -ForegroundColor Yellow
Write-Host "⚠️  Se pedir o Project Reference ID, pegue em:" -ForegroundColor Cyan
Write-Host "   https://supabase.com/dashboard → Seu Projeto → Settings → General" -ForegroundColor Cyan
Write-Host ""

# Link com o projeto (vai pedir o reference ID se não estiver linkado)
npx supabase link

Write-Host ""
Write-Host "📤 Fazendo deploy da função: send-appointment-email..." -ForegroundColor Yellow
npx supabase functions deploy send-appointment-email

Write-Host ""
Write-Host "📤 Fazendo deploy da função: send-invite-email..." -ForegroundColor Yellow
npx supabase functions deploy send-invite-email

Write-Host ""
Write-Host "✅ Deploy concluído!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Configure a RESEND_API_KEY no Supabase:" -ForegroundColor White
Write-Host "   https://supabase.com/dashboard → Settings → Edge Functions → Secrets" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Execute o SQL setup-analytics-functions.sql no SQL Editor:" -ForegroundColor White
Write-Host "   https://supabase.com/dashboard → SQL Editor" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Teste enviando um convite no Super Admin!" -ForegroundColor White
Write-Host ""
