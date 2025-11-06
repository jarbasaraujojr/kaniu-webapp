# Plano Completo - Webapp Kaniu
## Sistema de Gestão de Abrigos de Animais

---

## Arquitetura e Stack Tecnológica

### Frontend
- **Framework**: Next.js 14+ (App Router) com TypeScript
- **UI**: TailwindCSS + shadcn/ui (componentes acessíveis)
- **State Management**: Zustand ou React Context API
- **Formulários**: React Hook Form + Zod (validação)
- **Tabelas/Listas**: TanStack Table
- **Gráficos**: Recharts ou Chart.js
- **Upload de arquivos**: React Dropzone
- **Mapas**: Leaflet ou Google Maps API

### Backend
- **API**: Next.js API Routes ou tRPC
- **ORM**: Prisma ou Drizzle ORM
- **Autenticação**: NextAuth.js ou Clerk
- **Armazenamento de arquivos**: AWS S3, Cloudinary ou Supabase Storage
- **Email**: Resend ou SendGrid
- **Validação**: Zod

### Banco de Dados
- **PostgreSQL** (conforme [schema.sql](database/schema.sql))

---

## Fase 1: Configuração Inicial e Infraestrutura (Semana 1-2)

### 1.1 Setup do Projeto
- [ ] Inicializar projeto Next.js 14 com TypeScript
- [ ] Configurar TailwindCSS e shadcn/ui
- [ ] Setup do ESLint, Prettier e Husky
- [ ] Configurar variáveis de ambiente (.env)

### 1.2 Banco de Dados
- [ ] Setup PostgreSQL (local ou Supabase/Neon)
- [ ] Executar schema.sql para criar estrutura
- [ ] Configurar Prisma/Drizzle ORM
- [ ] Gerar tipos TypeScript do schema
- [ ] Criar seeds iniciais (catalogs, roles)

### 1.3 Autenticação
- [ ] Implementar NextAuth.js com providers (email/password, Google)
- [ ] Criar middleware de autenticação
- [ ] Sistema de roles (admin, shelter_manager, veterinarian, adopter, volunteer)
- [ ] Proteção de rotas baseada em permissões

---

## Fase 2: Módulo de Usuários e Abrigos (Semana 3-4)

### 2.1 Gestão de Usuários
- [ ] CRUD de usuários (tabela `users`)
- [ ] Tela de perfil do usuário
- [ ] Edição de dados pessoais (nome, email, telefone, endereço)
- [ ] Upload de foto de perfil
- [ ] Dashboard por role

### 2.2 Gestão de Abrigos
- [ ] CRUD de abrigos (tabela `shelters`)
- [ ] Listagem de abrigos (com filtros)
- [ ] Página pública de perfil do abrigo
- [ ] Associação de gerentes ao abrigo (owner_id)
- [ ] Estatísticas do abrigo (view `animals_by_shelter`)

---

## Fase 3: Módulo Central - Animais (Semana 5-8)

### 3.1 Cadastro de Animais
- [ ] Formulário completo de cadastro (tabela `animals`)
  - Informações básicas (nome, espécie, raça, gênero, tamanho)
  - Data de nascimento e microchip
  - Status (available, adopted, hospitalized, lost, deceased)
  - Características (castrado, health_status, behavior, appearance)
- [ ] Seleção de espécie/raça da tabela `catalogs`
- [ ] Sistema de aparência (cores, comprimento do pelo - campo JSON)
- [ ] Sistema de comportamento (perfil comportamental - campo JSON)

### 3.2 Galeria de Fotos
- [ ] Upload múltiplo de fotos (tabela `animal_photos`)
- [ ] Definir foto de perfil (is_profile_pic)
- [ ] Ordenação de fotos (photo_order)
- [ ] Galeria responsiva com lightbox

### 3.3 Documentos
- [ ] Upload de documentos (tabela `documents`)
- [ ] Tipos: exames médicos, vacinas, contratos, relatórios
- [ ] Visualização de PDFs/imagens inline
- [ ] Metadata em JSON (parâmetros do exame, notas veterinárias)

### 3.4 Listagem e Busca de Animais
- [ ] Grid/lista de animais disponíveis
- [ ] Filtros avançados:
  - Espécie, raça, gênero, tamanho, idade
  - Comportamento (bom com crianças, outros animais)
  - Cor, comprimento do pelo
  - Status, abrigo
- [ ] Ordenação (recentes, alfabética, idade)
- [ ] Paginação
- [ ] View `available_animals` para otimização

