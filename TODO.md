# TODO - Kaniu WebApp

Plano de implementação das funcionalidades pendentes, organizado por fases e prioridades.

**Última atualização:** 2025-01-15

---

## 📋 Índice
- [Roadmap de Implementação](#-roadmap-de-implementação)
- [FASE 1: Fundação (Crítico)](#-fase-1-fundação-crítico)
- [FASE 2: CRUD Essencial (Alta Prioridade)](#-fase-2-crud-essencial-alta-prioridade)
- [FASE 3: Funcionalidades Avançadas (Média Prioridade)](#-fase-3-funcionalidades-avançadas-média-prioridade)
- [FASE 4: Otimização e Compliance (Baixa Prioridade)](#-fase-4-otimização-e-compliance-baixa-prioridade)
- [Concluído](#-concluído)
- [Referências Técnicas](#-referências-técnicas)

---

## 🎯 Roadmap de Implementação

### Progresso Geral
- ✅ Estrutura base de dados criada
- ✅ Sistema de autenticação básico (login/register)
- ✅ Dashboard principal com métricas
- ✅ Visualização de animais (lista e detalhes)
- ✅ Gráficos de peso implementados
- ⏳ **Em desenvolvimento:** Sistema de clínicas veterinárias
- ⏸️ CRUD completo de entidades principais
- ⏸️ Processo de adoção
- ⏸️ Gestão de saúde completa

---

## 🚨 FASE 1: Fundação (Crítico)

Funcionalidades essenciais para que o sistema seja minimamente operacional.

### 1.1 Autenticação e Segurança
**Objetivo:** Completar fluxo de autenticação e gestão de usuários
**Status:** 🔴 Crítico - Não iniciado
**Estimativa:** 2 semanas

- [ ] **Recuperação de senha**
  - [ ] Página de solicitação (`/forgot-password`)
  - [ ] Geração de token temporário (tabela `password_reset_tokens`)
  - [ ] Email com link de reset (Resend/SendGrid)
  - [ ] Página de redefinição com validação de token
  - [ ] Invalidação de sessões antigas após reset

- [ ] **Validação de email**
  - [ ] Tabela `email_verification_tokens`
  - [ ] Envio de email de confirmação no registro
  - [ ] Página de verificação (`/verify-email/[token]`)
  - [ ] Bloqueio de acesso até confirmação
  - [ ] Reenvio de email de verificação

- [ ] **Administração de usuários** (`/dashboard/usuarios`)
  - [ ] Listagem com filtros (role, shelter, status)
  - [ ] Formulário de criação (com atribuição de shelter e role)
  - [ ] Formulário de edição
  - [ ] Desativação/reativação (soft delete)
  - [ ] Convite por email para novos usuários
  - [ ] Encerramento forçado de sessão

**Arquivos afetados:**
- `src/app/forgot-password/page.tsx` (novo)
- `src/app/verify-email/[token]/page.tsx` (novo)
- `src/app/dashboard/usuarios/page.tsx` (novo)
- `src/lib/auth/` (atualizar)
- `prisma/schema.prisma` (adicionar tabelas de tokens)

---

### 1.2 Gestão de Abrigos
**Objetivo:** CRUD completo de abrigos
**Status:** 🔴 Crítico - Não iniciado
**Estimativa:** 1 semana

- [ ] **CRUD de Abrigos** (`/dashboard/abrigos`)
  - [ ] Listagem com status ativo/inativo
  - [ ] Formulário de cadastro
    - Nome, descrição, localização (JSON)
    - Contatos (phone, email, website)
    - Owner (admin responsável)
  - [ ] Formulário de edição
  - [ ] Soft delete
  - [ ] Upload de logo/fotos do abrigo

- [ ] **Associação de usuários a abrigos**
  - [ ] Atribuir `shelter_id` ao criar/editar usuário
  - [ ] Listar usuários de um abrigo
  - [ ] Transferir usuário entre abrigos

**Arquivos afetados:**
- `src/app/dashboard/abrigos/page.tsx` (novo)
- `src/app/dashboard/abrigos/[id]/page.tsx` (novo)
- `src/app/dashboard/abrigos/novo/page.tsx` (novo)

---

### 1.3 Gestão de Catálogos
**Objetivo:** Gerenciar catálogos do sistema (espécies, raças, status, etc)
**Status:** 🔴 Crítico - Não iniciado
**Estimativa:** 3 dias

- [ ] **CRUD de Catálogos** (`/dashboard/catalogos`)
  - [ ] Listagem por categoria (species, breed, status, size, medication_dosage, medication_route)
  - [ ] Formulário de criação (categoria, nome, descrição, parent_id)
  - [ ] Formulário de edição
  - [ ] Ativação/desativação (`is_active`)
  - [ ] Hierarquia (parent-child) para raças

**Arquivos afetados:**
- `src/app/dashboard/catalogos/page.tsx` (novo)
- `src/app/dashboard/catalogos/[category]/page.tsx` (novo)

---

## 🔧 FASE 2: CRUD Essencial (Alta Prioridade)

Funcionalidades que permitem operação completa do sistema.

### 2.1 Cadastro Completo de Animais
**Objetivo:** Formulários para criar e editar animais
**Status:** 🟡 Alta - Não iniciado
**Estimativa:** 2 semanas

- [ ] **Formulário multi-etapas de criação** (`/dashboard/animais/novo`)
  - [ ] Etapa 1: Dados básicos (nome, espécie, raça, gênero, tamanho, data nascimento)
  - [ ] Etapa 2: Saúde (microchip, castrado, health_status JSON)
  - [ ] Etapa 3: Comportamento (behavior JSON)
  - [ ] Etapa 4: Aparência (appearance JSON - cores, marcas, etc)
  - [ ] Etapa 5: Fotos (upload múltiplo, definir foto principal)
  - [ ] Atribuição automática de shelter_id do usuário logado

- [ ] **Formulário de edição** (`/dashboard/animais/[id]/editar`)
  - [ ] Mesma estrutura multi-etapas
  - [ ] Preservar dados existentes
  - [ ] Histórico de alterações (`updated_by`, `updated_at`)

- [ ] **Gestão de fotos** (na página de detalhes)
  - [ ] Upload de novas fotos
  - [ ] Reordenação (drag and drop)
  - [ ] Definir/alterar foto principal
  - [ ] Excluir foto

- [ ] **Gestão de documentos** (na página de detalhes)
  - [ ] Upload de documentos (PDF, imagens)
  - [ ] Categorização (tipo de documento)
  - [ ] Download
  - [ ] Excluir

- [ ] **Registro de peso** (na página de detalhes)
  - [ ] Modal para adicionar nova pesagem
  - [ ] Validação de valores
  - [ ] Atualização automática do gráfico

- [ ] **Registro de eventos** (na página de detalhes)
  - [ ] Modal para adicionar evento
  - [ ] Tipos: entrada, transferência, adoção, retorno, óbito
  - [ ] Atualização automática da timeline

**Arquivos afetados:**
- `src/app/dashboard/animais/novo/page.tsx` (novo)
- `src/app/dashboard/animais/[id]/editar/page.tsx` (novo)
- `src/app/dashboard/animais/[id]/AnimalDetailsClient.tsx` (atualizar - adicionar modais)

---

### 2.2 Sistema de Clínicas Veterinárias
**Objetivo:** Gestão completa de clínicas e integração com registros médicos
**Status:** 🟡 Alta - Em desenvolvimento
**Estimativa:** 1 semana

- [ ] **CRUD de Clínicas** (`/dashboard/clinicas`)
  - [ ] Listagem com filtros (ativo/inativo)
  - [ ] Formulário de cadastro
    - Nome, CRMV, email, telefone
    - Endereço completo (JSON)
    - Descrição
  - [ ] Formulário de edição
  - [ ] Soft delete
  - [ ] Visualização de detalhes

- [ ] **Integração com cadastro de veterinários** (`/dashboard/usuarios`)
  - [ ] Campo select para escolher clínica (ao criar/editar veterinário)
  - [ ] Campo `details` JSON para:
    - Especialidades (array)
    - CRMV do veterinário + estado
    - Horários de atendimento
    - Contato de emergência

- [ ] **Integração com registros médicos**
  - [ ] Campo select de clínica (opcional) ao criar registro médico
  - [ ] Pré-selecionar clínica do veterinário logado
  - [ ] Exibir clínica nos detalhes do registro

- [ ] **Relatórios por clínica** (`/dashboard/relatorios/clinicas`)
  - [ ] Total de atendimentos por clínica
  - [ ] Ranking de clínicas mais utilizadas
  - [ ] Filtros (período, clínica, tipo de atendimento)
  - [ ] Exportação CSV

**Arquivos afetados:**
- `src/app/dashboard/clinicas/page.tsx` (novo)
- `src/app/dashboard/clinicas/[id]/page.tsx` (novo)
- `src/app/dashboard/clinicas/novo/page.tsx` (novo)
- `src/app/dashboard/usuarios/page.tsx` (atualizar)
- `src/app/dashboard/relatorios/clinicas/page.tsx` (novo)

**DB:**
- ✅ Tabela `veterinary_clinics` criada
- ✅ Campo `clinic_id` em `users` criado
- ✅ Campo `details` em `users` criado
- ✅ Campo `clinic_id` em `animal_medical_records` criado

---

### 2.3 Gestão de Saúde
**Objetivo:** Formulários para registros médicos e tratamentos
**Status:** 🟡 Alta - Não iniciado
**Estimativa:** 2 semanas

- [ ] **Registros Médicos** (`/dashboard/historico`)
  - [ ] Substituir placeholder por lista real de `animal_medical_records`
  - [ ] Filtros (animal, tipo, data, veterinário, clínica)
  - [ ] Modal/página para criar novo registro
    - Tipo (vacina, consulta, cirurgia, exame, etc)
    - Data do registro
    - Próxima data (vacinas, retornos)
    - Veterinário responsável
    - Clínica (se aplicável)
    - Descrição
    - Anexar documentos
  - [ ] Modal/página para editar registro
  - [ ] Visualizar detalhes do registro

- [ ] **Tratamentos/Prescrições** (`/dashboard/tratamentos`)
  - [ ] Substituir placeholder por lista real de `prescriptions`
  - [ ] Filtros (animal, medicamento, status, veterinário)
  - [ ] Modal/página para criar prescrição
    - Medicamento (select de `medications`)
    - Dosagem, via de administração
    - Intervalo (horas)
    - Data início, duração (dias)
    - Contínuo? Completo?
    - Veterinário prescritor
  - [ ] Gerenciar tarefas de administração (`prescription_tasks`)
    - Marcar como administrado
    - Registrar quem administrou
    - Notas

- [ ] **Avaliações** (`/dashboard/avaliacoes`)
  - [ ] Substituir placeholder por formulário de avaliação de saúde
  - [ ] Checklist de comportamento
  - [ ] Status geral de saúde
  - [ ] Histórico de avaliações

- [ ] **Agenda de saúde** (widget no dashboard)
  - [ ] Próximas vacinas/retornos (baseado em `next_due_date`)
  - [ ] Alertas de vencimento
  - [ ] Medicações ativas

**Arquivos afetados:**
- `src/app/dashboard/historico/page.tsx` (substituir)
- `src/app/dashboard/tratamentos/page.tsx` (substituir)
- `src/app/dashboard/avaliacoes/page.tsx` (substituir)
- `src/app/dashboard/painel/page.tsx` (adicionar widgets)

---

## 🎨 FASE 3: Funcionalidades Avançadas (Média Prioridade)

Funcionalidades que melhoram a experiência e ampliam o alcance do sistema.

### 3.1 Processo de Adoção Completo
**Objetivo:** Fluxo completo de adoção do início ao fim
**Status:** 🟠 Média - Não iniciado
**Estimativa:** 3 semanas

- [ ] **Páginas públicas** (sem autenticação)
  - [ ] Vitrine de animais (`/animais`)
    - Listagem com filtros (espécie, tamanho, idade, abrigo)
    - Busca por nome
    - Card com foto, nome, idade, localização
    - SEO otimizado
  - [ ] Detalhes do animal público (`/animais/[id]`)
    - Galeria de fotos
    - Informações básicas
    - Botão "Quero adotar"
  - [ ] Lista de abrigos (`/abrigos`)
    - Card com logo, nome, localização
    - Link para perfil do abrigo
  - [ ] Perfil público do abrigo (`/abrigos/[id]`)
    - Informações institucionais
    - Animais disponíveis para adoção

- [ ] **Formulário de solicitação de adoção**
  - [ ] Dados do adotante (se não autenticado, criar conta)
  - [ ] Etapas do formulário:
    - Dados pessoais
    - Endereço completo
    - Informações sobre moradia
    - Experiência com animais
    - Motivação
    - Upload de comprovantes (residência, renda)
  - [ ] Termos e condições (assinatura digital)
  - [ ] Persistir em `adoption_events` com status "pending"

- [ ] **Pipeline de adoção** (`/dashboard/adocoes`)
  - [ ] Kanban/lista com status:
    - Pendente → Em análise → Visita agendada → Aprovado → Adotado → Rejeitado
  - [ ] Filtros (abrigo, animal, adotante, status)
  - [ ] Drag and drop para mudar status
  - [ ] Ações em massa (aprovar múltiplos, rejeitar)
  - [ ] Comentários/notas por solicitação

- [ ] **Área do adotante** (`/dashboard/usuario/adocoes`)
  - [ ] Histórico de solicitações
  - [ ] Status atual de cada solicitação
  - [ ] Anexos enviados/recebidos
  - [ ] Chat/mensagens com o abrigo

- [ ] **Favoritos** (`/dashboard/usuario/favoritos`)
  - [ ] Listar animais favoritados
  - [ ] Adicionar/remover favoritos (botão na lista e detalhes)
  - [ ] Notificação quando animal favorito é adotado

**Arquivos afetados:**
- `src/app/animais/page.tsx` (novo - público)
- `src/app/animais/[id]/page.tsx` (novo - público)
- `src/app/abrigos/page.tsx` (novo - público)
- `src/app/abrigos/[id]/page.tsx` (novo - público)
- `src/app/dashboard/adocoes/page.tsx` (novo)
- `src/app/dashboard/usuario/favoritos/page.tsx` (novo)
- `src/app/dashboard/usuario/adocoes/page.tsx` (novo)

---

### 3.2 Comunicações e Notificações
**Objetivo:** Sistema de notificações e emails
**Status:** 🟠 Média - Não iniciado
**Estimativa:** 1 semana

- [ ] **Configuração de email** (Resend/SendGrid)
  - [ ] Setup de API keys no `.env`
  - [ ] Templates de email (React Email)
  - [ ] Serviço de envio (`src/lib/email/`)

- [ ] **Emails transacionais**
  - [ ] Verificação de email
  - [ ] Recuperação de senha
  - [ ] Convite de usuário
  - [ ] Confirmação de adoção
  - [ ] Lembretes de vacinas
  - [ ] Atualizações de status de adoção

- [ ] **Notificações internas**
  - [ ] Toast notifications (sonner/react-hot-toast)
  - [ ] Centro de notificações no header
  - [ ] Tipos:
    - Novo pedido de adoção
    - Animal com peso crítico
    - Documento vencido
    - Vacina próxima
  - [ ] Marcar como lida
  - [ ] Tabela `notifications` (opcional)

**Arquivos afetados:**
- `src/lib/email/` (novo)
- `src/components/layout/Header.tsx` (adicionar sino de notificações)

---

### 3.3 Relatórios Operacionais
**Objetivo:** Dashboard de métricas e exportações
**Status:** 🟠 Média - Não iniciado
**Estimativa:** 1 semana

- [ ] **Módulo de relatórios** (`/dashboard/relatorios`)
  - [ ] Ocupação histórica
    - Entrada vs saída por período
    - Taxa de ocupação
    - Tempo médio de permanência
  - [ ] Lead time de adoção
    - Tempo médio de solicitação → adoção
    - Taxa de aprovação/rejeição
  - [ ] Controle financeiro básico (se implementado)
    - Custos com saúde por animal
    - Custos por abrigo
  - [ ] Exportação CSV/PDF
  - [ ] Filtros por abrigo, período

**Arquivos afetados:**
- `src/app/dashboard/relatorios/page.tsx` (novo)

---

## 🔐 FASE 4: Otimização e Compliance (Baixa Prioridade)

Funcionalidades de segurança, monitoramento e automação.

### 4.1 Observabilidade
**Status:** 🔵 Baixa - Não iniciado
**Estimativa:** 3 dias

- [ ] **Tracking de erros** (Sentry)
  - [ ] Setup do Sentry SDK
  - [ ] Captura de erros em rotas API
  - [ ] Source maps para produção

- [ ] **Logs estruturados**
  - [ ] Logger (Winston/Pino)
  - [ ] Logs em rotas críticas (auth, cadastro, adoção)
  - [ ] Formato JSON para parsing

**Arquivos afetados:**
- `next.config.js` (configurar Sentry)
- `src/lib/logger.ts` (novo)

---

### 4.2 Automações
**Status:** 🔵 Baixa - Não iniciado
**Estimativa:** 5 dias

- [ ] **Cron jobs** (node-cron ou Vercel Cron)
  - [ ] Envio de lembretes de vacinas (diário)
  - [ ] Recalcular métricas do dashboard (diário)
  - [ ] Limpeza de tokens expirados (semanal)

- [ ] **Queue system** (Bull/BullMQ - opcional)
  - [ ] Processamento assíncrono de emails
  - [ ] Upload de imagens/documentos

**Arquivos afetados:**
- `src/lib/cron/` (novo)
- `src/lib/jobs/` (novo)

---

### 4.3 Auditoria e Compliance
**Status:** 🔵 Baixa - Não iniciado
**Estimativa:** 3 dias

- [ ] **Logs de auditoria** (usar tabela `audit_logs` existente)
  - [ ] Registrar ações críticas:
    - Criação/edição/exclusão de animais
    - Mudanças de status de adoção
    - Alterações em usuários
  - [ ] Visualizar logs (`/dashboard/auditoria`)

- [ ] **Backup e exportação**
  - [ ] Script de backup automático
  - [ ] Exportação de dados por abrigo
  - [ ] Política de retenção

- [ ] **Documentação operacional**
  - [ ] `OPERATIONS.md` - procedimentos de onboarding, rollback, etc
  - [ ] Atualizar `README.md` com guia completo

---

## ✅ Concluído

### Estrutura de Dados
- [x] Schema Prisma completo
- [x] Migrations iniciais
- [x] Tabela `veterinary_clinics`
- [x] Campos `clinic_id` e `details` em `users`
- [x] Campo `clinic_id` em `animal_medical_records`

### Migrações de Dados
- [x] Pesagens (442 registros)
- [x] Dosagens de medicamentos (11 registros)
- [x] Vias de administração (11 registros)
- [x] Veterinários (9 registros)

### Visualizações
- [x] Gráficos de peso (Recharts)
  - [x] Gráfico completo (tab Pesagem)
  - [x] Mini gráfico (card Peso e Medidas)
  - [x] Espaçamento proporcional
  - [x] Eixo X com anos

### Infraestrutura
- [x] Next.js 14 com App Router
- [x] NextAuth.js (autenticação básica)
- [x] Prisma ORM
- [x] PostgreSQL/Supabase
- [x] TailwindCSS
- [x] TypeScript
- [x] React Hook Form + Zod

---

## 🛠️ Referências Técnicas

### Stack Tecnológica
- **Framework:** Next.js 14.2 (App Router)
- **Auth:** NextAuth.js 4.24
- **Database:** PostgreSQL (Supabase)
- **ORM:** Prisma 5.20
- **UI:** TailwindCSS + Radix UI
- **Forms:** React Hook Form + Zod
- **Charts:** Recharts 3.4.1

### Convenções de Código
- TypeScript strict mode
- Prisma Client para todas as queries
- Soft delete em todas entidades principais (`deleted_at`)
- Validação com Zod em todos os formulários
- Componentes Server por padrão, Client quando necessário
- API Routes em `src/app/api/`

### Padrões de Arquivo
```
src/
├── app/
│   ├── (auth)/          # Rotas de autenticação (layout específico)
│   ├── (public)/        # Rotas públicas (sem auth)
│   ├── dashboard/       # Rotas protegidas (requer auth)
│   └── api/             # API Routes
├── components/
│   ├── ui/              # Componentes base (Radix)
│   ├── layout/          # Header, Sidebar, etc
│   └── features/        # Componentes por funcionalidade
├── lib/
│   ├── auth/            # Configuração NextAuth
│   ├── db/              # Prisma client
│   └── utils/           # Helpers gerais
└── types/               # TypeScript types
```

### Estrutura de Formulários
```typescript
// Validação com Zod
const schema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  // ...
})

// React Hook Form
const form = useForm({
  resolver: zodResolver(schema),
})

// Submissão
const onSubmit = async (data) => {
  const res = await fetch('/api/...', {
    method: 'POST',
    body: JSON.stringify(data)
  })
  // ...
}
```

### Soft Delete Pattern
```typescript
// Criar
await prisma.entity.create({ data })

// Soft delete
await prisma.entity.update({
  where: { id },
  data: { deleted_at: new Date() }
})

// Listar (excluir deletados)
await prisma.entity.findMany({
  where: { deleted_at: null }
})
```

### Exemplos de Código

**Criar clínica:**
```typescript
const clinic = await prisma.veterinary_clinics.create({
  data: {
    name: "Clínica VetCare",
    address: {
      street: "Rua das Flores, 123",
      city: "São Paulo",
      state: "SP",
      zip: "01234-567"
    },
    phone: "(11) 9999-9999",
    email: "contato@vetcare.com",
    crmv: "CRMV-SP 12345"
  }
})
```

**Associar veterinário:**
```typescript
await prisma.users.update({
  where: { id: veterinarianId },
  data: {
    clinic_id: clinicId,
    details: {
      specialties: ["Cirurgia", "Ortopedia"],
      crmv_state: "SP",
      schedule: {
        monday: "14h-18h",
        wednesday: "14h-18h"
      }
    }
  }
})
```

---

## 📚 Links Úteis

- [Prisma Schema](prisma/schema.prisma)
- [NextAuth Config](src/lib/auth/auth.ts)
- [Recharts Docs](https://recharts.org/)
- [Zod Docs](https://zod.dev/)
- [Radix UI](https://www.radix-ui.com/)
