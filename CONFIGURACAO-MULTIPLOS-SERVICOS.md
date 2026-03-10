# Configuração de Múltiplos Serviços por Agendamento

## Resumo
Implementada configuração para permitir que cada barbearia escolha se quer permitir múltiplos serviços por agendamento ou manter o fluxo tradicional de um serviço por vez.

## Arquivos Modificados

### 1. Banco de Dados
**Arquivo**: `add-multiple-services-setting.sql`
- Adicionada coluna `allow_multiple_services` na tabela `barbershops`
- Tipo: BOOLEAN
- Padrão: `false` (desativado)
- Não afeta barbearias existentes (todas ficam com o padrão desativado)

### 2. Painel Admin - Brand Center
**Arquivo**: `src/pages/BrandCenterPage.jsx`

**Mudanças**:
- Adicionada nova seção "Preferências de Agendamento"
- Toggle switch para ativar/desativar múltiplos serviços
- Descrição clara do comportamento
- Salva automaticamente no banco de dados

**Localização**: Logo após a seção "Redes Sociais"

### 3. Página Pública de Agendamento
**Arquivo**: `src/pages/BarbershopPublicPage.jsx`

**Mudanças**:
- Carrega configuração `allow_multiple_services` do banco
- Adapta comportamento de seleção de serviços:
  - **SE DESATIVADO**: Cliente seleciona apenas 1 serviço (comportamento atual)
  - **SE ATIVADO**: Cliente pode selecionar múltiplos serviços com checkbox
- Mostra/oculta elementos condicionalmente:
  - Checkbox de seleção (apenas se ativado)
  - Card de resumo em tempo real (apenas se ativado e múltiplos selecionados)
  - Duração total (apenas se múltiplos serviços)
- Título dinâmico: "Escolha o serviço" vs "Escolha os serviços"

## Comportamento

### Modo Desativado (Padrão)
- Cliente seleciona apenas 1 serviço por vez
- Ao clicar em outro serviço, substitui o anterior
- Sem checkbox visual
- Interface limpa e simples
- **Comportamento idêntico ao atual**

### Modo Ativado
- Cliente pode selecionar múltiplos serviços
- Checkbox visual em cada serviço
- Card de resumo mostrando:
  - Lista de serviços selecionados
  - Duração total somada
  - Valor total somado
- Horários calculados com base no tempo total
- Tudo salvo em um único agendamento

## Regras de Negócio

1. **Padrão Desativado**: Todas as barbearias (novas e antigas) começam com a configuração desativada
2. **Independência**: Cada barbearia tem sua própria configuração
3. **Aplicação Imediata**: Mudança na configuração aplica instantaneamente
4. **Sem Quebra**: Barbearias que não alterarem a configuração continuam funcionando exatamente como antes
5. **Banco de Dados**: 
   - Se desativado: salva apenas 1 serviço
   - Se ativado: salva múltiplos serviços concatenados com " + "

## Como Testar

### 1. Executar SQL
```bash
# No Supabase SQL Editor, executar:
add-multiple-services-setting.sql
```

### 2. Testar Modo Desativado (Padrão)
1. Acessar Brand Center
2. Verificar que o toggle está DESATIVADO
3. Acessar página pública de agendamento
4. Verificar que só é possível selecionar 1 serviço por vez
5. Sem checkbox, sem card de resumo

### 3. Testar Modo Ativado
1. Acessar Brand Center
2. Ativar o toggle "Permitir múltiplos serviços por agendamento"
3. Clicar em "Salvar Alterações"
4. Acessar página pública de agendamento
5. Verificar:
   - Checkbox aparece em cada serviço
   - Possível selecionar múltiplos serviços
   - Card de resumo aparece mostrando total
   - Horários consideram tempo total
   - Confirmação mostra todos os serviços

### 4. Testar Independência
1. Criar/usar 2 barbearias diferentes
2. Ativar múltiplos serviços em apenas 1 delas
3. Verificar que cada uma mantém sua configuração independente

## Impacto

### ✅ Sem Impacto
- Barbearias existentes continuam funcionando normalmente
- Nenhuma mudança visual para quem não ativar
- Sem necessidade de migração de dados
- Sem quebra de funcionalidades existentes

### ✨ Novo Recurso
- Barbearias podem optar por permitir múltiplos serviços
- Melhora experiência do cliente (menos agendamentos separados)
- Otimiza agenda do barbeiro (tudo em um slot)
- Aumenta ticket médio (cliente agenda mais serviços de uma vez)

## Próximos Passos

1. ✅ Executar SQL no banco de dados
2. ✅ Testar em desenvolvimento
3. ⏳ Fazer commit e push
4. ⏳ Deploy para produção
5. ⏳ Comunicar nova funcionalidade aos clientes

## Notas Técnicas

- A configuração é carregada junto com os dados da barbearia
- Não há cache, mudanças aplicam imediatamente
- Validação no frontend e backend
- Compatível com fluxo de agendamento existente
- Não requer alterações em outras tabelas do banco
