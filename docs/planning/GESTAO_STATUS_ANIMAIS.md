# Gestão de Status dos Animais

## Solução Implementada

### Arquitetura

A solução utiliza uma **abordagem híbrida** que combina:

1. **Status Atual** (`Animal.status`) - Status único e atual do animal
2. **Histórico de Eventos** (`AnimalEvent`) - Registro completo de mudanças ao longo do tempo

### Por que esta abordagem?

#### ❌ Problemas com Campos Booleanos Independentes
```prisma
// Abordagem antiga (NÃO recomendada)
model Animal {
  isAdopted      Boolean
  isLost         Boolean
  isDeceased     Boolean
  isHospitalized Boolean
}
```

**Problemas:**
- Estados podem conflitar (adotado E desaparecido ao mesmo tempo)
- Não captura ordem temporal (foi adotado ANTES ou DEPOIS de desaparecer?)
- Difícil consultar histórico
- Não é escalável (adicionar novo status = alterar schema)

#### ✅ Solução Atual
```prisma
model Animal {
  statusId Int?         @map("status_id")
  status   Catalog?     @relation("AnimalStatus")  // Status ATUAL
  events   AnimalEvent[]  // Histórico completo
}

model Catalog {
  category    String  // 'animal_status'
  name        String  // 'Adotado', 'Disponível', etc
  description String?
}

model AnimalEvent {
  eventType   String  // 'STATUS_CHANGE', 'ADOPTION', 'MEDICAL'
  description String
  details     Json?   // Pode conter fromStatus, toStatus, etc
  createdAt   DateTime
}
```

### Status Disponíveis

| Status | Descrição | Ícone |
|--------|-----------|-------|
| **Abrigado** | Animal está abrigado | `fa-home` |
| **Adotado** | Animal foi adotado | `fa-house` |
| **Desaparecido** | Animal desaparecido | `fa-magnifying-glass` |
| **Internado** | Animal internado para tratamento | `fa-hospital` |
| **Falecido** | Animal falecido | `fa-cross` |

**Nota sobre Disponibilidade para Adoção:**
- A disponibilidade para adoção **não é mais um status separado**
- Agora é controlada pelo campo booleano `is_available_for_adoption` no model `Animal`
- Apenas animais com status "Abrigado" podem ter `is_available_for_adoption = true`
- Exemplo: Animal em tratamento = status "Abrigado" + `is_available_for_adoption = false`

### Fluxo de Mudança de Status

```typescript
// Quando um botão de ação é clicado:

1. Criar evento no histórico
await prisma.animalEvent.create({
  data: {
    animalId: animal.id,
    eventType: 'STATUS_CHANGE',
    description: `Status alterado de ${animal.status} para Adotado`,
    details: {
      fromStatus: animal.status,
      toStatus: 'Adotado',
      changedBy: userId,
      reason: '...'
    },
    triggeredByUserId: userId
  }
})

2. Atualizar status atual
await prisma.animal.update({
  where: { id: animal.id },
  data: {
    statusId: novoStatusId  // ID do Catalog com name='Adotado'
  }
})
```

### Exemplo de Timeline

Um animal pode ter o seguinte histórico:

```
10/01/2025 - Status: Abrigado (chegou ao abrigo) - is_available_for_adoption: false
15/02/2025 - Disponibilidade alterada (liberado para adoção) - is_available_for_adoption: true
20/03/2025 - Status: Adotado (família Silva adotou)
10/04/2025 - Status: Desaparecido (família reportou desaparecimento)
25/04/2025 - Status: Abrigado (foi encontrado e retornou) - is_available_for_adoption: false
01/05/2025 - Status: Internado (precisou de tratamento)
15/05/2025 - Status: Abrigado (recuperado) - is_available_for_adoption: true
```

**Status Atual:** Abrigado + Disponível para Adoção (`is_available_for_adoption: true`)
**Histórico:** 7 eventos registrados mostrando toda a jornada

### Consultas Úteis

```typescript
// Buscar animais disponíveis para adoção
const animaisDisponiveis = await prisma.animal.findMany({
  where: {
    status: {
      name: 'Abrigado'
    },
    is_available_for_adoption: true
  }
})

// Buscar histórico completo de um animal
const historico = await prisma.animalEvent.findMany({
  where: { animalId: animal.id },
  orderBy: { createdAt: 'desc' },
  include: {
    triggeredByUser: {
      select: { name: true }
    }
  }
})

// Animais que já foram adotados (em algum momento)
const jaAdotados = await prisma.animalEvent.findMany({
  where: {
    eventType: 'STATUS_CHANGE',
    details: {
      path: ['toStatus'],
      equals: 'Adotado'
    }
  },
  select: {
    animal: true
  },
  distinct: ['animalId']
})
```

### UI - Botões de Ação

Os botões de status na página de detalhes:
- **Botão ativo** = Status atual do animal (destaque visual)
- **Botões inativos** = Outros status possíveis
- **Ao clicar** = Muda status E cria evento no histórico

```typescript
// Destaque visual do botão ativo
const isActive = animal.status === action.status

style={{
  border: isActive ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
  background: isActive ? 'var(--primary-color)' : 'var(--card-background)',
  color: isActive ? 'white' : 'var(--text-dark)',
  boxShadow: isActive ? '0 4px 12px rgba(90, 93, 127, 0.3)' : 'none',
}}
```

### Próximos Passos (TODO)

- [ ] Implementar API endpoint para mudança de status
- [ ] Adicionar confirmação antes de mudar status críticos (Falecido)
- [ ] Criar timeline visual do histórico de eventos
- [ ] Adicionar permissões (quem pode mudar status)
- [ ] Notificações quando status mudar (email, push)
- [ ] Relatórios de status ao longo do tempo
- [ ] Validações de transição de status (Falecido não pode virar Disponível)

### Arquivos Modificados

1. **`prisma/schema.prisma`** - Adicionado campo `is_available_for_adoption` no model `animals`
2. **`prisma/seed.ts`** - Removido status "Disponível", mantido apenas "Abrigado"
3. **`src/app/dashboard/animais/[id]/AnimalDetailsClient.tsx`** - Botões de ação com destaque do status ativo
4. **`src/app/api/animals/route.ts`** - Validação e tratamento do campo `is_available_for_adoption`
5. **`src/app/api/animals/[id]/route.ts`** - Validação e tratamento do campo `is_available_for_adoption`
6. **`src/app/dashboard/animais/novo/new-animal-form.tsx`** - Checkbox para marcar disponibilidade
7. **`src/app/dashboard/animais/[id]/editar/edit-animal-form.tsx`** - Checkbox para marcar disponibilidade
