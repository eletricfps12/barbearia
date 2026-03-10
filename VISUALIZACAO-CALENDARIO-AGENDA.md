# Visualização de Calendário - Página de Agendamentos

## Status: ✅ IMPLEMENTAÇÃO COMPLETA

---

## 📋 Visão Geral

Sistema de visualização dupla (Lista e Calendário) implementado na página de Agendamentos, permitindo alternar entre visualização tradicional em lista e visualização estilo Google Calendar.

---

## 🎯 Funcionalidades Implementadas

### 1. Toggle de Visualização

**Localização**: Header da página de Agendamentos

**Componente**: Botões "Lista" e "Calendário"

**Comportamento**:
- Salva preferência do usuário no `localStorage`
- Carrega preferência salva ao abrir a página
- Transição suave entre modos
- Design dark mantido em ambos os modos

**Código**:
```javascript
const [viewMode, setViewMode] = useState(() => {
  return localStorage.getItem('agendaViewMode') || 'list'
})

useEffect(() => {
  localStorage.setItem('agendaViewMode', viewMode)
}, [viewMode])
```

---

### 2. Visualização Lista (Modo Existente)

**Características**:
- Mantida exatamente como estava
- Cards de agendamento com todas as informações
- Indicadores de horários ociosos
- Métricas de ocupação
- Botões de ação (Concluir, Faltou, etc.)

**Quando usar**: Visualização detalhada com todas as informações e ações

---

### 3. Visualização Calendário (NOVA)

**Layout**:
- Grade de horários vertical (07:00 até 22:00)
- Coluna de horários na esquerda (96px de largura, fundo destacado)
- Cada slot = 1 hora (100px de altura mínima)
- Scroll vertical para navegar os horários
- Min-width: 700px para melhor legibilidade

**Cards de Agendamento**:
- Posicionados no horário exato
- Altura proporcional à duração do serviço
  - 30 min = 50% do slot de 1h
  - 60 min = 100% do slot de 1h
  - Altura mínima de 25% para legibilidade
- **Cores por barbeiro**: Usa a cor cadastrada do barbeiro
- Exceções: Faltou (vermelho escuro) e Cancelado (cinza)
- Border-left de 4px com a cor do barbeiro
- Shadow e hover effects para melhor UX

**Informações no Card**:
- Nome do cliente (negrito, 14px)
- Nome do serviço (12px)
- Nome do barbeiro com ícone 👤 (11px, no rodapé)
- Texto branco para contraste

**Bloqueios de Horário**:
- Exibidos como cards cinza escuro (`bg-gray-700/90`)
- Ícone 🔒 (18px)
- Texto: motivo do bloqueio ou "Bloqueado"
- Nome do barbeiro se específico
- Border de 2px
- Posicionados acima dos agendamentos (z-index maior)

**Legenda**:
- Rodapé do calendário com fundo destacado
- Mostra todos os barbeiros com suas cores
- Indica bloqueios e faltas
- Texto pequeno (12px) e compacto

**Interações**:
- Clicar no card: console.log (preparado para abrir modal)
- Hover em slot vazio: botão "+ Adicionar agendamento" aparece
- Clicar em slot vazio: console.log (preparado para criar agendamento)
- Hover nos cards: shadow aumenta

**Mobile**:
- Scroll horizontal habilitado (min-width: 700px)
- Texto legível mesmo em telas pequenas (14px, 12px, 11px)
- Cards com padding adequado (12px)
- Espaçamento entre elementos aumentado
- Botão de adicionar com texto completo

---

## 🗄️ Estrutura de Dados

### Bloqueios de Horário

**Busca Combinada**:
```javascript
// Bloqueios pontuais (data específica)
const { data: oneTimeBlocks } = await supabase
  .from('time_blocks')
  .select('*')
  .eq('barbershop_id', barbershopId)
  .gte('start_time', startOfDay.toISOString())
  .lte('start_time', endOfDay.toISOString())

// Bloqueios fixos (recorrentes)
const { data: fixedBlocks } = await supabase
  .from('fixed_time_blocks')
  .select('*')
  .eq('barbershop_id', barbershopId)
```

**Conversão de Bloqueios Fixos**:
- Bloqueios fixos são armazenados como TIME (sem data)
- Convertidos para timestamp do dia selecionado
- Combinados com bloqueios pontuais em um único array

---

## 🎨 Cálculos de Posicionamento

### Posição Vertical (top)
```javascript
const startMinutes = startTime.getMinutes()
const top = (startMinutes / 60) * 100 // 0-60 min = 0-100%
```

**Exemplos**:
- 09:00 → top: 0%
- 09:15 → top: 25%
- 09:30 → top: 50%
- 09:45 → top: 75%

### Altura (height)
```javascript
const durationMinutes = (endTime - startTime) / (1000 * 60)
const height = (durationMinutes / 60) * 100 // Proporção da hora
const finalHeight = Math.max(height, 25) // Mínimo 25%
```

**Exemplos**:
- 30 min → height: 50%
- 45 min → height: 75%
- 60 min → height: 100%
- 15 min → height: 25% (mínimo)

### Sobreposição de Agendamentos
```javascript
marginLeft: `${aptIndex * 4}px` // Desloca 4px para cada agendamento no mesmo horário
```