### 3.5 Página de Detalhes do Animal
- [ ] Informações completas
- [ ] Galeria de fotos
- [ ] Linha do tempo de eventos (view `animal_event_timeline`)
- [ ] Histórico médico
- [ ] Botões de ação (adotar, favoritar, compartilhar)

---

## Fase 4: Módulo de Saúde e Monitoramento (Semana 9-10)

### 4.1 Registros Médicos
- [ ] CRUD de registros médicos (tabela `animal_medical_records`)
- [ ] Tipos: vacina, consulta, cirurgia, medicação
- [ ] Calendário de próximos procedimentos (next_due_date)
- [ ] Vinculação com documentos
- [ ] Notificações de vencimento de vacinas

### 4.2 Controle de Peso
- [ ] Registro de pesagens (tabela `animal_weights`)
- [ ] Gráfico de evolução do peso ao longo do tempo
- [ ] Alertas de variação anormal

### 4.3 Timeline de Eventos
- [ ] Registro automático de eventos (tabela `animal_events`)
- [ ] Tipos: criado, status alterado, foto adicionada, documento adicionado
- [ ] Visualização cronológica na página do animal

---

## Fase 5: Módulo de Adoções (Semana 11-13)

### 5.1 Processo de Adoção
- [ ] Sistema de eventos de adoção (tabela `adoption_events`)
- [ ] Fluxo: inquiry → pending → approved → finalized
- [ ] Formulário de interesse em adoção
- [ ] Dashboard para aprovação de adoções (shelter_manager)
- [ ] Contratos de adoção

### 5.2 Gestão de Status
- [ ] View `adoption_current_status` para status atual
- [ ] Function `create_adoption_event` para criar eventos
- [ ] Histórico completo (view `adoption_history`)
- [ ] Notificações de mudança de status

### 5.3 Devoluções e Cancelamentos
- [ ] Registro de devoluções (status 'undone')
- [ ] Campo `information` para motivos e notas
- [ ] Estatísticas de adoções bem-sucedidas vs devoluções

---

## Fase 6: Módulo de Perdidos e Encontrados (Semana 14-15)

### 6.1 Relatórios
- [ ] Formulário de animal perdido (tabela `reports`, type='lost')
- [ ] Formulário de animal encontrado (type='found')
- [ ] Localização em mapa (campo location JSON)
- [ ] Upload de fotos de evidência

### 6.2 Sistema de Matching
- [ ] Algoritmo de correspondência (espécie, raça, cores, localização)
- [ ] Notificações de possíveis matches
- [ ] Vinculação de relatórios (matched_report_id)
- [ ] Resolução de casos

---

## Fase 7: Features Sociais e Engajamento (Semana 16-17)

### 7.1 Sistema de Favoritos
- [ ] Adicionar/remover favoritos (tabela `favorites`)
- [ ] Página "Meus Favoritos"
- [ ] Notificações de mudanças no animal favoritado

### 7.2 Compartilhamento
- [ ] Botões de share em redes sociais
- [ ] Geração de cards visuais (Open Graph)
- [ ] Link público para animal individual

### 7.3 Catálogos Customizáveis
- [ ] CRUD de catálogos (tabela `catalogs`)
- [ ] Adicionar espécies, raças, tamanhos personalizados
- [ ] Interface admin para gerenciar categorias

---

## Fase 8: Dashboards e Relatórios (Semana 18-19)

### 8.1 Dashboard Admin
- [ ] Estatísticas gerais do sistema
- [ ] Total de animais, abrigos, adoções
- [ ] Gráficos de crescimento
- [ ] Animais mais visualizados

### 8.2 Dashboard do Abrigo
- [ ] View `animals_by_shelter` para estatísticas
- [ ] Animais por status
- [ ] Taxa de adoção
- [ ] Alertas de tarefas pendentes

### 8.3 Relatórios
- [ ] Exportação de dados (CSV, PDF)
- [ ] Relatório de adoções por período
- [ ] Relatório médico de animais
- [ ] Análise de performance do abrigo

---

## Fase 9: Auditoria e Segurança (Semana 20)

### 9.1 Sistema de Logs
- [ ] Tabela `audit_logs` já configurada com triggers
- [ ] Interface para visualizar logs de auditoria
- [ ] Filtros por usuário, tabela, ação, período
- [ ] Detecção de ações suspeitas

### 9.2 Permissões Granulares
- [ ] Sistema de permissions em JSON (tabela `roles`)
- [ ] Middleware de verificação de permissões
- [ ] RBAC (Role-Based Access Control) completo
- [ ] Proteção de endpoints da API

---

## Fase 10: Otimizações e Features Extras (Semana 21-22)

