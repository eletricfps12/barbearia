# Configuração de Recuperação de Senha - Supabase

## Problema
O link de recuperação de senha no e-mail está redirecionando para a landing page ao invés da página `/reset-password`.

## Solução

### 1. Acessar o Painel do Supabase
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto: `cntdiuaxocutsqwqnrkd`

### 2. Configurar URL de Redirecionamento
1. No menu lateral, clique em **Authentication** (ícone de cadeado)
2. Clique na aba **URL Configuration**
3. Localize o campo **Site URL**
4. Certifique-se que está configurado como: `https://brioapp.online`

### 3. Adicionar Redirect URLs
1. Na mesma página, localize **Redirect URLs**
2. Adicione as seguintes URLs (uma por linha):
   ```
   https://brioapp.online/reset-password
   http://localhost:5173/reset-password
   ```
3. Clique em **Save** (Salvar)

### 4. Configurar Email Templates (Opcional mas Recomendado)
1. No menu **Authentication**, clique em **Email Templates**
2. Selecione **Reset Password**
3. Verifique se o template contém: `{{ .ConfirmationURL }}`
4. O template padrão já deve funcionar, mas você pode personalizar se quiser

### 5. Testar
1. Acesse: https://brioapp.online/login
2. Clique em "Esqueci minha senha"
3. Digite seu e-mail
4. Verifique o e-mail recebido
5. Clique no link - deve redirecionar para `/reset-password`

## Verificação Adicional

Se ainda não funcionar, verifique:

1. **Configuração de SMTP** (se estiver usando SMTP customizado):
   - Authentication > Settings > SMTP Settings
   - Certifique-se que está configurado corretamente

2. **Logs de Email**:
   - Authentication > Logs
   - Verifique se há erros no envio de e-mails

## Código Implementado

### Páginas Criadas:
- ✅ `/src/pages/ForgotPassword.jsx` - Solicitar recuperação
- ✅ `/src/pages/ResetPassword.jsx` - Redefinir senha
- ✅ Rotas adicionadas no `App.jsx`
- ✅ Link atualizado no `Login.jsx`

### Fluxo:
1. Usuário clica em "Esqueci minha senha" no login
2. Digita o e-mail cadastrado
3. Recebe e-mail com link de recuperação
4. Clica no link → Redireciona para `/reset-password`
5. Define nova senha
6. Redireciona para login

## Suporte

Se o problema persistir após configurar as URLs no Supabase:
1. Limpe o cache do navegador
2. Teste em modo anônimo/privado
3. Verifique os logs do Supabase (Authentication > Logs)