---

## 🎨 Cores e Estilos

### Cores por Barbeiro (NOVO)
```javascript
const getBarberColor = (barberColor, status) => {
  // Exceções para status específicos
  if (status === 'no_show') return { bg: 'bg-red-800/90', border: 'border-red-900' }
  if (status === 'cancelled') return { bg: 'bg-gray-500/90', border: 'border-gray-600' }
  
  // Usa a cor cadastrada do barbeiro
  const color = barberColor || '#3b82f6'
  return {
    style: {
      backgroundColor: `${color}E6`, // 90% opacity
      borderColor: color
    }
  }
}
```

**Exemplos de cores**:
- Barbeiro 1 (azul): `#3b82f6` → `#3b82f6E6`
- Barbeiro 2 (verde): `#10b981` → `#10b981E6`
- Barbeiro 3 (roxo): `#8b5cf6` → `#8b5cf6E6`
- Faltou: `bg-red-800/90` (sempre vermelho escuro)
- Cancelado: `bg-gray-500/90` (sempre cinza)

### Bloqueios
```css
bg-gray-700/90 border-2 border-gray-800
```

### Legenda
```css
bg-gray-50 dark:bg-[#0A0A0A]
border-t border-gray-200 dark:border-[#2A2A2A]
```

### Slots Vazios (Hover)
```css
opacity-0 hover:opacity-100
text-gray-400 hover:text-blue-500
hover:bg-blue-50 dark:hover:bg-blue-500/10
```

---

## 📱 Responsividade

### Desktop
- Grade completa visível
- Scroll vertical suave
- Hover effects funcionando
- Legenda com todas as cores dos barbeiros
- Min-width: 700px

### Tablet
- Scroll horizontal suave
- Todos os elementos visíveis
- Texto legível (14px, 12px, 11px)

### Mobile
- Scroll horizontal habilitado
- Min-width: 700px na grade
- Texto truncado para evitar overflow
- Padding adequado nos cards (12px)
- Espaçamento entre elementos (6px entre cards sobrepostos)
- Botão "+ Adicionar agendamento" com texto completo
- Legenda responsiva com wrap

---

## 🔄 Integração com Sistema Existente

### Dados Compartilhados
- Usa os mesmos `appointments` da visualização lista
- Usa os mesmos `barbers` para filtro
- Usa os mesmos `businessHours` para validação
- Adiciona `timeBlocks` para bloqueios

### Filtros
- Filtro por barbeiro funciona em ambos os modos
- Navegação de data funciona em ambos os modos
- Botão "Hoje" funciona em ambos os modos

### Realtime
- Subscription do Supabase atualiza ambas as visualizações
- Mudanças refletem instantaneamente

---

## 🚀 Próximos Passos (Opcionais)

### Melhorias Futuras
1. ⏳ Modal de detalhes ao clicar no card
2. ⏳ Modal de criação de agendamento ao clicar em slot vazio
3. ⏳ Drag & drop para mover agendamentos
4. ⏳ Visualização por múltiplos barbeiros (colunas)
5. ⏳ Zoom in/out nos horários
6. ⏳ Impressão da agenda do dia

---

## 📝 Notas Técnicas

### Performance
- Renderização otimizada com `map()` direto
- Cálculos de posição feitos uma vez por card
- Sem re-renders desnecessários

### Acessibilidade
- Botões com `type="button"`
- Labels descritivos
- Cores com contraste adequado
- Texto legível em todos os tamanhos

### Manutenibilidade
- Funções auxiliares bem documentadas
- Código modular e reutilizável
- Fácil adicionar novos status ou cores

---

## 📁 Arquivos Modificados

### Modificados
- `src/pages/AgendaPage.jsx` - Implementação completa da visualização de calendário

### Criados
- `VISUALIZACAO-CALENDARIO-AGENDA.md` - Esta documentação

---

## 🎯 Checklist de Implementação

- ✅ Toggle de visualização (Lista/Calendário)
- ✅ Salvar preferência no localStorage
- ✅ Grade de horários (07:00 - 22:00)
- ✅ Coluna de horários na esquerda com fundo destacado
- ✅ Cards posicionados no horário exato
- ✅ Altura proporcional à duração
- ✅ **Cores por barbeiro (usa cor cadastrada)**
- ✅ Exceções: Faltou (vermelho) e Cancelado (cinza)
- ✅ Bloqueios de horário exibidos
- ✅ Nome do cliente, serviço e barbeiro no card
- ✅ Hover em slot vazio mostra "+ Adicionar agendamento"
- ✅ Click preparado para modal (console.log)
- ✅ Mobile responsivo com scroll horizontal
- ✅ Layout melhorado: mais espaçamento e legibilidade
- ✅ Legenda com cores dos barbeiros
- ✅ Design dark mantido
- ✅ Integração com filtros existentes
- ✅ Realtime funcionando
- ✅ Shadow e hover effects nos cards

---

**Data de Conclusão**: 10/03/2026
**Última Atualização**: 10/03/2026 - Melhorias de layout e cores por barbeiro
**Status**: ✅ IMPLEMENTAÇÃO COMPLETA - PRONTO PARA USO
