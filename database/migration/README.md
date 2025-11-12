# Migração de Base de Dados - Kaniu

Este diretório contém todos os scripts e documentação necessários para migrar a base de dados antiga (56 tabelas) para a nova arquitetura simplificada (16 tabelas).

## 📋 Visão Geral

- **Base Antiga**: 56 tabelas (sistema complexo de gestão veterinária)
- **Base Nova**: 16 tabelas (sistema simplificado e moderno)
- **Tempo Estimado**: 7-12 horas
- **Perda de Dados**: Mínima (dados complexos armazenados em JSONB)

## 🗂️ Estrutura de Arquivos

```
database/migration/
├── README.md                    # Este arquivo
├── old schema.sql               # Schema da base de dados antiga
├── current schema.sql           # Schema da base de dados nova
└── scripts/
    ├── 01_backup.sql            # Backup e validação inicial
    ├── 02_create_mapping_tables.sql
    ├── 03_data_quality_check.sql
    ├── 04_migrate_roles.sql
    ├── 05_migrate_catalogs.sql
    ├── 06_migrate_users.sql
    ├── 07_migrate_shelters.sql
    ├── 08_migrate_animals.sql
    ├── 09_migrate_animal_photos.sql
    ├── 10_migrate_animal_weights.sql
    ├── 11_migrate_documents.sql
    ├── 12_migrate_medical_records.sql
    ├── 13_migrate_adoption_events.sql
    ├── 14_migrate_animal_events.sql
    ├── 15_migrate_favorites.sql
    ├── 16_validate_migration.sql
    ├── 17_cleanup.sql
    └── rollback/
        └── rollback_all.sql     # Script de rollback completo
```

## 🚀 Pré-requisitos

### 1. Software Necessário

- PostgreSQL 12 ou superior
- `psql` (client PostgreSQL)
- Acesso administrativo às bases de dados antiga e nova
- Espaço em disco: ~2x o tamanho da base antiga

### 2. Preparação

```bash
# 1. Criar backup da base antiga
pg_dump -h <host> -U <usuario> -d <db_antiga> \
  -F c -b -v -f backup_antiga_$(date +%Y%m%d_%H%M%S).backup

# 2. Verificar schema da base nova está aplicado
cd prisma
npx prisma migrate deploy

# 3. Validar conexões
psql -h <host> -U <usuario> -d <db_antiga> -c "SELECT version();"
psql -h <host> -U <usuario> -d <db_nova> -c "SELECT version();"
```

## 📝 Ordem de Execução

### Fase 1: Preparação (30 min)

```bash
# Script 01: Validar dados da base antiga
psql -h <host> -U <usuario> -d <db_antiga> -f scripts/01_backup.sql

# Script 02: Criar tabelas temporárias de mapeamento
psql -h <host> -U <usuario> -d <db_nova> -f scripts/02_create_mapping_tables.sql

# Script 03: Análise de qualidade de dados
psql -h <host> -U <usuario> -d <db_antiga> -f scripts/03_data_quality_check.sql > quality_report.txt
```

**⚠️ IMPORTANTE**: Revise `quality_report.txt` antes de prosseguir. Corrija problemas críticos.

### Fase 2: Tabelas Base (1h)

```bash
# Script 04: Roles
psql -h <host> -U <usuario> -d <db_nova> -f scripts/04_migrate_roles.sql

# Script 05: Catálogos
psql -h <host> -U <usuario> -d <db_nova> -f scripts/05_migrate_catalogs.sql

# Script 06: Usuários
psql -h <host> -U <usuario> -d <db_nova> -f scripts/06_migrate_users.sql

# Script 07: Abrigos
psql -h <host> -U <usuario> -d <db_nova> -f scripts/07_migrate_shelters.sql
```

### Fase 3: Animais (2-3h)

```bash
# Script 08: Animais (MAIS DEMORADO)
psql -h <host> -U <usuario> -d <db_nova> -f scripts/08_migrate_animals.sql

# Script 09: Fotos
psql -h <host> -U <usuario> -d <db_nova> -f scripts/09_migrate_animal_photos.sql

# Script 10: Pesagens
psql -h <host> -U <usuario> -d <db_nova> -f scripts/10_migrate_animal_weights.sql
```

### Fase 4: Documentos e Médicos (2h)

