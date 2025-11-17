# TODO - Sistema de Clínicas Veterinárias

## Contexto
Foi criada a estrutura completa para gerenciamento de clínicas veterinárias no sistema, incluindo:
- Nova tabela `veterinary_clinics`
- Campo `clinic_id` na tabela `users` (para associar veterinários a clínicas)
- Campo `details` (JSON) na tabela `users` (para informações extras específicas por role)
- Campo `clinic_id` na tabela `animal_medical_records` (para registrar qual clínica realizou o atendimento)

## Estrutura do Banco de Dados

### Tabela `veterinary_clinics`
```sql
- id (UUID)
- name (VARCHAR) - Nome da clínica
- address (JSONB) - Endereço completo
- phone (VARCHAR) - Telefone
- email (VARCHAR) - Email
- crmv (VARCHAR) - Registro da clínica
- description (TEXT) - Descrição
- is_active (BOOLEAN) - Clínica ativa
- created_at, updated_at, deleted_at (TIMESTAMPTZ)
```

### Relacionamentos
- `users.clinic_id → veterinary_clinics.id` (SET NULL on delete)
- `animal_medical_records.clinic_id → veterinary_clinics.id` (SET NULL on delete)

## Tarefas Pendentes

### 1. Criar página de cadastro de clínicas veterinárias
**Status:** Pendente
**Descrição:** Criar interface para cadastrar e gerenciar clínicas veterinárias
**Localização sugerida:** `src/app/dashboard/clinicas/`
**Funcionalidades:**
- Listagem de clínicas (com filtros por status ativo/inativo)
- Formulário de cadastro
- Formulário de edição
- Desativação/exclusão lógica (soft delete)
- Visualização de detalhes da clínica

**Campos do formulário:**
- Nome da clínica (obrigatório)
- CRMV (opcional)
- Email (opcional)
- Telefone (opcional)
- Endereço completo em JSON:
  - Rua
  - Número
  - Complemento
  - Bairro
  - Cidade
  - Estado
  - CEP
- Descrição (opcional)

---

### 2. Atualizar formulário de cadastro/edição de veterinários
**Status:** Pendente
**Descrição:** Adicionar seleção de clínica ao cadastrar/editar veterinários
**Localização:** `src/app/dashboard/usuarios/` (ou onde estiver o cadastro de veterinários)
**Mudanças necessárias:**
- Adicionar campo select/dropdown para seleção de clínica (opcional)
- Carregar lista de clínicas ativas da tabela `veterinary_clinics`
- Salvar `clinic_id` ao criar/editar veterinário
- Adicionar campo `details` (JSON) para informações extras:
  - Especialidades
  - CRMV (estado)
  - Horários de atendimento
  - Contato de emergência

**Exemplo de `details` JSON:**
```json
{
  "specialties": ["Cirurgia", "Ortopedia"],
  "crmv_state": "SP",
  "schedule": {
    "monday": "14h-18h",
    "wednesday": "14h-18h",
    "friday": "09h-13h"
  },
  "emergency_contact": "(11) 99999-9999"
}
```

---

### 3. Atualizar registro de atendimentos médicos
**Status:** Pendente
**Descrição:** Adicionar campo de clínica ao registrar atendimentos médicos
**Localização:** Formulário de registro médico (`animal_medical_records`)
**Mudanças necessárias:**
- Adicionar campo select para seleção de clínica (opcional)
- Carregar lista de clínicas ativas
- Salvar `clinic_id` ao criar registro médico
- Mostrar clínica nos detalhes do registro médico
- Filtrar clínicas por veterinário selecionado (se houver)

**Lógica sugerida:**
- Se o veterinário selecionado tiver uma clínica associada, pré-selecionar essa clínica
- Permitir alterar para outra clínica ou deixar em branco

---

### 4. Criar relatórios por clínica veterinária
**Status:** Pendente
**Descrição:** Criar sistema de relatórios para análise de atendimentos por clínica
**Localização sugerida:** `src/app/dashboard/relatorios/clinicas/`
**Funcionalidades:**
- Relatório de atendimentos por clínica (quantidade, tipos, período)
- Ranking de clínicas mais utilizadas
- Histórico de atendimentos de uma clínica específica
- Exportação de dados (CSV/PDF)
- Filtros:
  - Período (data início/fim)
  - Clínica específica
  - Tipo de atendimento
  - Veterinário

**Métricas sugeridas:**
- Total de atendimentos por clínica
- Tipos de atendimento mais comuns por clínica
- Animais atendidos por clínica
- Custo médio por atendimento (se houver dados financeiros)
- Tempo médio entre atendimentos

---

## Exemplos de Uso (Código)

### Cadastrar uma clínica
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

### Associar veterinário a uma clínica
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

### Registrar atendimento com clínica
```typescript
await prisma.animal_medical_records.create({
  data: {
    animal_id: animalId,
    record_type: "consultation",
    description: "Consulta de rotina",
    clinic_id: clinicId,
    created_by: veterinarianId,
    record_date: new Date()
  }
})
```

---

## Arquivos de Migração
- Migration SQL: `prisma/migrations/20251115000000_add_veterinary_clinics/migration.sql`
- Schema atualizado: `prisma/schema.prisma`

---

## Notas Adicionais
- A estrutura do banco já está criada e sincronizada
- Todos os relacionamentos usam `SET NULL` para evitar perda de dados ao deletar clínicas
- O campo `details` em `users` é flexível e pode ser usado para outros tipos de usuários no futuro
- Todas as tabelas possuem soft delete (`deleted_at`) para manter histórico
