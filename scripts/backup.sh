#!/bin/bash

# Script de Backup para Kaniu WebApp
# Usage: ./scripts/backup.sh

set -e  # Exit on error

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configurações
BACKUP_DIR="${BACKUP_DIR:-$HOME/backups/kaniu}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo -e "${GREEN}🗄️  Iniciando backup do Kaniu WebApp...${NC}"

# Criar diretório de backup se não existir
mkdir -p "$BACKUP_DIR"

# Verificar se está no diretório correto
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ Erro: docker-compose.yml não encontrado!${NC}"
    exit 1
fi

# 1. Backup do banco de dados
echo -e "${YELLOW}📦 Fazendo backup do banco de dados...${NC}"
DB_BACKUP_FILE="$BACKUP_DIR/database_$TIMESTAMP.sql"
docker-compose exec -T postgres pg_dump -U kaniu kaniu > "$DB_BACKUP_FILE"

if [ -f "$DB_BACKUP_FILE" ]; then
    # Comprimir backup
    gzip "$DB_BACKUP_FILE"
    echo -e "${GREEN}✓ Backup do banco de dados salvo: ${DB_BACKUP_FILE}.gz${NC}"
else
    echo -e "${RED}❌ Erro ao criar backup do banco de dados${NC}"
    exit 1
fi

# 2. Backup dos arquivos de configuração
echo -e "${YELLOW}📦 Fazendo backup dos arquivos de configuração...${NC}"
CONFIG_BACKUP_FILE="$BACKUP_DIR/config_$TIMESTAMP.tar.gz"
tar -czf "$CONFIG_BACKUP_FILE" \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='.git' \
    .env \
    docker-compose.yml \
    nginx/ \
    2>/dev/null || true

if [ -f "$CONFIG_BACKUP_FILE" ]; then
    echo -e "${GREEN}✓ Backup da configuração salvo: $CONFIG_BACKUP_FILE${NC}"
else
    echo -e "${RED}❌ Erro ao criar backup da configuração${NC}"
fi

# 3. Backup dos volumes do Docker (opcional)
if [ "$BACKUP_VOLUMES" = "true" ]; then
    echo -e "${YELLOW}📦 Fazendo backup dos volumes do Docker...${NC}"
    VOLUMES_BACKUP_FILE="$BACKUP_DIR/volumes_$TIMESTAMP.tar.gz"

    docker run --rm \
        -v kaniu-webapp_postgres_data:/data \
        -v "$BACKUP_DIR:/backup" \
        alpine \
        tar -czf "/backup/volumes_$TIMESTAMP.tar.gz" -C /data .

    if [ -f "$VOLUMES_BACKUP_FILE" ]; then
        echo -e "${GREEN}✓ Backup dos volumes salvo: $VOLUMES_BACKUP_FILE${NC}"
    else
        echo -e "${YELLOW}⚠️  Aviso: Não foi possível criar backup dos volumes${NC}"
    fi
fi

# 4. Limpar backups antigos
echo -e "${YELLOW}🧹 Limpando backups antigos (mantendo últimos $RETENTION_DAYS dias)...${NC}"
find "$BACKUP_DIR" -name "database_*.sql.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "config_*.tar.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "volumes_*.tar.gz" -mtime +$RETENTION_DAYS -delete

# 5. Listar backups existentes
echo ""
echo -e "${GREEN}✅ Backup concluído!${NC}"
echo ""
echo "📂 Backups disponíveis em: $BACKUP_DIR"
echo ""
echo "📊 Tamanho dos backups:"
du -h "$BACKUP_DIR" | tail -1
echo ""
echo "📋 Arquivos de backup:"
ls -lh "$BACKUP_DIR" | grep "^-" | tail -5

# Criar arquivo de log
LOG_FILE="$BACKUP_DIR/backup.log"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup concluído com sucesso" >> "$LOG_FILE"

echo ""
echo "💡 Para restaurar um backup:"
echo "   Database: gunzip -c $DB_BACKUP_FILE.gz | docker-compose exec -T postgres psql -U kaniu kaniu"
echo "   Config: tar -xzf $CONFIG_BACKUP_FILE"