```bash
# Script 11: Documentos
psql -h <host> -U <usuario> -d <db_nova> -f scripts/11_migrate_documents.sql

# Script 12: Registros Médicos
psql -h <host> -U <usuario> -d <db_nova> -f scripts/12_migrate_medical_records.sql
```

### Fase 5: Adoções e Eventos (1-2h)

```bash
# Script 13: Eventos de Adoção
psql -h <host> -U <usuario> -d <db_nova> -f scripts/13_migrate_adoption_events.sql

# Script 14: Eventos dos Animais
psql -h <host> -U <usuario> -d <db_nova> -f scripts/14_migrate_animal_events.sql

# Script 15: Favoritos
psql -h <host> -U <usuario> -d <db_nova> -f scripts/15_migrate_favorites.sql
```

### Fase 5.5: Medicações e Prescrições (1-2h) ✨ NOVO

```bash
# Script 18: Medicamentos
psql -h <host> -U <usuario> -d <db_nova> -f scripts/18_migrate_medications.sql

# Script 19: Prescrições
psql -h <host> -U <usuario> -d <db_nova> -f scripts/19_migrate_prescriptions.sql

# Script 20: Tarefas de Prescrição
psql -h <host> -U <usuario> -d <db_nova> -f scripts/20_migrate_prescription_tasks.sql
```

**⚠️ IMPORTANTE**: Esta fase é **NOVA** e migra todo o sistema de medicação para tabelas estruturadas!

### Fase 6: Validação (1-2h)

```bash
# Script 16: Validação completa
psql -h <host> -U <usuario> -d <db_nova> -f scripts/16_validate_migration.sql > validation_report.txt

# Revisar relatório
cat validation_report.txt
```

**⚠️ CRÍTICO**: Se houver ERROs no relatório, execute rollback e investigue.

### Fase 7: Finalização

```bash
# Script 17: Limpeza
psql -h <host> -U <usuario> -d <db_nova> -f scripts/17_cleanup.sql
```

## 🔄 Executar Todos de Uma Vez (Não Recomendado)

Se você tiver certeza absoluta, pode executar todos os scripts sequencialmente:

```bash
# ⚠️ USE COM CAUTELA - Sem pontos de verificação intermediários
for i in {01..17}; do
  echo "Executando script $i..."
  psql -h <host> -U <usuario> -d <db_nova> -f scripts/${i}_*.sql
  if [ $? -ne 0 ]; then
    echo "ERRO no script $i. Abortando."
    exit 1
  fi
done
```

## ⚠️ Rollback

Se algo der errado:

```bash
# 1. Parar a aplicação imediatamente
# 2. Executar rollback
psql -h <host> -U <usuario> -d <db_nova> -f scripts/rollback/rollback_all.sql

# 3. Restaurar backup se necessário
pg_restore -h <host> -U <usuario> -d <db_nova> -c backup_antiga_*.backup

# 4. Investigar erro e corrigir scripts
# 5. Tentar novamente
```

## 📊 Mapeamento de Dados

### Tabelas Consolidadas

| Antiga | Nova | Transformação |
|--------|------|---------------|
| `animais` | `animals` | Flags booleanos → status enum, dados físicos → JSONB |
| `usuarios` + `pessoa` | `users` | Merge com endereço em JSONB |
| `canis` | `shelters` | bigint → UUID |
| `especies`, `racas`, `cores`, etc. | `catalogs` | Consolidação por categoria |
| `vacinacoes` + `imunizacao` + `anamneses` | `animal_medical_records` | Consolidação com type |
| `interessado_animal` + `questionario` | `adoption_events` | Questionário serializado em JSON |
| `pessoa_likes.animais` | `favorites` | Array explodido em registros |
| `medicamento` | `medications` | ✨ Medicamentos estruturados |
| `prescricao` + `receita` | `prescriptions` | ✨ Prescrições completas |
| `prescricao_tarefa` | `prescription_tasks` | ✨ Histórico de administração |

### Campos JSONB

#### `animals.appearance`
```json
{
  "color": "string",
  "coat": "string",
  "chest": number,
  "length": number,
  "neck": number,
  "height": number
}
```

