# 🎨 Plano de Implementação do Design Kaniu

## Análise da Referência

### Cores Principais
```css
--primary-color: #5A5D7F       /* Roxo/Lavanda principal */
--background-light: #EEF2F9    /* Fundo claro */
--background-soft: #F5F6FB     /* Fundo suave */
--card-background: #FFFFFF     /* Cards brancos */
--text-dark: #372D1F           /* Texto escuro */
--text-light: #6B7280          /* Texto claro */
--border-color: #E5E7F2        /* Bordas */
--warning-color: #C62828       /* Vermelho de alerta */
```

### Fonte Especial
- **GoodDog**: Fonte display para títulos de animais
- **Inter**: Fonte principal do sistema

### Estrutura de Layout

#### 1. Sidebar (Esquerda - Recolhível)
- **Largura**: 240px (expandida) / 72px (recolhida)
- **Posição**: Fixa à esquerda
- **Conteúdo**:
  - Logo do Kaniu (topo)
  - Menu principal:
    - Painel (dashboard geral)
    - Animais (lista de animais)
    - Histórico (eventos)
    - Avaliações (avaliações de saúde)
    - Tratamentos (tratamentos médicos)
  - Botão de recolher/expandir
  - Rodapé com opções (logout, configurações)

#### 2. Área Principal
**Dividida em 2 partes**:

##### A. Header/Toolbar (Topo - Posição Estática)
- Altura: ~44px
- Contém tabs de navegação/filtros
- Não rola com o conteúdo
- Exemplo: tabs "Abrigado", "Adotado", "Internado", etc.

##### B. Conteúdo (Área Rolável)
- Ocupa o resto do espaço disponível
- Scroll independente
- Carregamento dinâmico sem reload

## Componentes a Criar

### 1. Layout Components
- [x] `Sidebar.tsx` - Sidebar recolhível
- [ ] `DashboardLayout.tsx` - Layout principal com sidebar
- [ ] `ContentHeader.tsx` - Header com tabs/filtros
- [ ] `ContentArea.tsx` - Área de conteúdo rolável

### 2. Page Components
- [ ] `/dashboard/painel` - Dashboard geral
- [ ] `/dashboard/animais` - Lista de animais
- [ ] `/dashboard/historico` - Histórico de eventos
- [ ] `/dashboard/avaliacoes` - Avaliações de saúde
- [ ] `/dashboard/tratamentos` - Tratamentos

### 3. Shared Components
- [ ] `AnimalCard.tsx` - Card de animal para listagem
- [ ] `StatCard.tsx` - Card de estatística para dashboard
- [ ] `DataTable.tsx` - Tabela de dados reutilizável
- [ ] `TabNavigation.tsx` - Navegação por tabs

## CSS Consolidado

### Principais Classes Reutilizáveis

```css
/* Cards */
.card - Card principal com sombra
.card header - Cabeçalho do card
.info-grid - Grid de informações
.info-field - Campo individual de info

/* Tabelas */
.table-card - Container de tabela
.tab-table - Tabela dentro de tabs
.tab-table-wrapper - Wrapper com scroll

/* Tabs */
.tab-nav - Container de tabs
.tab-btn - Botão de tab
.tab-content - Conteúdo da tab
.tab-content-area - Área de conteúdo

/* Botões */
.detail-button - Botão de detalhes
.icon-button - Botão com ícone
.quick-action - Botão circular de ação
.action-button - Botão de ação

/* Chips/Tags */
.chip - Chip/tag padrão
.chip.is-empty - Chip vazio
.chip.is-action - Chip clicável

/* Sidebar */
.sidebar - Sidebar principal
.sidebar-item - Item de menu
.sidebar-item.active - Item ativo
```

## Navegação SPA (Single Page Application)

### Estratégia
1. **Next.js App Router**: Usar rotas do Next.js
2. **Client Components**: Navegação dinâmica
3. **URL State**: Manter estado na URL
4. **Shallow Routing**: Trocar conteúdo sem reload

### Exemplo de Fluxo
```
/dashboard/animais?status=Abrigado
→ Usuário clica em tab "Adotado"
→ URL muda para /dashboard/animais?status=Adotado
→ Conteúdo atualiza via client-side fetch
→ Sem reload da página
```

## Prioridades de Implementação

### Fase 1: Fundação (ATUAL)
1. ✅ Consolidar CSS global
2. ⏳ Criar Sidebar component
3. ⏳ Criar DashboardLayout
4. ⏳ Implementar navegação básica

### Fase 2: Páginas Core
1. Página "Painel" (dashboard)
2. Página "Animais" (lista)
3. Implementar filtros por status

### Fase 3: Funcionalidades Avançadas
1. Página "Histórico"
2. Página "Avaliações"
3. Página "Tratamentos"
4. Pop-ups e modais

### Fase 4: Interatividade
1. Navegação SPA completa
2. Loading states
3. Transições suaves
4. Responsividade mobile

## Diferenças com a Versão Anterior (n8n)

| Aspecto | n8n (Anterior) | Next.js (Novo) |
|---------|----------------|----------------|
| Renderização | Server-side HTML | React SSR/CSR |
| Navegação | Full page reload | Client-side routing |
| Estado | URL params + cookies | React state + URL |
| Fetch | Webhooks n8n | API Routes Next.js |
| Estilo | CSS inline | CSS Modules/Global |

## Próximos Passos Imediatos

1. **Atualizar globals.css** com variáveis da referência
2. **Criar componente Sidebar** com recolhimento
3. **Criar DashboardLayout** que envolve páginas
4. **Migrar página /dashboard** para novo layout
5. **Implementar navegação por tabs** sem reload

---

**Status**: Em Progresso - Fase 1
**Última atualização**: 2025-01-06
