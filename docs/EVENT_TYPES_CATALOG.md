# Catálogo de Tipos de Eventos

## Visão Geral

Os tipos de eventos do sistema Kaniu são gerenciados através da tabela `catalogs`, permitindo maior flexibilidade e consistência no gerenciamento de atividades relacionadas aos animais.

## Estrutura

Cada tipo de evento possui:

- **ID**: Identificador único no catálogo
- **Nome**: Nome legível do evento (ex: "Entrada no Abrigo")
- **Key**: Chave única em snake_case (ex: "entrada")
- **Ícone**: Ícone Font Awesome para exibição (ex: "fa-hand-holding-heart")
- **Categoria**: Categoria do evento (shelter, medical, care, monitoring, documentation, other)

## Categorias de Eventos

### 🏠 Shelter (Abrigo)
Eventos relacionados à entrada, saída e transferências:
- Entrada no Abrigo
- Resgate
- Transferência (Entrada/Saída)
- Devolução
- Fuga

### ❤️ Adoption (Adoção)
Eventos do processo de adoção:
- Pré-Adoção
- Adoção
- Adoção Cancelada

### 🏥 Medical (Medicina)
Eventos de saúde e procedimentos veterinários:
- Vacinação
- Vermifugação
- Castração
- Cirurgia
- Consulta Veterinária
- Exame
- Tratamento
- Medicação
- Internação
- Alta Médica
- Óbito

### 🐾 Care (Cuidados)
Eventos de bem-estar e socialização:
- Banho e Tosa
- Socialização
- Adestramento
- Passeio
- Enriquecimento Ambiental

### 📊 Monitoring (Monitoramento)
Eventos de acompanhamento:
- Pesagem
- Avaliação Comportamental
- Avaliação de Saúde

### 📄 Documentation (Documentação)
Eventos de registro:
- Registro Fotográfico
- Registro em Vídeo
- Documentação

### 📝 Other (Outros)
Eventos diversos:
- Observação
- Incidente
- Outro

## Uso no Código

### Criando um Evento

```typescript
// Buscar tipo de evento
const eventType = await prisma.catalogs.findFirst({
  where: {
    category: 'event_types',
    description: { contains: '"key":"entrada"' }
  }
})

// Criar evento
await prisma.animal_events.create({
  data: {
    animal_id: animalId,
    event_type_id: eventType.id,
    description: 'Descrição do evento',
    triggered_by: userId,
    details: { /* dados adicionais */ }
  }
})
```

### Consultando Eventos com Tipos

```typescript
const events = await prisma.animal_events.findMany({
  include: {
    event_type_catalog: {
      select: { name: true, description: true }
    },
    animals: { select: { name: true } },
    users: { select: { name: true } }
  }
})

// Extrair ícone do catálogo
events.forEach(event => {
  const details = JSON.parse(event.event_type_catalog.description)
  const icon = details.icon // ex: 'fa-hand-holding-heart'
  const category = details.eventCategory // ex: 'shelter'
})
```

### Helper Function para Ícone

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

## Adicionando Novos Tipos

Para adicionar um novo tipo de evento:

```typescript
await prisma.catalogs.create({
  data: {
    category: 'event_types',
    name: 'Nome Legível do Evento',
    description: JSON.stringify({
      key: 'nome_snake_case',
      icon: 'fa-icon-name',
      eventCategory: 'categoria'
    })
  }
})
```

Escolha uma categoria apropriada:
- `shelter` - Eventos de abrigo
- `medical` - Eventos médicos
- `care` - Eventos de cuidados
- `monitoring` - Eventos de monitoramento
- `documentation` - Eventos de documentação
- `adoption` - Eventos de adoção
- `other` - Outros eventos

## Ícones Disponíveis

Todos os ícones usam Font Awesome 6. Exemplos:

- 🏠 Abrigo: `fa-hand-holding-heart`, `fa-building`
- ❤️ Adoção: `fa-heart-circle-check`, `fa-heart`
- 🏥 Médico: `fa-syringe`, `fa-stethoscope`, `fa-scissors`
- 🐾 Cuidados: `fa-shower`, `fa-users`, `fa-graduation-cap`
- 📊 Monitoramento: `fa-weight-scale`, `fa-clipboard-check`
- 📄 Documentação: `fa-camera`, `fa-video`, `fa-file-lines`

Consulte [Font Awesome Icons](https://fontawesome.com/icons) para mais opções.

## Relação com Tabela animal_events

```
catalogs                    animal_events
┌──────────────┐           ┌──────────────────┐
│ id           │◄──────────│ event_type_id    │
│ category     │           │ animal_id        │
│ name         │           │ description      │
│ description  │           │ details          │
└──────────────┘           │ triggered_by     │
                           │ created_at       │
                           └──────────────────┘
```

## Benefícios da Abordagem

1. **Manutenibilidade**: Adicionar/modificar tipos sem alterar código
2. **Consistência**: Todos usam mesma fonte de verdade
3. **Flexibilidade**: Metadados (ícones, categorias) armazenados com o tipo
4. **Internacionalização**: Facilita tradução de nomes
5. **Validação**: Foreign key garante integridade referencial
6. **Reporting**: Facilita agrupamento e análise por categoria

## Migração de Sistemas Legados

Para migrar de um sistema que usa strings para tipos de eventos:

1. Manter coluna antiga (`event_type`) temporariamente
2. Adicionar nova coluna (`event_type_id`)
3. Mapear valores antigos para IDs do catálogo
4. Atualizar código para usar nova coluna
5. Após validação, remover coluna antiga

Veja [MIGRATION_GUIDE_EVENT_TYPES.md](../scripts/MIGRATION_GUIDE_EVENT_TYPES.md) para detalhes.

## Scripts Úteis

- `scripts/insert_event_types.ts` - Popula catálogo com tipos de eventos
- `scripts/migrate_event_types_to_catalog.ts` - Migra dados existentes
- `scripts/check_current_event_types.ts` - Verifica tipos em uso

## Queries Úteis

### Listar todos os tipos de eventos

```sql
SELECT id, name, description
FROM catalogs
WHERE category = 'event_types'
ORDER BY name;
```

### Contar eventos por tipo

```sql
SELECT
  c.name,
  COUNT(ae.id) as total_events
FROM catalogs c
LEFT JOIN animal_events ae ON ae.event_type_id = c.id
WHERE c.category = 'event_types'
GROUP BY c.id, c.name
ORDER BY total_events DESC;
```

### Eventos sem tipo definido (legado)

```sql
SELECT COUNT(*)
FROM animal_events
WHERE event_type_id IS NULL;
```

## Considerações de Performance

- Índice em `animal_events.event_type_id` para joins eficientes
- Cache de tipos de eventos em memória se necessário
- Evitar parse de JSON em queries repetidas (use views materializadas se necessário)

## Suporte

Para dúvidas ou problemas relacionados aos tipos de eventos, consulte:

- Guia de migração completo em `scripts/MIGRATION_GUIDE_EVENT_TYPES.md`
- Código fonte em `src/app/dashboard/painel/page.tsx`
- Schema Prisma em `prisma/schema.prisma`
