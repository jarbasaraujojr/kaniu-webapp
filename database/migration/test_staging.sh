#!/bin/bash
# =====================================================
# Script de Teste em Staging - Linux/Mac
# =====================================================

set -e

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "===================================================="
echo "TESTE DE MIGRAÇÃO EM STAGING"
echo "===================================================="
echo ""

# Configuração
read -p "Host (localhost): " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Porta (5432): " DB_PORT
DB_PORT=${DB_PORT:-5432}

read -p "Usuário (postgres): " DB_USER
DB_USER=${DB_USER:-postgres}

read -p "Database staging: " DB_NAME
DB_NAME=${DB_NAME:-kaniu_staging}

read -sp "Senha: " DB_PASSWORD
echo ""

export PGHOST=$DB_HOST
export PGPORT=$DB_PORT
export PGUSER=$DB_USER
export PGPASSWORD=$DB_PASSWORD
export PGDATABASE=$DB_NAME

# Testar conexão
echo ""
echo "Testando conexão..."
if ! psql -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${RED}ERRO: Não foi possível conectar${NC}"
    exit 1
fi
echo -e "${GREEN}[OK] Conexão estabelecida${NC}"
echo ""

# Criar diretório de logs
LOG_DIR="logs/staging_test_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$LOG_DIR"

echo "===================================================="
echo "EXECUTANDO SCRIPTS DE MEDICAÇÃO"
echo "===================================================="
echo ""

# Script 18: Medications
echo -e "${YELLOW}[18/20] Migrando medicamentos...${NC}"
if psql -f scripts/18_migrate_medications.sql > "$LOG_DIR/18_medications.log" 2>&1; then
    echo -e "${GREEN}[OK] Medicamentos migrados${NC}"
else
    echo -e "${RED}[ERRO] Script 18 falhou${NC}"
    cat "$LOG_DIR/18_medications.log"
    exit 1
fi

# Script 19: Prescriptions
echo -e "${YELLOW}[19/20] Migrando prescrições...${NC}"
if psql -f scripts/19_migrate_prescriptions.sql > "$LOG_DIR/19_prescriptions.log" 2>&1; then
    echo -e "${GREEN}[OK] Prescrições migradas${NC}"
else
    echo -e "${RED}[ERRO] Script 19 falhou${NC}"
    cat "$LOG_DIR/19_prescriptions.log"
    exit 1
fi

# Script 20: Tasks
echo -e "${YELLOW}[20/20] Migrando tarefas...${NC}"
if psql -f scripts/20_migrate_prescription_tasks.sql > "$LOG_DIR/20_tasks.log" 2>&1; then
    echo -e "${GREEN}[OK] Tarefas migradas${NC}"
else
    echo -e "${RED}[ERRO] Script 20 falhou${NC}"
    cat "$LOG_DIR/20_tasks.log"
    exit 1
fi

echo ""
echo "===================================================="
echo "VALIDAÇÃO"
echo "===================================================="
echo ""

# Validar contagens
echo "Validando contagens..."
psql -c "
SELECT 'medications' as tabela, COUNT(*) as total FROM medications
UNION ALL SELECT 'prescriptions', COUNT(*) FROM prescriptions
UNION ALL SELECT 'prescription_tasks', COUNT(*) FROM prescription_tasks;
"

echo ""
echo "===================================================="
echo -e "${GREEN}TESTE CONCLUÍDO${NC}"
echo "===================================================="
echo "Logs salvos em: $LOG_DIR"
echo ""
echo "Revise os logs e valide os resultados."
echo "Se tudo estiver OK, execute a migração em produção."
echo ""
