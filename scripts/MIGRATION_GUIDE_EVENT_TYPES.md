# Guia de Migração: Tipos de Eventos para Catálogo

## Visão Geral

Esta migração move os tipos de eventos de uma coluna string (`event_type`) para uma referência de catálogo (`event_type_id`), proporcionando maior consistência, flexibilidade e facilidade de manutenção.

## Benefícios

1. **Consistência**: Todos os tipos de eventos são definidos em um único lugar
2. **Flexibilidade**: Fácil adicionar novos tipos sem alterar código
3. **Internacionalização**: Possibilidade de traduzir nomes de eventos
4. **Metadados**: Ícones e categorias armazenados com cada tipo
5. **Validação**: Foreign key garante integridade referencial

## Estrutura do Catálogo

Cada tipo de evento no catálogo tem:

```json
{
  "id": 468,
  "category": "event_types",
  "name": "Entrada no Abrigo",
  "description": "{\"key\":\"entrada\",\"icon\":\"fa-hand-holding-heart\",\"eventCategory\":\"shelter\"}"
}
```

- **category**: Sempre "event_types"
- **name**: Nome legível do tipo de evento
- **description**: JSON com metadados:
  - **key**: Chave única em snake_case
  - **icon**: Ícone Font Awesome
  - **eventCategory**: Categoria (shelter, medical, care, etc.)

## Tipos de Eventos Incluídos

### Entrada e Resgate
- `entrada` - Entrada no Abrigo
- `resgate` - Resgate
- `transferencia_entrada` - Transferência (Entrada)
- `devolucao` - Devolução

### Adoção
- `adocao` - Adoção
- `pre_adocao` - Pré-Adoção
- `adocao_cancelada` - Adoção Cancelada

### Saída
- `transferencia_saida` - Transferência (Saída)
- `obito` - Óbito
- `fuga` - Fuga

### Saúde e Medicina
- `vacinacao` - Vacinação
- `vermifugacao` - Vermifugação
- `castracao` - Castração
- `cirurgia` - Cirurgia
- `consulta` - Consulta Veterinária
- `exame` - Exame
- `tratamento` - Tratamento
- `medicacao` - Medicação
- `internacao` - Internação
- `alta_medica` - Alta Médica

### Cuidados e Bem-estar
- `banho_tosa` - Banho e Tosa
- `socializacao` - Socialização
- `adestramento` - Adestramento
- `passeio` - Passeio
- `enriquecimento` - Enriquecimento Ambiental

### Pesagem e Avaliação
- `pesagem` - Pesagem
- `avaliacao_comportamental` - Avaliação Comportamental
- `avaliacao_saude` - Avaliação de Saúde

### Documentação
- `foto` - Registro Fotográfico
- `video` - Registro em Vídeo
- `documento` - Documentação

### Outros
- `observacao` - Observação
- `incidente` - Incidente
- `outro` - Outro

## Passos da Migração

### 1. Inserir Tipos de Eventos no Catálogo

```bash
npx tsx scripts/insert_event_types.ts
```

Este script:
- Cria entradas no catálogo para todos os tipos de eventos
- Verifica duplicatas antes de inserir
- Retorna o total de tipos inseridos

### 2. Migrar Dados Existentes

```bash
npx tsx scripts/migrate_event_types_to_catalog.ts
```

Este script:
- Adiciona coluna `event_type_id` na tabela `animal_events`
- Mapeia eventos existentes para IDs do catálogo
- Adiciona constraint de foreign key
- Mantém a coluna `event_type` antiga para compatibilidade
- Verifica integridade da migração

### 3. Atualizar Schema do Prisma

O schema já foi atualizado com:

```prisma
model animal_events {
  id              String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  animal_id       String    @db.Uuid
  event_type      String?   @db.VarChar(50) // Deprecated
  event_type_id   Int?
  description     String
  details         Json?
  triggered_by    String    @db.Uuid
  created_at      DateTime  @default(now()) @db.Timestamptz(6)

  animals         animals   @relation(fields: [animal_id], references: [id], onDelete: Cascade)
  users           users     @relation(fields: [triggered_by], references: [id])
  event_type_catalog catalogs? @relation("event_type_catalog", fields: [event_type_id], references: [id], onDelete: Restrict)

  @@index([event_type_id])
}
```

### 4. Gerar Cliente Prisma

```bash
npx prisma generate
```

**Nota**: Se houver erro de permissão (arquivo .dll bloqueado), reinicie o ambiente de desenvolvimento.

### 5. Verificar Migração

Consultar eventos com tipos:

```typescript
const events = await prisma.animal_events.findMany({
  include: {
    event_type_catalog: {
      select: { name: true, description: true }
    }
  }
})
```

## Migração do Banco Antigo

Quando migrar dados do banco antigo (`kaniu_old`):

### Passo 1: Mapear Tipos Antigos

Crie um mapeamento dos tipos de eventos do banco antigo para as novas keys:

