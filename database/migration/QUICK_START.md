# Guia Rápido de Migração - Kaniu

## 🚀 Início Rápido

### Opção 1: Script Automático (Recomendado)

**Windows:**
```cmd
cd database\migration
run_migration.bat
```

**Linux/Mac:**
```bash
cd database/migration
chmod +x run_migration.sh
./run_migration.sh
```

### Opção 2: Manual (Passo a Passo)

```bash
# 1. Backup
pg_dump -h localhost -U postgres -d kaniu_old -F c -f backup.backup

# 2. Executar migrations Prisma
cd prisma && npx prisma migrate deploy

# 3. Executar scripts de migração
cd database/migration/scripts
psql -d kaniu_new -f 01_backup.sql
psql -d kaniu_new -f 02_create_mapping_tables.sql
# ... continue com os demais scripts
```

## ⏱️ Tempo Estimado

| Fase | Tempo | Scripts |
|------|-------|---------|
| Preparação | 30 min | 01-03 |
| Tabelas Base | 1h | 04-07 |
| Animais | 2-3h | 08-10 |
| Documentos/Médicos | 2h | 11-12 |
| Adoções/Eventos | 1-2h | 13-15 |
| **Medicações** ✨ | **1-2h** | **18-20** |
| Validação | 1-2h | 16-17 |
| **TOTAL** | **8-14h** | |

## 📋 Pré-requisitos

- [ ] PostgreSQL 12+
- [ ] Backup da base antiga criado
- [ ] Schema novo aplicado (Prisma migrate)
- [ ] Acesso às duas bases de dados
- [ ] Espaço em disco: 2x tamanho base antiga

## ⚠️ Pontos de Atenção

### Antes de Começar
1. **Backup obrigatório** da base antiga
2. **Testar conexões** com ambas as bases
3. **Executar em horário de baixo uso**
4. **Avisar usuários** sobre indisponibilidade

### Durante a Migração
1. **Script 03**: Revisar análise de qualidade
2. **Script 08**: Mais demorado (animais)
3. **Script 16**: Validar sem erros críticos

### Depois da Migração
1. **Todos usuários precisam resetar senha**
2. **Testar aplicação completamente**
3. **Manter base antiga por 90 dias**

## 🔄 Rollback

Se algo der errado:

```bash
# Parar aplicação
# Executar rollback
psql -d kaniu_new -f scripts/rollback/rollback_all.sql

# Restaurar backup se necessário
pg_restore -d kaniu_new -c backup.backup
```

## 📊 O Que é Migrado

### ✅ Migrado Completamente
- ✅ Todos os animais e características
- ✅ Histórico de pesagens
- ✅ Fotos dos animais
- ✅ Documentos
- ✅ Registros médicos (consolidados)
- ✅ Vacinações
- ✅ Abrigos e usuários
- ✅ Favoritos
- ✅ Eventos
- ✨ **Medicamentos** (tabelas estruturadas)
- ✨ **Prescrições completas** (com histórico)
- ✨ **Tarefas de administração** (com tracking)

### 🔄 Transformado
- 🔄 Questionários → JSON em adoption_events
- 🔄 Dados veterinários → Consolidados
- 🔄 Senhas → Reset obrigatório

### ❌ Não Migrado
- ❌ Tabelas n8n
- ❌ Embeddings de documentos

## 🔍 Validação Rápida

Após migração, verificar:

```sql
-- Contar registros principais
SELECT 'users' as tabela, COUNT(*) FROM users
UNION ALL
SELECT 'shelters', COUNT(*) FROM shelters
UNION ALL
SELECT 'animals', COUNT(*) FROM animals
UNION ALL
SELECT 'animal_photos', COUNT(*) FROM animal_photos
UNION ALL
SELECT 'documents', COUNT(*) FROM documents;

-- Verificar órfãos
SELECT COUNT(*) as animais_sem_shelter
FROM animals a
WHERE NOT EXISTS (SELECT 1 FROM shelters s WHERE s.id = a.shelter_id);

-- Verificar erros
SELECT * FROM migration_errors ORDER BY occurred_at DESC LIMIT 10;
```

## 📞 Troubleshooting Rápido

### Erro: "relation does not exist"
```bash
cd prisma && npx prisma migrate deploy
```

### Erro: "out of memory"
```sql
SET work_mem = '256MB';
SET maintenance_work_mem = '1GB';
```

### Performance lenta
```sql
CREATE INDEX CONCURRENTLY idx_temp_animals_canil ON animais(canil);
```

### Revisar logs
```bash
# Ver últimos erros
tail -f logs/migration_*/16_validate_migration.log
```

## 📧 Template Email para Usuários

```
Assunto: [AÇÃO NECESSÁRIA] Atualização do Sistema Kaniu

Olá!

O sistema Kaniu foi atualizado. Por segurança, você deve criar uma nova senha:

1. Acesse: [URL]
2. Clique em "Esqueci minha senha"
3. Siga as instruções

Seus dados foram preservados.

Dúvidas? Entre em contato.
```

## ✅ Checklist de Produção

- [ ] Backup criado e testado
- [ ] Migração executada sem erros
- [ ] Validação passou 100%
- [ ] Testes de integração OK
- [ ] Reset de senha configurado
- [ ] Emails enviados aos usuários
- [ ] Base antiga em read-only
- [ ] Monitoramento ativo
- [ ] Plano de rollback pronto

## 🆘 Suporte

**Logs de Migração:**
- Salvos em: `logs/migration_YYYYMMDD_HHMMSS/`
- Contém saída de cada script

**Tabelas de Diagnóstico:**
```sql
SELECT * FROM migration_stats;
SELECT * FROM migration_errors;
```

**Documentação Completa:**
- [README.md](README.md) - Guia completo
- Scripts comentados em `/scripts`

---

**Última atualização**: 2025-01-12
