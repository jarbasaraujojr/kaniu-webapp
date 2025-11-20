# Catálogos com shelter_id - Suporte Multi-Abrigo

## Visão Geral

A tabela `catalogs` agora suporta **isolamento por abrigo**, permitindo que cada shelter tenha seus próprios catálogos personalizados (raças, medicações, tipos de eventos) além dos catálogos globais compartilhados.

## Mudanças no Schema

### Campo Adicionado

```prisma
model catalogs {
  // ... campos existentes ...
  shelter_id  String?  @db.Uuid  // NULL = catalog global

  // Nova relação
  shelter     shelters?  @relation(fields: [shelter_id], references: [id], onDelete: Cascade)

  // Constraint única atualizado
  @@unique([category, name, shelter_id])  // Permite duplicatas entre abrigos
}
```

### Índices Criados

- `shelter_id` - Para queries filtradas por abrigo
- `(category, shelter_id)` - Para queries comuns de busca de catálogo

## Comportamento

### Catálogos Globais (`shelter_id = NULL`)

- Visíveis para **todos os abrigos**
- Criados pelo administrador do sistema
- Incluem:
  - Espécies (Cão, Gato)
  - Raças comuns
  - Sexos (Macho, Fêmea, Indefinido)
  - Status padrão de animais
  - Tipos de eventos padrão

### Catálogos de Abrigo (`shelter_id != NULL`)

- Visíveis apenas para o **abrigo específico**
- Podem ser criados pelos gerentes do abrigo
- Exemplos:
  - Raça personalizada não listada
  - Medicação específica usada pelo abrigo
  - Tipo de evento customizado

## Migration

### Aplicar Migration

```sql
-- Adiciona coluna e constraints
ALTER TABLE "catalogs" ADD COLUMN "shelter_id" UUID;
ALTER TABLE "catalogs" ADD CONSTRAINT "catalogs_shelter_id_fkey"
  FOREIGN KEY ("shelter_id") REFERENCES "shelters"("id") ON DELETE CASCADE;

-- Índices
CREATE INDEX "catalogs_shelter_id_idx" ON "catalogs"("shelter_id");
CREATE INDEX "catalogs_category_shelter_id_idx" ON "catalogs"("category", "shelter_id");

-- Atualiza constraint única
ALTER TABLE "catalogs" DROP CONSTRAINT IF EXISTS "catalogs_category_name_key";
ALTER TABLE "catalogs" ADD CONSTRAINT "catalogs_category_name_shelter_id_key"
  UNIQUE ("category", "name", "shelter_id");
```

### Aplicar em Produção

```bash
# Via API endpoint
curl -X POST "https://your-domain.com/api/migrations/add-shelter-id-catalogs"

# Ou via script
npx tsx prisma/migrations/20251120_add_shelter_id_to_catalogs/migration.sql
```

## Queries Atualizadas

### Buscar Catálogos (Globais + do Abrigo)

```typescript
const breeds = await prisma.catalogs.findMany({
  where: {
    category: 'breed',
    OR: [
      { shelter_id: null },              // Globais
      { shelter_id: session.shelter_id } // Do abrigo
    ]
  },
  orderBy: { name: 'asc' }
})
```

### Criar Catálogo Global (Admin)

```typescript
await prisma.catalogs.create({
  data: {
    category: 'breed',
    name: 'Nova Raça Global',
    shelter_id: null  // Global
  }
})
```

### Criar Catálogo de Abrigo

```typescript
await prisma.catalogs.create({
  data: {
    category: 'medication',
    name: 'Medicamento Personalizado',
    shelter_id: session.shelter_id  // Específico do abrigo
  }
})
```

## Seeding

### Seed Completo de Catálogos

Arquivo: `prisma/seeds/catalogs.ts`

```bash
# Executar seed de catálogos
npx tsx prisma/seeds/catalogs.ts
```

Popula:
- 2 espécies
- 61 raças de cães
- 29 raças de gatos
- 3 sexos
- 5 status de animais
- 36 tipos de eventos

Todos com `shelter_id = NULL` (globais).

## Arquivos Relacionados

- **Schema**: `prisma/schema.prisma`
- **Migration**: `prisma/migrations/20251120_add_shelter_id_to_catalogs/migration.sql`
- **Seed**: `prisma/seeds/catalogs.ts`
- **Docs**: `docs/CATALOG_SHELTER_ID.md` (este arquivo)

## Próximos Passos

### Atualizar Queries Existentes

Todas as queries que buscam catálogos precisam ser atualizadas para incluir:

```typescript
OR: [
  { shelter_id: null },
  { shelter_id: session.shelter_id }
]
```

### Criar UI de Gerenciamento

Interface para abrigos gerenciarem seus catálogos personalizados:
- Adicionar raça customizada
- Adicionar medicação
- Adicionar tipo de evento personalizado

### API Endpoints

- `POST /api/catalogs` - Criar catálogo do abrigo
- `GET /api/catalogs?category=breed` - Listar (globais + do abrigo)
- `PUT /api/catalogs/:id` - Atualizar catálogo do abrigo
- `DELETE /api/catalogs/:id` - Remover catálogo do abrigo

## Benefícios

✅ **Isolamento** - Cada abrigo tem autonomia sobre seus dados
✅ **Flexibilidade** - Abrigos podem customizar conforme necessidade
✅ **Consistência** - Catálogos globais mantêm padrões
✅ **Escalabilidade** - Sistema pronto para múltiplos abrigos
✅ **Sem Duplicação Forçada** - Unique constraint permite mesmo nome em abrigos diferentes