```typescript
const eventTypeMapping: Record<string, string> = {
  'entrada_abrigo': 'entrada',
  'saida': 'transferencia_saida',
  'castrado': 'castracao',
  'adotado': 'adocao',
  // ... adicionar todos os mapeamentos
}
```

### Passo 2: Script de Migração

```typescript
// scripts/migrate_from_old_db.ts
import { PrismaClient } from '@prisma/client'

const newPrisma = new PrismaClient()
const oldPrisma = new PrismaClient({
  datasources: {
    db: { url: 'postgresql://postgres:postgres@localhost:5432/kaniu_old' }
  }
})

async function migrateEvents() {
  // 1. Buscar eventos do banco antigo
  const oldEvents = await oldPrisma.animal_events.findMany()

  // 2. Para cada evento antigo
  for (const oldEvent of oldEvents) {
    // Mapear tipo antigo para key nova
    const newKey = eventTypeMapping[oldEvent.tipo_evento] || 'outro'

    // Buscar ID do catálogo
    const eventType = await newPrisma.catalogs.findFirst({
      where: {
        category: 'event_types',
        description: { contains: `"key":"${newKey}"` }
      }
    })

    if (!eventType) {
      console.error(`Event type not found: ${newKey}`)
      continue
    }

    // Criar evento no banco novo
    await newPrisma.animal_events.create({
      data: {
        animal_id: oldEvent.animal_id,
        event_type_id: eventType.id,
        description: oldEvent.descricao,
        details: oldEvent.detalhes,
        triggered_by: oldEvent.usuario_id,
        created_at: oldEvent.data_criacao
      }
    })
  }
}
```

## Código Atualizado

### Seed File

O arquivo `prisma/seed.ts` foi atualizado para usar `event_type_id`:

```typescript
const entradaId = await getEventTypeId('entrada')

const eventos = [
  {
    animal_id: animal1.id,
    event_type_id: entradaId,
    description: 'Animal resgatado das ruas',
    triggered_by: shelterManager.id,
    created_at: new Date('2024-09-01'),
  },
  // ...
]
```

### Dashboard Panel

A função `getEventIcon` no arquivo `src/app/dashboard/painel/page.tsx` busca o ícone do catálogo:

```typescript
const getEventIcon = (eventTypeCatalog: { description: string | null } | null): string => {
  if (!eventTypeCatalog?.description) {
    return 'fa-circle-check'
  }

  try {
    const details = JSON.parse(eventTypeCatalog.description)
    return details.icon || 'fa-circle-check'
  } catch {
    return 'fa-circle-check'
  }
}
```

## Fase de Transição

Durante a fase de transição:

1. **Ambas as colunas existem**: `event_type` e `event_type_id`
2. **Prioridade**: Código usa `event_type_id` quando disponível, `event_type` como fallback
3. **Novos eventos**: Sempre usar `event_type_id`

## Remoção da Coluna Antiga (Futuro)

Após validar que tudo funciona:

```sql
-- Tornar event_type_id obrigatório
ALTER TABLE animal_events ALTER COLUMN event_type_id SET NOT NULL;

-- Remover coluna antiga
ALTER TABLE animal_events DROP COLUMN event_type;
```

Atualizar schema Prisma removendo `event_type` e tornando `event_type_id` obrigatório:

```prisma
model animal_events {
  id              String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  animal_id       String    @db.Uuid
  event_type_id   Int       // Agora obrigatório
  // ...
}
```

## Adicionando Novos Tipos de Eventos

No futuro, para adicionar novos tipos:

```typescript
await prisma.catalogs.create({
  data: {
    category: 'event_types',
    name: 'Nome do Novo Evento',
    description: JSON.stringify({
      key: 'novo_evento',
      icon: 'fa-icon-name',
      eventCategory: 'categoria'
    })
  }
})
```

## Rollback (Se Necessário)

Se algo der errado:

```sql
-- Remover foreign key
ALTER TABLE animal_events DROP CONSTRAINT fk_animal_events_event_type;

-- Remover coluna
ALTER TABLE animal_events DROP COLUMN event_type_id;

-- Deletar tipos do catálogo
DELETE FROM catalogs WHERE category = 'event_types';
```

## Verificações de Integridade

```sql
-- Verificar eventos sem tipo
SELECT COUNT(*) FROM animal_events WHERE event_type_id IS NULL;

-- Verificar tipos no catálogo
SELECT COUNT(*) FROM catalogs WHERE category = 'event_types';

-- Listar eventos por tipo
SELECT
  c.name,
  COUNT(ae.id) as count
FROM catalogs c
LEFT JOIN animal_events ae ON ae.event_type_id = c.id
WHERE c.category = 'event_types'
GROUP BY c.id, c.name
ORDER BY count DESC;
```

## Suporte

Em caso de problemas:

1. Verificar logs de migração
2. Consultar tabela `catalogs` para tipos disponíveis
3. Verificar constraint de foreign key
4. Validar Prisma client está atualizado