#### `animals.health_status`
```json
{
  "vaccinated": boolean,
  "dewormed": boolean,
  "deparasitized": boolean,
  "hospitalized": boolean,
  "diagnoses": ["array", "of", "strings"]
}
```

## 🔒 Segurança

### Senhas

**⚠️ CRÍTICO**: Todos os usuários serão migrados com senha temporária.

- Senha temporária: `TempPassword123!`
- Todos devem resetar no primeiro acesso
- Implementar sistema de reset de senha antes de liberar acesso

### Notificação de Usuários

Antes de dar acesso ao sistema novo:

1. Enviar email para todos os usuários
2. Informar sobre migração
3. Incluir link de reset de senha
4. Fornecer suporte para dúvidas

Template de email:

```
Assunto: [IMPORTANTE] Migração do Sistema Kaniu

Olá [Nome],

Informamos que o sistema Kaniu foi atualizado com melhorias significativas.

AÇÃO NECESSÁRIA:
Por segurança, você precisará criar uma nova senha no primeiro acesso.

1. Acesse: [URL_DO_SISTEMA]
2. Clique em "Esqueci minha senha"
3. Siga as instruções enviadas por email

Seus dados e histórico foram preservados na migração.

Dúvidas? Entre em contato conosco.

Equipe Kaniu
```

## 🐛 Troubleshooting

### Erro: "relation does not exist"

```bash
# Verificar se schema novo foi aplicado
psql -h <host> -U <usuario> -d <db_nova> -c "\dt"

# Aplicar migrations Prisma
cd prisma && npx prisma migrate deploy
```

### Erro: "foreign key violation"

Scripts já tratam FKs com fallbacks. Se ocorrer:

```sql
-- Verificar órfãos no script 16
psql -d <db_nova> -f scripts/16_validate_migration.sql
```

### Erro: "out of memory"

Para bases muito grandes:

```sql
-- Aumentar work_mem temporariamente
SET work_mem = '256MB';
SET maintenance_work_mem = '1GB';
```

### Performance Lenta

```sql
-- Criar índices temporários
CREATE INDEX CONCURRENTLY idx_temp_animals_canil ON animais(canil);
CREATE INDEX CONCURRENTLY idx_temp_animais_id ON animais(animal_id);
```

## 📈 Monitoramento Pós-Migração

### Primeiros 7 dias

```sql
-- Verificar logs de erro
SELECT * FROM audit_logs WHERE action = 'ERROR' ORDER BY created_at DESC LIMIT 100;

-- Verificar queries lentas
SELECT * FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 20;

-- Verificar uso de índices
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC;
```

### Performance

```bash
# Executar ANALYZE após migração
psql -d <db_nova> -c "ANALYZE VERBOSE;"

# Criar índices adicionais conforme necessário
# Monitorar com pg_stat_statements
```

## 📞 Suporte

### Logs de Migração

Todos os scripts geram logs. Salve para referência:

```bash
# Executar com log
psql -d <db_nova> -f scripts/08_migrate_animals.sql 2>&1 | tee migration_animals.log
```

### Tabelas de Diagnóstico

Durante a migração, são criadas:

- `migration_stats`: Estatísticas de cada tabela
- `migration_errors`: Erros registrados
- Tabelas de mapeamento (temporárias)

Consulte para debug:

```sql
SELECT * FROM migration_stats ORDER BY table_name;
SELECT * FROM migration_errors ORDER BY occurred_at DESC;
```

## ✅ Checklist Final

Antes de liberar para produção:

- [ ] Backup completo da base antiga
- [ ] Backup completo da base nova (pós-migração)
- [ ] Validação passou sem ERROs críticos
- [ ] Testes de integração da aplicação
- [ ] Sistema de reset de senha configurado
- [ ] Emails de notificação enviados aos usuários
- [ ] Base antiga em modo read-only (fallback)
- [ ] Monitoramento ativo configurado
- [ ] Equipe de suporte treinada
- [ ] Plano de rollback documentado

## 📚 Referências

- [Prisma Schema](../../prisma/schema.prisma)
- [Documentação PostgreSQL](https://www.postgresql.org/docs/)
- [Guia de Migração de Dados](https://www.postgresql.org/docs/current/backup.html)

## 📄 Licença

Este projeto está sob a licença do sistema Kaniu.

---

**Última atualização**: 2025-01-12
**Versão**: 1.0.0
