# Documentação de Rotas - Brio Barber App

**Domínio**: https://brioapp.online

## Rotas Públicas

### 1. Login
- **URL**: `/login`
- **Descrição**: Página de login para donos de barbearia e barbeiros
- **Acesso**: Público
- **Exemplo**: `https://brioapp.online/login`

### 2. Registro
- **URL**: `/register`
- **Descrição**: Cadastro de novas barbearias
- **Acesso**: Público
- **Exemplo**: `https://brioapp.online/register`

### 3. Página Pública da Barbearia
- **URL**: `/:slug`
- **Descrição**: Página pública da barbearia acessível por slug único
- **Acesso**: Público
- **Exemplo**: `https://brioapp.online/barbearia-exemplo`

### 4. Agendamento do Cliente
- **URL**: `/booking/:barberId`
- **Descrição**: Página de agendamento para clientes (por barbeiro)
- **Acesso**: Público
- **Exemplo**: `https://brioapp.online/booking/123e4567-e89b-12d3-a456-426614174000`

---

## Rotas de Super Admin

### 5. Login Super Admin
- **URL**: `/owner/login`
- **Descrição**: Login exclusivo para o dono do SaaS (Black Sheep Owner)
- **Acesso**: Público (mas requer credenciais de superadmin)
- **Exemplo**: `https://brioapp.online/owner/login`

### 6. Painel Super Admin
- **URL**: `/brio-super-admin`
- **Descrição**: Dashboard de controle do SaaS (gerenciar barbearias, aprovar cadastros)
- **Acesso**: Protegido (requer role = 'superadmin')
- **Exemplo**: `https://brioapp.online/brio-super-admin`

---

## Rotas Protegidas (Requer Autenticação)

### 7. Aprovação Pendente
- **URL**: `/pending-approval`
- **Descrição**: Página exibida quando barbearia está aguardando aprovação
- **Acesso**: Protegido (usuários autenticados com subscription_status = 'pending')
- **Exemplo**: `https://brioapp.online/pending-approval`

### 8. Dashboard Principal
- **URL**: `/admin`
- **Descrição**: Dashboard inteligente com métricas e visão geral
- **Acesso**: Protegido (donos de barbearia e barbeiros)
- **Exemplo**: `https://brioapp.online/admin`

### 9. Agenda
- **URL**: `/admin/agenda`
- **Descrição**: Calendário de agendamentos
- **Acesso**: Protegido
- **Exemplo**: `https://brioapp.online/admin/agenda`

### 10. Serviços
- **URL**: `/admin/servicos`
- **Descrição**: Gerenciamento de serviços oferecidos
- **Acesso**: Protegido
- **Exemplo**: `https://brioapp.online/admin/servicos`

### 11. Clientes (CRM)
- **URL**: `/admin/clientes`
- **Descrição**: Gestão de clientes e histórico
- **Acesso**: Protegido
- **Exemplo**: `https://brioapp.online/admin/clientes`

### 12. Identidade Visual
- **URL**: `/admin/identidade`
- **Descrição**: Brand Center - personalização de marca
- **Acesso**: Protegido
- **Exemplo**: `https://brioapp.online/admin/identidade`

### 13. Operacional
- **URL**: `/admin/operacional`
- **Descrição**: Configurações operacionais e horários
- **Acesso**: Protegido
- **Exemplo**: `https://brioapp.online/admin/operacional`

### 14. Equipe
- **URL**: `/admin/equipe`
- **Descrição**: Gerenciamento de barbeiros e convites
- **Acesso**: Protegido
- **Exemplo**: `https://brioapp.online/admin/equipe`

### 15. Financeiro
- **URL**: `/admin/financeiro`
- **Descrição**: Dashboard financeiro com receitas, despesas e comissões
- **Acesso**: Protegido
- **Exemplo**: `https://brioapp.online/admin/financeiro`

---

## Rotas Especiais

### 16. Raiz (/)
- **URL**: `/`
- **Descrição**: Redireciona automaticamente:
  - Se não autenticado → `/login`
  - Se superadmin → `/brio-super-admin`
  - Se barbeiro/dono → `/admin`
- **Acesso**: Público (com redirecionamento inteligente)
- **Exemplo**: `https://brioapp.online/`

### 17. 404 - Não Encontrado
- **URL**: `*` (qualquer rota não mapeada)
- **Descrição**: Página de erro 404
- **Acesso**: Público
- **Exemplo**: `https://brioapp.online/rota-inexistente`

---

## Hierarquia de Rotas

```
https://brioapp.online/
├── login (público)
├── register (público)
├── owner/login (público - super admin)
├── pending-approval (protegido)
├── booking/:barberId (público)
├── brio-super-admin (protegido - superadmin)
├── admin (protegido)
│   ├── / (dashboard)
│   ├── agenda
│   ├── servicos
│   ├── clientes
│   ├── identidade
│   ├── operacional
│   ├── equipe
│   └── financeiro
└── :slug (público - página da barbearia)
```

---

## Links Rápidos de Acesso

### Para Clientes
- 🏠 Página da Barbearia: `https://brioapp.online/{slug-da-barbearia}`
- 📅 Agendar Horário: `https://brioapp.online/booking/{id-do-barbeiro}`

### Para Barbearias
- 🔐 Login: `https://brioapp.online/login`
- ✍️ Cadastro: `https://brioapp.online/register`
- 📊 Dashboard: `https://brioapp.online/admin`

### Para Super Admin (Black Sheep Owner)
- 🔑 Login Exclusivo: `https://brioapp.online/owner/login`
- ⚙️ Painel de Controle: `https://brioapp.online/brio-super-admin`

---

## Notas Importantes

1. **Ordem de Prioridade**: As rotas fixas (como `/login`, `/register`) têm prioridade sobre a rota dinâmica `/:slug`

2. **Proteção de Rotas**: Rotas protegidas verificam:
   - Sessão ativa do usuário
   - Status de aprovação da barbearia
   - Role do usuário (para super admin)

3. **Redirecionamentos Automáticos**:
   - Usuário não autenticado tentando acessar rota protegida → `/login`
   - Barbearia com status 'pending' → `/pending-approval`
   - Usuário autenticado acessando `/` → dashboard apropriado

4. **SPA (Single Page Application)**: Todas as rotas são gerenciadas pelo React Router no client-side. O Vercel precisa redirecionar todas as requisições para `/index.html` para o roteamento funcionar corretamente.

5. **Domínio Personalizado**: O domínio `brioapp.online` está configurado no Vercel e todas as rotas acima funcionam com este domínio.
