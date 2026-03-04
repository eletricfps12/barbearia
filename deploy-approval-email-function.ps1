# =====================================================
# DEPLOY: Edge Function - Send Approval Email
# =====================================================
# Este script faz o deploy da função de envio de email de aprovação
# Correção aplicada: Link agora usa URL fixa (https://www.brioapp.online/login)
# ao invés de window.location.origin que pegava localhost
# =====================================================

Write-Host "🚀 Iniciando deploy da Edge Function: send-approval-email" -ForegroundColor Cyan
Write-Host ""

# Verificar se está na pasta correta
if (-not (Test-Path "supabase/functions/send-approval-email")) {
    Write-Host "❌ Erro: Pasta supabase/functions/send-approval-email não encontrada!" -ForegroundColor Red
    Write-Host "   Execute este script na raiz do projeto." -ForegroundColor Yellow
    exit 1
}

Write-Host "📦 Fazendo deploy da função..." -ForegroundColor Yellow
Write-Host ""

# Deploy da função (sem verificação JWT pois é chamada internamente)
npx supabase functions deploy send-approval-email --no-verify-jwt

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deploy concluído com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Resumo da correção aplicada:" -ForegroundColor Cyan
    Write-Host "   • Problema: Email chegava com link localhost" -ForegroundColor White
    Write-Host "   • Solução: SuperAdminPage agora passa URL fixa" -ForegroundColor White
    Write-Host "   • URL correta: https://www.brioapp.online/login" -ForegroundColor Green
    Write-Host ""
    Write-Host "🧪 Para testar:" -ForegroundColor Cyan
    Write-Host "   1. Acesse o Super Admin: https://www.brioapp.online/brio-super-admin" -ForegroundColor White
    Write-Host "   2. Aprove uma barbearia pendente" -ForegroundColor White
    Write-Host "   3. Verifique o email recebido" -ForegroundColor White
    Write-Host "   4. Confirme que o botão leva para: https://www.brioapp.online/login" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Erro no deploy!" -ForegroundColor Red
    Write-Host "   Verifique os logs acima para mais detalhes." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}
