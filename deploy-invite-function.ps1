# =====================================================
# DEPLOY INVITE EMAIL FUNCTION
# =====================================================
# Script para fazer deploy da Edge Function de convites
# =====================================================

Write-Host "🚀 Fazendo deploy da função send-invite-email..." -ForegroundColor Green

# Deploy da função
supabase functions deploy send-invite-email

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deploy concluído com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Próximos passos:" -ForegroundColor Yellow
    Write-Host "1. Configure a RESEND_API_KEY no Supabase (se ainda não fez):" -ForegroundColor White
    Write-Host "   supabase secrets set RESEND_API_KEY=re_xxxxxxxxxx" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "2. Verifique o domínio brioapp.online no Resend" -ForegroundColor White
    Write-Host "3. Teste o envio de convite no Super Admin" -ForegroundColor White
} else {
    Write-Host "❌ Erro ao fazer deploy" -ForegroundColor Red
    Write-Host "Verifique se você está logado no Supabase CLI" -ForegroundColor Yellow
}
