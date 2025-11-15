# TODO - Kaniu WebApp

Este arquivo centraliza todas as tarefas pendentes do projeto. Organizado por categoria e prioridade.

---

## 🏥 Sistema de Clínicas Veterinárias

### Contexto
Estrutura completa criada para gerenciamento de clínicas veterinárias:
- Nova tabela `veterinary_clinics`
- Campo `clinic_id` em `users` (associar veterinários a clínicas)
- Campo `details` (JSON) em `users` (informações extras por role)
- Campo `clinic_id` em `animal_medical_records` (registrar clínica do atendimento)

**Arquivos:**
- Migration: `prisma/migrations/20251115000000_add_veterinary_clinics/migration.sql`
- Schema: `prisma/schema.prisma`

### Tarefas

#### ⏳ 1. Criar página de cadastro de clínicas veterinárias
**Status:** Pendente
**Prioridade:** Alta
**Localização:** `src/app/dashboard/clinicas/`

**Funcionalidades:**
- [ ] Listagem de clínicas (com filtros ativo/inativo)
- [ ] Formulário de cadastro
- [ ] Formulário de edição
- [ ] Desativação/exclusão lógica (soft delete)
- [ ] Visualização de detalhes

**Campos:**
- Nome da clínica (obrigatório)
- CRMV (opcional)
- Email (opcional)
- Telefone (opcional)
- Endereço JSON (rua, número, complemento, bairro, cidade, estado, CEP)
- Descrição (opcional)

---

#### ⏳ 2. Atualizar formulário de veterinários
**Status:** Pendente
**Prioridade:** Alta
**Localização:** `src/app/dashboard/usuarios/`

**Mudanças:**
- [ ] Adicionar select de clínica (opcional)
- [ ] Carregar lista de clínicas ativas
- [ ] Salvar `clinic_id` ao criar/editar
- [ ] Adicionar campo `details` (JSON) para:
  - Especialidades
  - CRMV (estado)
  - Horários de atendimento
  - Contato de emergência

**Exemplo details:**
```json
{
  "specialties": ["Cirurgia", "Ortopedia"],
  "crmv_state": "SP",
  "schedule": {
    "monday": "14h-18h",
    "wednesday": "14h-18h"
  },
  "emergency_contact": "(11) 99999-9999"
}
```

---

#### ⏳ 3. Atualizar registro de atendimentos médicos
**Status:** Pendente
**Prioridade:** Média
**Localização:** Formulário `animal_medical_records`

**Mudanças:**
- [ ] Adicionar select de clínica (opcional)
- [ ] Carregar lista de clínicas ativas
- [ ] Salvar `clinic_id`
- [ ] Mostrar clínica nos detalhes do registro
- [ ] Pré-selecionar clínica do veterinário (se houver)

---

#### ⏳ 4. Criar relatórios por clínica
**Status:** Pendente
**Prioridade:** Baixa
**Localização:** `src/app/dashboard/relatorios/clinicas/`

**Funcionalidades:**
- [ ] Relatório de atendimentos por clínica
- [ ] Ranking de clínicas mais utilizadas
- [ ] Histórico de atendimentos
- [ ] Exportação (CSV/PDF)
- [ ] Filtros (período, clínica, tipo, veterinário)

**Métricas:**
- Total de atendimentos por clínica
- Tipos de atendimento mais comuns
- Animais atendidos
- Custo médio (se houver dados financeiros)
- Tempo médio entre atendimentos

---

## 📊 Gráficos e Visualizações

### ✅ Gráficos de Peso
**Status:** Concluído
**Localização:** `src/app/dashboard/animais/[id]/AnimalDetailsClient.tsx`

**Implementado:**
- [x] Gráfico completo na tab Pesagem (300px altura)
- [x] Mini gráfico no card "Peso e Medidas" (180px altura)
- [x] Espaço proporcional até data atual
- [x] Eixo X mostrando apenas anos (Janeiro)
- [x] Sem linha conectando última medição à data atual
- [x] Biblioteca Recharts 3.4.1 instalada

---

## 🔄 Migrações de Dados

### ✅ Pesagens (Weights)
**Status:** Concluído
**Script:** `database/migration/migrate_weights.js`
**Resultado:** 442 registros migrados, 13 duplicados

### ✅ Dosagens de Medicamentos
**Status:** Concluído
**Script:** `database/migration/migrate_medication_dosages.js`
**Resultado:** 11 dosagens migradas para `catalogs`

### ✅ Vias de Administração
**Status:** Concluído
**Script:** `database/migration/migrate_medication_routes.js`
**Resultado:** 11 vias migradas para `catalogs`

### ✅ Veterinários
**Status:** Concluído
**Script:** `database/migration/migrate_veterinarians.js`
**Resultado:** 9 veterinários migrados como `users` (role_id=13)
**Nota:** Senha temporária: `veterinario123`

---

## 🗂️ Estrutura de Dados

### Tabelas Criadas/Modificadas

#### veterinary_clinics
```sql
- id (UUID)
- name (VARCHAR)
- address (JSONB)
- phone, email, crmv (VARCHAR)
- description (TEXT)
- is_active (BOOLEAN)
- created_at, updated_at, deleted_at (TIMESTAMPTZ)
```

#### users (campos adicionados)
```sql
- clinic_id (UUID) → FK para veterinary_clinics
- details (JSONB) → Informações extras por role
```

#### animal_medical_records (campos adicionados)
```sql
- clinic_id (UUID) → FK para veterinary_clinics
```

---

## 🎯 Próximas Prioridades

1. **Alta:** Implementar CRUD de clínicas veterinárias
2. **Alta:** Atualizar cadastro de veterinários
3. **Média:** Integrar clínicas em registros médicos
4. **Baixa:** Desenvolver relatórios por clínica

---

## 📝 Notas Técnicas

### Convenções de Código
- Usar Prisma Client para queries
- Soft delete em todas as entidades principais
- Validação com Zod nos formulários
- TypeScript strict mode

### Padrões de Relacionamento
- Clínicas → Veterinários: 1:N (clinic_id nullable)
- Clínicas → Registros Médicos: 1:N (clinic_id nullable)
- Todos os FKs usam `SET NULL` on delete

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
      crmv_state: "SP"
    }
  }
})
```

---

## 📚 Referências

- [Prisma Schema](prisma/schema.prisma)
- [Migration Clínicas](prisma/migrations/20251115000000_add_veterinary_clinics/)
- [Documentação Recharts](https://recharts.org/)

---

**Última atualização:** 2025-01-15
