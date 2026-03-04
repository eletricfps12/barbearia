# Script para executar SQL no Supabase via API REST
param(
    [string]$SqlFile
)

# Ler o conteúdo do arquivo SQL
$sqlContent = Get-Content $SqlFile -Raw

# Configurações do Supabase
$projectUrl = "https://cntdiuaxocutsqwqnrkd.supabase.co"
$serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNudGRpdWF4b2N1dHNxd3FucmtkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTY3NTU5NiwiZXhwIjoyMDUxMjUxNTk2fQ.Yz0Yz0Yz0Yz0Yz0Yz0Yz0Yz0Yz0Yz0Yz0Yz0Yz0"

# Headers
$headers = @{
    "apikey" = $serviceRoleKey
    "Authorization" = "Bearer $serviceRoleKey"
    "Content-Type" = "application/json"
}

# Body
$body = @{
    query = $sqlContent
} | ConvertTo-Json

# Executar SQL
try {
    $response = Invoke-RestMethod -Uri "$projectUrl/rest/v1/rpc/exec_sql" -Method Post -Headers $headers -Body $body
    Write-Host "✅ SQL executado com sucesso!" -ForegroundColor Green
    $response
} catch {
    Write-Host "❌ Erro ao executar SQL:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    Write-Host $_.ErrorDetails.Message
}
