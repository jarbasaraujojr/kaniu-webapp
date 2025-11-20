# Setup de Status de Animais

## Visão Geral

Os botões de status na página de detalhes do animal permitem alternar entre diferentes estados: Disponível, Adotado, Desaparecido, Internado e Falecido.

## Status Disponíveis

1. **Disponível** (`disponivel`) - Animal disponível para adoção
2. **Adotado** (`adotado`) - Animal foi adotado
3. **Desaparecido** (`desaparecido`) - Animal desaparecido
4. **Internado** (`internado`) - Animal internado para tratamento
5. **Falecido** (`falecido`) - Animal falecido

## Primeira Configuração (Produção)

Para popular os status de animais no banco de dados de produção, execute o seguinte script via Easypanel ou diretamente no servidor:

```bash
npx tsx scripts/insert_animal_statuses.ts
```

Este script:
- Verifica se cada status já existe no catálogo
- Insere apenas status que ainda não existem
- Exibe todos os status cadastrados com seus IDs

## Verificar Status Cadastrados

```sql
SELECT id, name, description
FROM catalogs
WHERE category = 'animal_status'
ORDER BY name;
```

## Como Funciona

### 1. Botões de Status

Na página de detalhes do animal ([src/app/dashboard/animais/[id]/AnimalDetailsClient.tsx](../src/app/dashboard/animais/[id]/AnimalDetailsClient.tsx)), os botões exibem o status atual:

- **Botão ativo**: Destacado em azul com borda mais grossa
- **Botão inativo**: Cinza com borda fina
- **Hover**: Destaque ao passar o mouse (apenas inativos)

### 2. Alteração de Status

Ao clicar em um botão de status diferente do atual:

1. **Modal de Confirmação**: Abre popup pedindo confirmação
2. **Confirmação**: Chama API `/api/animals/[id]/status`
3. **API atualiza**:
   - Campo `status_id` do animal
   - Campo `is_available_for_adoption` (true apenas para "Disponível")
   - Campo `updated_by` e `updated_at`
4. **Cria Evento**: Adiciona registro no histórico (`animal_events`):
   - Tipo de evento correspondente (entrada, adoção, fuga, internação, óbito)
   - Descrição automática
   - Data e hora da alteração
   - Usuário que fez a alteração
5. **Atualiza Página**: Recarrega para mostrar novo status

### 3. Mapeamento Status → Eventos

| Status | Event Type | Descrição |
|--------|------------|-----------|
| Disponível | entrada | Animal disponível para adoção |
| Adotado | adocao | Animal adotado |
| Desaparecido | fuga | Animal desaparecido |
| Internado | internacao | Animal internado para tratamento |
| Falecido | obito | Animal falecido |

## Estrutura do Catálogo

Cada status é armazenado na tabela `catalogs` com:

```json
{
  "category": "animal_status",
  "name": "Disponível",
  "description": "{\"key\":\"disponivel\",\"description\":\"Animal disponível para adoção\"}"
}
```

## API Endpoint

**PATCH** `/api/animals/[id]/status`

**Body**:
```json
{
  "statusName": "Adotado"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Status alterado para Adotado",
  "data": {
    "animal": { /* objeto animal atualizado */ },
    "event": { /* evento criado */ }
  }
}
```

## Segurança

- ✅ Requer autenticação (NextAuth session)
- ✅ Valida status antes de aplicar
- ✅ Usa transaction para garantir consistência
- ✅ Registra usuário que fez a alteração

## Transação Atômica

A alteração usa uma transaction do Prisma para garantir que:
1. Status do animal é atualizado
2. Evento é criado no histórico
3. Se qualquer operação falhar, ambas são revertidas

## Troubleshooting

### Status não aparece nos botões
Verificar se o `status_id` do animal está correto:
```sql
SELECT a.name, a.status_id, c.name as status_name
FROM animals a
LEFT JOIN catalogs c ON c.id = a.status_id
WHERE a.id = 'animal-id-aqui';
```

### Erro ao alterar status
1. Verificar se todos os status estão no catálogo
2. Verificar se todos os event types estão no catálogo
3. Checar logs do servidor para detalhes do erro

### Evento não aparece no histórico
Verificar se o event_type existe no catálogo:
```sql
SELECT * FROM catalogs
WHERE category = 'event_types'
AND description LIKE '%"key":"adocao"%';
```

## Próximos Passos

Após a configuração inicial, os status estarão disponíveis para uso. Você pode:

1. Testar alterando status de um animal
2. Verificar o histórico do animal para ver o evento criado
3. Confirmar que `is_available_for_adoption` foi atualizado corretamente
