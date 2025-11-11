# Estrutura de Controle de Acesso Baseado em Roles (RBAC)

## Roles e Permissões

### 1. Admin (Administrador do Sistema)
**Role:** `admin`

**Acesso:**
- Dashboard com estatísticas globais de todos os abrigos
- Gerenciamento de usuários (criar, editar, remover)
- Gerenciamento de abrigos (criar, editar, remover, ativar/desativar)
- Visualização de todos os animais de todos os abrigos
- Estatísticas gerais do sistema
- Relatórios consolidados
- Auditoria de ações

**Navegação:**
- Dashboard Global
- Abrigos
- Usuários
- Estatísticas
- Relatórios
- Configurações

**Dados Exibidos:**
- Total de abrigos ativos
- Total de animais (todos os abrigos)
- Taxa de adoção global
- Estatísticas por região/abrigo
- Gráficos comparativos entre abrigos

---

### 2. Shelter Manager (Responsável por Abrigo)
**Role:** `shelter_manager`

**Acesso:**
- Dashboard com dados APENAS do seu abrigo
- Gerenciamento de animais do seu abrigo
- Aprovação de adoções
- Registro de eventos médicos
- Registro de peso
- Gestão de documentos dos animais
- Relatórios do abrigo

**Navegação:**
- Dashboard do Abrigo
- Animais (apenas do seu abrigo)
- Adoções Pendentes
- Relatórios Médicos
- Eventos
- Configurações do Abrigo

**Dados Exibidos:**
- Total de animais no SEU abrigo
- Animais disponíveis/adotados/internados no SEU abrigo
- Taxa de adoção do SEU abrigo
- Próximas vacinações/consultas
- Histórico de adoções do abrigo

**Filtros Aplicados:**
- Todos os dados são filtrados por `shelterId = user.sheltersOwned[0].id`

---

### 3. Adopter (Usuário Comum)
**Role:** `adopter`

**Acesso:**
- Dashboard pessoal
- Visualização de animais disponíveis para adoção
- Registro de animais perdidos/encontrados
- Lista de favoritos
- Solicitações de adoção
- Perfil pessoal

**Navegação:**
- Meu Dashboard
- Animais Disponíveis
- Meus Favoritos
- Meus Relatórios (perdidos/encontrados)
- Minhas Solicitações de Adoção
- Meu Perfil

**Dados Exibidos:**
- Animais que marcou como favoritos
- Seus relatórios de animais perdidos/encontrados
- Status das suas solicitações de adoção
- Recomendações de animais

**Filtros Aplicados:**
- Animais: apenas disponíveis para adoção (`status = 'Disponível'`)
- Favoritos: `userId = currentUser.id`
- Relatórios: `reporterId = currentUser.id`

---

## Implementação Técnica

### Estrutura de Pastas

```
src/
├── app/
│   ├── dashboard/
│   │   ├── admin/          # Dashboard do administrador
│   │   │   ├── page.tsx
│   │   │   ├── abrigos/
│   │   │   ├── usuarios/
│   │   │   └── estatisticas/
│   │   ├── abrigo/         # Dashboard do gerente de abrigo
│   │   │   ├── page.tsx
│   │   │   ├── animais/
│   │   │   ├── adocoes/
│   │   │   └── relatorios/
│   │   └── usuario/        # Dashboard do usuário comum
│   │       ├── page.tsx
│   │       ├── favoritos/
│   │       ├── relatorios/
│   │       └── adocoes/
├── components/
│   ├── navigation/
│   │   └── DynamicSidebar.tsx  # Sidebar dinâmica baseada em role
├── hooks/
│   └── useAuth.ts              # Hook para autenticação e role
└── lib/
    ├── auth/
    │   ├── permissions.ts      # Definições de permissões
    │   └── middleware.ts       # Middleware de autorização
    └── utils/
        └── rbac.ts             # Utilitários RBAC
```

### Fluxo de Autorização

1. Usuário faz login → NextAuth retorna user com role
2. Aplicação verifica role e redireciona para dashboard apropriado:
   - `admin` → `/dashboard/admin`
   - `shelter_manager` → `/dashboard/abrigo`
   - `adopter` → `/dashboard/usuario`
3. Sidebar renderiza itens baseados no role
4. Cada página valida permissões no servidor
5. Queries são filtradas automaticamente baseadas no role

### Queries Filtradas por Role

**Admin:**
```typescript
// Sem filtros - vê tudo
const animals = await prisma.animal.findMany()
```

**Shelter Manager:**
```typescript
// Filtrado pelo abrigo do usuário
const shelter = await prisma.shelter.findFirst({
  where: { ownerId: session.user.id }
})
const animals = await prisma.animal.findMany({
  where: { shelterId: shelter.id }
})
```

**Adopter:**
```typescript
// Apenas animais disponíveis + seus favoritos/relatórios
const animals = await prisma.animal.findMany({
  where: {
    status: { name: 'Disponível' },
    deletedAt: null
  }
})
const favorites = await prisma.favorite.findMany({
  where: { userId: session.user.id }
})
```
