# Como Trocar a Conta do GitHub no Windows

## Problema
O Git está usando credenciais da conta `zanattag917-hash` mas você precisa fazer push para o repositório `eletricfps12/barbearia`.

## Solução: Limpar Credenciais do Windows

### Método 1: Pelo Gerenciador de Credenciais do Windows

1. Pressione `Windows + R`
2. Digite: `control /name Microsoft.CredentialManager`
3. Clique em "Credenciais do Windows"
4. Procure por entradas relacionadas ao GitHub:
   - `git:https://github.com`
   - `github.com`
5. Clique em cada uma e selecione "Remover"

### Método 2: Via PowerShell (como Administrador)

```powershell
cmdkey /list | Select-String "github" | ForEach-Object { cmdkey /delete:($_ -replace ".*Target: ","") }
```

### Método 3: Via Git Credential Manager

```bash
git credential-manager erase
```

Quando pedir, digite:
```
protocol=https
host=github.com
```

Depois pressione Enter duas vezes.

## Depois de Limpar as Credenciais

1. Volte para o diretório do projeto:
```bash
cd "C:\Users\gsant\Desktop\BS Barberapp"
```

2. Tente fazer o push novamente:
```bash
git push -u origin main
```

3. O Git vai pedir suas credenciais:
   - **Username**: `eletricfps12`
   - **Password**: Seu Personal Access Token do GitHub (não a senha da conta)

## Como Criar um Personal Access Token

Se você não tem um token:

1. Acesse: https://github.com/settings/tokens
2. Clique em "Generate new token" → "Generate new token (classic)"
3. Dê um nome (ex: "Brio App Deploy")
4. Selecione os escopos:
   - ✅ `repo` (acesso completo aos repositórios)
5. Clique em "Generate token"
6. **COPIE O TOKEN** (você não vai conseguir ver novamente!)
7. Use esse token como senha quando o Git pedir

## Repositório Correto Configurado

✅ Remote já está configurado para: `https://github.com/eletricfps12/barbearia.git`

Você só precisa fazer o login com a conta correta!