### 10.1 Performance
- [ ] Implementar cache (Redis ou Upstash)
- [ ] Otimização de queries (índices no schema já criados)
- [ ] Lazy loading de imagens
- [ ] Server-side rendering (SSR) otimizado

### 10.2 Notificações
- [ ] Sistema de notificações em tempo real (WebSocket ou Pusher)
- [ ] Email notifications (Resend/SendGrid)
- [ ] Notificações push (opcional)

### 10.3 Busca Avançada
- [ ] Full-text search (PostgreSQL trgm ou ElasticSearch)
- [ ] Busca por imagem similar (opcional - AI)
- [ ] Autocomplete de espécies/raças

### 10.4 Mobile
- [ ] PWA (Progressive Web App)
- [ ] Responsividade total
- [ ] App mobile nativo (React Native - opcional)

---

## Fase 11: Testes e Deploy (Semana 23-24)

### 11.1 Testes
- [ ] Unit tests (Jest/Vitest)
- [ ] Integration tests (API routes)
- [ ] E2E tests (Playwright/Cypress)
- [ ] Testes de acessibilidade

### 11.2 Deploy
- [ ] Deploy no Vercel/Netlify (frontend)
- [ ] PostgreSQL no Supabase/Neon/Railway
- [ ] Setup de domínio customizado
- [ ] SSL/HTTPS
- [ ] Monitoramento (Sentry, LogRocket)

### 11.3 Documentação
- [ ] README completo
- [ ] Documentação da API
- [ ] Guia de contribuição
- [ ] Manual do usuário

---

## Priorização de Features MVP (Mínimo Viável)

Para lançar uma primeira versão funcional, priorize:

1. ✅ Autenticação básica (email/senha)
2. ✅ CRUD de abrigos
3. ✅ CRUD de animais (com fotos)
4. ✅ Listagem pública de animais disponíveis
5. ✅ Sistema simples de adoção (inquiry → approved → finalized)
6. ✅ Dashboard básico do abrigo

**Total estimado: 8-10 semanas para MVP**

---

## Estrutura de Pastas Sugerida

```
kaniu-webapp/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Grupo de rotas autenticadas
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/              # Grupo de rotas protegidas
│   │   ├── admin/
│   │   ├── shelter/
│   │   ├── animals/
│   │   ├── adoptions/
│   │   ├── medical/
│   │   └── reports/
│   ├── api/                      # API Routes
│   │   ├── animals/
│   │   ├── shelters/
│   │   ├── adoptions/
│   │   └── auth/
│   └── layout.tsx
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── animals/
│   ├── shelters/
│   ├── adoptions/
│   └── shared/
├── lib/
│   ├── db/                       # Prisma client, queries
│   ├── auth/                     # NextAuth config
│   ├── validations/              # Zod schemas
│   └── utils/
├── hooks/                        # Custom React hooks
├── types/                        # TypeScript types
├── public/                       # Static assets
├── database/
│   └── schema.sql
└── prisma/
    └── schema.prisma
```

---

## Tecnologias Complementares Recomendadas

- **Upload**: Cloudinary (transformações de imagem automáticas)
- **Email templates**: React Email
- **Analytics**: Vercel Analytics ou Plausible
- **Error tracking**: Sentry
- **Database**: Supabase (PostgreSQL + Storage + Auth all-in-one)

---

## Entidades do Banco de Dados

### Tabelas Principais
- `catalogs` - Catálogos de referência (espécies, raças, tamanhos)
- `roles` - Papéis e permissões
- `users` - Usuários do sistema
- `shelters` - Abrigos de animais
- `animals` - Animais cadastrados
- `animal_photos` - Fotos dos animais
- `documents` - Documentos e arquivos
- `adoption_events` - Eventos do processo de adoção
- `animal_weights` - Histórico de peso
- `animal_medical_records` - Registros médicos
- `reports` - Relatórios de animais perdidos/encontrados
- `favorites` - Favoritos dos usuários
- `animal_events` - Timeline de eventos
- `audit_logs` - Logs de auditoria

### Views Disponíveis
- `available_animals` - Animais disponíveis para adoção
- `adoption_history` - Histórico de adoções
- `animals_by_shelter` - Estatísticas por abrigo
- `animal_event_timeline` - Timeline de eventos
- `adoption_current_status` - Status atual das adoções

### Functions
- `create_animal_event()` - Criar evento de animal
- `create_adoption_event()` - Criar evento de adoção
- `get_adoption_current_status()` - Obter status atual da adoção
- `log_changes()` - Trigger para auditoria automática