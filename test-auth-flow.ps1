# Script de Teste - Fluxo de Autenticação Brio App
# Execute este script para diagnosticar problemas de login

Write-Host "🔍 DIAGNÓSTICO BRIO APP - FLUXO DE AUTENTICAÇÃO" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""

# 1. Verificar se o vercel.json existe
Write-Host "1. Verificando vercel.json..." -ForegroundColor Cyan
if (Test-Path "vercel.json") {
    Write-Host "   ✅ vercel.json encontrado" -ForegroundColor Green
    $vercelContent = Get-Content "vercel.json" -Raw | ConvertFrom-Json
    if ($vercelContent.rewrites) {
        Write-Host "   ✅ Rewrites configurados corretamente" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Rewrites NÃO encontrados!" -ForegroundColor Red
    }
} else {
    Write-Host "   ❌ vercel.json NÃO encontrado!" -ForegroundColor Red
}
Write-Host ""

# 2. Verificar se _redirects existe
Write-Host "2. Verificando public/_redirects..." -ForegroundColor Cyan
if (Test-Path "public/_redirects") {
    Write-Host "   ✅ _redirects encontrado" -ForegroundColor Green
} else {
    Write-Host "   ❌ _redirects NÃO encontrado!" -ForegroundColor Red
}
Write-Host ""

# 3. Verificar se .env existe
Write-Host "3. Verificando .env..." -ForegroundColor Cyan
if (Test-Path ".env") {
    Write-Host "   ✅ .env encontrado" -ForegroundColor Green
    $envContent = Get-Content ".env"
    $hasUrl = $envContent | Select-String "VITE_SUPABASE_URL"
    $hasKey = $envContent | Select-String "VITE_SUPABASE_ANON_KEY"
    
    if ($hasUrl) {
        Write-Host "   ✅ VITE_SUPABASE_URL configurado" -ForegroundColor Green
    } else {
        Write-Host "   ❌ VITE_SUPABASE_URL NÃO encontrado!" -ForegroundColor Red
    }
    
    if ($hasKey) {
        Write-Host "   ✅ VITE_SUPABASE_ANON_KEY configurado" -ForegroundColor Green
    } else {
        Write-Host "   ❌ VITE_SUPABASE_ANON_KEY NÃO encontrado!" -ForegroundColor Red
    }
} else {
    Write-Host "   ❌ .env NÃO encontrado!" -ForegroundColor Red
}
Write-Host ""

# 4. Verificar status do Git
Write-Host "4. Verificando status do Git..." -ForegroundColor Cyan
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "   ⚠️  Existem arquivos não commitados:" -ForegroundColor Yellow
    Write-Host $gitStatus -ForegroundColor Yellow
} else {
    Write-Host "   ✅ Todos os arquivos estão commitados" -ForegroundColor Green
}
Write-Host ""

# 5. Verificar último commit
Write-Host "5. Último commit:" -ForegroundColor Cyan
$lastCommit = git log --oneline -1
Write-Host "   $lastCommit" -ForegroundColor White
Write-Host ""

# 6. Verificar se vercel.json está no repositório
Write-Host "6. Verificando se vercel.json está no repositório..." -ForegroundColor Cyan
$filesInRepo = git ls-tree -r HEAD --name-only
if ($filesInRepo -contains "vercel.json") {
    Write-Host "   ✅ vercel.json está no repositório" -ForegroundColor Green
} else {
    Write-Host "   ❌ vercel.json NÃO está no repositório!" -ForegroundColor Red
    Write-Host "   Execute: git add vercel.json && git commit -m 'Add vercel.json' && git push" -ForegroundColor Yellow
}
Write-Host ""

# 7. Verificar arquivos principais
Write-Host "7. Verificando arquivos principais..." -ForegroundColor Cyan
$mainFiles = @(
    "src/App.jsx",
    "src/pages/SuperAdminLogin.jsx",
    "src/pages/SuperAdminPage.jsx",
    "src/components/SuperAdminRoute.jsx"
)

foreach ($file in $mainFiles) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file NÃO encontrado!" -ForegroundColor Red
    }
}
Write-Host ""

# 8. Resumo e próximos passos
Write-Host "================================================" -ForegroundColor Green
Write-Host "📋 RESUMO E PRÓXIMOS PASSOS" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Se todos os itens acima estão ✅, faça:" -ForegroundColor Cyan
Write-Host "1. Limpe o cache do navegador (Ctrl + Shift + Delete)" -ForegroundColor White
Write-Host "2. Feche TODAS as abas do site" -ForegroundColor White
Write-Host "3. Abra uma aba anônima (Ctrl + Shift + N)" -ForegroundColor White
Write-Host "4. Acesse: https://www.brioapp.online/owner/login" -ForegroundColor White
Write-Host ""
Write-Host "Se ainda não funcionar:" -ForegroundColor Cyan
Write-Host "1. Verifique se o deploy da Vercel completou (https://vercel.com/dashboard)" -ForegroundColor White
Write-Host "2. Verifique as variáveis de ambiente na Vercel" -ForegroundColor White
Write-Host "3. Abra o Console (F12) e tire um print dos erros" -ForegroundColor White
Write-Host ""
